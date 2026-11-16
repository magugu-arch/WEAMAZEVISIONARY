import { studioFilm } from '@/content/film';
import { matchPath } from 'react-router';
import { getService, publishedServices } from '@/content/services';
import { getProject, publishedProjects } from '@/content/projects';
import { getInsight, publishedInsights } from '@/content/insights';
import { getLegalPage, legalPages } from '@/content/legal';
import { settings, publicEmail } from '@/content/settings';
import type { ImageId } from '@/content/media.generated';
import { images } from '@/content/media.generated';
import { INDEXABLE, SITE_URL } from './env';

export type JsonLd = Record<string, unknown>;
export type RouteMeta = {
  title: string;
  description: string;
  path: string;
  status: 200 | 404;
  noindex: boolean;
  ogImage: string;
  ogType: 'website' | 'article';
  jsonLd: JsonLd[];
};

const BRAND = settings.name;
const abs = (p: string) => `${SITE_URL}${p}`;
const ogFor = (id?: ImageId) => {
  if (!id) return abs('/images/og-default.jpg');
  const img = images[id];
  // ≤1024 px keeps link-preview images small enough for WhatsApp (≈300 KB limit) while staying sharp.
  const w = [...img.widths].reverse().find((x) => x <= 1024) ?? img.widths[0];
  return abs(`/images/${img.id}-${w}.jpg`);
};
/** Width, height and alt text for an OG image URL produced by ogFor(). */
function ogDims(url: string): { width: number; height: number; alt: string } {
  const m = /\/images\/(.+)-(\d+)\.jpg$/.exec(url);
  const img = m ? (images as Record<string, (typeof images)[ImageId]>)[m[1]!] : undefined;
  if (!m || !img) return { width: 1200, height: 630, alt: `${BRAND} — Creative Intelligence, Made Real.` };
  const width = Number(m[2]);
  return { width, height: Math.round((img.height / img.width) * width), alt: img.alt };
}

/** Organization from confirmed facts only: no address, rating, phone or unverified profiles (V10 §19). */
export function organizationLd(): JsonLd {
  const email = publicEmail();
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': abs('/#organization'),
    name: BRAND,
    url: abs('/'),
    logo: abs('/app-icons/icon-512.png'),
    description: settings.boilerplateFull,
    slogan: settings.tagline,
    areaServed: 'Worldwide', // owner instruction, 7 Nov 2026: the studio takes international work (D-33)
    // What the studio does, in the words search engines and AI assistants match against.
    knowsAbout: publishedServices.map((s) => s.name),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Services',
      itemListElement: [...publishedServices].sort((a, b) => a.order - b.order).map((s) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', '@id': abs(`/services/${s.slug}#service`), name: s.name, description: s.descriptor, url: abs(`/services/${s.slug}`) } })),
    },
    ...(email ? { email, contactPoint: { '@type': 'ContactPoint', contactType: 'new business', email, availableLanguage: ['English'], url: abs('/contact') } } : {}),
    ...(settings.social.length ? { sameAs: settings.social.map((s) => s.url) } : {}),
  };
}

/**
 * llms.txt (llmstxt.org): a plain-language map of the site for AI assistants that read
 * it. Built from the same published content as the pages, so it never says more than
 * the site does; unapproved client work is already excluded from production builds.
 */
export function llmsTxt(): string {
  const lines = [
    `# ${BRAND}`,
    '',
    `> ${settings.boilerplateFull}`,
    '',
    settings.positioning,
    '',
    '## Services',
    ...[...publishedServices].sort((a, b) => a.order - b.order).map((s) => `- [${s.name}](${abs(`/services/${s.slug}`)}): ${s.descriptor}`),
    '',
    '## Work',
    ...publishedProjects.map((p) => `- [${p.title}](${abs(`/work/${p.slug}`)}): ${p.summary}`),
    '',
    '## Insights',
    ...publishedInsights.map((a) => `- [${a.title}](${abs(`/insights/${a.slug}`)}): ${a.summary}`),
    '',
    '## Contact',
    `- [Start a project](${abs('/start-a-project')}): a guided brief`,
    `- [Book a discovery call](${abs('/book-a-call')})`,
    `- [Contact](${abs('/contact')})${publicEmail() ? `: ${publicEmail()}` : ''}`,
    '',
  ];
  return lines.join('\n');
}
const breadcrumbLd = (items: { name: string; path: string }[]): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: abs(it.path) })),
});

/** The studio film plays on the home page (hero loop and the full film on demand). */
const studioFilmLd = (): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'VideoObject',
  name: studioFilm.title,
  description: studioFilm.summary,
  thumbnailUrl: [abs(`${studioFilm.media.still.desktop}.jpg`)],
  contentUrl: abs(studioFilm.media.full.mp4),
  uploadDate: studioFilm.uploadDate, // first published here; owner approval pending (B-23)
  duration: studioFilm.isoDuration,
  width: studioFilm.media.full.width,
  height: studioFilm.media.full.height,
  isFamilyFriendly: true,
  publisher: { '@id': abs('/#organization') },
  accessibilityFeature: ['longDescription'],
});

const NOT_FOUND: Omit<RouteMeta, 'path'> = {
  title: `Page not found | ${BRAND}`,
  description: 'The page you were looking for does not exist or has moved.',
  status: 404,
  noindex: true,
  ogImage: ogFor(),
  ogType: 'website',
  jsonLd: [],
};

const STATIC: Record<string, { title: string; description: string; crumbs?: string; noindex?: boolean }> = {
  '/': { title: `${BRAND} — AI Creative Studio for Brands Worldwide`, description: 'A human-led AI creative studio for brands worldwide: brand films, campaigns, pitch decks, websites, apps and automation from one senior team. Creative Intelligence, Made Real.' },
  '/work': { title: `Work | ${BRAND}`, description: 'Selected work from WeAmaze Visionary, each piece clearly labelled as client work or studio concept.', crumbs: 'Work' },
  '/services': { title: `Services | ${BRAND}`, description: 'Eight connected capabilities, from AI Creative Studio and pitch decks to websites, apps, automation, 3D and motion, brand strategy and digital innovation.', crumbs: 'Services' },
  '/approach': { title: `Approach | ${BRAND}`, description: 'How we work: six stages from Discover to Evolve, each with a clear output, a decision point and defined responsibilities.', crumbs: 'Approach' },
  '/studio': { title: `Studio | ${BRAND}`, description: 'Who we are and how we work: human imagination leads, intelligence amplifies and precision makes it real.', crumbs: 'Studio' },
  '/insights': { title: `Insights | ${BRAND}`, description: 'Practical writing on human-led AI, creative process, rights and governance from WeAmaze Visionary.', crumbs: 'Insights' },
  '/start-a-project': { title: `Start a Project | ${BRAND}`, description: 'Tell us about your project in a few guided steps. Review every answer before you send it; nothing is binding until a written proposal is agreed.', crumbs: 'Start a Project' },
  '/book-a-call': { title: `Book a discovery call | ${BRAND}`, description: 'Arrange a discovery conversation with WeAmaze Visionary, with times shown in your own time zone.', crumbs: 'Book a call' },
  '/book-a-call/manage': { title: `Manage your booking | ${BRAND}`, description: 'Reschedule or cancel a discovery call.', noindex: true },
  '/contact': { title: `Contact | ${BRAND}`, description: 'Contact WeAmaze Visionary about a project, a partnership or a general question.', crumbs: 'Contact' },
  '/system': { title: `Design system | ${BRAND}`, description: 'Component and state library (staging only).', noindex: true },
};

export function resolveMeta(pathname: string): RouteMeta {
  const path = pathname.replace(/\/+$/, '') || '/';
  const base = { path, status: 200 as const, noindex: !INDEXABLE, ogImage: ogFor(), ogType: 'website' as const };

  const fixed = STATIC[path];
  if (fixed) {
    const jsonLd: JsonLd[] = [];
    if (path === '/') {
      jsonLd.push(organizationLd(), { '@context': 'https://schema.org', '@type': 'WebSite', '@id': abs('/#website'), name: BRAND, url: abs('/'), publisher: { '@id': abs('/#organization') } }, studioFilmLd());
    } else if (fixed.crumbs) {
      jsonLd.push(breadcrumbLd([{ name: 'Home', path: '/' }, { name: fixed.crumbs, path }]));
    }
    return { ...base, title: fixed.title, description: fixed.description, noindex: base.noindex || Boolean(fixed.noindex), jsonLd };
  }

  const legal = ['/privacy', '/terms', '/cookies'].includes(path) ? getLegalPage(path.slice(1)) : undefined;
  if (legal) {
    return { ...base, title: `${legal.title} | ${BRAND}`, description: legal.summary, noindex: base.noindex || !legal.approved, jsonLd: [] };
  }

  let m = matchPath('/services/:slug', path);
  if (m) {
    const s = getService(m.params.slug ?? '');
    if (!s) return { ...NOT_FOUND, path };
    return {
      ...base,
      title: `${s.seo.title} | ${BRAND}`,
      description: s.seo.description,
      ogImage: ogFor(s.seo.ogImage ?? s.image),
      jsonLd: [
        { '@context': 'https://schema.org', '@type': 'Service', '@id': abs(`${path}#service`), name: s.name, serviceType: s.name, description: s.outcome, url: abs(path), provider: { '@id': abs('/#organization') } },
        // The same questions and answers shown on the page, so assistants can quote them exactly.
        ...(s.faqs.length ? [{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: s.faqs.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })) }] : []),
        breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Services', path: '/services' }, { name: s.name, path }]),
      ],
    };
  }
  m = matchPath('/work/:slug', path);
  if (m) {
    const p = getProject(m.params.slug ?? '');
    if (!p) return { ...NOT_FOUND, path };
    return {
      ...base,
      title: `${p.seo.title} | ${BRAND}`,
      description: p.seo.description,
      ogImage: ogFor(p.seo.ogImage ?? p.heroImage),
      ogType: 'article',
      jsonLd: [
        breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Work', path: '/work' }, { name: p.title, path }]),
        // Films embedded on their case study, so VideoObject describes visible content.
        ...(p.film
          ? [{
              '@context': 'https://schema.org',
              '@type': 'VideoObject',
              name: p.film.title,
              description: p.summary,
              thumbnailUrl: [abs(`/images/${p.film.poster}-1536.jpg`)],
              contentUrl: abs(`/video/${p.film.key}-720p.mp4`),
              uploadDate: '2026-11-07', // first published on this site; publication pending permission (B-14)
              duration: p.film.isoDuration,
              isFamilyFriendly: true,
              accessibilityFeature: ['captions', 'longDescription'],
            }]
          : []),
      ],
    };
  }
  m = matchPath('/insights/:slug', path);
  if (m) {
    const a = getInsight(m.params.slug ?? '');
    if (!a) return { ...NOT_FOUND, path };
    return {
      ...base,
      title: `${a.seo.title} | ${BRAND}`,
      description: a.seo.description,
      ogImage: ogFor(a.seo.ogImage ?? a.heroImage),
      ogType: 'article',
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: a.title,
          description: a.summary,
          datePublished: a.publishedAt,
          ...(a.updatedAt ? { dateModified: a.updatedAt } : {}),
          author: { '@type': 'Organization', name: a.author.name, url: abs('/') },
          publisher: { '@type': 'Organization', name: BRAND, logo: { '@type': 'ImageObject', url: abs('/app-icons/icon-512.png') } },
          image: ogFor(a.heroImage),
          mainEntityOfPage: abs(path),
        },
        breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Insights', path: '/insights' }, { name: a.title, path }]),
      ],
    };
  }
  return { ...NOT_FOUND, path };
}

/** All public, published, canonical routes (sitemap + prerender). */
export function publicRoutes(): string[] {
  return [
    '/', '/work', '/services', '/approach', '/studio', '/insights', '/start-a-project', '/book-a-call', '/contact',
    ...publishedServices.map((s) => `/services/${s.slug}`),
    ...publishedProjects.map((p) => `/work/${p.slug}`),
    ...publishedInsights.map((i) => `/insights/${i.slug}`),
    ...legalPages.map((l) => `/${l.slug}`),
  ];
}
/** Routes eligible for the sitemap: public, canonical, status 200; unapproved legal drafts excluded. */
export function sitemapRoutes(): string[] {
  return publicRoutes().filter((r) => {
    if (['/privacy', '/terms', '/cookies'].includes(r)) return Boolean(getLegalPage(r.slice(1))?.approved);
    return resolveMeta(r).status === 200 && r !== '/book-a-call/manage';
  });
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Head tags for prerendered HTML. */
export function renderHead(meta: RouteMeta): string {
  const canonical = abs(meta.path === '/' ? '/' : meta.path);
  const tags = [
    `<title>${esc(meta.title)}</title>`,
    `<meta name="description" content="${esc(meta.description)}" />`,
    meta.status === 200 ? `<link rel="canonical" href="${esc(canonical)}" />` : '',
    `<meta name="robots" content="${meta.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'}" />`,
    `<meta property="og:site_name" content="${esc(BRAND)}" />`,
    `<meta property="og:type" content="${meta.ogType}" />`,
    `<meta property="og:title" content="${esc(meta.title)}" />`,
    `<meta property="og:description" content="${esc(meta.description)}" />`,
    `<meta property="og:url" content="${esc(canonical)}" />`,
    `<meta property="og:image" content="${esc(meta.ogImage)}" />`,
    `<meta property="og:image:secure_url" content="${esc(meta.ogImage)}" />`,
    `<meta property="og:image:type" content="image/jpeg" />`,
    `<meta property="og:image:width" content="${ogDims(meta.ogImage).width}" />`,
    `<meta property="og:image:height" content="${ogDims(meta.ogImage).height}" />`,
    `<meta property="og:image:alt" content="${esc(ogDims(meta.ogImage).alt)}" />`,
    `<meta property="og:locale" content="en_GB" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(meta.title)}" />`,
    `<meta name="twitter:description" content="${esc(meta.description)}" />`,
    `<meta name="twitter:image" content="${esc(meta.ogImage)}" />`,
    `<meta name="twitter:image:alt" content="${esc(ogDims(meta.ogImage).alt)}" />`,
    ...meta.jsonLd.map((ld) => `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`),
  ];
  return tags.filter(Boolean).join('\n    ');
}

/** Client-side head sync after navigation (titles, description, canonical, robots, OG). */
export function applyHead(meta: RouteMeta) {
  document.title = meta.title;
  const set = (selector: string, attr: string, value: string, create: () => HTMLElement) => {
    let el = document.head.querySelector<HTMLElement>(selector);
    if (!el) { el = create(); document.head.appendChild(el); }
    el.setAttribute(attr, value);
  };
  const meta_ = (name: string, prop = false) => () => { const m = document.createElement('meta'); m.setAttribute(prop ? 'property' : 'name', name); return m; };
  set('meta[name="description"]', 'content', meta.description, meta_('description'));
  set('meta[name="robots"]', 'content', meta.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large', meta_('robots'));
  const canonical = abs(meta.path === '/' ? '/' : meta.path);
  set('link[rel="canonical"]', 'href', canonical, () => { const l = document.createElement('link'); l.rel = 'canonical'; return l; });
  set('meta[property="og:title"]', 'content', meta.title, meta_('og:title', true));
  set('meta[property="og:description"]', 'content', meta.description, meta_('og:description', true));
  set('meta[property="og:url"]', 'content', canonical, meta_('og:url', true));
  set('meta[property="og:image"]', 'content', meta.ogImage, meta_('og:image', true));
  set('meta[property="og:image:alt"]', 'content', ogDims(meta.ogImage).alt, meta_('og:image:alt', true));
  set('meta[property="og:type"]', 'content', meta.ogType, meta_('og:type', true));
  document.head.querySelectorAll('script[type="application/ld+json"]').forEach((s) => s.remove());
  for (const ld of meta.jsonLd) {
    const s = document.createElement('script');
    s.type = 'application/ld+json';
    s.textContent = JSON.stringify(ld);
    document.head.appendChild(s);
  }
}
