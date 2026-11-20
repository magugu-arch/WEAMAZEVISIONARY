# WeAmaze Visionary — website

Creative Intelligence, Made Real. A premium, dark-first, CI-governed website and lead-generation platform for a human-led creative technology studio.

**Stack:** React 19 · TypeScript (strict) · Vite 7 · Tailwind CSS 4 (CI tokens only) · lucide-react · React Router 7, plus a custom static prerender and a Node API server. No UI library.

> **Status: live at weamazevisionary.com** (Hostinger web hosting, from a production build; see [`docs/14_DEPLOY_HOSTINGER.md`](docs/14_DEPLOY_HOSTINGER.md), section 13). The default build is a **staging** preview in which every page is `noindex`. Some content, legal text and integrations still await owner approval: run `npm run launch-check` for the list.
>
> This is the **public edition** of the project: the website as the public sees it, with its server, form handler, tests and deployment guides. The studio's original source files, and work that is not yet cleared for publication, are kept in the studio's private project.

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
| `npm run assets:brand` | Extracts the official monogram, logos and service icons from the CI manual's vector pages (requires poppler). The manual is kept with the studio's private files, so in this edition the command only reports that the generated artwork is already included |
| `npm run build` | Builds client + SSR + server bundles, then prerenders all public routes, the sitemap, robots, 404 and the **offline edition** (`dist/client/downloads/weamaze-visionary.html`) |
| `npm run build:production` | The same build for the public site: indexable, and without work that is not cleared for publication |
| `npm run build:hostinger-static` | Production build plus the package for Hostinger web hosting (`dist/hostinger-static`: the pages, `.htaccess` and the PHP form handler) |
| `npm run launch-check` | Lists launch blockers. With `PUBLIC_SITE_ENV=production`, exits 1 while any is open |
| `node scripts/capture-screens.mjs` | Captures the responsive QA screenshot matrix (`BASE=` a running server) |
| `node scripts/measure-perf.mjs` | Lab performance on a throttled mobile profile |

## Documentation
| Doc | Contents |
|---|---|
| [05 SEO](docs/05_SEO.md) | Crawlability, metadata, schema, sitemap, Search Console and Bing set-up |
| [10 Security](docs/10_SECURITY.md) | What protects the site, what was tested, and the owner's actions |
| [12 Deploy to Fly.io](docs/12_DEPLOY_FLY.md) | Step-by-step deployment, domain, updates, rollback, enquiries and backups |
| [13 Global architecture](docs/13_GLOBAL_ARCHITECTURE.md) | Johannesburg primary, adding London, Virginia and Singapore later, data, caching, Cloudflare and the cost estimate |
| [14 Deploy to Hostinger](docs/14_DEPLOY_HOSTINGER.md) | Hostinger web hosting with the PHP form handler (where the site runs today, section 13), and the VPS or managed Node.js options: plan, location, build and start commands, settings, domain, HTTPS, backups, updates and costs |

The films, images and storyboards in `public/` are the web versions built from the studio's original files, which are archived in the private project and never deployed.
