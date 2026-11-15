import { describe, expect, it } from 'vitest';
import { llmsTxt, organizationLd, publicRoutes, renderHead, resolveMeta, sitemapRoutes } from '@/lib/seo';
import { services } from '@/content/services';
import { serviceIndex } from '@/content/serviceIndex';
import { projects, publishableProjects, publishedProjects } from '@/content/projects';
import { legalPages } from '@/content/legal';
import { settings } from '@/content/settings';

describe('route metadata', () => {
  it('gives every public route a unique title and description', () => {
    const metas = publicRoutes().map((r) => resolveMeta(r));
    expect(metas.every((m) => m.status === 200)).toBe(true);
    expect(new Set(metas.map((m) => m.title)).size).toBe(metas.length);
    expect(new Set(metas.map((m) => m.description)).size).toBe(metas.length);
    for (const m of metas) {
      expect(m.title.length).toBeLessThanOrEqual(80);
      expect(m.description.length).toBeGreaterThan(50);
      expect(m.description.length).toBeLessThanOrEqual(200);
    }
  });

  it('returns 404 metadata for unknown and unpublished slugs', () => {
    expect(resolveMeta('/services/not-a-service').status).toBe(404);
    expect(resolveMeta('/work/nope').status).toBe(404);
    expect(resolveMeta('/insights/nope').status).toBe(404);
    expect(resolveMeta('/random').noindex).toBe(true);
  });

  it('keeps staging builds noindex', () => {
    expect(resolveMeta('/').noindex).toBe(true);
    expect(renderHead(resolveMeta('/'))).toContain('noindex, nofollow');
  });

  it('excludes unapproved legal drafts, private and system routes from the sitemap', () => {
    const map = sitemapRoutes();
    for (const l of legalPages.filter((p) => !p.approved)) expect(map).not.toContain(`/${l.slug}`);
    expect(map).not.toContain('/system');
    expect(map).not.toContain('/book-a-call/manage');
    expect(map).toContain('/services/ai-creative-studio');
  });

  it('emits factual Organization schema only (no address, rating or unverified profiles)', () => {
    const ld = organizationLd();
    expect(ld).not.toHaveProperty('address');
    expect(ld).not.toHaveProperty('aggregateRating');
    expect(ld).not.toHaveProperty('telephone');
    if (!settings.contactEmail.verified) expect(ld).not.toHaveProperty('email');
    if (!settings.social.length) expect(ld).not.toHaveProperty('sameAs');
  });

  it('escapes JSON-LD so content cannot break out of the script tag', () => {
    expect(renderHead({ ...resolveMeta('/'), jsonLd: [{ x: '</script><script>alert(1)</script>' }] })).not.toContain('</script><script>');
  });
});

describe('content integrity', () => {
  const CI_NAMES = ['AI Creative Studio', 'AI Presentations & Pitch Decks', 'Websites & Digital Experiences', 'Apps & Digital Products', 'AI Solutions & Automation', '3D, Animation & Motion Design', 'Brand Strategy & Creative Direction', 'Digital Innovation & Technology'];
  it('uses the exact eight CI service names, in order, in both indexes', () => {
    expect(services.sort((a, b) => a.order - b.order).map((s) => s.name)).toEqual(CI_NAMES);
    expect(serviceIndex.map((s) => s.name)).toEqual(CI_NAMES);
    expect(serviceIndex.map((s) => s.descriptor)).toEqual(services.map((s) => s.descriptor));
  });
  it('labels every project and never publishes client work without permission in production', () => {
    for (const p of projects) {
      expect(['client-work', 'studio-concept', 'capability-demonstration', 'confidential']).toContain(p.status);
      if (p.outcome) expect(p.outcome.source.length).toBeGreaterThan(0);
    }
    const production = publishableProjects(projects, 'production');
    expect(production.every((p) => !(p.status === 'client-work' || p.permission.thirdParty) || p.permission.publicationApproved)).toBe(true);
    // Unapproved client work, and work featuring another company's brand, is visible only in staging previews.
    const pending = projects.filter((p) => (p.status === 'client-work' || p.permission.thirdParty) && !p.permission.publicationApproved);
    for (const p of pending) {
      expect(production).not.toContain(p);
      expect(publishableProjects(projects, 'staging')).toContain(p);
    }
  });
  it('film case studies carry captions, a shot list and a script source note, and add no claims', () => {
    for (const p of projects.filter((x) => x.film)) {
      const f = p.film!;
      expect(f.script.length).toBeGreaterThan(0);
      expect(f.shots[0]!.start).toBe(0);
      for (let i = 1; i < f.shots.length; i++) expect(f.shots[i]!.start).toBe(f.shots[i - 1]!.end);
      expect(f.shots[f.shots.length - 1]!.end).toBeCloseTo(f.durationSec, 1);
      expect(f.scriptNote).toMatch(/checked against the final mix/);
      expect(p.outcome).toBeNull();
      expect(p.year).toBeUndefined(); // not stated by the owner, so not shown
      expect(JSON.stringify(p).toLowerCase()).not.toMatch(/\baward|\broi\b|increase[ds]? (sales|revenue)|\d+ ?%/);
    }
  });
  it('contains no banned claims in service copy', () => {
    const text = JSON.stringify(services).toLowerCase();
    for (const banned of ['best in the world', 'award-winning', 'guaranteed results', 'first place on google', 'cutting-edge', 'revolutionary', 'game-changing']) {
      expect(text.includes(banned) && !text.includes('can you guarantee first place on google')).toBe(false);
    }
  });
});

describe('discoverability for search engines and AI assistants', () => {
  it('the Organization names what the studio does, its service catalogue and how to reach it', () => {
    const ld = organizationLd() as unknown as { knowsAbout: string[]; hasOfferCatalog: { itemListElement: { itemOffered: { name: string } }[] }; contactPoint: { email: string } };
    expect(ld.knowsAbout).toHaveLength(8);
    expect(ld.hasOfferCatalog.itemListElement).toHaveLength(8);
    expect(ld.hasOfferCatalog.itemListElement[0]!.itemOffered.name).toBe('AI Creative Studio');
    expect(ld.contactPoint.email).toBe(settings.contactEmail.value);
    expect(ld).not.toHaveProperty('address'); // no unconfirmed facts
    expect(ld).not.toHaveProperty('aggregateRating');
  });
  it('service pages link the Service to the Organization and carry their visible questions as FAQPage', () => {
    type Node = { '@type': string; provider?: { '@id': string }; mainEntity?: { name: string }[] };
    for (const s of services) {
      const ld = resolveMeta(`/services/${s.slug}`).jsonLd as unknown as Node[];
      const svc = ld.find((x) => x['@type'] === 'Service')!;
      expect(svc.provider!['@id']).toMatch(/\/#organization$/);
      const faq = ld.find((x) => x['@type'] === 'FAQPage');
      expect(faq?.mainEntity!.map((q) => q.name)).toEqual(s.faqs.map((f) => f.question));
    }
  });
  it('llms.txt lists every service and only the work this build publishes, from the same words as the pages', () => {
    const txt = llmsTxt();
    expect(txt.startsWith('# WeAmaze Visionary\n\n> ')).toBe(true);
    for (const s of services) expect(txt).toContain(`[${s.name}](`);
    const work = txt.split('## Work\n')[1]!.split('\n\n')[0]!.split('\n');
    expect(work).toHaveLength(publishedProjects.length);
    for (const p of projects.filter((x) => !publishedProjects.includes(x))) expect(txt).not.toContain(p.title);
    expect(txt).not.toMatch(/\bR ?\d{3}|\d+ ?%|guarantee|best in/i);
  });
});
