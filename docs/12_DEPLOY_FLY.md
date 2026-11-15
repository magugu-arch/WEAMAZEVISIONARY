# 12 — Deploy to Fly.io

How to put the WeAmaze Visionary website online on Fly.io, hosted in **Johannesburg** (`jnb`). Everything in the project is prepared and tested; you only run the commands below.

Adding London, Virginia or Singapore later, the cost estimate, Cloudflare and data management are covered in `docs/13_GLOBAL_ARCHITECTURE.md`. Only Johannesburg is switched on now.

## What is being deployed

| | |
|---|---|
| **Website** | React 19 + TypeScript, built with Vite 7 and Tailwind CSS 4. Every page is prerendered to plain HTML at build time, so pages load fast and work when refreshed or opened from a shared link. |
| **Server** | One small Node.js 22 server (`dist/server/node.js`) that serves the pages, images and films, and handles the forms (project brief, call request, contact request). It adds compression, caching and security headers itself. |
| **Storage** | Enquiries are saved as files on a Fly volume mounted at `/data`, so they survive restarts and new deploys. |

**Why no Nginx:** this is not a static-only site. The forms need the Node server, and that server already does everything Nginx would (static files, direct URLs and page refreshes, the 404 page, compression, caching, HTTPS headers). Fly.io provides HTTPS in front of it. Adding Nginx would mean a second program to run and configure, with no benefit.

## The files prepared for Fly.io

| File | What it does |
|---|---|
| `Dockerfile` | Builds the site in production mode, then makes a small image with only the built site and server. Runs on port 8080, listening on 0.0.0.0. |
| `scripts/docker-entrypoint.sh` | Gives the `/data` volume to the unprivileged `node` user, then starts the server as that user (never as root). |
| `fly.toml` | App name, region (Johannesburg), port, volume, health check, HTTPS redirect and the non-secret settings, plus the switched-off settings for extra regions (marked `EXPANSION`). |
| `server/lib/region.ts` | Keeps all data in Johannesburg: machines in other regions (when added) pass forms and bookings to it. |
| `.dockerignore` | Keeps large and private folders off Fly's builder (`deliverables`, `source-assets`, `docs`, `.env` files). |
| `.env.example` | Every setting, what it means, and which ones are secrets. |

## What visitors will see

The live site is built in **production** mode. Search engines can index it, and any work that is not yet cleared for publication is left out completely. Its pages are not built, and its text, images, films and captions are removed from the deployment. The build checks this and stops if anything is left behind.

Today that means the Work section shows **My Backyard**, **DigitFMS** and **Miss Rhee Beauty**.

**To publish a project once you have written permission:** open `src/content/projects.ts`, find the project, change `publicationApproved: false` to `publicationApproved: true` in its `permission` section, then run `fly deploy` again.

## Before you start

- A Fly.io account (fly.io/app/sign-up). Fly asks for a payment card before it will run apps.
- This project folder on your computer.
- About 15 minutes for the first deploy.

## Step by step

**1. Install the Fly command-line tool.**

On a Mac:

```bash
brew install flyctl
```

On Windows (PowerShell):

```powershell
pwsh -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

On Linux:

```bash
curl -L https://fly.io/install.sh | sh
```

**2. Sign in.** A browser window opens.

```bash
fly auth login
```

**3. Open a terminal in the project folder** (the folder that contains `fly.toml`).

**4. Check the configuration.** This checks `fly.toml` against Fly's rules before anything is created.

```bash
fly config validate
```

**5. Create the app.** If Fly says the name is taken, pick another name (for example `weamaze-visionary-site`), use it here, and change the `app = "…"` line at the top of `fly.toml` to match.

```bash
fly apps create weamaze-visionary
```

**6. Create the storage volume for enquiries** (1 GB, in Johannesburg to match `primary_region` in `fly.toml`). When Fly warns that a single volume has no redundancy, answer yes; daily snapshots cover backups (step 12).

```bash
fly volumes create weamaze_data --region jnb --size 1
```

**7. (Recommended) Turn on email notifications.** Without this, enquiries are still saved safely, but nobody is emailed about them. You need a Resend account (resend.com) with your sending domain verified. Then:

- In `fly.toml`, remove the `#` in front of the three `EMAIL_…` lines.
- Store the key as a secret. It is encrypted by Fly and never written into any file.

```bash
fly secrets set RESEND_API_KEY=re_your_key_here
```

You can do this later; run `fly deploy` again afterwards.

**8. Deploy.** Fly builds the site on its own servers (about 3–5 minutes the first time) and starts one machine in Johannesburg. `--ha=false` keeps it to one machine, which is right for this site: the enquiry files live on one volume. Do not add more `app` machines later; extra regions use the separate `edge` machines described in `docs/13_GLOBAL_ARCHITECTURE.md`.

```bash
fly deploy --ha=false
```

**9. Check it is running.**

```bash
fly status
```

```bash
fly open
```

The site opens at `https://weamaze-visionary.fly.dev` (or your app name). If anything looks wrong:

```bash
fly logs
```

**10. Connect your domain.** Ask Fly for HTTPS certificates:

```bash
fly certs add weamazevisionary.com
```

```bash
fly certs add www.weamazevisionary.com
```

Fly prints the DNS records to add. Add them at your domain registrar: usually an `A` and an `AAAA` record for `weamazevisionary.com`, and a `CNAME` for `www` pointing to `weamaze-visionary.fly.dev`. To see the addresses again:

```bash
fly ips list
```

Check progress (certificates usually appear within minutes of DNS updating):

```bash
fly certs check weamazevisionary.com
```

**11. Updating the site later.** Make your changes, then run:

```bash
fly deploy
```

To roll back, list earlier releases, then redeploy one by its image name:

```bash
fly releases --image
```

```bash
fly deploy --image registry.fly.io/weamaze-visionary:deployment-XXXXXXXX
```

**12. Reading enquiries and backups.** Enquiries are JSON files on the volume. To list them:

```bash
fly ssh console -C "ls -l /data/leads"
```

To download one to your computer:

```bash
fly ssh sftp get /data/leads/WV-ENQ-2026-XXXXXX.json
```

Fly snapshots volumes daily. To see the snapshots, first find the volume ID:

```bash
fly volumes list
```

```bash
fly volumes snapshots list vol_xxxxxxxxxxxx
```

## Settings: where each one lives

| Setting | Where | Notes |
|---|---|---|
| `PUBLIC_SITE_ENV`, `PUBLIC_SITE_URL` | `fly.toml`, in both `[build.args]` and `[env]` | Keep both places the same. `production` is the public site. |
| `PORT` = 8080, `HOST` = 0.0.0.0 | `fly.toml [env]` | Must match `internal_port = 8080`. |
| `LEAD_STORE_DIR` = /data | `fly.toml [env]` | The volume. |
| `PRIMARY_REGION` = jnb | `fly.toml [env]` and `primary_region` | Keep both the same. The only region that stores data. |
| `TRUST_PROXY`, `TRUST_PROXY_HOPS` | `fly.toml [env]` | Hops `1` for Fly alone; change to `2` if you put Cloudflare in front (`docs/10_SECURITY.md`). |
| `FORCE_HSTS` | `fly.toml [env]` | On: browsers always use HTTPS. |
| `OPERATOR_NOTIFICATION_EMAIL`, `EMAIL_PROVIDER`, `EMAIL_FROM`, `EMAIL_REPLY_TO` | `fly.toml [env]` | Not secret. |
| `RESEND_API_KEY`, `CRM_WEBHOOK_SECRET`, `BOOKING_WEBHOOK_SECRET`, CRM webhook URLs | `fly secrets set` | Secret: never in `fly.toml` or any file in the project. |

## Costs

One `shared-cpu-1x` machine with 512 MB of memory in Johannesburg, running all the time, plus a 1 GB volume, with HTTPS certificates included: about $5–8 a month, mostly depending on bandwidth (Africa is Fly's most expensive bandwidth region). Cloudflare's free plan in front reduces that. The full estimate, by phase, is in `docs/13_GLOBAL_ARCHITECTURE.md`; confirm current prices at fly.io/pricing.

## Verified before handover (12 November 2026)

The production image was built from this `Dockerfile` and run exactly as `fly.toml` configures it: port 8080 on 0.0.0.0, and a root-owned volume at `/data` (as Fly mounts it).

- **Server and storage:** the server started as the unprivileged `node` user, the volume was handed to it (mode 700), and the Docker health check reported healthy.
- **Pages and links:** all 27 public pages load by direct address, which is the same as a refresh or a shared link. All 111 internal links, images, films, fonts, scripts and stylesheets load. Trailing slashes redirect once, and unknown addresses return the site's 404 page.
- **Held-back work:** every held-back page, image, film and caption file returns "not found".
- **Headers and search:** HTTPS and security headers are present, and there is no "noindex" header. `robots.txt` allows search engines; `sitemap.xml` and `llms.txt` are published.
- **Forms:** a contact request was accepted (201) and saved on the volume with private file permissions (600).
- **Downloads:** the 9 MB offline copy downloads at once and can resume.
- **Restarts:** the server stops cleanly in under a second, and saved enquiries are still there after a restart.
- **Browser checks:** a real browser checked all pages on desktop and phone, with no console errors (apart from the deliberate 404 test). An automated layout check at 320, 390, 768, 1024 and 1440 px found 0 issues: no overflow, clipped text, broken images or undersized tap targets.
- **Test suites:** all 83 unit tests and all 100 browser tests pass. The browser tests cover animations, the film player, gestures, accessibility and responsive layouts.
- **Dependencies and secrets:** `npm audit` reports 0 vulnerabilities. No API keys, passwords or private keys are in the source code or the image.

## If something goes wrong

| Problem | What to do |
|---|---|
| `fly deploy` says the app is not listening on the expected address | Check that `PORT = "8080"` in `[env]` matches `internal_port = 8080`. |
| The health check fails | Run `fly logs`. An "Invalid server environment" line names the setting to fix. |
| The forms say the service is unavailable | Check the volume is attached with `fly volumes list`. It must be in Johannesburg, with the `app` machine. If extra regions are switched on, check that no `edge` machine runs in `jnb` (`fly status`; fix with `fly scale count edge=0 --region jnb`). |
| Fly says there is no capacity in `jnb` | Try again later, or create the volume and deploy in another region temporarily by changing `primary_region` and `PRIMARY_REGION` together. |
| The domain shows a certificate warning | Wait until `fly certs check` shows the certificate as issued. DNS changes can take up to an hour. |
| The name `weamaze-visionary` is taken | Use another name in step 5 and in `fly.toml`. |
