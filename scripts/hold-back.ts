/**
 * Production builds leave out, completely, every piece of work that is not cleared
 * for publication (client work or third-party brands without recorded permission;
 * see `publishableProjects` in src/content/projects.ts and B-14, B-25, B-26, B-27).
 *
 * The pages for that work were already never rendered in production. This also keeps
 * its text out of the JavaScript sent to browsers and its images, films and caption
 * files out of the deployed folder, so nothing can be reached by guessing an address.
 * Staging and development builds are unchanged.
 *
 * The list is worked out from the content itself, so recording a client's permission
 * (`permission.publicationApproved: true`) is all it takes to publish their work.
 *
 * Plain TypeScript with no build-time imports: Node runs it directly (prerender.mjs) and
 * Vite bundles it into its config (vite.config.ts).
 */
import { existsSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';

type Work = {
  slug: string;
  title: string;
  heroImage: string;
  gallery: { image: string }[];
  feature?: { image: string };
  storyboard?: { image: string };
  film?: { key: string; poster: string };
  seo?: { ogImage?: string };
};
export type HeldBack = { slugs: string[]; titles: string[]; images: string[]; films: string[] };

const imagesOf = (p: Work) => [p.heroImage, p.seo?.ogImage, p.feature?.image, p.storyboard?.image, p.film?.poster, ...p.gallery.map((g) => g.image)].filter((x): x is string => Boolean(x));

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? sourceFiles(path) : /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

/** What a production build must leave out. Images used anywhere else on the site are kept. */
export async function heldBackWork(root: string): Promise<HeldBack> {
  const mod = (await import(pathToFileURL(join(root, 'src/content/projects.ts')).href)) as {
    projects: Work[];
    publishableProjects: (list: Work[], env: string) => Work[];
  };
  const published = new Set(mod.publishableProjects(mod.projects, 'production').map((p) => p.slug));
  const held = mod.projects.filter((p) => !published.has(p.slug));
  const kept = mod.projects.filter((p) => published.has(p.slug));
  const keptImages = new Set(kept.flatMap(imagesOf));
  const elsewhere = sourceFiles(join(root, 'src'))
    .filter((f) => !/content[\\/](projects|media\.generated)\.ts$/.test(f))
    .map((f) => readFileSync(f, 'utf8'))
    .join('\n');
  const usedElsewhere = (id: string) => keptImages.has(id) || elsewhere.includes(`'${id}'`) || elsewhere.includes(`"${id}"`);
  // Every image of held-back work, plus spare frames from the same set that no page uses
  // (same prefix, such as "mrb-"), so nothing from that work is left behind.
  const heldIds = [...new Set(held.flatMap(imagesOf))].filter((id) => !usedElsewhere(id));
  const prefixes = new Set(heldIds.map((id) => `${id.split('-')[0]}-`));
  const registry = Object.keys(JSON.parse(/export const images = (\{[\s\S]*?\n\}) as const satisfies/.exec(readFileSync(join(root, 'src/content/media.generated.ts'), 'utf8'))![1]!) as object);
  const spares = registry.filter((id) => [...prefixes].some((p) => id.startsWith(p)) && !usedElsewhere(id));
  const images = [...new Set([...heldIds, ...spares])];
  const keptFilms = new Set(kept.map((p) => p.film?.key).filter(Boolean));
  const films = held.map((p) => p.film?.key).filter((k): k is string => Boolean(k) && !keptFilms.has(k));
  return { slugs: held.map((p) => p.slug), titles: held.map((p) => p.title), images, films };
}

/**
 * Removes the held-back entries from the `projects` array in projects.ts. Each entry is a
 * top-level `  {` … `  },` block; the build fails if any held-back entry is not found, so a
 * change of layout can never let work through silently.
 */
export function stripProjects(code: string, slugs: string[]): string {
  if (!slugs.length) return code;
  const lines = code.split('\n');
  const out: string[] = [];
  const removed = new Set<string>();
  for (let i = 0; i < lines.length; i++) {
    if (lines[i] === '  {') {
      let j = i;
      while (j < lines.length && !/^ {2}\},?$/.test(lines[j]!)) j++;
      const block = lines.slice(i, j + 1).join('\n');
      const slug = /^ {4}slug: '([^']+)',$/m.exec(block)?.[1];
      if (slug && slugs.includes(slug)) {
        removed.add(slug);
        i = j;
        continue;
      }
    }
    out.push(lines[i]!);
  }
  const missing = slugs.filter((s) => !removed.has(s));
  if (missing.length) throw new Error(`hold-back: could not remove ${missing.join(', ')} from projects.ts`);
  return out.join('\n');
}

/** Removes the held-back images from the generated image registry (alt text included). */
export function stripImages(code: string, ids: string[]): string {
  if (!ids.length) return code;
  const m = /export const images = (\{[\s\S]*?\n\}) as const satisfies/.exec(code);
  if (!m) throw new Error('hold-back: image registry not found in media.generated.ts');
  const images = JSON.parse(m[1]!) as Record<string, unknown>;
  for (const id of ids) delete images[id];
  return code.replace(m[1]!, JSON.stringify(images, null, 2));
}

/** Vite plugin: applies the two removals to production builds only (client and SSR). */
export function holdBackPlugin(root: string) {
  let held: HeldBack | null = null;
  return {
    name: 'weamaze-hold-back',
    enforce: 'pre' as const,
    apply: 'build' as const,
    async configResolved(config: { env: Record<string, unknown> }) {
      held = (config.env.PUBLIC_SITE_ENV ?? process.env.PUBLIC_SITE_ENV) === 'production' ? await heldBackWork(root) : null;
    },
    transform(code: string, id: string) {
      if (!held) return null;
      const file = id.split('?')[0]!.replace(/\\/g, '/');
      if (file.endsWith('/src/content/projects.ts')) return { code: stripProjects(code, held.slugs), map: null };
      if (file.endsWith('/src/content/media.generated.ts')) return { code: stripImages(code, held.images), map: null };
      return null;
    },
  };
}

/** After a production build: delete held-back media from the output, then prove nothing remains. */
export function scrubOutput(clientDir: string, held: HeldBack): { removedFiles: number } {
  let removedFiles = 0;
  const drop = (dir: string, test: (name: string) => boolean) => {
    if (!existsSync(dir)) return;
    for (const name of readdirSync(dir)) if (test(name)) { rmSync(join(dir, name)); removedFiles++; }
  };
  const imageFile = new RegExp(`^(${held.images.map((i) => i.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})-\\d+\\.(avif|webp|jpg)$`);
  if (held.images.length) drop(join(clientDir, 'images'), (n) => imageFile.test(n));
  if (held.films.length) drop(join(clientDir, 'video'), (n) => held.films.some((k) => n.startsWith(`${k}-`)));

  const needles = [...held.titles, ...held.slugs.map((s) => `/work/${s}`), ...held.images.map((i) => `${i}-`), ...held.films.map((k) => `/video/${k}-`)];
  const leaks: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) { walk(path); continue; }
      if (!/\.(js|css|html|json|txt|xml|vtt|webmanifest|md)$/.test(name)) continue;
      const text = readFileSync(path, 'utf8');
      for (const n of needles) if (text.includes(n)) leaks.push(`${relative(clientDir, path)}: ${n}`);
    }
  };
  walk(clientDir);
  if (leaks.length) throw new Error(`hold-back: held-back work still in the production build:\n  ${leaks.slice(0, 20).join('\n  ')}`);
  return { removedFiles };
}
