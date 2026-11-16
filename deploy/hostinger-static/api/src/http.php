<?php
/** Replies and logging. */
if (!defined('WV_API')) { http_response_code(404); exit; }

/** Sends a JSON reply and stops. */
function wv_json(int $status, array $body, array $headers = []): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    foreach ($headers as $h) header($h);
    echo json_encode($body, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

/** Sends an error in the shape the pages expect: { ok: false, error, message, ... }. */
function wv_fail(int $status, string $error, string $message, array $extra = [], array $headers = []): void
{
    wv_json($status, array_merge(['ok' => false, 'error' => $error, 'message' => $message], $extra), $headers);
}

/**
 * One line per event in a private log (never personal details: references and reasons only).
 * $dataDir null = find it; logging never throws and never blocks a reply.
 */
function wv_log(?string $dataDir, string $level, string $event, array $fields = []): void
{
    try {
        $dir = $dataDir;
        if ($dir === null && function_exists('wv_data_dir') && function_exists('wv_config')) $dir = wv_data_dir(wv_config());
        if ($dir === null) return;
        $file = $dir . '/log/api-' . gmdate('Y-m') . '.log';
        if (is_file($file) && filesize($file) > 5 * 1024 * 1024) return;
        $line = json_encode(array_merge(['t' => gmdate('Y-m-d\TH:i:s\Z'), 'level' => $level, 'event' => $event], $fields), JSON_UNESCAPED_SLASHES);
        @file_put_contents($file, $line . "\n", FILE_APPEND | LOCK_EX);
        @chmod($file, 0600);
    } catch (Throwable $e) {
        // Logging must never break a request.
    }
}
