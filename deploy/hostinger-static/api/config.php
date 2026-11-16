<?php
/**
 * Settings for the website's forms on Hostinger web hosting (docs/14_DEPLOY_HOSTINGER.md).
 * Nothing here is secret. To change a setting without losing it at the next upload, copy
 * this file to "config.local.php" in the same folder and edit the copy: it wins over this one.
 */
if (!defined('WV_API')) { http_response_code(404); exit; }

return [
    // Where enquiries are emailed. Empty = save only, send no email.
    'operator_email' => 'weamazevisionary@gmail.com',

    // The sender shown on those emails. It must be an address on the website's own domain,
    // and on Hostinger it should be a mailbox that exists (hPanel > Emails), or the mail
    // may be refused or land in spam.
    'mail_from' => 'website@weamazevisionary.com',
    'mail_from_name' => 'WeAmaze Visionary website',

    // Where enquiries are saved. Empty = automatic: a private folder next to public_html
    // (outside the website, so it survives re-uploads and cannot be opened in a browser).
    'data_dir' => '',

    // Spam limits: submissions allowed per visitor, and in total, in each time window (seconds).
    'rate_limit_max' => 5,
    'rate_limit_window' => 600,
    'global_limit_max' => 60,
    'global_limit_window' => 3600,

    // A form sent faster than this many seconds after it was opened is treated as a robot.
    'min_form_seconds' => 3,
];
