# 14 — Deploy to Hostinger

How to put the WeAmaze Visionary website online on Hostinger, for visitors worldwide. The website's design, branding and features are the same on every option below.

**Where the site runs today (November 2026):** on Hostinger **web hosting**, uploaded into `public_html`, with the PHP form handler receiving the forms. That setup is described in **section 13**; start there to update the live site. Sections 1 to 12 describe the VPS, which remains the recommended step up when the studio wants Node.js features (online scheduling, the CRM link, automatic confirmation emails).

## Summary: the final settings

| Setting | Value |
|---|---|
| **Hosting type** | **Hostinger VPS** (recommended): plan **KVM 1** (1 vCPU, 4 GB RAM, 50 GB disk) |
| **Server location** | **United Kingdom**. If it is not offered, choose the Netherlands or France (see "Where to host") |
| **Operating system** | Ubuntu 24.04 with Docker (Hostinger's Docker template) |
| **CDN** | Cloudflare, free plan (Hostinger's own CDN belongs to its web hosting plans, not VPS) |
| **Node.js / package manager** | Node.js 22 (inside the Docker image) · npm, with `package-lock.json` |
| **Build command** | `npm run build:production` (run for you by `docker compose up -d --build`) |
| **Start command** | `node dist/server/node.js` (inside the image); entry file `server.js` on managed hosting |
| **Publishing directory** | `dist/client`, served by the site's own Node server, not uploaded on its own |
| **Start or update the site** | `docker compose up -d --build` |
| **HTTPS** | Automatic and free: Caddy gets and renews Let's Encrypt certificates for the domain and `www` |
| **Database** | None needed: enquiries are saved as files on a Docker volume, with daily backups |

## 1. What the website is

| | |
|---|---|
| **Framework** | React 19 and TypeScript, built with Vite 7 and Tailwind CSS 4, React Router 7 |
| **Type** | **Full-stack Node.js application.** Every page is prerendered to plain HTML at build time (fast, and works on refresh and from shared links). One small Node.js 22 server serves the pages, images and films, and runs the API behind the forms. |
| **Forms and API** | Project brief, call request, partnership and Contact-page request box (`/api/enquiries`); call booking (`/api/booking/*`, with its provider switched off until one is chosen); browser security reports (`/api/csp-report`); health check (`/api/health`) |
| **Storage** | Enquiries are saved as private JSON files (the "lead store"), with a queue (the "outbox") that delivers email and CRM notifications and retries them if a provider is down. No database. |
| **Outside services** | All optional, and all called from the server only: **Resend** (email notifications), a **CRM webhook** (sends each enquiry to your CRM, signed with a secret). Both have 10-second timeouts and automatic retries. |
| **AI integrations** | **None.** The website does not call any AI service (no OpenAI, Anthropic or similar API, and no AI keys anywhere in the code). AI is part of the studio's work, not of the website's code. |
| **Size** | About 128 MB of built site, mostly films and images |

## 2. Which Hostinger hosting, and why

| Option | Verdict | Why |
|---|---|---|
| **Web hosting with the PHP form handler** (Premium, Business web hosting, "Upload website") | **Supported** (added 16 November 2026, section 13) | The pages are uploaded as plain files, and a small PHP program in `api/` receives the forms with the same checks as the Node server, saves each enquiry privately and emails it to the studio. Visitors get no automatic confirmation email, and CRM and online scheduling are not available. |
| **Managed Node.js web app** (Business or Cloud web hosting) | **Possible, with checks first** | Cheapest and easiest, with Hostinger's CDN and SSL included. But Hostinger's documentation says files changed on the server do not survive a redeploy, and it does not say whether files the app writes itself (your saved enquiries) survive one. Node.js 22 must also be on offer. The project is ready for it (see "Alternative"), but confirm those points with Hostinger support before choosing it. |
| **VPS KVM 1** | **Recommended** | Runs the exact Docker image tested here, with Node.js 22 built in. Enquiries live on a disk that survives every update. You control HTTPS, firewall and backups, and how visitors' addresses reach the site, which the form's spam limits depend on. It costs a little more, and you apply updates yourself (two commands, below). |

**Features a managed Node.js plan cannot guarantee** (according to Hostinger's documentation as found on 13 November 2026):

- Saved enquiries may not survive a redeploy, unless support confirms a folder that does.
- Node.js 22 may not be on offer (the site needs 22.12 or newer).
- The email and CRM queue needs the server to keep running between visits.
- The form's spam limits rely on knowing how many proxies stand in front of the site, and Hostinger does not document that.

None of these is an issue on a VPS.

## 3. Where to host: the server location

Hostinger has **no data centre in Africa**. Reports from 2026 list the **United Kingdom, the Netherlands, France, Lithuania, the United States, Brazil, India, Indonesia and Malaysia**, and some list Singapore, but which ones are offered depends on the plan and changes over time. **Check the actual list in hPanel when you buy**: for a VPS the location is chosen during setup, and for web hosting hPanel shows the data centre options for your plan.

**Recommended: United Kingdom.** For a South African studio with clients in Europe, the US and Asia, the UK is the best single location:

| Visitors in | Typical round trip to a UK server | Notes |
|---|---|---|
| South Africa | about 150–170 ms | Most South African traffic to Europe is direct; to the US or Asia it often goes via Europe anyway |
| Europe | about 10–40 ms | |
| United States (east) | about 70–80 ms | |
| Asia (Singapore, India) | about 110–170 ms | |

These are typical figures for routes between those regions, not measurements of Hostinger's network. Hosting in the US would add about 230 ms for South African visitors, and Singapore about 200–300 ms. The Netherlands and France perform almost the same as the UK. With Cloudflare in front, images, scripts and fonts are served from Cloudflare's cities, including Johannesburg, Cape Town and Durban, so only the page itself and form submissions travel to the UK.

**Privacy:** enquiries contain personal information. Hosting in the UK means storing it outside South Africa. POPIA allows this when the destination has adequate protection, and UK GDPR is generally treated as adequate. Name Hostinger and the UK in the privacy notice's "Where it goes" section, which is already marked for the owner and legal adviser to confirm.

## 4. What was changed in the project, and why

| Change | Why |
|---|---|
| `vite.server.config.ts`: the server build no longer copies the `public` folder | Every image and film (about 140 MB) was copied a second time into `dist/server`, where nothing used it. Builds, uploads and the Docker image are now smaller (the server folder is 248 KB, and the image 586 MB instead of 881 MB). |
| `scripts/prerender.mjs` writes `dist/server/build.json`, and `server/lib/buildInfo.ts` reads it | Hosts that build and run the site in separate steps may not pass `PUBLIC_SITE_ENV` to the running server. It would then default to "staging" and tell search engines not to index the site. A production build now always runs as production unless the host deliberately says otherwise (with a warning in the logs if the two differ). Covered by 4 new unit tests. |
| `package.json`: new script `build:production` | A build command that always builds the public site. Hostinger chooses the build command from these scripts. |
| `server.js` (new, in the project root) | The entry file Hostinger's managed Node.js apps ask for. It starts the built server, or explains that the build is missing. |
| `.npmrc`: `include=dev` | The build tools (Vite, TypeScript, Tailwind) are development dependencies. Hosts that install with `NODE_ENV=production` would skip them and the build would fail. Tested: a clean install with `NODE_ENV=production` now installs them. |
| `docker-compose.yml` (new) | Runs the site and Caddy on the VPS with one command, with the enquiry volume, log limits and hardening: read-only files, minimal privileges and no privilege escalation. |
| `deploy/Caddyfile` (new) | Free automatic HTTPS for the domain and `www`, HTTP to HTTPS redirect, `www` to bare-domain redirect, and HTTP/3. During an update it holds requests for up to 15 s instead of failing them. |
| `deploy/hostinger.env.example` (new) | The settings file for the server: the domain, and the email and CRM keys when you have them. |
| `deploy/backup.sh` (new) | Daily backup of saved enquiries, keeping the last 30 days. |
| `scripts/docker-entrypoint.sh`: hands the data folder to the app only on first use | Testing found that with the hardened setup, the site could not restart once enquiries had been saved: the start-up step could no longer read the folder, and the container restarted in a loop. Fixed and re-tested. This also applies to Fly.io. |

Nothing else changed. The pages, design, branding, content and features are exactly as before, and the Fly.io setup still works.

## 5. Security

- **Secrets stay on the server.** API keys (Resend, CRM and booking secrets) are read only by the Node server, from the `.env` file on the VPS (readable by root only) or from Hostinger's environment variables. They are never in the code, the repository, the Docker image or anything sent to browsers. A scan of the built site and the repository found none.
- **Forms:** limited to 5 submissions per visitor per 10 minutes, with a hidden spam trap, a minimum fill time, size limits, strict validation and same-site checks. Visitors cannot fake their address to get past the limit (tested through Caddy).
- **Headers:** strict Content Security Policy, HSTS (HTTPS only), clickjacking protection, a locked-down permissions policy and isolation headers, plus Subresource Integrity on scripts. Full list: `docs/10_SECURITY.md`.
- **Server hardening:** the site runs as an unprivileged user in a container whose files cannot be changed, with only the privileges its start-up needs and no privilege escalation. It is not reachable from the internet except through Caddy (ports 80 and 443 only).
- **Your actions on the VPS:** sign in with an SSH key, then turn off password sign-in. Use Hostinger's firewall to allow only ports 22, 80 and 443. Keep automatic security updates on (Ubuntu's default). Use a strong hPanel password and two-factor authentication.

## 6. Data, backups and recovery

- **Where enquiries are saved:** the Docker volume `weamaze-visionary_weamaze_data`, as private files (mode 600, in a folder only the app can read). They survive updates, restarts and reboots.
- **Daily backup:** `deploy/backup.sh` writes a compressed copy to `/root/weamaze-backups` every night and keeps the last 30 days (setup in step 11).
- **Off-site copy:** a VPS backup is lost if the server is. Once a month, download the latest backup to your computer (step 11), or turn on Hostinger's VPS backups in hPanel (Backups). Hostinger includes some VPS backups; check the frequency on your plan.
- **Central record:** turn on email notifications (Resend) so every enquiry also reaches your inbox, and optionally the CRM webhook. Then no enquiry exists only on the server.
- **Restore** from a backup file:

```bash
docker run --rm -v weamaze-visionary_weamaze_data:/data -v /root/weamaze-backups:/backup alpine:3.22 tar -xzf /backup/enquiries-YYYY-MM-DD.tar.gz -C /data
```

## 7. Settings (environment variables)

On the VPS these go in the `.env` file (step 7). The fixed ones are already set in `docker-compose.yml`.

| Variable | Value | Secret? | Where |
|---|---|---|---|
| `SITE_DOMAIN` | `weamazevisionary.com` | No | `.env` |
| `TRUST_PROXY_HOPS` | `1`, or `2` with Cloudflare in front | No | `.env` |
| `OPERATOR_NOTIFICATION_EMAIL` | `weamazevisionary@gmail.com` | No | `.env` |
| `EMAIL_PROVIDER`, `EMAIL_FROM`, `EMAIL_REPLY_TO` | `resend`, your sender, your reply address | No | `.env` (when Resend is set up) |
| `RESEND_API_KEY` | from resend.com | **Yes** | `.env` only |
| `CRM_PROVIDER`, `CRM_WEBHOOK_URL_*` | `webhook` and your CRM's URLs | URLs: treat as secret | `.env` (optional) |
| `CRM_WEBHOOK_SECRET`, `BOOKING_WEBHOOK_SECRET` | long random strings | **Yes** | `.env` only |
| `NODE_ENV`, `HOST`, `PORT`, `PUBLIC_SITE_ENV`, `PUBLIC_SITE_URL`, `LEAD_STORE_DIR`, `TRUST_PROXY`, `FORCE_HSTS` | already set | No | `docker-compose.yml` |

Every variable is explained in `.env.example`. The site checks its settings when it starts, and names any invalid one in the logs.

## 8. Deployment guide (VPS)

### Step 1: Hosting plan

In Hostinger, buy **VPS → KVM 1**. KVM 2 (2 vCPU, 8 GB) is only needed for much higher traffic. During setup:

- **Location:** United Kingdom (or the Netherlands or France).
- **Operating system:** Ubuntu 24.04 **with Docker** (under Applications or OS with panel → Docker).
- Set a strong root password, and add your SSH public key if you have one.

Note the server's **IPv4 and IPv6 addresses** (hPanel → VPS → Overview).

### Step 2: Firewall

In hPanel, open the VPS's **Firewall** settings: create a rule set that **accepts TCP 22, TCP 80, TCP 443 and UDP 443**, and drops everything else, and activate it.

### Step 3: GitHub repository

There are two copies of the project, and only one of them may be public:

| Copy | What it holds | Where it may go |
|---|---|---|
| **Public edition** | The website exactly as the public sees it, the server, the form handler and these deployment guides. No original client files, and nothing from work that is not cleared for publication | The public GitHub repository `WEAMAZEVISIONARY`. This is the copy a server downloads |
| **Full project** | Everything, including the original client files (`source-assets`) and the case studies still awaiting permission | The studio's own computers, or a **private** repository only. Never a public one |

The public edition is already on GitHub. The server in step 6 downloads it; you do not need to create anything here.

To keep a private backup of the full project on GitHub as well: create a repository there, set it to **Private** before pushing anything, and push the full project to it. Check that GitHub shows the **Private** label first.

### Step 4: Connect to the server

From your computer (or with hPanel's **Browser terminal**):

```bash
ssh root@YOUR_SERVER_IP
```

### Step 5: Give the server read-only access (private repositories only)

**Skip this step** when the server downloads the public edition: a public repository needs no key. It is only needed if you deploy from a private repository.

On the server, create a deploy key:

```bash
ssh-keygen -t ed25519 -N "" -f /root/.ssh/github_deploy
```

```bash
cat /root/.ssh/github_deploy.pub
```

Copy the line it prints. On GitHub: repository → **Settings → Deploy keys → Add deploy key**, paste it, and leave "Allow write access" **off**. Then tell the server to use it for GitHub:

```bash
printf 'Host github.com\n  IdentityFile /root/.ssh/github_deploy\n  IdentitiesOnly yes\n' >> /root/.ssh/config
```

### Step 6: Download the project

The public edition (use your GitHub username in place of `YOUR-USERNAME`):

```bash
git clone https://github.com/YOUR-USERNAME/WEAMAZEVISIONARY.git /opt/weamaze-visionary
```

From a private repository instead (after step 5), the address is `git@github.com:YOUR-USERNAME/REPOSITORY.git`.

```bash
cd /opt/weamaze-visionary
```

### Step 7: Settings file

```bash
cp deploy/hostinger.env.example .env && chmod 600 .env
```

```bash
nano .env
```

Check `SITE_DOMAIN`. Add the Resend key and email lines if you have them, or later. Save with Ctrl+O, Enter, Ctrl+X.

### Step 8: Domain connection (DNS)

Wherever the domain is managed (hPanel → Domains → DNS, or your registrar), set:

| Type | Name | Points to |
|---|---|---|
| `A` | `@` | the server's IPv4 address |
| `AAAA` | `@` | the server's IPv6 address |
| `CNAME` | `www` | `weamazevisionary.com` |

Remove any other `A`, `AAAA` or `CNAME` records for `@` and `www` (for example, parking pages). Wait until the domain points at the server; on your computer, this shows the server's address once it does:

```bash
nslookup weamazevisionary.com
```

### Step 9: Build and start the site (with HTTPS)

```bash
docker compose up -d --build
```

The first build takes about 5–10 minutes. Caddy then gets the HTTPS certificates automatically, within a minute of the domain pointing at the server. Check:

```bash
docker compose ps
```

Both `app` (healthy) and `caddy` should be running. Open `https://weamazevisionary.com`. If the certificate is not ready yet, see what Caddy reports:

```bash
docker compose logs caddy --tail 50
```

### Step 10: SSL and HTTPS

Nothing to configure: Caddy obtains free Let's Encrypt certificates for `weamazevisionary.com` and `www.weamazevisionary.com`, renews them automatically, redirects `http://` to `https://` and `www` to the bare domain, and serves HTTP/3. The site adds HSTS so browsers always use HTTPS. Send a test message from the Contact page, then confirm it was saved:

```bash
docker compose exec -u node app ls -l /data/leads
```

### Step 11: Backups

Schedule the daily backup:

```bash
chmod +x deploy/backup.sh && (crontab -l 2>/dev/null; echo "15 2 * * * /opt/weamaze-visionary/deploy/backup.sh >> /var/log/weamaze-backup.log 2>&1") | crontab -
```

Run it once now to check:

```bash
/opt/weamaze-visionary/deploy/backup.sh
```

To download the backups to your computer (run this on your computer):

```bash
scp -r root@YOUR_SERVER_IP:/root/weamaze-backups ./weamaze-backups
```

### Step 12: Updating the site later

Push changes to GitHub, then on the server:

```bash
cd /opt/weamaze-visionary && git pull && docker compose up -d --build
```

The site keeps answering during the update (tested: no failed requests while the site restarted). Enquiries are untouched.

**Roll back** to an earlier version: find its commit, check it out and rebuild:

```bash
git log --oneline -10
```

```bash
git checkout COMMIT_ID && docker compose up -d --build
```

Return to the latest version with `git checkout main && git pull && docker compose up -d --build`.

**Publishing held-back work** after permission: set `publicationApproved: true` for the project in `src/content/projects.ts`, commit, push and update as above.

**Logs:**

```bash
docker compose logs app --tail 100
```

**Server security updates:** Ubuntu installs security updates automatically. Once a month, and after a "restart required" notice:

```bash
apt update && apt upgrade -y && reboot
```

The site starts again on its own after a reboot.

## 9. Global performance: Cloudflare (recommended, free)

Already built in: images in AVIF and WebP at several widths, films in 360p and 720p that load only when needed and support resuming, Brotli and gzip compression, year-long caching for scripts and styles, 7-day caching for images and films, and prerendered pages.

Cloudflare's free plan caches images, scripts and fonts in cities worldwide, including Johannesburg, Cape Town and Durban, so visitors far from the UK still load the heavy files nearby. Set it up after the site works (step 9):

1. Add the domain to Cloudflare (free plan) and change the domain's name servers to Cloudflare's.
2. In Cloudflare DNS, recreate the records from step 8, first with the cloud **grey (DNS only)**.
3. SSL/TLS → Overview: **Full (strict)**.
4. In `deploy/Caddyfile`, replace the plain `reverse_proxy app:8080 { … }` block with the commented `CLOUDFLARE` block, and paste Cloudflare's IP ranges (from cloudflare.com/ips) after `trusted_proxies static`. In `.env`, set `TRUST_PROXY_HOPS=2`. Then run:

```bash
docker compose up -d --build
```

5. Turn the clouds **orange (proxied)**.
6. Caching → Cache Rules: add a rule for URI path starting with `/video/` → **Bypass cache**. Cloudflare's terms restrict serving video through the free CDN, so films keep coming from the server.

Without step 4, every visitor would appear to come from a Cloudflare address, and the form's spam limits would apply to many visitors at once.

## 10. Alternative: Hostinger managed Node.js web app

Only after Hostinger support confirms, in writing:

1. a folder that keeps files the app writes across redeploys (its full path);
2. that **Node.js 22** is available;
3. that the app keeps running between visits;
4. how many proxies add an `X-Forwarded-For` entry before the app.

Then, in hPanel → **Websites → Add website → Node.js web app → import from GitHub**:

| Setting | Value |
|---|---|
| Plan | Business or Cloud Startup web hosting |
| Data centre | United Kingdom (or the nearest European option offered) |
| Framework preset | Express / Other (a custom Node.js server) |
| Branch | `main` |
| Node.js version | 22.x |
| Build command | `npm run build:production` |
| Output directory | leave empty if allowed (the server serves `dist/client` itself); otherwise `dist` |
| Entry file | `server.js` |
| Environment variables | `NODE_ENV=production`, `PUBLIC_SITE_ENV=production`, `PUBLIC_SITE_URL=https://weamazevisionary.com`, `TRUST_PROXY=true`, `TRUST_PROXY_HOPS=` (the number from point 4), `FORCE_HSTS=true`, `LEAD_STORE_DIR=` (the folder from point 1), `OPERATOR_NOTIFICATION_EMAIL`, and the email and CRM settings from section 7 |
| Domain and SSL | connect the domain in hPanel, then turn on the free SSL and **Force HTTPS** |
| CDN | turn on Hostinger CDN for the website in hPanel |

Do not leave `PORT` or `HOST` set by hand unless Hostinger asks for them: the server listens on the `PORT` the platform provides, on all interfaces. **Email notifications are strongly recommended** on this option, so no enquiry depends on the server's disk alone.

Tested: a clean install with `NODE_ENV=production`, then `npm run build:production`, then `node server.js` with no site mode set. The site ran in production mode, all 29 pages and 138 links and files loaded, the contact form saved its enquiry, and held-back work returned "not found".

## 11. Costs (USD per month)

Hostinger's website could not be opened from the build environment; these prices come from 2026 search results. **Confirm them at hostinger.com before buying.** Hostinger's low prices apply to long prepaid terms, and renewals cost more.

| Item | Estimate |
|---|---|
| **VPS KVM 1** (recommended) | about **$6.49** a month on a 24-month term (about $156 paid upfront), renewing at about $11.99 a month |
| VPS KVM 2 (only for much higher traffic) | about $8.99 a month on 24 months, renewing at about $14.99 |
| Business web hosting (managed Node.js alternative) | lower promotional price on long terms; renewals reported between about $8.99 and $16.99 a month |
| Cloudflare | $0 (free plan) |
| Resend email | free tier is enough at launch (check resend.com/pricing) |
| HTTPS certificates | $0 (Let's Encrypt through Caddy) |
| Domain | your registrar's yearly price, if not already paid |

**Typical total: about $6.50 a month for the first two years, then about $12**, with no bandwidth charges at this traffic level.

## 12. Production test results (13 November 2026)

The production setup was built from a clean copy of the project and run with `docker-compose.yml` and Caddy exactly as on the VPS (with a local certificate in place of Let's Encrypt):

- **Build:** the production build succeeds with Node.js 22, at a peak of about 0.5 GB of memory. 29 public pages are prerendered, 3 held-back projects are left out, and the build checks that nothing of theirs remains.
- **Pages and links:** all 29 pages load by direct address (the same as a refresh or a shared link). All 138 internal links, images, films, fonts, scripts and stylesheets load. Unknown addresses get the site's 404 page, and held-back projects return "not found".
- **Browsers:** a real browser loaded all 31 routes on desktop and phone, with no console errors except the two deliberate "page not found" tests. The layout check at 320, 390, 768, 1024 and 1440 px found **0 issues**: no overflow, clipped text, broken images or undersized tap targets.
- **Speed** (as a first-time visitor on a slow 4G phone, with Lighthouse's mobile profile): content appears in 0.95–1.24 s on the home, work, case study, services and contact pages. Layout shift is 0–0.04 (good is under 0.1), and phone pages weigh 190–360 KB. On desktop broadband, pages appear in 0.3–0.4 s. Distance to the UK adds about 0.15–0.3 s for visitors in South Africa, less with Cloudflare.
- **HTTPS:** HTTP redirects to HTTPS, `www` redirects to the bare domain, HTTP/2, HTTP/3, HSTS, Brotli compression and all security headers are present.
- **Forms:** contact request accepted (201) and saved with private permissions. A visitor sending six posts with six fake addresses was still limited after five.
- **Reliability:** no failed requests (60 of 60 answered) while the site restarted for an update. Enquiries survive updates and restarts. The site's files are read-only, and the backup script works.
- **Environment and secrets:** settings are validated at start-up. No secrets are in the built site or the repository. `npm audit` reports 0 vulnerabilities.
- **Test suites:** all 96 unit tests and all 100 browser tests pass, as do the type check and lint.

**Not tested here:** Hostinger's own servers (the VPS and DNS do not exist yet), real Let's Encrypt certificates, Cloudflare, and real email delivery (no Resend key yet). Safari and Firefox have not been tested either: only Chromium is available in the build environment, so check the live site once in each.

## 13. Hostinger web hosting (Premium or Business): upload with the PHP form handler

Use this when the site runs on ordinary Hostinger web hosting, uploaded through **Upload website** or File Manager, rather than as a Node.js app or on a VPS. Plain web hosting cannot run the Node.js server, so without this handler every form answers "Your brief has not been sent". The handler replaces it for the forms only: the pages need no changes.

### What is in the package

`npm run build:hostinger-static` builds the public site and writes everything that goes into `public_html` to `dist/hostinger-static/`:

| Part | What it does |
|---|---|
| The pages, images, films, fonts and scripts | The production site, exactly as built for the Node.js host |
| `.htaccess` | Clean page addresses (`/work`), `www` to the bare domain, the site's 404 page (also for folders with no page of their own, such as `/images`), all 12 security headers, compression and caching, and sends every `/api/...` request to the PHP program. Two small ones sit in `assets/` (year-long caching) and `downloads/` (the offline edition keeps its own security policy) |
| `api/index.php` and `api/src/` | The form handler (source in `deploy/hostinger-static/api`) |
| `api/config.php` | The settings: where emails go, the sender address, the spam limits |

### What the forms do on this hosting

- **Project brief, Contact request box and call request** are accepted with the same checks as the Node server: the same answers are accepted, the same problems are reported beside the same fields, and the same spam protection applies (a hidden field, a minimum time to fill in, same-site checks, 5 sends per visitor in 10 minutes, and 60 per hour for the whole site). A double tap or a retry is never stored twice.
- **Each enquiry is saved** as a private file (mode 600) in `weamaze-visionary-data/leads/`, a folder created **next to** `public_html`, outside the website. It survives re-uploads of the site and cannot be opened in a browser. If the hosting does not allow that folder, the handler uses `public_html/api/data/` instead, which is locked against browsers; that copy is lost if `public_html` is deleted, so download the files first.
- **The studio is emailed** the whole enquiry with the hosting's own mail service, with Reply set to the sender. Text typed into the form can never add recipients or change the email's headers. If the mail service is down, the enquiry is still saved and the email is retried automatically (from 5 minutes up to every 6 hours, 12 times), whenever the next visitor uses a form.
- **Book a call** shows "Online scheduling is not connected yet" and offers the call request form, as on the Node server without a scheduling provider.
- **Not available on this hosting:** a confirmation email to the visitor (sending mail to addresses typed by strangers would let the form be abused), the CRM webhook and online scheduling. The success messages say only what is true.
- **Visitor addresses** are never written down: the spam limits keep a keyed fingerprint for at most about an hour.

### Upload

1. Run `npm run build:hostinger-static`, then zip the **contents** of `dist/hostinger-static` (so `index.html`, `.htaccess` and `api/` are at the top of the zip). Or use the ready-made `weamaze-visionary-hostinger-web-hosting.zip`.
2. In hPanel, open **File Manager** for the website. In `public_html`, delete the old site files (keep any folder you created yourself). Upload the zip and choose **Extract** into `public_html`. Check that `index.html`, `.htaccess` and the `api` folder sit directly inside `public_html`. (The **Reupload** button on the "Upload website" screen does the same.)
3. **Create the sender mailbox:** hPanel → **Emails** → create `website@weamazevisionary.com` (any password; nobody needs to read it). Hostinger's mail service only sends from addresses that exist on the domain. To use another address, see "Settings" below.
4. **HTTPS:** hPanel → **Security → SSL**: install the free certificate, then turn on **Force HTTPS**.
5. **PHP version:** any from 7.4 to 8.4 works (tested on 7.4, 8.3 and 8.4); keep Hostinger's default.

### Check it works

1. Open `https://weamazevisionary.com/api/health`. It should show `"forms":"php"` and `"storage":"ok"`.
2. Send a test message from the **Contact** page. You should see "Request sent" with a reference such as `WV-MSG-2026-…`, and an email should reach weamazevisionary@gmail.com within a few minutes. Check the spam folder the first time, and mark it "Not spam".
3. In File Manager, the folder `weamaze-visionary-data/leads` (next to `public_html`) now holds a file named after the reference.
4. Open `https://weamazevisionary.com/images`. It should show the site's "Page not found" page. (With the upload of 16 November 2026 the browser reported "too many redirects" instead; that upload's other pages were not affected.)

From the project folder, one command runs these checks and the rest (address rules, caching, the offline edition, film dates, security headers) without sending anything: `node scripts/verify-hostinger-live.mjs https://weamazevisionary.com`. Against the upload of 16 November it reports 6 failed checks; against the package of 20 November, none.

### Settings

To change a setting, copy `api/config.php` to `api/config.local.php` in File Manager and edit the copy: it wins over `config.php`. Re-upload `config.local.php` after any future upload of the site, or keep a copy.

| Setting | Default | Meaning |
|---|---|---|
| `operator_email` | weamazevisionary@gmail.com | Where enquiries are emailed. Empty: save only |
| `mail_from` | website@weamazevisionary.com | The sender. Must be a mailbox that exists on the domain in hPanel |
| `data_dir` | empty (automatic) | Where enquiries are saved |
| `rate_limit_max` / `rate_limit_window` | 5 / 600 | Sends allowed per visitor in each window (seconds) |
| `global_limit_max` / `global_limit_window` | 60 / 3600 | Sends allowed for the whole site in each window |
| `min_form_seconds` | 3 | Faster than this is treated as a robot |

### Reading enquiries and backups

Every enquiry is in your inbox. The saved files are in File Manager under `weamaze-visionary-data/leads`: download that folder once a month as an off-site copy. A small log of what happened (references and reasons only, no personal details) is kept in `weamaze-visionary-data/log/`.

### If something goes wrong

| What you see | What to do |
|---|---|
| "Your brief has not been sent. Something went wrong on our side." | The PHP handler is not answering: check that `.htaccess` and the `api` folder are directly inside `public_html` (File Manager hides files starting with a dot unless "Show hidden files" is on), then open `/api/health` |
| `/api/health` shows `"storage":"unavailable"` | The handler cannot create its data folder. Ask Hostinger support to confirm PHP may write to the folder next to `public_html`, or set `data_dir` to a folder you created |
| "Request sent", but no email arrives | Check spam; check that the `mail_from` mailbox exists in hPanel → Emails; the enquiry is saved either way, and the email is retried automatically |
| "Too many submissions" during your own tests | Wait 10 minutes, or raise `rate_limit_max` in `config.local.php` while testing |
| Real visitors report "Too many submissions" after you turn on a CDN | Behind a CDN, different visitors can appear to come from one address and share the limit of 5. Raise `rate_limit_max` to about 20 in `config.local.php`; the limit of 60 an hour for the whole site still protects the inbox |

### Testing the web hosting package

`scripts/compare-form-servers.mjs` sends 62 cases (valid forms, every kind of mistake, attacks, double sends) to the Node server and the PHP handler and fails on any difference in the replies or the saved answers. `playwright.hostinger.config.ts` runs the three forms end to end in a browser, on desktop and phone, against a running copy of the package, and checks the address rules, the caching and the offline edition. Both need a **test copy** with the limits relaxed, because a test types faster than a person: in its `api/config.local.php`, set `rate_limit_max` and `global_limit_max` to 1000 and `min_form_seconds` to 0. Never use those values on the live site.

**20 November 2026, the package:** on Apache with PHP 8.3, no differences in 62 cases, 14 of 14 browser tests passed, and all 31 pages and 167 links and assets loaded. (PHP 7.4 and 8.4 were tested on 16 November; the PHP program has not changed since.) The address rules were also run on a LiteSpeed server (OpenLiteSpeed 1.9.4) and on Apache set to add the slash to folder addresses by itself, as Hostinger's server does: 48 and 14 requests for folders with no page, every one answered "not found", none redirected in a circle.

**20 November 2026, the live site** (the upload of 16 November, read only: no form was sent): all 33 addresses loaded on desktop and phone with no console errors, failed files or blocked content; 39 internal links answered; `/api/health` reported `"forms":"php"` and `"storage":"ok"`; an empty form was refused with the right message and a form from another site with 403; all 12 security headers, Brotli compression and film seeking were present; none of the held-back work was in the public files. One fault was found: a folder with no page of its own (`/images`, `/video`, `/assets`, `/downloads`, `/app-icons`) redirected to itself for ever, because Hostinger's server (LiteSpeed) adds a slash to folder addresses and the site's rule removed it again. No page links to those addresses, so visitors were not affected. The rule now answers such folders first, before any redirect. `www.weamazevisionary.com` showed the site under a second address; it now redirects to the bare domain, as on the VPS. Fonts in `assets/` were kept for 7 days instead of a year; corrected.

**Servers:** the package is for Hostinger web hosting (LiteSpeed) and for Apache. It is not for OpenLiteSpeed, which some VPS control panels install: that server applies its own folder redirects unpredictably, so a page address asked for with a trailing slash can start redirecting in a circle. On a VPS, use the Docker setup in section 8.

## Before going live

- Choose Hostinger as the host and confirm the privacy notice's "Where it goes" section (Hostinger, United Kingdom), with the other items it marks "to be confirmed".
- Set up Resend so enquiries are emailed to you (section 7).
- After going live, check a page on your phone, send a test enquiry, and confirm the certificate in the browser's address bar.
