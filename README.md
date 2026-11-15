# WeAmaze Visionary — website

Creative Intelligence, Made Real. A premium, dark-first, CI-governed website and lead-generation platform for a human-led creative technology studio.

**Stack:** React 19 · TypeScript (strict) · Vite 7 · Tailwind CSS 4 (CI tokens only) · lucide-react · React Router 7, plus a custom static prerender and a Node API server. No UI library.

> **Status: staging.** Every page is `noindex`. Content, legal text and integrations await owner approval. Run `npm run launch-check` for the live list, and see [`docs/BLOCKERS.md`](docs/BLOCKERS.md).

## Quick start

```bash
npm ci
```

```bash
npm run dev
```

The dev server runs at http://localhost:5173. The API is mounted with the booking mock and logged email.

```bash
npm run check
```

That runs typecheck, lint, unit tests and the production build with prerender.

```bash
npm start
```

That serves the production build at http://localhost:4173.

```bash
npm run test:e2e
```

That runs the Playwright journeys, the axe scans, the responsive overflow checks, and the legibility and parallax checks against the build.

## Scripts

| Script | Purpose |
|---|---|
| `npm run assets:brand` | Extracts the official monogram, logos and service icons from the CI manual's vector pages (requires poppler) |
| `npm run assets:media` | Builds film encodes, posters, responsive images, favicons and the OG image (requires ffmpeg) |
| `npm run build` | Builds client + SSR + server bundles, then prerenders all public routes, the sitemap, robots, 404 and the **offline edition** (`dist/client/downloads/weamaze-visionary.html`) |
| `npm run launch-check` | Lists launch blockers. With `PUBLIC_SITE_ENV=production`, exits 1 while any is open |
| `node scripts/capture-screens.mjs` | Captures the responsive QA screenshot matrix (`BASE=` a running server) |
| `node scripts/measure-perf.mjs` | Lab performance on a throttled mobile profile |

## Documentation
| Doc | Contents |
|---|---|
| [12 Deploy to Fly.io](docs/12_DEPLOY_FLY.md) | Step-by-step deployment, domain, updates, rollback, enquiries and backups |
| [13 Global architecture](docs/13_GLOBAL_ARCHITECTURE.md) | Johannesburg primary, adding London, Virginia and Singapore later, data, caching, Cloudflare and the cost estimate |
| [14 Deploy to Hostinger](docs/14_DEPLOY_HOSTINGER.md) | Hostinger VPS (recommended) or managed Node.js: plan, location, GitHub, build and start commands, settings, domain, HTTPS, backups, updates and costs |

Original supplied files are archived unchanged in `source-assets/` with `CHECKSUMS.sha256`. They are never deployed.
