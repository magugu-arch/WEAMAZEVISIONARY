import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { SocialLinks } from '@/components/brand/SocialLinks';
import { llmsTxt, organizationLd } from '@/lib/seo';
import { settings } from '@/content/settings';

describe('the studio channels', () => {
  it('links the YouTube channel the owner supplied, without the share link tracking code', () => {
    const youtube = settings.social.find((s) => s.network === 'youtube');
    expect(youtube?.url).toBe('https://www.youtube.com/@weamazevisionary');
    for (const s of settings.social) expect(s.url).toMatch(/^https:\/\/[^?#]+$/);
  });

  it('draws one-colour marks with a spoken name and a 44 px target', () => {
    const html = renderToStaticMarkup(<SocialLinks />);
    expect(html).toContain('href="https://www.youtube.com/@weamazevisionary"');
    expect(html).toContain('rel="me noopener"');
    expect(html).toContain('<span class="sr-only">WeAmaze Visionary on YouTube</span>');
    expect(html).toContain('size-11'); // 44 px: above WCAG 2.2's 24 px minimum target
    expect(html).toMatch(/<svg[^>]*fill="currentColor"[^>]*aria-hidden="true"/);
    // Monochrome: the only fill is the surface's own text colour; no brand red, no inline colour.
    expect(html.match(/fill="[^"]*"/g)).toEqual(['fill="currentColor"']);
    expect(html).not.toMatch(/style=|stroke=|#ff0000|text-red/i);
  });

  it('tells search engines and AI assistants the channel is the studio’s', () => {
    expect(organizationLd().sameAs).toContain('https://www.youtube.com/@weamazevisionary');
    expect(llmsTxt()).toContain('- [YouTube](https://www.youtube.com/@weamazevisionary)');
  });
});
