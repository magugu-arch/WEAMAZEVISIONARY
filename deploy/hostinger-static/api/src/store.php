<?php
/**
 * Where enquiries live: one private JSON file each, the same record the Node.js server
 * keeps. The folder is outside public_html whenever the hosting allows it, so it survives
 * re-uploads of the site and can never be opened in a browser.
 */
if (!defined('WV_API')) { http_response_code(404); exit; }

const WV_REFERENCE_RE = '/^WV-(?:ENQ|MSG|CALL|PTR)-\d{4}-[2-9A-HJ-NP-Z]{6}\z/';

/** The private data folder, created on first use. Null when nothing can be written. */
function wv_data_dir(array $cfg): ?string
{
    static $found = false;
    if ($found !== false) return $found;
    $candidates = [];
    if (!empty($cfg['data_dir']) && is_string($cfg['data_dir'])) $candidates[] = rtrim($cfg['data_dir'], '/\\');
    $candidates[] = dirname(WV_API_DIR, 2) . '/weamaze-visionary-data'; // next to public_html
    $candidates[] = WV_API_DIR . '/data';                               // last resort: inside the site, locked below
    foreach ($candidates as $dir) {
        if (wv_prepare_dir($dir)) return $found = $dir;
    }
    return $found = null;
}

function wv_prepare_dir(string $dir): bool
{
    try {
        foreach (['', '/leads', '/idempotency', '/ratelimit', '/outbox', '/log'] as $sub) {
            $d = $dir . $sub;
            if (!@is_dir($d) && !@mkdir($d, 0700, true) && !@is_dir($d)) return false;
        }
        if (!@is_writable($dir . '/leads')) return false;
        // Two locks in case the folder is ever inside the website: the server refuses to
        // serve it, and it lists nothing.
        if (!is_file($dir . '/.htaccess')) {
            @file_put_contents($dir . '/.htaccess', "<IfModule mod_authz_core.c>\n  Require all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\n  Order allow,deny\n  Deny from all\n</IfModule>\n");
        }
        if (!is_file($dir . '/index.html')) @file_put_contents($dir . '/index.html', '');
        return true;
    } catch (Throwable $e) {
        return false;
    }
}

/** Writes a whole file or nothing: a crash can never leave half an enquiry behind. */
function wv_write_file(string $file, string $content): void
{
    $tmp = $file . '.' . bin2hex(random_bytes(6)) . '.tmp';
    if (@file_put_contents($tmp, $content, LOCK_EX) !== strlen($content)) {
        @unlink($tmp);
        throw new RuntimeException('write failed');
    }
    @chmod($tmp, 0600);
    if (!@rename($tmp, $file)) {
        @unlink($tmp);
        throw new RuntimeException('rename failed');
    }
}

/** A random key kept with the data, so stored fingerprints of visitor addresses cannot be reversed. */
function wv_secret(string $dir): string
{
    $file = $dir . '/secret.key';
    $key = @file_get_contents($file);
    if (is_string($key) && strlen($key) >= 32) return $key;
    $key = bin2hex(random_bytes(32));
    @file_put_contents($file, $key, LOCK_EX);
    @chmod($file, 0600);
    $again = @file_get_contents($file);
    return is_string($again) && strlen($again) >= 32 ? $again : $key;
}

/**
 * Counts one more request for $key in the current time window. The visitor's address is
 * never written down: only a keyed fingerprint, deleted soon after the window ends.
 */
function wv_rate_check(string $dir, string $key, int $max, int $window): array
{
    $now = time();
    $file = $dir . '/ratelimit/' . substr(hash_hmac('sha256', $key, wv_secret($dir)), 0, 32) . '.json';
    $fh = @fopen($file, 'c+');
    if ($fh === false) return ['allowed' => true, 'retryAfter' => 1];
    $bucket = null;
    try {
        flock($fh, LOCK_EX);
        $raw = stream_get_contents($fh);
        $bucket = is_string($raw) && $raw !== '' ? json_decode($raw, true) : null;
        if (!is_array($bucket) || !isset($bucket['count'], $bucket['resetAt']) || (int) $bucket['resetAt'] <= $now) {
            $bucket = ['count' => 0, 'resetAt' => $now + $window];
        }
        $bucket['count'] = (int) $bucket['count'] + 1;
        rewind($fh);
        ftruncate($fh, 0);
        fwrite($fh, (string) json_encode($bucket));
        fflush($fh);
    } finally {
        flock($fh, LOCK_UN);
        fclose($fh);
    }
    @chmod($file, 0600);
    if (random_int(1, 40) === 1) wv_rate_sweep($dir, $now);
    return ['allowed' => $bucket['count'] <= $max, 'retryAfter' => max(1, (int) $bucket['resetAt'] - $now)];
}

function wv_rate_sweep(string $dir, int $now): void
{
    foreach ((array) @glob($dir . '/ratelimit/*.json') as $f) {
        if (is_string($f) && @filemtime($f) < $now - 3700) @unlink($f);
    }
}

function wv_new_reference(string $type): string
{
    $prefix = $type === 'partnership' ? 'WV-PTR' : ($type === 'call-request' ? 'WV-CALL' : ($type === 'general' ? 'WV-MSG' : 'WV-ENQ'));
    $alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    $code = '';
    foreach (str_split(random_bytes(6)) as $b) $code .= $alphabet[ord($b) % 32];
    return $prefix . '-' . gmdate('Y') . '-' . $code;
}

function wv_pipeline(string $type): string
{
    return $type === 'partnership' ? 'partners' : ($type === 'general' ? 'general' : 'projects');
}

function wv_idem_file(string $dir, string $key): string
{
    return $dir . '/idempotency/' . hash('sha256', $key) . '.json';
}

/** The earlier submission made with this one-off key, if any. */
function wv_idem_find(string $dir, string $key): ?array
{
    $raw = @file_get_contents(wv_idem_file($dir, $key));
    if (!is_string($raw) || $raw === '') return null;
    $v = json_decode($raw, true);
    if (!is_array($v) || !isset($v['reference'], $v['bodyHash']) || !is_string($v['reference']) || !is_string($v['bodyHash'])) return null;
    return preg_match(WV_REFERENCE_RE, $v['reference']) === 1 ? ['reference' => $v['reference'], 'bodyHash' => $v['bodyHash']] : null;
}

function wv_lead_file(string $dir, string $reference): string
{
    if (preg_match(WV_REFERENCE_RE, $reference) !== 1) throw new RuntimeException('bad reference');
    return $dir . '/leads/' . $reference . '.json';
}

function wv_lead_get(string $dir, string $reference): ?array
{
    try {
        $raw = @file_get_contents(wv_lead_file($dir, $reference));
    } catch (Throwable $e) {
        return null;
    }
    if (!is_string($raw) || $raw === '') return null;
    $v = json_decode($raw, true);
    return is_array($v) ? $v : null;
}

function wv_lead_encode(array $lead): string
{
    return json_encode($lead, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR) . "\n";
}

/**
 * Stores a new enquiry. The one-off key is claimed first, in a single step that only one
 * request can win, so a double tap never creates two enquiries.
 * Returns 'created', or 'duplicate' when another request with the same key got there first.
 */
function wv_lead_save(string $dir, array $lead, string $key, string $bodyHash): string
{
    $idem = wv_idem_file($dir, $key);
    $fh = @fopen($idem, 'x');
    if ($fh === false) {
        if (is_file($idem)) return 'duplicate';
        throw new RuntimeException('cannot claim key');
    }
    try {
        $claim = (string) json_encode(['reference' => $lead['reference'], 'bodyHash' => $bodyHash]);
        if (fwrite($fh, $claim) !== strlen($claim)) throw new RuntimeException('claim write failed');
        fflush($fh);
        fclose($fh);
        $fh = null;
        @chmod($idem, 0600);
        $file = wv_lead_file($dir, $lead['reference']);
        if (is_file($file)) throw new RuntimeException('reference in use');
        wv_write_file($file, wv_lead_encode($lead));
    } catch (Throwable $e) {
        if (is_resource($fh)) fclose($fh);
        @unlink($idem);
        throw $e;
    }
    return 'created';
}

/**
 * Records what happened to the studio's email for a stored enquiry. The file is read as
 * objects, not arrays, so nothing else in it changes shape when it is written back.
 */
function wv_lead_mark(string $dir, string $reference, string $operatorEmail): void
{
    try {
        $file = wv_lead_file($dir, $reference);
        $lead = json_decode((string) @file_get_contents($file), false);
        if (!($lead instanceof stdClass) || !isset($lead->downstream) || !($lead->downstream instanceof stdClass)) return;
        $lead->downstream->operatorEmail = $operatorEmail;
        wv_write_file($file, json_encode($lead, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR) . "\n");
    } catch (Throwable $e) {
        wv_log($dir, 'warn', 'lead.mark_failed', ['reference' => $reference]);
    }
}
