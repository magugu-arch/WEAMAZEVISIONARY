<?php
/**
 * The same rules as shared/enquiry.ts, which the pages also apply before sending. The
 * server's answer is the one that counts; field names and messages match, so a problem is
 * shown beside the right field. Keep this file in step with shared/enquiry.ts.
 */
if (!defined('WV_API')) { http_response_code(404); exit; }

const WV_SERVICE_NAMES = [
    'ai-creative-studio' => 'AI Creative Studio',
    'ai-presentations-pitch-decks' => 'AI Presentations & Pitch Decks',
    'websites-digital-experiences' => 'Websites & Digital Experiences',
    'apps-digital-products' => 'Apps & Digital Products',
    'ai-solutions-automation' => 'AI Solutions & Automation',
    '3d-animation-motion-design' => '3D, Animation & Motion Design',
    'brand-strategy-creative-direction' => 'Brand Strategy & Creative Direction',
    'digital-innovation-technology' => 'Digital Innovation & Technology',
    'help-me-define-it' => 'Help me define it',
];
const WV_TIMEFRAMES = [
    'asap' => 'As soon as possible',
    'within-3-months' => 'Within three months',
    '3-6-months' => 'In three to six months',
    '6-plus-months' => 'More than six months away',
    'not-sure' => 'Not sure yet',
];
const WV_BUDGETS = ['not-sure' => 'Not sure yet', 'prefer-to-discuss' => 'I’d prefer to discuss it'];
const WV_CALL_WINDOWS = ['weekday-morning' => 'Weekday mornings', 'weekday-afternoon' => 'Weekday afternoons', 'weekday-evening' => 'Weekday early evenings'];
const WV_CONTACT_TOPICS = ['project' => 'A project', 'partnership' => 'A partnership', 'press' => 'Press or speaking', 'other' => 'Something else'];

const WV_INVALID = 'Invalid input';
const WV_MSG_EMAIL = 'Enter an email address in the format name@example.com.';
const WV_MSG_NAME = 'Enter your name.';
const WV_MSG_CONSENT = 'Please confirm you agree so we can respond.';
const WV_MSG_TZ = 'Choose a valid time zone.';
/** The pattern the pages use (zod's email check). It allows no spaces or line breaks, so an address is safe in a mail header. */
const WV_EMAIL_RE = '/^(?:[A-Za-z0-9_\'+\-]+\.)*[A-Za-z0-9_\'+\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}\z/';

/** Records the first problem found for a field. */
function wv_err(array &$errs, string $path, string $message): void
{
    if (!array_key_exists($path, $errs)) $errs[$path] = $message;
}
function wv_has($obj, string $key): bool
{
    return $obj instanceof stdClass && property_exists($obj, $key);
}
function wv_get($obj, string $key)
{
    return wv_has($obj, $key) ? $obj->{$key} : null;
}
/** Removes leading and trailing white space, including non-breaking and other Unicode spaces. */
function wv_trim(string $s): string
{
    $t = preg_replace('/^[\s\p{Z}\x{FEFF}]+|[\s\p{Z}\x{FEFF}]+\z/u', '', $s);
    return is_string($t) ? $t : trim($s);
}
/** Length in characters, counted the way the site's validator (zod) counts them: an emoji is one. */
function wv_len(string $s): int
{
    $chars = preg_match_all('/./us', $s);
    return $chars === false ? strlen($s) : $chars;
}

/** A trimmed string of at most $max characters. Missing: '' when optional, a problem when required. */
function wv_str($obj, string $key, string $path, array &$errs, int $max, bool $optional, ?int $min = null, ?string $minMessage = null): string
{
    if (!wv_has($obj, $key)) {
        if (!$optional) wv_err($errs, $path, WV_INVALID);
        return '';
    }
    $v = $obj->{$key};
    if (!is_string($v)) {
        wv_err($errs, $path, WV_INVALID);
        return '';
    }
    $v = wv_trim($v);
    if (wv_len($v) > $max) wv_err($errs, $path, "Please keep this under {$max} characters.");
    elseif ($min !== null && wv_len($v) < $min) wv_err($errs, $path, $minMessage ?? WV_INVALID);
    return $v;
}
function wv_email($obj, string $key, string $path, array &$errs): string
{
    $v = wv_get($obj, $key);
    if (!is_string($v)) {
        wv_err($errs, $path, WV_INVALID);
        return '';
    }
    $v = wv_trim($v);
    if (wv_len($v) > 254 || preg_match(WV_EMAIL_RE, $v) !== 1) wv_err($errs, $path, WV_MSG_EMAIL);
    return $v;
}
function wv_valid_time_zone(string $tz): bool
{
    if ($tz === '' || strlen($tz) > 64 || preg_match('/^[A-Za-z0-9_+\-\/]+\z/', $tz) !== 1) return false;
    try {
        new DateTimeZone($tz);
        return true;
    } catch (Throwable $e) {
        return false;
    }
}
function wv_time_zone($obj, string $key, string $path, array &$errs): string
{
    $v = wv_get($obj, $key);
    if (!is_string($v)) {
        wv_err($errs, $path, WV_INVALID);
        return '';
    }
    $v = wv_trim($v);
    if (!wv_valid_time_zone($v)) wv_err($errs, $path, WV_MSG_TZ);
    return $v;
}
function wv_phone($obj, string $key, string $path, array &$errs): string
{
    if (!wv_has($obj, $key)) return '';
    $v = $obj->{$key};
    if (!is_string($v)) {
        wv_err($errs, $path, WV_INVALID);
        return '';
    }
    $v = wv_trim($v);
    if (wv_len($v) > 40) wv_err($errs, $path, WV_INVALID);
    elseif ($v !== '' && preg_match('/^\+?[0-9][0-9\s().\-]{5,}\z/u', $v) !== 1) wv_err($errs, $path, 'Enter a phone number using digits, spaces and an optional +.');
    return $v;
}
/** One of the allowed ids. Returns null when optional and missing. */
function wv_enum($obj, string $key, string $path, array &$errs, array $allowed, bool $optional, string $message = WV_INVALID): ?string
{
    if (!wv_has($obj, $key)) {
        if (!$optional) wv_err($errs, $path, $message);
        return null;
    }
    $v = $obj->{$key};
    if (!is_string($v) || !in_array($v, $allowed, true)) {
        wv_err($errs, $path, $message);
        return null;
    }
    return $v;
}
/** A list of allowed ids, between $min and $max long. */
function wv_enum_list($obj, string $key, string $path, array &$errs, array $allowed, int $min, int $max, string $minMessage): array
{
    $v = wv_get($obj, $key);
    if (!is_array($v)) {
        wv_err($errs, $path, WV_INVALID);
        return [];
    }
    if (count($v) < $min) wv_err($errs, $path, $minMessage);
    if (count($v) > $max) wv_err($errs, $path, WV_INVALID);
    $out = [];
    foreach (array_values($v) as $i => $item) {
        if (!is_string($item) || !in_array($item, $allowed, true)) wv_err($errs, "{$path}.{$i}", WV_INVALID);
        else $out[] = $item;
    }
    return $out;
}
function wv_consent($obj, array &$errs): bool
{
    if (wv_get($obj, 'consent') !== true) wv_err($errs, 'consent', WV_MSG_CONSENT);
    return true;
}
/** A named part of the form, which must be an object. */
function wv_section($obj, string $key, array &$errs): ?stdClass
{
    $v = wv_get($obj, $key);
    if ($v instanceof stdClass) return $v;
    wv_err($errs, $key, WV_INVALID);
    return null;
}

/** Project brief (the five steps of the builder). */
function wv_validate_project(stdClass $p, array &$errs): array
{
    $intents = array_keys(WV_SERVICE_NAMES);
    $out = ['type' => 'project'];

    $s = wv_section($p, 'intent', $errs);
    if ($s) {
        $out['intent'] = [
            'services' => wv_enum_list($s, 'services', 'intent.services', $errs, $intents, 1, count($intents), 'Choose at least one option, or “Help me define it”.'),
            'outcome' => wv_str($s, 'outcome', 'intent.outcome', $errs, 1000, true),
        ];
    }

    $s = wv_section($p, 'context', $errs);
    if ($s) {
        $individual = false;
        if (wv_has($s, 'isIndividual')) {
            if (is_bool($s->isIndividual)) $individual = $s->isIndividual;
            else wv_err($errs, 'context.isIndividual', WV_INVALID);
        }
        $organisation = wv_str($s, 'organisation', 'context.organisation', $errs, 160, true);
        $out['context'] = [
            'isIndividual' => $individual,
            'organisation' => $organisation,
            'sector' => wv_str($s, 'sector', 'context.sector', $errs, 120, true),
            'audience' => wv_str($s, 'audience', 'context.audience', $errs, 600, true),
            'background' => wv_str($s, 'background', 'context.background', $errs, 4000, false, 20, 'Tell us a little more about the project (at least 20 characters).'),
        ];
        if (!$individual && wv_len($organisation) < 2) wv_err($errs, 'context.organisation', 'Enter your organisation, or tick “I’m enquiring as an individual”.');
    }

    $s = wv_section($p, 'scope', $errs);
    if ($s) {
        $deliverables = [];
        if (wv_has($s, 'deliverables')) {
            if (!is_array($s->deliverables)) {
                wv_err($errs, 'scope.deliverables', WV_INVALID);
            } else {
                if (count($s->deliverables) > 60) wv_err($errs, 'scope.deliverables', WV_INVALID);
                foreach (array_values($s->deliverables) as $i => $item) {
                    if (!is_string($item)) {
                        wv_err($errs, "scope.deliverables.{$i}", WV_INVALID);
                        continue;
                    }
                    $item = wv_trim($item);
                    if (wv_len($item) > 160) wv_err($errs, "scope.deliverables.{$i}", 'Please keep this under 160 characters.');
                    $deliverables[] = $item;
                }
            }
        }
        $out['scope'] = [
            'deliverables' => $deliverables,
            'channels' => wv_str($s, 'channels', 'scope.channels', $errs, 600, true),
            'markets' => wv_str($s, 'markets', 'scope.markets', $errs, 600, true),
            'integrations' => wv_str($s, 'integrations', 'scope.integrations', $errs, 800, true),
        ];
    }

    $s = wv_section($p, 'timing', $errs);
    if ($s) {
        $out['timing'] = [
            'timeframe' => wv_enum($s, 'timeframe', 'timing.timeframe', $errs, array_keys(WV_TIMEFRAMES), false, 'Choose a timeframe, or “Not sure yet”.'),
            'dependency' => wv_str($s, 'dependency', 'timing.dependency', $errs, 600, true),
        ];
        $budget = wv_enum($s, 'budget', 'timing.budget', $errs, array_keys(WV_BUDGETS), true);
        if ($budget !== null) $out['timing']['budget'] = $budget;
    }

    $s = wv_section($p, 'contact', $errs);
    if ($s) {
        $out['contact'] = [
            'name' => wv_str($s, 'name', 'contact.name', $errs, 120, false, 2, WV_MSG_NAME),
            'email' => wv_email($s, 'email', 'contact.email', $errs),
            'role' => wv_str($s, 'role', 'contact.role', $errs, 120, true),
            'country' => wv_str($s, 'country', 'contact.country', $errs, 80, true),
            'timeZone' => wv_time_zone($s, 'timeZone', 'contact.timeZone', $errs),
            'phone' => wv_phone($s, 'phone', 'contact.phone', $errs),
        ];
    }

    $out['consent'] = wv_consent($p, $errs);
    return $out;
}

/** The Contact page's request box (general requests and partnerships). */
function wv_validate_contact(stdClass $p, array &$errs): array
{
    $out = ['type' => $p->type];
    $topic = wv_enum($p, 'topic', 'topic', $errs, array_keys(WV_CONTACT_TOPICS), true);
    if ($topic !== null) $out['topic'] = $topic;
    $out['subject'] = wv_str($p, 'subject', 'subject', $errs, 140, true);
    $out['name'] = wv_str($p, 'name', 'name', $errs, 120, false, 2, WV_MSG_NAME);
    $out['email'] = wv_email($p, 'email', 'email', $errs);
    $out['organisation'] = wv_str($p, 'organisation', 'organisation', $errs, 160, true);
    $out['capability'] = wv_str($p, 'capability', 'capability', $errs, 600, true);
    $out['message'] = wv_str($p, 'message', 'message', $errs, 4000, false, 10, 'Please add a short message (at least 10 characters).');
    $out['consent'] = wv_consent($p, $errs);
    return $out;
}

/** A request for a call, used while online scheduling is not connected. */
function wv_validate_call_request(stdClass $p, array &$errs): array
{
    $out = ['type' => 'call-request'];
    $out['name'] = wv_str($p, 'name', 'name', $errs, 120, false, 2, WV_MSG_NAME);
    $out['email'] = wv_email($p, 'email', 'email', $errs);
    $out['organisation'] = wv_str($p, 'organisation', 'organisation', $errs, 160, true);
    $out['timeZone'] = wv_time_zone($p, 'timeZone', 'timeZone', $errs);
    $out['windows'] = wv_enum_list($p, 'windows', 'windows', $errs, array_keys(WV_CALL_WINDOWS), 1, 50, 'Choose at least one time that could work.');
    $topic = wv_enum($p, 'topic', 'topic', $errs, array_keys(WV_SERVICE_NAMES), true);
    if ($topic !== null) $out['topic'] = $topic;
    $out['notes'] = wv_str($p, 'notes', 'notes', $errs, 2000, true);
    $out['consent'] = wv_consent($p, $errs);
    return $out;
}

/**
 * The wrapper every form sends around its answers: a one-off key (so a double tap or a
 * retry is never stored twice), when the form was opened, a hidden field real people leave
 * empty, and which page it came from. Returns null when it cannot be read.
 */
function wv_validate_envelope($body): ?array
{
    if (!($body instanceof stdClass)) return null;
    $key = wv_get($body, 'idempotencyKey');
    if (!is_string($key) || preg_match('/^[A-Za-z0-9-]{16,80}\z/', $key) !== 1) return null;
    $started = wv_get($body, 'startedAt');
    if (is_float($started) && floor($started) === $started && $started < 9.0e15) $started = (int) $started;
    if (!is_int($started) || $started <= 0) return null;
    $website = '';
    if (wv_has($body, 'website')) {
        $website = $body->website;
        if (!is_string($website) || wv_len($website) > 200) return null;
    }
    $source = null;
    if (wv_has($body, 'source')) {
        $s = $body->source;
        if (!($s instanceof stdClass)) return null;
        $route = wv_get($s, 'route');
        if (!is_string($route)) return null;
        $route = wv_trim($route);
        if (wv_len($route) > 200) return null;
        $source = ['route' => $route];
        if (wv_has($s, 'utm')) {
            if (!($s->utm instanceof stdClass)) return null;
            $utm = [];
            foreach (get_object_vars($s->utm) as $k => $v) {
                if (wv_len((string) $k) > 40 || !is_string($v) || wv_len($v) > 120) return null;
                $utm[(string) $k] = $v;
            }
            $source['utm'] = (object) $utm;
        }
    }
    // The answers must be there (they may be null, which is then an unknown kind of enquiry).
    if (!wv_has($body, 'payload')) return null;
    return ['idempotencyKey' => $key, 'startedAt' => $started, 'website' => $website, 'source' => $source, 'payload' => $body->payload];
}
