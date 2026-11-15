/**
 * Parallax fallback for browsers without CSS scroll timelines.
 *
 * The primary implementation is pure CSS (src/styles/motion.css): compositor-driven
 * `animation-timeline` on [data-parallax-layer] elements, which needs no script.
 * This fallback reproduces it with one passive scroll listener and one rAF per
 * frame, and only where it cannot hurt: precise-pointer devices, motion allowed.
 * Touch devices without scroll timelines stay static rather than risk jitter
 * during momentum scrolling (V10 §12).
 */
const REDUCED = '(prefers-reduced-motion: reduce)';
const FINE = '(hover: hover) and (pointer: fine)';

export function supportsScrollTimeline(): boolean {
  return typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('animation-timeline: view()');
}

/** Progress of a frame through the viewport: 'cover' (enter→exit) or 'exit' (top at viewport top → bottom at viewport top). */
export function frameProgress(top: number, height: number, viewport: number, range: 'cover' | 'exit'): number {
  const p = range === 'cover' ? (viewport - top) / (viewport + height) : -top / height;
  return Math.min(1, Math.max(0, p));
}

/** Translation in px for a layer at progress p. Depth layers travel −a → +a; the hero travels 0 → shift. */
export function layerOffset(kind: string, p: number, amplitude: number, heroShift: number): number {
  return kind === 'hero' ? p * heroShift : (p * 2 - 1) * amplitude;
}

export function initParallaxFallback(root: ParentNode = document): () => void {
  if (typeof window === 'undefined' || supportsScrollTimeline()) return () => {};
  if (window.matchMedia(REDUCED).matches || !window.matchMedia(FINE).matches) return () => {};
  if (!('IntersectionObserver' in window)) return () => {};

  const layers = Array.from(root.querySelectorAll<HTMLElement>('[data-parallax-layer]'));
  if (!layers.length) return () => {};
  const visible = new Set<HTMLElement>();
  let raf = 0;

  const readPx = (el: Element, name: string, basis: number) => {
    const v = getComputedStyle(el).getPropertyValue(name).trim();
    if (v.endsWith('%')) return (parseFloat(v) / 100) * basis;
    return parseFloat(v) || 0;
  };

  const update = () => {
    raf = 0;
    const vh = window.innerHeight;
    for (const layer of visible) {
      const frame = layer.closest<HTMLElement>('[data-parallax-frame]');
      if (!frame) continue;
      const r = frame.getBoundingClientRect();
      const kind = layer.dataset.parallaxLayer ?? 'media';
      const p = frameProgress(r.top, r.height, vh, kind === 'hero' ? 'exit' : 'cover');
      const y = layerOffset(kind, p, readPx(layer, '--wv-parallax', r.height), readPx(layer, '--wv-hero-shift', layer.offsetHeight));
      layer.style.translate = `0 ${y.toFixed(2)}px`;
    }
  };
  const schedule = () => { if (!raf) raf = requestAnimationFrame(update); };

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const layer = (e.target as HTMLElement).querySelector<HTMLElement>('[data-parallax-layer]');
      if (!layer) continue;
      if (e.isIntersecting) visible.add(layer); else visible.delete(layer);
    }
    schedule();
  }, { rootMargin: '10% 0px' });
  const frames = new Set(layers.map((l) => l.closest<HTMLElement>('[data-parallax-frame]')).filter((f): f is HTMLElement => Boolean(f)));
  for (const f of frames) io.observe(f);

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  return () => {
    io.disconnect();
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
    if (raf) cancelAnimationFrame(raf);
    for (const l of layers) l.style.translate = '';
  };
}
