/**
 * Builds the offline edition: ONE self-contained HTML file with the CSS, the
 * Latin font subsets, the official vector logos, every image, the hero film and
 * its description track embedded as data URIs. No network requests, no server.
 *
 * Designed for Android, iOS and WhatsApp's document viewer:
 *  - content, galleries (native scroll-snap), accordions (<details>) and the film
 *    (native autoplay/poster/controls) all work with JavaScript disabled, as in
 *    iOS Quick Look;
 *  - an optional inline script (ES2017, no dependencies) only adds polish: a
 *    quiet pause control, offscreen pausing, reduced-motion/save-data respect,
 *    and previous/next buttons for galleries on pointer devices.
 */
import { readFileSync, writeFileSync, mkdirSync, statSync, rmSync, copyFileSync } from 'node:fs';
import { join, extname } from 'node:path';
import { createHash } from 'node:crypto';

const MIME = { '.webp': 'image/webp', '.jpg': 'image/jpeg', '.avif': 'image/avif', '.png': 'image/png', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.webm': 'video/webm', '.vtt': 'text/vtt', '.woff2': 'font/woff2' };
const dataUri = (file) => `data:${MIME[extname(file)] ?? 'application/octet-stream'};base64,${readFileSync(file).toString('base64')}`;

const KEEP_FONTS = [/geist-latin-wght-normal-/, /geist-mono-latin-wght-normal-/, /cormorant-garamond-latin-400-normal-/];

function inlineCss(css, clientDir) {
  return css.replace(/@font-face\s*\{[^}]*\}/g, (block) => {
    const m = /url\((?:["']?)\/assets\/([^)"']+\.woff2)(?:["']?)\)/.exec(block);
    if (!m || !KEEP_FONTS.some((re) => re.test(m[1]))) return ''; // drop non-Latin subsets and unused styles
    return block.replace(/src:[^;}]*/, `src:url(${dataUri(join(clientDir, 'assets', m[1]))}) format("woff2")`);
  });
}

const SCRIPT = `(function(){
  var d=document,w=window;
  var reduce=w.matchMedia&&w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var c=navigator.connection,save=!!(c&&c.saveData);
  var v=d.querySelector('[data-sa-film]');
  // Without script the film is a poster with native controls (tap to play, with sound).
  // With script, and when motion and data are welcome, it becomes a muted ambient loop with
  // Pause and "Watch the film" (restarts with sound and native controls), as on the site.
  if(v&&!reduce&&!save){
    var frame=v.closest('[data-parallax-frame]')||v.parentNode;
    v.removeAttribute('controls');v.muted=true;v.loop=true;
    var bar=d.createElement('div');bar.className='sa-film-bar';
    var wb=d.createElement('button');wb.type='button';wb.className='sa-film-btn';
    wb.appendChild(d.createTextNode('Watch the film '));
    var dur=d.createElement('span');dur.setAttribute('aria-hidden','true');dur.className='sa-film-dur';dur.textContent=v.getAttribute('data-duration')||'';wb.appendChild(dur);
    var sr=d.createElement('span');sr.className='sr-only';sr.textContent=', with sound';wb.appendChild(sr);
    var pb=d.createElement('button');pb.type='button';pb.className='sa-film-btn';
    var set=function(){var p=!v.paused;pb.textContent=p?'Pause':'Play';pb.setAttribute('aria-label',p?'Pause film':'Play film');pb.setAttribute('aria-pressed',String(!p));};
    pb.addEventListener('click',function(){if(v.paused){v.play().catch(function(){});}else{v.pause();}});
    wb.addEventListener('click',function(){v.loop=false;v.muted=false;v.currentTime=0;v.controls=true;bar.hidden=true;v.play().catch(function(){});v.focus();});
    v.addEventListener('ended',function(){v.controls=false;v.muted=true;v.loop=true;bar.hidden=false;v.currentTime=0;v.play().catch(function(){});});
    v.addEventListener('play',set);v.addEventListener('pause',set);
    bar.appendChild(pb);bar.appendChild(wb);frame.appendChild(bar);
    var pr=v.play();if(pr&&pr.catch)pr.catch(function(){});
    set();
    if('IntersectionObserver' in w){new IntersectionObserver(function(es){es.forEach(function(e){if(!v.muted)return;if(!e.isIntersecting&&!v.paused){v.pause();v.setAttribute('data-resume','1');}else if(e.isIntersecting&&v.getAttribute('data-resume')){v.removeAttribute('data-resume');v.play().catch(function(){});}});},{threshold:0.1}).observe(v);}
  }
  Array.prototype.forEach.call(d.querySelectorAll('[data-sa-rail]'),function(rail){
    ['prev','next'].forEach(function(dir){
      var bt=d.createElement('button');bt.type='button';bt.className='sa-rail-btn sa-rail-'+dir;
      bt.setAttribute('aria-label',dir==='prev'?'Previous image':'Next image');bt.textContent=dir==='prev'?'\\u2190':'\\u2192';
      bt.addEventListener('click',function(){rail.scrollBy({left:(dir==='prev'?-1:1)*rail.clientWidth*0.8,behavior:reduce?'auto':'smooth'});});
      rail.parentNode.appendChild(bt);
    });
  });
  var h=d.querySelector('[data-sa-header]');
  if(h){var on=function(){h.setAttribute('data-scrolled',String(w.scrollY>8));};on();w.addEventListener('scroll',on,{passive:true});}
})();`;

const EXTRA_CSS = `
@media (prefers-reduced-motion:no-preference){html:focus-within{scroll-behavior:smooth}}
.sa-film-bar{position:absolute;right:var(--wv-margin);bottom:16px;z-index:2;display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px}
@media (min-width:64rem){.sa-film-bar{bottom:32px}}
.sa-film-bar[hidden]{display:none}
.sa-film-btn{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 14px;font:500 .75rem/1 var(--font-sans);letter-spacing:.02em;color:var(--color-ivory);background:color-mix(in srgb,var(--color-onyx) 82%,transparent);border:1px solid color-mix(in srgb,var(--color-ivory) 30%,transparent);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
.sa-film-dur{font-family:var(--font-mono);opacity:.78}
.sa-rail-btn{position:absolute;top:calc(50% - 40px);width:44px;height:44px;display:none;align-items:center;justify-content:center;font-size:18px;color:var(--color-ivory);background:color-mix(in srgb,var(--color-onyx) 85%,transparent);border:1px solid color-mix(in srgb,var(--color-ivory) 30%,transparent)}
.sa-rail-prev{left:8px}.sa-rail-next{right:8px}
@media (hover:hover) and (pointer:fine){.sa-rail-btn{display:inline-flex}}
.sa-film-btn:active,.sa-rail-btn:active{scale:.97}
`;

/**
 * The offline file's own security policy. Everything it shows is embedded, so it may load
 * nothing from anywhere: only its one inline script (pinned by hash), inline styles and the
 * embedded images, films, captions and fonts. The request form may only open an email.
 */
export function offlineCsp() {
  const hash = createHash('sha256').update(SCRIPT).digest('base64');
  return [
    "default-src 'none'", `script-src 'sha256-${hash}'`, "style-src 'unsafe-inline'", 'img-src data:', 'media-src data:',
    'font-src data:', "connect-src 'none'", 'form-action mailto:', "base-uri 'none'", "object-src 'none'",
  ].join('; ');
}

export function writeStandalone({ clientDir, cssFile, html, head, outFile }) {
  const css = inlineCss(readFileSync(join(clientDir, cssFile), 'utf8'), clientDir) + EXTRA_CSS;
  const body = html.replace(/(src|poster)="(\/(?:images|video|brand)\/[^"]+)"/g, (_, attr, path) => `${attr}="${dataUri(join(clientDir, path))}"`);
  const favicon = `data:image/svg+xml,${encodeURIComponent(readFileSync(join(clientDir, 'brand/favicon.svg'), 'utf8').trim())}`;
  const doc = `<!doctype html>
<html lang="en-GB" dir="ltr">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="Content-Security-Policy" content="${offlineCsp()}" />
    <meta name="referrer" content="no-referrer" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="theme-color" content="#111114" />
    <meta name="color-scheme" content="dark" />
    <meta name="application-name" content="WeAmaze Visionary" />
    <meta name="apple-mobile-web-app-title" content="WeAmaze" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />
    <link rel="icon" type="image/svg+xml" href="${favicon}" />
    ${head}
    <style>${css}</style>
  </head>
  <body>
    ${body}
    <script>${SCRIPT}</script>
  </body>
</html>
`;
  mkdirSync(join(outFile, '..'), { recursive: true });
  writeFileSync(outFile, doc);
  const external = (doc.match(/(?:src|href|poster)="(?:https?:)?\/\/[^"]+"/g) ?? []).filter((m) => !m.includes('schema.org'));
  return { bytes: statSync(outFile).size, external };
}

/**
 * The same edition laid out for Claude Artifacts: body content only (the host wraps it in
 * its own document), with media published as files beside the page instead of embedded,
 * so the page itself stays small and the films can stream at higher quality. `swap` maps a
 * media path to a better encode for this output. Returns the files to publish.
 */
/** Fonts for the shareable edition: served by Google Fonts, the one font host public sharing accepts. */
const ARTIFACT_FONTS = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=Geist:wght@100..900&family=Geist+Mono:wght@100..900&display=swap';

export function writeArtifact({ clientDir, cssFile, html, outDir, swap = {} }) {
  // Public sharing accepts only image, video and audio files (JPEG, PNG, GIF, WebP, MP4,
  // WebM, MP3, WAV), so this edition embeds no fonts and no caption files: fonts load from
  // Google Fonts under the same family names, and caption and description tracks are left
  // out. Each film's script and shot-by-shot description are already on the page as text.
  const css = readFileSync(join(clientDir, cssFile), 'utf8').replace(/@font-face\s*\{[^}]*\}/g, '') + EXTRA_CSS;
  const files = new Map();
  const body = html.replace(/<track\b[^>]*>/g, '').replace(/(src|poster)="(\/(?:images|video|brand)\/[^"]+)"/g, (_, attr, path) => {
    const real = swap[path] ?? path;
    const name = real.split('/').pop();
    files.set(`media/${name}`, join(clientDir, real));
    return `${attr}="media/${name}"`;
  });
  // The host's reset is unlayered, so it outranks the site's layered CSS: restate the body basics.
  const fix = ':root{color-scheme:dark;--font-sans:"Geist","Geist Variable",ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;--font-mono:"Geist Mono","Geist Mono Variable",ui-monospace,Menlo,monospace}body{background:var(--color-onyx);color:var(--color-ivory);font-family:var(--font-sans);font-size:16px;line-height:1.5}';
  const fonts = `<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link rel="stylesheet" href="${ARTIFACT_FONTS}">`;
  const page = `<title>WeAmaze Visionary</title>\n${fonts}\n<style>${css}</style>\n<style>${fix}</style>\n${body}\n<script>${SCRIPT}</script>\n`;
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(join(outDir, 'media'), { recursive: true });
  writeFileSync(join(outDir, 'index.html'), page);
  let bytes = statSync(join(outDir, 'index.html')).size;
  for (const [rel, src] of files) { copyFileSync(src, join(outDir, rel)); bytes += statSync(src).size; }
  const external = (page.match(/(?:src|href|poster)="(?:https?:)?\/\/[^"]+"/g) ?? []).filter((m) => !m.includes('schema.org') && !/\/\/fonts\.(googleapis|gstatic)\.com/.test(m));
  const embedded = page.match(/data:(?!image\/(?:jpeg|png|gif|webp))[a-z]+\/[a-z0-9.+-]+/g) ?? [];
  if (embedded.length) throw new Error(`Artifact edition embeds files public sharing refuses: ${[...new Set(embedded)].join(', ')}`);
  return { pageBytes: statSync(join(outDir, 'index.html')).size, totalBytes: bytes, files: [...files.keys()], external };
}
