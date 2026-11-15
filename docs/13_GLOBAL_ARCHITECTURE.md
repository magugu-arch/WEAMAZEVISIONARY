# 13 — Global architecture on Fly.io

How the WeAmaze Visionary website runs from Johannesburg today, and how it grows to London, Virginia and Singapore later without moving any data. The first deploy is in `docs/12_DEPLOY_FLY.md`. The website's design is not affected by any of this.

## The plan in one picture

```
                         Visitors anywhere
                                │
                 (optional) Cloudflare CDN: caches images, scripts, fonts
                                │
                     Fly.io proxy (nearest region)
          ┌──────────────┬──────┴───────┬──────────────┐
          ▼              ▼              ▼              ▼
   Johannesburg       London         Virginia       Singapore
   jnb · "app"        lhr · "edge"   iad · "edge"   sin · "edge"
   ACTIVE NOW         later          later          later
   pages + data       pages only     pages only     pages only
   volume /data       no volume      no volume      no volume
          ▲              │              │              │
          └──── forms, bookings and other data requests are replayed to jnb
```

| Phase | What runs | When to move on |
|---|---|---|
| **1. Now** | One machine in Johannesburg with the 1 GB volume. | Stay here until real visitors in Europe, the Americas or Asia find the site slow (see "When to add a region"). |
| **2. First edge** | Add one stopped-when-idle edge machine in the region with the most distant visitors (usually London). | Repeat for each region as needed. |
| **3. Global** | Edges in London, Virginia and Singapore. Johannesburg still holds all data. | Move enquiries to a managed database only if the studio needs to search or share them (see "Data"). |

## How requests are routed

- **Pages, images, films, fonts and scripts** are inside every machine's image, so each region serves them itself. Nothing needs copying between regions.
- **Data requests** (`/api/enquiries`, `/api/booking/…`, `/api/webhooks/booking`) must reach Johannesburg. An edge machine answers them with Fly's `fly-replay: region=jnb` header **before reading the request body**. Fly's proxy then sends the untouched request to Johannesburg, and the visitor gets Johannesburg's answer. The visitor sees one request; nothing is stored in London, Virginia or Singapore.
- **Health checks** (`/api/health`) and **browser security reports** (`/api/csp-report`) are answered locally, because they store nothing.
- **Safety net:** an edge machine that finds itself in Johannesburg (a scaling mistake) refuses data requests with "temporarily unavailable" instead of writing to a disk that would be thrown away, and logs `server.region role=misplaced` as an error.
- **Email and CRM delivery** (the outbox) runs only in Johannesburg, next to the data.

The rules live in `server/lib/region.ts` and are unit-tested in `tests/unit/region.test.ts`. Fly sets `FLY_REGION`, `FLY_PROCESS_GROUP` and `PRIMARY_REGION` on every machine. Off Fly none are set, and the server behaves as a single primary, exactly as before.

## Security

Nothing about security changes when regions are added:

- **One copy of the data.** Enquiries exist only on the Johannesburg volume (files readable only by the app user, mode 600 in a 700 folder). Edge machines have no volume and keep no data.
- **One place for secrets.** `fly secrets set` applies to every machine, but only Johannesburg uses the email and CRM keys, because only it runs the outbox.
- **The same checks everywhere.** Each machine sends the same security headers (CSP, HSTS, frame and permission policies). The same-site check, rate limits and spam checks run in Johannesburg on the replayed request, which keeps the visitor's original address and headers.
- **Private networking.** Machines talk to each other only over Fly's private, encrypted network; the replay is done by Fly's proxy, not over the public internet.
- **No root.** Every machine runs the server as the unprivileged `node` user.
- **HTTPS only.** `force_https` redirects plain HTTP, and Fly manages the certificates.
- Full checklist: `docs/10_SECURITY.md`.

## Data: consistency and central management

- **One writer.** Only the Johannesburg machine writes, so there is nothing to merge or keep in sync and no chance of two regions disagreeing. This is the simplest consistent design, and the right one for the expected number of enquiries.
- **Scale up, not out, in Johannesburg.** If the site needs more power, give the Johannesburg machine more memory or CPU (`fly scale vm` / `fly scale memory`). Do **not** add a second `app` machine: it would get its own separate volume, and enquiries would be split between two disks. (Any `app` machine outside Johannesburg replays to it anyway, but one inside Johannesburg would not.)
- **Backups.** Fly snapshots the volume daily. Keep an off-site copy as well, for example a monthly download:

```bash
fly ssh sftp shell
```

  then `get -r /data/leads` inside it. Store the copy somewhere private; enquiries contain personal details (POPIA and GDPR apply).
- **The central record.** For day-to-day work, connect the CRM webhook (`CRM_WEBHOOK_URL_*` secrets). Every enquiry is then pushed to the studio's CRM as it arrives, and the CRM becomes the shared, searchable record; the volume stays the durable source copy.
- **When to add a database.** Only if the studio needs to search, report on or edit enquiries inside the website itself. Then use a managed Postgres in Johannesburg, or the nearest region the provider offers. That adds a fixed monthly cost; it is not needed for the launch.

## Images, caching and speed

Already in place, unchanged by this work:

- Every photograph is served as AVIF and WebP in several widths, so phones download small files.
- Films come in 360p and 720p, start only when needed, and support resuming (byte ranges).
- Scripts and stylesheets have content-hashed names and are cached for a year (`immutable`). Images and films are cached for 7 days. Pages are revalidated so updates appear at once.
- Text is compressed (Brotli or gzip).

**Recommended once the domain is live: Cloudflare in front (free plan).** Cloudflare's network caches images, scripts and fonts close to visitors on every continent, which gives most of the speed of extra regions for nothing, and it cuts Fly's bandwidth bill (Africa is Fly's most expensive bandwidth region). Setup:

1. Add the domain to Cloudflare and use its name servers.
2. DNS: `A` and `AAAA` records for `weamazevisionary.com`, and a `CNAME` for `www`, all pointing at Fly (`fly ips list`), with the orange cloud (proxied) on.
3. SSL/TLS mode: **Full (strict)**.
4. Fly certificates behind Cloudflare: run `fly certs add weamazevisionary.com`, then add the `_acme-challenge` `CNAME` record that `fly certs show weamazevisionary.com` prints (DNS validation), so Fly can issue and renew certificates while Cloudflare proxies the traffic.
5. In `fly.toml`, set `TRUST_PROXY_HOPS = "2"` so rate limits see the visitor's real address, then `fly deploy`.
6. Films: Cloudflare's terms limit serving large amounts of video through the general CDN. Add a Cache Rule that **bypasses** the cache for `/video/*` unless your Cloudflare plan allows video, so films keep coming from Fly.

## HTTPS and the custom domain

Unchanged from `docs/12_DEPLOY_FLY.md`, step 10: `fly certs add` for the bare domain and `www`, add the records Fly prints, and check with `fly certs check`. One set of certificates covers every region: Fly's anycast addresses are the same worldwide, so DNS never changes when regions are added.

## Keeping costs lean

- One machine and one 1 GB volume to start.
- Edge machines use `auto_stop_machines = "stop"`: with no visitors they stop and cost only a small storage charge, and they start again on the next visit (usually in under a second for this image). `min_machines_running = 1` applies to the primary region only, so Johannesburg never stops.
- Edges use the smallest machine (256 MB).
- The shared IPv4 address is free; there is no need to buy a dedicated one.
- Cloudflare's free plan takes most image and script traffic off Fly.

## Cost estimate

Fly's website could not be reached from the build environment on 13 November 2026, so these are estimates from Fly's published prices as reported by search results. **Confirm them at fly.io/pricing before deciding.** Fly also prices some regions higher than others, and Johannesburg may be one of them.

| Item | Estimate (USD per month) |
|---|---|
| Johannesburg machine, `shared-cpu-1x`, 512 MB, always on (about $2.19 for 256 MB plus about $6 per GB of extra memory) | about $3.70, possibly more in jnb |
| 1 GB volume (about $0.15 per GB) | about $0.15 |
| Daily volume snapshots | a few cents |
| Shared IPv4 and IPv6 addresses | $0 |
| HTTPS certificates for the domain and `www` | $0 to cents |
| Bandwidth from Johannesburg (Africa and India: up to about $0.12 per GB) | about $1.20 per 10 GB served |

| Phase | Typical monthly total |
|---|---|
| **1. Johannesburg only** (traffic up to about 10–20 GB a month) | **about $5–8** |
| **1 with Cloudflare in front** | **about $4–6** (images and scripts mostly served by Cloudflare) |
| **2. Each edge region added** (256 MB, stopped when idle) | **+ about $0.20 when mostly idle, up to about $2.20 if busy all month**, plus that region's bandwidth (Europe and North America about $0.02 per GB, Asia Pacific about $0.04 per GB) |
| **3. Johannesburg + London + Virginia + Singapore** | **about $8–15**, depending on traffic |
| Managed database (only if needed later) | a fixed extra monthly cost; check the provider's current price |

A visit to the home page with the film costs a few megabytes, so 2,000 visits a month is roughly 10 GB.

## When to add a region

Add an edge region when there is evidence, not before:

- Visitors from that part of the world are a meaningful share of traffic (your analytics), **and**
- Pages feel slow for them even with Cloudflare in front (for example, a time to first byte above about 600 ms in the browser's network panel, or reports from clients there).

## Adding a region (when needed)

You need nothing new: the image is the same and no data moves.

**1. Turn on the edge group in `fly.toml`.** Three small edits, each marked `EXPANSION` in the file:

- In `[processes]`, remove the `#` before `edge = "node dist/server/node.js"`.
- In `[http_service]`, change `processes = ["app"]` to `processes = ["app", "edge"]`.
- Remove the `#` before the second `[[vm]]` block (the 256 MB one for `edge`).

**2. Deploy.** The Johannesburg machine is updated as usual.

```bash
fly deploy --ha=false
```

**3. Make sure no edge machine runs in Johannesburg** (the deploy may create one in the primary region):

```bash
fly scale count edge=0 --region jnb
```

**4. Add an edge where it is needed.** London:

```bash
fly scale count edge=1 --region lhr
```

Later, Virginia:

```bash
fly scale count edge=1 --region iad
```

Later, Singapore:

```bash
fly scale count edge=1 --region sin
```

**5. Check.**

```bash
fly status
```

You should see one `app` machine in `jnb` and one `edge` machine in each region you added. Then send a test message from the contact page and confirm it appears in Johannesburg:

```bash
fly ssh console --select -C "ls -l /data/leads"
```

(choose the `jnb` machine when asked). `fly logs` shows `server.region role=replica` on each edge.

**To remove a region**, set its count to 0, for example:

```bash
fly scale count edge=0 --region sin
```

Nothing is lost: edges hold no data.

## Verified (13 November 2026)

The production Docker image was built from a clean copy of the project and run three ways, as Fly would run it:

- **Johannesburg primary** (`FLY_REGION=jnb`, group `app`, with a volume): pages 200, health 200, a contact request accepted (201) and saved on the volume with private permissions (600), and the email outbox started.
- **London edge** (`FLY_REGION=lhr`, group `edge`, no volume): pages 200 and health 200 served locally. The contact request and the booking settings were answered with `fly-replay: region=jnb` without the body being read. No file was written.
- **Misplaced edge** (`FLY_REGION=jnb`, group `edge`): pages served, data requests refused with 503, and an error logged.
- **Replay end to end:** a stand-in for Fly's proxy sent a contact request to the London edge, followed its `fly-replay` answer to Johannesburg, and the request was stored there once (201). The same-site check passed because the original host was kept.
- Unit tests (92, including 9 new routing tests), the type check, lint and all 100 browser tests pass. `fly.toml` parses as valid TOML; run `fly config validate` on your computer as well, because the Fly tool could not be installed in the build environment.
