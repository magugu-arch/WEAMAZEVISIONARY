import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { ArrowLeft, ArrowRight, Expand, X } from 'lucide-react';
import type { ImageId } from '@/content/media.generated';
import { images } from '@/content/media.generated';
import { Icon } from '@/lib/icon';
import { project, rubberband, Spring, VelocityTracker } from '@/lib/spring';
import { ResponsiveImage } from './ResponsiveImage';

export type GalleryItem = { image: ImageId; caption: string };

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/**
 * Case-study gallery with a fluid, accessible viewer on the native <dialog>.
 *  - Swipe sideways to move between images: 1:1 tracking from the grab point,
 *    momentum projection on release, rubber-banding at the first/last image.
 *  - Swipe down to dismiss, with the backdrop fading as the image follows the finger.
 *  - Every animation is a critically damped spring that starts from the current
 *    on-screen value and inherits release velocity, so it can be interrupted.
 *  - Keyboard: ←/→ move, Escape closes; focus returns to the opening thumbnail;
 *    position is announced. Reduced motion: no springs, instant changes.
 */
export function Gallery({ items, label, single = false }: { items: GalleryItem[]; label: string; /** One full-width image at its own proportions (e.g. a storyboard), never cropped. */ single?: boolean }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const triggerRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const openerIndex = useRef<number | null>(null);
  const [index, setIndex] = useState<number | null>(null);
  const indexRef = useRef(0);
  const width = useRef(0);
  const height = useRef(0);

  // Two independent springs: horizontal position of the track, vertical dismiss offset.
  const xSpring = useRef<Spring | null>(null);
  const ySpring = useRef<Spring | null>(null);
  const apply = useCallback(() => {
    const x = xSpring.current?.value ?? 0;
    const y = ySpring.current?.value ?? 0;
    if (trackRef.current) trackRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    if (scrimRef.current) scrimRef.current.style.opacity = String(Math.max(0.15, 1 - Math.abs(y) / (height.current * 0.9 || 1)));
  }, []);
  useIsoLayoutEffect(() => {
    xSpring.current = new Spring(0, apply);
    ySpring.current = new Spring(0, apply);
    return () => { xSpring.current?.stop(); ySpring.current?.stop(); };
  }, [apply]);

  const measure = useCallback(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    width.current = vp.clientWidth;
    height.current = vp.clientHeight;
  }, []);

  const goTo = useCallback((i: number, velocity?: number) => {
    const clamped = Math.max(0, Math.min(items.length - 1, i));
    indexRef.current = clamped;
    setIndex(clamped);
    xSpring.current!.to(-clamped * width.current, { velocity, damping: 1, response: 0.38 });
  }, [items.length]);

  const open = (i: number) => {
    openerIndex.current = i;
    indexRef.current = i;
    setIndex(i);
    dialogRef.current?.showModal();
  };
  const close = useCallback(() => dialogRef.current?.close(), []);

  // Position the track instantly when the viewer opens or the viewport resizes.
  useIsoLayoutEffect(() => {
    if (index === null) return;
    measure();
    xSpring.current!.set(-indexRef.current * width.current);
    ySpring.current!.set(0);
    const onResize = () => { measure(); xSpring.current!.set(-indexRef.current * width.current); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [index === null, measure]);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    const onClose = () => {
      setIndex(null);
      const i = openerIndex.current;
      requestAnimationFrame(() => { if (i !== null) triggerRefs.current[i]?.focus(); });
    };
    dlg.addEventListener('close', onClose);
    return () => dlg.removeEventListener('close', onClose);
  }, []);

  // ---- Gesture: detect axis after 10 px of travel, then track 1:1 ----
  const gesture = useRef<{ id: number; startX: number; startY: number; baseX: number; axis: 'x' | 'y' | null; tracker: VelocityTracker } | null>(null);
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button, a')) return;
    // Grab mid-flight: continue from the presentation value, never the target.
    xSpring.current!.stop();
    ySpring.current!.stop();
    const tracker = new VelocityTracker();
    tracker.add(e.clientX, e.clientY);
    gesture.current = { id: e.pointerId, startX: e.clientX, startY: e.clientY, baseX: xSpring.current!.value, axis: null, tracker };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    const dx = e.clientX - g.startX;
    const dy = e.clientY - g.startY;
    g.tracker.add(e.clientX, e.clientY);
    if (!g.axis) {
      if (Math.hypot(dx, dy) < 10) return; // hysteresis before committing to a direction
      g.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    }
    if (g.axis === 'x') {
      const min = -(items.length - 1) * width.current;
      let x = g.baseX + dx;
      if (x > 0) x = rubberband(x, width.current);
      else if (x < min) x = min - rubberband(min - x, width.current);
      xSpring.current!.set(x);
    } else {
      ySpring.current!.set(dy > 0 ? dy : -rubberband(-dy, height.current));
    }
  };
  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    gesture.current = null;
    const v = g.tracker.velocity();
    if (g.axis === 'x') {
      // Project where the flick is going, then snap to the nearest image from there (±1 per gesture).
      const projected = xSpring.current!.value + project(v.x);
      const nearest = Math.round(-projected / (width.current || 1));
      const from = indexRef.current;
      goTo(Math.max(from - 1, Math.min(from + 1, nearest)), v.x);
    } else if (g.axis === 'y') {
      const projected = ySpring.current!.value + project(v.y);
      if (projected > height.current * 0.35) {
        ySpring.current!.to(height.current, { velocity: v.y, response: 0.3, onRest: close });
      } else {
        ySpring.current!.to(0, { velocity: v.y });
      }
    }
  };

  const current = index === null ? null : items[index];

  return (
    <div>
      <ul role="list" className={single ? 'grid grid-cols-1' : 'grid grid-cols-1 gap-6 md:grid-cols-2'} aria-label={label}>
        {items.map((item, i) => (
          <li key={item.image}>
            <figure>
              <button
                ref={(el) => { triggerRefs.current[i] = el; }}
                type="button"
                onClick={() => open(i)}
                className="group relative block w-full text-left"
                aria-label={`Open image ${i + 1} of ${items.length}: ${item.caption}`}
              >
                <ResponsiveImage id={item.image} sizes={single ? '(min-width: 1440px) 1440px, 100vw' : '(min-width: 768px) 50vw, 100vw'} aspect={single ? undefined : '16 / 10'} decorative />
                <span className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center bg-onyx/85 text-ivory opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-visible:opacity-100">
                  <Icon as={Expand} size={16} />
                </span>
              </button>
              <figcaption className="t-caption text-2 mt-3">{item.caption}</figcaption>
            </figure>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        aria-label={`${label} — image viewer`}
        className="m-0 h-dvh max-h-none w-full max-w-none overflow-hidden bg-transparent p-0 text-ivory backdrop:bg-transparent"
        style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') { e.preventDefault(); goTo(indexRef.current + 1); }
          if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(indexRef.current - 1); }
        }}
      >
        <div ref={scrimRef} aria-hidden="true" className="absolute inset-0 bg-onyx" />
        {current && index !== null ? (
          <div className="relative flex h-full flex-col">
            <div className="wv-container flex items-center justify-between gap-4 py-4">
              <p className="t-meta text-platinum" aria-live="polite">Image {index + 1} of {items.length}</p>
              <button type="button" onClick={close} className="inline-flex min-h-11 items-center gap-2 px-2">
                <Icon as={X} size={20} />
                <span className="t-small">Close</span>
              </button>
            </div>
            <div
              ref={viewportRef}
              className="relative min-h-0 flex-1 cursor-grab touch-none select-none overflow-hidden active:cursor-grabbing"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              data-testid="gallery-viewport"
            >
              <div ref={trackRef} className="flex h-full will-change-transform">
                {items.map((item, i) => (
                  <figure key={item.image} className="flex h-full w-full shrink-0 flex-col items-center justify-center gap-4 px-[var(--wv-margin)]" aria-hidden={i !== index} inert={i !== index}>
                    <div className="relative min-h-0 w-full max-w-6xl flex-1">
                      <ResponsiveImage id={item.image} sizes="100vw" fit="contain" className="h-full !bg-transparent" aspect="auto" />
                    </div>
                    <figcaption className="t-small text-platinum max-w-[70ch] text-center">{item.caption}</figcaption>
                  </figure>
                ))}
              </div>
            </div>
            <div className="wv-container flex items-center justify-between gap-4 py-5">
              <button type="button" onClick={() => goTo(index - 1)} disabled={index === 0} className="inline-flex min-h-11 items-center gap-2 px-2 disabled:opacity-40">
                <Icon as={ArrowLeft} size={20} /> <span className="t-small">Previous</span>
              </button>
              <p className="t-caption text-platinum hidden sm:block">Swipe or use the arrow keys · swipe down to close</p>
              <button type="button" onClick={() => goTo(index + 1)} disabled={index === items.length - 1} className="inline-flex min-h-11 items-center gap-2 px-2 disabled:opacity-40">
                <span className="t-small">Next</span> <Icon as={ArrowRight} size={20} />
              </button>
            </div>
          </div>
        ) : null}
      </dialog>
    </div>
  );
}
export const galleryImageAlt = (id: ImageId) => images[id].alt;
