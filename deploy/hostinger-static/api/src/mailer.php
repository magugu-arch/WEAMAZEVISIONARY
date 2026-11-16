<?php
/**
 * The studio's email for each enquiry, sent with the hosting's own mail service (PHP mail).
 * Nothing a visitor types can reach a mail header: headers carry only checked addresses and
 * single-line, encoded text; everything else travels in the encoded body.
 */
if (!defined('WV_API')) { http_response_code(404); exit; }

/** One line of plain text for a header: no control characters or line breaks, limited length. */
function wv_header_text(string $s, int $max): string
{
    $s = preg_replace('/[\x00-\x1F\x7F\x{0085}\x{2028}\x{2029}]+/u', ' ', $s) ?? '';
    $s = trim(preg_replace('/\s+/u', ' ', $s) ?? '');
    return preg_match('/^.{0,' . $max . '}/us', $s, $m) === 1 ? $m[0] : '';
}

/** Header text as RFC 2047 encoded words, split between characters (never inside one). */
function wv_mime_words(string $s): string
{
    if (preg_match('/^[A-Za-z0-9 .,:()\[\]\/\-]*\z/', $s) === 1) return $s;
    $words = [];
    $current = '';
    foreach (preg_split('//u', $s, -1, PREG_SPLIT_NO_EMPTY) ?: [] as $ch) {
        if (strlen($current . $ch) > 42) {
            $words[] = $current;
            $current = '';
        }
        $current .= $ch;
    }
    if ($current !== '') $words[] = $current;
    return implode(' ', array_map(static function (string $w): string {
        return '=?UTF-8?B?' . base64_encode($w) . '?=';
    }, $words));
}

function wv_mail_configured(array $cfg): bool
{
    return function_exists('mail')
        && preg_match(WV_EMAIL_RE, (string) ($cfg['operator_email'] ?? '')) === 1
        && preg_match(WV_EMAIL_RE, (string) ($cfg['mail_from'] ?? '')) === 1;
}

/** Hands one message to the hosting's mail service. True means accepted for sending, not delivered. */
function wv_send_mail(array $cfg, string $to, string $subject, string $text, ?string $replyTo): bool
{
    $from = (string) ($cfg['mail_from'] ?? '');
    if (!function_exists('mail') || preg_match(WV_EMAIL_RE, $from) !== 1 || preg_match(WV_EMAIL_RE, $to) !== 1) return false;
    $name = wv_header_text((string) ($cfg['mail_from_name'] ?? ''), 80);
    $headers = ['From: ' . ($name !== '' ? '=?UTF-8?B?' . base64_encode($name) . '?= ' : '') . '<' . $from . '>'];
    if ($replyTo !== null && preg_match(WV_EMAIL_RE, $replyTo) === 1) $headers[] = 'Reply-To: <' . $replyTo . '>';
    $headers[] = 'MIME-Version: 1.0';
    $headers[] = 'Content-Type: text/plain; charset=UTF-8';
    $headers[] = 'Content-Transfer-Encoding: base64';
    $headers[] = 'Auto-Submitted: auto-generated';
    $headers[] = 'X-Auto-Response-Suppress: All';
    $subject = wv_mime_words(wv_header_text($subject, 160));
    $body = chunk_split(base64_encode(str_replace("\n", "\r\n", str_replace(["\r\n", "\r"], "\n", $text))), 76, "\r\n");
    $extra = implode("\r\n", $headers);
    try {
        // "-f" sets the bounce address to the same mailbox, which mail services expect.
        if (@mail($to, $subject, $body, $extra, '-f' . $from)) return true;
    } catch (Throwable $e) {
        // Some hosts refuse extra options; try once more without them.
    }
    try {
        return (bool) @mail($to, $subject, $body, $extra);
    } catch (Throwable $e) {
        return false;
    }
}

/** "Label: value", or nothing when the value is empty. */
function wv_line(string $label, $value): array
{
    $value = is_string($value) ? trim($value) : '';
    return $value === '' ? [] : ["{$label}: {$value}"];
}
/** A longer answer on its own lines under a heading. */
function wv_block(string $label, $value): array
{
    $value = is_string($value) ? trim($value) : '';
    return $value === '' ? [] : ['', "{$label}:", $value];
}
/** A heading and its lines; "Not given" when every answer in it was left empty. */
function wv_section_lines(string $heading, array $lines): array
{
    if (!$lines) return ['', $heading, 'Not given'];
    return array_merge(['', $heading], $lines[0] === '' ? array_slice($lines, 1) : $lines);
}
function wv_labels(array $ids, array $names): string
{
    return implode(', ', array_map(static function ($id) use ($names) {
        return $names[$id] ?? (string) $id;
    }, $ids));
}

/**
 * The email the studio receives: the whole enquiry, with Reply set to the sender, so it can
 * be answered straight from the inbox. Returns [subject, text, replyTo].
 */
function wv_operator_message(array $lead): array
{
    $p = $lead['payload'];
    $ref = $lead['reference'];
    $foot = ['', '—', 'Reply to this email to answer the sender directly.', "The enquiry is also saved on the website's hosting as {$ref}.json."];

    if ($p['type'] === 'general' || $p['type'] === 'partnership') {
        $topic = isset($p['topic']) ? WV_CONTACT_TOPICS[$p['topic']] : ($p['type'] === 'partnership' ? WV_CONTACT_TOPICS['partnership'] : 'General');
        $subject = ($p['subject'] !== '' ? $p['subject'] : "{$topic} request") . " — {$p['name']} ({$ref})";
        $text = array_merge(
            ['New request from the website Contact page.', '', "From: {$p['name']} <{$p['email']}>"],
            wv_line('Organisation', $p['organisation']),
            ["Topic: {$topic}"],
            wv_line('Subject', $p['subject']),
            ["Reference: {$ref}", "Received: {$lead['receivedAt']}", '', $p['message']],
            wv_block('Capability needed', $p['capability']),
            $foot
        );
        return [$subject, implode("\n", $text), $p['email']];
    }

    if ($p['type'] === 'call-request') {
        $text = array_merge(
            ['New call request from the website. This is a request, not a confirmed booking.', '', "From: {$p['name']} <{$p['email']}>"],
            wv_line('Organisation', $p['organisation']),
            ["Time zone: {$p['timeZone']}", 'Times that could work: ' . wv_labels($p['windows'], WV_CALL_WINDOWS)],
            wv_line('Topic', isset($p['topic']) ? (WV_SERVICE_NAMES[$p['topic']] ?? $p['topic']) : ''),
            ["Reference: {$ref}", "Received: {$lead['receivedAt']}"],
            wv_block('Notes', $p['notes']),
            $foot
        );
        return ["[projects] Call request — {$p['name']} ({$ref})", implode("\n", $text), $p['email']];
    }

    $c = $p['contact'];
    $x = $p['context'];
    $s = $p['scope'];
    $t = $p['timing'];
    $text = array_merge(
        ['New project brief from the website.', '', "Reference: {$ref}", "Received: {$lead['receivedAt']}"],
        ['', 'CONTACT', "Name: {$c['name']}", "Email: {$c['email']}"],
        wv_line('Role', $c['role']),
        wv_line('Country', $c['country']),
        ["Time zone: {$c['timeZone']}"],
        wv_line('Phone', $c['phone']),
        ['', 'WHAT THEY WANT TO MAKE', 'Services: ' . wv_labels($p['intent']['services'], WV_SERVICE_NAMES)],
        wv_block('Outcome they want', $p['intent']['outcome']),
        ['', 'CONTEXT', $x['isIndividual'] ? 'Enquiring as an individual' : "Organisation: {$x['organisation']}"],
        $x['isIndividual'] ? wv_line('Organisation', $x['organisation']) : [],
        wv_line('Sector', $x['sector']),
        wv_block('Audience', $x['audience']),
        wv_block('Background', $x['background']),
        wv_section_lines('SCOPE', array_merge(
            wv_line('Deliverables', implode(', ', $s['deliverables'])),
            wv_block('Channels', $s['channels']),
            wv_block('Markets', $s['markets']),
            wv_block('Integrations', $s['integrations'])
        )),
        ['', 'TIMING', 'Timeframe: ' . (WV_TIMEFRAMES[$t['timeframe']] ?? $t['timeframe'])],
        wv_block('Depends on', $t['dependency']),
        wv_line('Budget', isset($t['budget']) ? (WV_BUDGETS[$t['budget']] ?? $t['budget']) : ''),
        $foot
    );
    return ["[projects] Project brief — {$c['name']} ({$ref})", implode("\n", $text), $c['email']];
}

/** Sends the studio's email for a stored enquiry. */
function wv_notify_operator(array $cfg, array $lead): bool
{
    [$subject, $text, $replyTo] = wv_operator_message($lead);
    return wv_send_mail($cfg, (string) $cfg['operator_email'], $subject, $text, $replyTo);
}

/** Notes an email that could not be sent, so later requests try it again. */
function wv_outbox_add(string $dir, string $reference): void
{
    @file_put_contents($dir . '/outbox/' . $reference . '.json', (string) json_encode(['reference' => $reference, 'attempts' => 1, 'nextAt' => time() + 300]), LOCK_EX);
}

/**
 * Tries again to send up to $limit emails that failed earlier, waiting longer after each
 * failure (5 minutes, doubling, up to 6 hours). After 12 tries it stops and says so in the log;
 * the enquiry itself is always safe in the leads folder.
 */
function wv_outbox_flush(string $dir, array $cfg, int $limit, string $skipReference = ''): void
{
    $now = time();
    foreach ((array) @glob($dir . '/outbox/*.json') as $file) {
        if ($limit <= 0) return;
        if (!is_string($file)) continue;
        $job = json_decode((string) @file_get_contents($file), true);
        if (!is_array($job) || !isset($job['reference']) || !is_string($job['reference']) || $job['reference'] === $skipReference) continue;
        if ((int) ($job['nextAt'] ?? 0) > $now) continue;
        $lead = wv_lead_get($dir, $job['reference']);
        if ($lead === null) {
            @unlink($file);
            continue;
        }
        $limit--;
        if (wv_notify_operator($cfg, $lead)) {
            @unlink($file);
            wv_lead_mark($dir, $job['reference'], 'sent');
            wv_log($dir, 'info', 'email.operator_sent_on_retry', ['reference' => $job['reference']]);
            continue;
        }
        $attempts = (int) ($job['attempts'] ?? 1) + 1;
        if ($attempts > 12) {
            @rename($file, $file . '.failed');
            wv_lead_mark($dir, $job['reference'], 'failed');
            wv_log($dir, 'error', 'email.operator_gave_up', ['reference' => $job['reference'], 'attempts' => $attempts - 1]);
            continue;
        }
        @file_put_contents($file, (string) json_encode(['reference' => $job['reference'], 'attempts' => $attempts, 'nextAt' => $now + min(21600, 300 * (2 ** ($attempts - 1)))]), LOCK_EX);
    }
}
