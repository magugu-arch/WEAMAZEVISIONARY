# 05 — International SEO and discoverability

## Implemented
- **Crawlable HTML.** Every public route is prerendered at build time (`scripts/prerender.mjs`) with full content, so pages do not depend on JavaScript to show their text. The client hydrates the same markup.
- **Metadata.** Each route has a unique `<title>` and meta description (unit-tested: unique, ≤ 80 and ≤ 200 characters), plus a canonical URL on `PUBLIC_SITE_URL`, Open Graph and Twitter tags, and an OG image per service, case study and article (default `og-default.jpg`).
- **Status codes.** Real `200`, `301` (trailing slash, redirect register) and `404` for unknown or unpublished slugs. The 404 page is branded and `noindex`.
- **Sitemap** (`/sitemap.xml`): canonical, published routes only. Unapproved legal drafts, `/system` and `/book-a-call/manage` are excluded.
- **Robots** (`/robots.txt`): staging blocks everything and sends `X-Robots-Tag: noindex` on every response. Production disallows only `/api/`, `/system` and `/book-a-call/manage`, and points to the sitemap.
- **Structured data**, factual only:

  | Page | Schema |
  |---|---|
  | Home | `Organization` (name, URL, logo, description, slogan; no address, phone, rating or unverified profiles), `WebSite` |
  | Services | `Service`, `BreadcrumbList` |
  | Case studies | `BreadcrumbList` |
  | Articles | `Article` (organisation author), `BreadcrumbList` |

  JSON-LD is escaped against script injection.
- **Language and internationalisation.** `lang="en-GB"` and `og:locale=en_GB`. No IP-based or browser-language redirects. **No `hreflang`**, because no translated equivalents exist. No country doorway pages.
- **Semantics.** One H1 per page (e2e-tested), ordered headings, breadcrumbs on detail pages, descriptive internal links, descriptive image filenames (for example `strategy-session-with-colour-swatches-1024.avif`) and meaningful alt text.
- **Redirect register.** `dist/client/redirects.json` (generated empty, served as single-hop 301s). Add `{"/old": "/new"}` entries when slugs change.

## AI search and assistants (ChatGPT, Claude, Perplexity, Google AI Overviews)
Assistants answer from what their search crawlers can read and from what other sites say about the studio. Built so far:
- **robots.txt** (production) names the answer and search crawlers (OAI-SearchBot, ChatGPT-User, Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User) and allows them everywhere except private routes. Training crawlers (GPTBot, ClaudeBot, Google-Extended, Applebot-Extended, CCBot) are allowed by default; set `AI_TRAINING_CRAWLERS=block` at build time to turn them away. Blocking them does not remove the studio from AI search answers (D-32).
- **llms.txt** (production): a plain-language map of the studio built from the same published content: the boilerplate, positioning, the eight services, published work, insights and contact. Not every assistant reads it, and it costs nothing to keep.
- **Structured data:** the Organization now names its expertise (`knowsAbout`), its service catalogue (`hasOfferCatalog`, each Service with an `@id`) and a new-business `contactPoint`. Each service page links its Service to the Organization and carries its visible questions as `FAQPage`, so answers can be quoted exactly.

What the build cannot do on its own (owner actions, in order of impact):
1. **Publish proof.** The production build shows five film case studies; two more pieces of work are waiting for written permission. Case studies are the evidence assistants and buyers cite.
2. **Now the site is live on the domain,** verify Google Search Console **and Bing Webmaster Tools** (ChatGPT search draws on Bing's index) and submit the sitemap.
3. **Be named elsewhere:** LinkedIn company page, Google Business Profile, and listings on agency directories such as Clutch, DesignRush and Behance, with the same name, description and URL everywhere; then add them to `settings.social` so they appear as `sameAs` (B-19).
4. **Show the people:** a founder or team page with real names, roles and experience (expertise is a ranking and citation signal; nothing is invented here).
5. **Publish answers:** one well-sourced article a month on the questions buyers ask (for example, what an AI creative studio costs, how rights work in AI-made content).
6. **Earn mentions:** client case studies on clients' own sites, interviews, awards entries and talks. Third-party mentions are what assistants repeat.
7. **Measure:** track referrals from chatgpt.com, claude.ai, perplexity.ai and Google, and ask the assistants the target questions monthly.

## Search intent → target page (V10 §19)
The eight service pages map one-to-one to the intent clusters (AI video and brand film → AI Creative Studio; pitch deck design → AI Presentations & Pitch Decks; and so on). Home and Studio target "creative technology studio". Rankings are never promised; authority comes from useful content and real proof over time.

## Going live: Search Console and Bing Webmaster Tools
1. Done: the site is live at `weamazevisionary.com` from a production build (`PUBLIC_SITE_ENV=production`). `npm run launch-check` lists the content items that still await owner approval.
2. **Google Search Console:** add a *Domain property* for `weamazevisionary.com` from a business-owned Google account. Verify with the DNS TXT record at the registrar, then submit `https://<host>/sitemap.xml` and inspect Home, one service, one case study and one article.
3. **Bing Webmaster Tools:** sign in with a business-owned account and import the site from Search Console (or verify by DNS CNAME/TXT), then submit the sitemap.
4. **Monitor:** coverage, manual actions, Core Web Vitals and structured-data reports, monthly (see the maintenance plan). Keep both accounts in company ownership.
