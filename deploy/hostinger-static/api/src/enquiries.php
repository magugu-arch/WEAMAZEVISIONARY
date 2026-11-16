<?php
/**
 * POST /api/enquiries: the project brief, the call request and the Contact request box.
 * The steps, limits and replies follow server/api/router.ts.
 */
if (!defined('WV_API')) { http_response_code(404); exit; }


function wv_enquiries(array $cfg): void
{
    $contentType = (string) ($_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? '');
    if (stripos($contentType, 'application/json') === false) wv_fail(415, 'rejected', 'Send the form as JSON.');

    $dir = wv_data_dir($cfg);
    if ($dir !== null) {
        $limit = wv_rate_check($dir, 'enquiries:' . (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown'), (int) $cfg['rate_limit_max'], (int) $cfg['rate_limit_window']);
        if (!$limit['allowed']) {
            wv_fail(429, 'rate_limited', 'Too many submissions from your connection. Please wait a few minutes and try again.', ['retryAfter' => $limit['retryAfter']], ['Retry-After: ' . $limit['retryAfter']]);
        }
    }

    $raw = file_get_contents('php://input', false, null, 0, WV_MAX_BODY + 1);
    if (!is_string($raw) || strlen($raw) > WV_MAX_BODY) wv_fail(413, 'rejected', 'This submission is too large.', [], ['Connection: close']);

    $body = json_decode($raw, false, 32);
    if (json_last_error() !== JSON_ERROR_NONE) wv_fail(400, 'rejected', 'The submission could not be read. Please try again.');
    $envelope = wv_validate_envelope($body);
    if ($envelope === null) wv_fail(400, 'rejected', 'The submission could not be read. Please refresh the page and try again.');

    if ($envelope['website'] !== '') {
        wv_log($dir, 'warn', 'enquiry.honeypot');
        wv_fail(400, 'rejected', 'We could not accept this submission.');
    }
    $elapsed = (int) floor(microtime(true) * 1000) - $envelope['startedAt'];
    if ($elapsed < (int) $cfg['min_form_seconds'] * 1000 || $elapsed > 7 * 24 * 3600 * 1000) {
        wv_fail(400, 'rejected', 'Please take a moment to review your answers, then send again.');
    }

    $payload = $envelope['payload'];
    $type = wv_get($payload, 'type');
    $errors = [];
    if ($type === 'project') $data = wv_validate_project($payload, $errors);
    elseif ($type === 'call-request') $data = wv_validate_call_request($payload, $errors);
    elseif ($type === 'general' || $type === 'partnership') $data = wv_validate_contact($payload, $errors);
    else wv_fail(400, 'rejected', 'Unknown enquiry type.');
    if ($errors) wv_fail(400, 'validation', 'Some answers need attention.', ['fieldErrors' => $errors]);

    $unavailable = 'We could not save your submission just now. Your answers are still here — please try again in a moment.';
    if ($dir === null) wv_fail(503, 'unavailable', $unavailable);

    $bodyHash = hash('sha256', (string) json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
    $mail = wv_mail_configured($cfg);
    try {
        $prior = wv_idem_find($dir, $envelope['idempotencyKey']);
        if ($prior !== null) wv_replay($dir, $prior, $bodyHash);

        // A ceiling for the whole site, so a flood from many addresses cannot fill the
        // hosting or the studio's inbox.
        $global = wv_rate_check($dir, 'enquiries:all', (int) $cfg['global_limit_max'], (int) $cfg['global_limit_window']);
        if (!$global['allowed']) {
            wv_log($dir, 'warn', 'enquiry.global_limit');
            wv_fail(429, 'rate_limited', 'We are receiving more submissions than usual. Please try again a little later.', ['retryAfter' => $global['retryAfter']], ['Retry-After: ' . $global['retryAfter']]);
        }

        $source = [];
        if ($envelope['source'] !== null) $source = $envelope['source'];
        $lead = [
            'reference' => wv_new_reference($data['type']),
            'receivedAt' => (new DateTime('now', new DateTimeZone('UTC')))->format('Y-m-d\TH:i:s.v\Z'),
            'type' => $data['type'],
            'pipeline' => wv_pipeline($data['type']),
            'status' => 'new',
            'owner' => null,
            'payload' => $data,
            'source' => (object) $source,
            'downstream' => ['crm' => 'not-configured', 'receiptEmail' => 'not-configured', 'operatorEmail' => $mail ? 'pending' : 'not-configured'],
        ];
        if (wv_lead_save($dir, $lead, $envelope['idempotencyKey'], $bodyHash) === 'duplicate') {
            $again = wv_idem_find($dir, $envelope['idempotencyKey']);
            if ($again !== null) wv_replay($dir, $again, $bodyHash);
            wv_fail(503, 'unavailable', 'Please try again.');
        }
    } catch (Throwable $e) {
        wv_log($dir, 'error', 'enquiry.store_failed', ['error' => substr($e->getMessage(), 0, 120)]);
        wv_fail(503, 'unavailable', $unavailable);
    }

    // The enquiry is safely stored from here on; email problems never undo that.
    $sent = false;
    if ($mail) {
        try {
            $sent = wv_notify_operator($cfg, $lead);
            if ($sent) wv_lead_mark($dir, $lead['reference'], 'sent');
            else wv_outbox_add($dir, $lead['reference']);
            wv_outbox_flush($dir, $cfg, 1, $lead['reference']);
        } catch (Throwable $e) {
            wv_log($dir, 'warn', 'email.operator_error', ['reference' => $lead['reference'], 'error' => substr($e->getMessage(), 0, 120)]);
        }
    }
    wv_log($dir, 'info', 'enquiry.accepted', ['reference' => $lead['reference'], 'type' => $lead['type'], 'pipeline' => $lead['pipeline'], 'email' => !$mail ? 'not-configured' : ($sent ? 'sent' : 'retrying')]);

    wv_json(201, [
        'ok' => true,
        'reference' => $lead['reference'],
        'receivedAt' => $lead['receivedAt'],
        'pipeline' => $lead['pipeline'],
        // "queued" means accepted for sending, not delivered. No receipt is sent to the visitor.
        'notifications' => ['receiptEmail' => 'not-configured', 'studioEmail' => $mail ? 'queued' : 'not-configured'],
    ]);
}

/** The same form sent twice (a double tap, or a retry after a lost reply) gets its first answer again. */
function wv_replay(string $dir, array $prior, string $bodyHash): void
{
    if (!hash_equals($prior['bodyHash'], $bodyHash)) {
        wv_fail(409, 'conflict', 'This form was already sent with different answers. Refresh the page to send a new enquiry.');
    }
    $lead = wv_lead_get($dir, $prior['reference']);
    if ($lead === null) wv_fail(503, 'unavailable', 'We could not confirm your earlier submission. Please try again.');
    wv_json(200, [
        'ok' => true,
        'reference' => $lead['reference'],
        'receivedAt' => $lead['receivedAt'],
        'pipeline' => $lead['pipeline'],
        'notifications' => [
            'receiptEmail' => 'not-configured',
            'studioEmail' => ($lead['downstream']['operatorEmail'] ?? 'not-configured') === 'not-configured' ? 'not-configured' : 'queued',
        ],
        'replayed' => true,
    ]);
}
