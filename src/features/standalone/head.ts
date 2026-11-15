import { organizationLd } from '@/lib/seo';
import { SITE_URL } from '@/lib/env';
import { settings } from '@/content/settings';
import { studioFilm } from '@/content/film';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/**
 * Head for the offline edition. Link-preview tags use absolute URLs on the
 * configured site host, because WhatsApp, iMessage and Android previews fetch
 * images by URL (they cannot read embedded data). Accessibility metadata:
 * language, a descriptive title, and VideoObject with a long description.
 */
export function standaloneHead(): string {
  const title = `${settings.name} — Creative technology studio (offline edition)`;
  const description = settings.boilerplateFull;
  const og = `${SITE_URL}/images/og-default.jpg`;
  const ld = [
    organizationLd(),
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: title,
      description,
      inLanguage: 'en-GB',
      isPartOf: { '@type': 'WebSite', name: settings.name, url: `${SITE_URL}/` },
      accessMode: ['textual', 'visual'],
      accessModeSufficient: ['textual'],
      accessibilityFeature: ['alternativeText', 'audioDescription', 'longDescription', 'structuralNavigation', 'readingOrder', 'highContrastDisplay'],
      accessibilityHazard: ['noFlashingHazard', 'noSoundHazard'],
      accessibilitySummary: 'All images have text alternatives; the film has a written, scene-by-scene description and plays sound only when you choose; content is organised with headings and landmarks; and all text meets WCAG AA contrast.',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      name: studioFilm.title,
      description: studioFilm.summary,
      thumbnailUrl: [`${SITE_URL}${studioFilm.media.still.desktop}.jpg`],
      uploadDate: studioFilm.uploadDate,
      duration: studioFilm.isoDuration,
      accessibilityFeature: ['longDescription'],
    },
  ];
  return [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<meta name="robots" content="noindex" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${esc(settings.name)}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:image" content="${og}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${esc(`${settings.name} — ${settings.tagline}`)}" />`,
    `<meta property="og:locale" content="en_GB" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:image" content="${og}" />`,
    ...ld.map((x) => `<script type="application/ld+json">${JSON.stringify(x).replace(/</g, '\\u003c')}</script>`),
  ].join('\n    ');
}
