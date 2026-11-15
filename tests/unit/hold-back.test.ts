import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { heldBackWork, stripImages, stripProjects } from '../../scripts/hold-back';
import { projects, publishableProjects } from '@/content/projects';

const projectsSource = readFileSync('src/content/projects.ts', 'utf8');
const mediaSource = readFileSync('src/content/media.generated.ts', 'utf8');

describe('production hold-back', () => {
  it('holds back exactly the work production pages already hide', async () => {
    const held = await heldBackWork(process.cwd());
    const published = publishableProjects(projects, 'production').map((p) => p.slug);
    expect([...held.slugs, ...published].sort()).toEqual(projects.map((p) => p.slug).sort());
    for (const s of held.slugs) expect(published).not.toContain(s);
  });

  it('never removes an image a published page still uses', async () => {
    const held = await heldBackWork(process.cwd());
    const used = publishableProjects(projects, 'production').flatMap((p) => [p.heroImage, ...p.gallery.map((g) => g.image), p.film?.poster, p.storyboard?.image]);
    for (const id of used) expect(held.images).not.toContain(id);
  });

  it('removes held-back entries from the source the browser receives, and nothing else', () => {
    const slug = 'miss-rhee-beauty-the-space-of-restoration';
    const out = stripProjects(projectsSource, [slug]);
    expect(out).not.toContain(slug);
    expect(out).toContain("slug: 'my-backyard'");
    expect(out.split('\n').length).toBeLessThan(projectsSource.split('\n').length);
    expect(stripProjects(projectsSource, [])).toBe(projectsSource);
  });

  it('fails the build instead of letting work through when an entry cannot be found', () => {
    expect(() => stripProjects(projectsSource, ['no-such-project'])).toThrow(/could not remove no-such-project/);
  });

  it('removes held-back images from the image registry, alt text included', () => {
    const out = stripImages(mediaSource, ['mrb-frame-touch']);
    expect(out).not.toContain('"mrb-frame-touch"');
    expect(out).toContain('"backyard-frame-lens"');
    expect(out).toMatch(/as const satisfies Record<string, ImageAsset>;/);
  });
});
