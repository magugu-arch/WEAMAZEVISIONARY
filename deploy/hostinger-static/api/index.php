<?php
/**
 * WeAmaze Visionary: the website's forms on Hostinger web hosting (PHP).
 *
 * The site was built for a Node.js server, which receives the project brief, call request
 * and Contact forms at /api/enquiries. Plain web hosting cannot run that server, so this
 * file answers the same addresses with the same checks and the same replies:
 * the pages need no changes. Each enquiry is saved as a private file and emailed to the
 * studio. Every request to /api/... is routed here by .htaccess.
 */
declare(strict_types=1);

define('WV_API', true);
define('WV_API_DIR', __DIR__);
/** The largest form the site accepts, the same as the Node.js server (64 KB). */
define('WV_MAX_BODY', 65536);

ini_set('display_errors', '0');
ini_set('html_errors', '0');
error_reporting(E_ALL);
header_remove('X-Powered-By');

require __DIR__ . '/src/http.php';
require __DIR__ . '/src/validate.php';
require __DIR__ . '/src/store.php';
require __DIR__ . '/src/mailer.php';
require __DIR__ . '/src/enquiries.php';

// Any PHP warning becomes an error that is caught below: nothing half-works silently.
set_error_handler(static function (int $severity, string $message, string $file = '', int $line = 0): bool {
    if (!(error_reporting() & $severity)) return false; // suppressed with @
    throw new ErrorException($message, 0, $severity, $file, $line);
});

try {
    wv_route(wv_config());
} catch (Throwable $e) {
    wv_log(null, 'error', 'api.unhandled', ['error' => substr($e->getMessage(), 0, 160)]);
    wv_fail(500, 'server_error', 'Something went wrong on our side. Please try again.');
}

function wv_config(): array
{
    $cfg = require __DIR__ . '/config.php';
    $local = __DIR__ . '/config.local.php';
    if (is_file($local)) {
        $over = require $local;
        if (is_array($over)) $cfg = array_replace($cfg, $over);
    }
    return $cfg;
}

function wv_route(array $cfg): void
{
    $method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));
    $path = (string) parse_url((string) ($_SERVER['REQUEST_URI'] ?? '/'), PHP_URL_PATH);
    $path = (string) preg_replace('#/{2,}#', '/', $path);
    if (strlen($path) > 1) $path = rtrim($path, '/');

    // Oversized bodies are refused before anything else is looked at, as on the Node.js server.
    if ($method !== 'GET' && $method !== 'HEAD' && (int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > WV_MAX_BODY) {
        wv_fail(413, 'rejected', 'This submission is too large.', [], ['Connection: close']);
    }

    // Writes come only from this site's own pages. Browsers label every request with where
    // it came from; a form or script on another site is refused before anything is read.
    if ($method !== 'GET' && $method !== 'HEAD') {
        $site = $_SERVER['HTTP_SEC_FETCH_SITE'] ?? null;
        $origin = $_SERVER['HTTP_ORIGIN'] ?? null;
        $originHost = null;
        if (is_string($origin) && $origin !== '' && $origin !== 'null') {
            $parts = parse_url($origin);
            $originHost = is_array($parts) && isset($parts['host'])
                ? strtolower($parts['host']) . (isset($parts['port']) ? ':' . $parts['port'] : '')
                : 'invalid';
        }
        $host = strtolower((string) ($_SERVER['HTTP_HOST'] ?? ''));
        if ($site === 'cross-site' || ($originHost !== null && $originHost !== $host)) {
            wv_fail(403, 'rejected', 'Requests must come from this website.');
        }
    }

    if ($path === '/api/health') {
        // "storage" tells the owner at a glance whether enquiries can be saved.
        wv_json(200, ['ok' => true, 'time' => gmdate('Y-m-d\TH:i:s\Z'), 'forms' => 'php', 'storage' => wv_data_dir($cfg) !== null ? 'ok' : 'unavailable']);
    }
    if ($path === '/api/enquiries') {
        if ($method !== 'POST') wv_fail(405, 'rejected', 'Method not allowed.', [], ['Allow: POST']);
        wv_enquiries($cfg);
    }
    if ($path === '/api/csp-report') {
        if ($method !== 'POST') wv_fail(405, 'rejected', 'Method not allowed.', [], ['Allow: POST']);
        http_response_code(204);
        header('Cache-Control: no-store');
        exit;
    }
    // Online scheduling needs a provider that is not connected; the page then offers the
    // call request form instead, exactly as on the Node.js host.
    if ($path === '/api/booking/config') {
        wv_json(200, ['mode' => 'unavailable', 'provider' => 'none', 'meetingTypes' => []]);
    }
    if (strpos($path, '/api/booking/') === 0) {
        wv_fail(503, 'unavailable', 'Online scheduling is not connected yet.');
    }
    wv_fail(404, 'not_found', 'Not found.');
}
