# 10 — Security

What protects the site today, what was tested, and what the owner should set up at launch. No website can be made impossible to attack; the aim is to leave nothing easy to exploit, keep damage small if something goes wrong, and notice quickly.

## What the site is exposed to
- **No accounts, no passwords, no payments, no file uploads.** The only data the site receives is text typed into the project builder, booking and Contact forms. There is no upload field, so there is no route for a visitor to plant a virus or malicious file on the server.
- **No database server.** Enquiries are JSON files in one private folder (`LEAD_STORE_DIR`), created readable by the server account only (mode 0600) and never served to the web.
- **No third-party scripts.** Fonts, images, films and code are all served from the site itself, so no outside script can be swapped for a malicious one.

## Protections in the code
| Threat | Protection | Tested by |
|---|---|---|
| Injected scripts (XSS) | Content Security Policy allows scripts from this site only, never inline; JSON-LD is escaped; React escapes all text | `seo.test.ts`, axe and route tests |
| Clickjacking | `frame-ancestors 'none'` and `X-Frame-Options: DENY` | header checks |
| Forged form posts from other sites (CSRF) | Writes need `Content-Type: application/json` and are refused when the browser marks them cross-site or the `Origin` is another site; there are no cookies to steal | `api.test.ts` hardening, `robustness.spec.ts` |
| Spam and floods | Honeypot field, minimum fill time, per-visitor rate limit (5 per 10 minutes by default), idempotency keys | `api.test.ts` |
| Faked visitor addresses | Only addresses added by trusted proxies are used (`TRUST_PROXY_HOPS`); the visitor-written part of `X-Forwarded-For` is ignored | `client-ip.test.ts` |
| Oversized requests | Bodies over 64 KB are refused with 413 before they are read in full | `robustness.spec.ts` |
| Slow-connection attacks | Headers must arrive within 66 s and the whole request within 120 s; at most 100 headers | server settings |
| Path traversal and file leaks | Only files inside `dist/client` are served; `..`, encoded traversal, dotfiles, source and data folders return 404 | `robustness.spec.ts` |
| Malformed addresses | Answered with 400; no request can crash the server | `robustness.spec.ts` |
| Information leaks | No `X-Powered-By`; errors never include internals; the public health check says only “ok”; no source maps | `api.test.ts` |
| Tampered booking webhooks | HMAC signatures with timestamps and replay protection | `api.test.ts` |
| Secrets | Read only on the server from environment variables; never sent to the browser or written to the repository | code review |
| Running as an administrator | The Docker image runs as the unprivileged `node` user | `Dockerfile` |
| Known-vulnerable libraries | `npm audit`: 0 vulnerabilities, including the development tools | QA report |
| Tampered files on a CDN or proxy | Subresource Integrity: every script and the stylesheet carry a SHA-384 hash of what was built; the browser refuses a file that differs | `robustness.spec.ts` |
| Pages served without the server's headers | Every page also carries the policy in `<meta>` tags (Content Security Policy and referrer policy), so a static host, cache or saved copy keeps the rules | `robustness.spec.ts` |
| Unused browser features being abused | Permissions-Policy switches off camera, microphone, location, payment, USB, serial, HID, MIDI, sensors, screen capture, clipboard reading, ad-interest tracking (Topics/FLoC), local-network access and more; only autoplay, fullscreen, picture-in-picture and clipboard writing stay on, for this site only | `security.test.ts` |
| Silent attacks | The browser reports anything the policy blocks to `/api/csp-report` on the site itself (no outside service). Reports are logged as `csp.violation` with the page path, the rule and the blocked source only, never query strings or visitor details; rate-limited and capped | `security.test.ts`, `api.test.ts` |
| Isolation between sites | `Origin-Agent-Cluster`, `Cross-Origin-Opener-Policy` and `Cross-Origin-Resource-Policy` keep other sites' pages out of this site's memory and windows; `X-Permitted-Cross-Domain-Policies: none`, `X-DNS-Prefetch-Control: off`, and the retired XSS filter switched off (`X-XSS-Protection: 0`) as current guidance advises | `security.test.ts` |
| The offline file | Its own policy lets it load nothing from anywhere: only its one inline script (pinned by hash), inline styles and embedded media; its request form may only open an email; no referrer is sent. The site's header policy is left off this one file, because browsers apply both and together they blocked its embedded films and fonts when it was opened by its web address; framing stays forbidden | `offline-edition.spec.ts`, `security.test.ts` |

A browser crawl of every route, on desktop and phone, shows no console errors, no failed requests and no security-policy violations (QA-D40/41/43). `/.well-known/security.txt` tells researchers to report problems to the studio inbox.

**Where the policy lives:** `shared/security.ts` is the single source for the Content Security Policy, referrer policy and Permissions-Policy; the server headers and the `<meta>` tags are built from it, so they cannot drift apart.

**Reading the reports:** search the host's logs for `csp.violation`. One-off reports from browser extensions are normal (they show a `chrome-extension` or `moz-extension` source). A burst of reports for the same page and rule after a release means something in that release needs fixing; reports for an unknown outside address mean someone tried to inject code and was stopped.

## On Hostinger web hosting (where the site runs today)
The live site is served as plain files with a small PHP program for the forms (`docs/14_DEPLOY_HOSTINGER.md`, section 13). The table above describes the Node.js server; on this hosting:

- **The same:** every security header (sent by `.htaccess`, built from `shared/security.ts`), Subresource Integrity, the `<meta>` policies, and all the form protections: same-site checks, the honeypot, the minimum fill time, 5 sends per visitor in 10 minutes, one-off keys against double sends, and the 64 KB limit. A 62-case comparison (`scripts/compare-form-servers.mjs`) confirms the PHP program accepts and refuses exactly what the Node.js server does.
- **Enquiries** are saved in a `weamaze-visionary-data` folder next to `public_html`, outside the website, as files only the hosting account can read. Visitor addresses are never written down: the limits keep a keyed fingerprint for about an hour.
- **Email** is sent by the hosting's own mail service. Nothing typed into a form can add recipients or change an email's headers (tested with injected headers in every field). No API keys are involved, so there are no secrets on this hosting.
- **An extra limit** of 60 sends an hour for the whole site protects the inbox and the hosting from a flood that comes from many addresses.
- **Not available:** policy reports (`/api/csp-report` accepts them but there is nowhere to log them; the policy is still enforced by the browser), signed booking webhooks and the CRM link.
- **Handled by Hostinger, not by this project:** slow-connection limits, the account the web server runs as, and server patches. Keep the PHP version current in hPanel.

## Owner actions at launch (most important first)
1. **Turn on two-factor authentication everywhere:** domain registrar, Cloudflare, the host (Hostinger today; Fly.io if you move), GitHub, Resend and the Gmail inbox. Most real break-ins start with a stolen password, not with the website's code.
2. **Put Cloudflare in front and close the side door.** Proxy the domain through Cloudflare, set SSL to *Full (strict)*, turn on *Bot Fight Mode* and the free managed rules, and allow traffic to the server only through Cloudflare, so its DDoS protection cannot be bypassed. Then set `TRUST_PROXY=true` and `TRUST_PROXY_HOPS=2`.
3. **Force HTTPS for good:** set `FORCE_HSTS=true`; once the site has run on HTTPS for a few weeks, consider submitting the domain to the HSTS preload list.
4. **Protect the enquiries:** on Hostinger web hosting, download the `weamaze-visionary-data/leads` folder once a month and keep hPanel's backups on; on a VPS or Fly.io, enable encrypted volumes and daily snapshots and back up `LEAD_STORE_DIR` to separate storage. Test a restore every quarter. Delete enquiries you no longer need, in line with the privacy notice.
5. **Keep Cloudflare from rewriting the site's code:** leave *Rocket Loader* and *Email Address Obfuscation* off. Both rewrite the pages after they leave the server, add nothing for this site, and can conflict with the integrity hashes and the security policy. After any Cloudflare change, open the site and check the browser console is clean.
6. **Keep secrets in the host's secret store** (API keys for Resend, CRM and booking webhooks). Rotate them if anyone with access leaves.
7. **Keep software current:** turn on Dependabot (or Renovate) on GitHub, and rebuild monthly so the Node base image gets security patches.
8. **Watch and be told:** an uptime monitor on `/` and `/api/health`, Cloudflare security alerts, a log alert on `csp.violation` bursts, and email alerts for failed deliveries (already built in via `OPERATOR_NOTIFICATION_EMAIL`).
9. **Check the live site** after launch with Mozilla Observatory and securityheaders.com, and consider an independent penetration test before large ad campaigns.
10. **Have a plan:** if something looks wrong, put Cloudflare in “Under Attack” mode, rotate keys, restore from backup and tell affected people as POPIA and GDPR require.
