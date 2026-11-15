import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';
import { X } from 'lucide-react';
import { Monogram } from '@/components/brand/Logo';
import { AppLink, AppNavLink } from '@/components/ui/AppLink';
import { ButtonLink } from '@/components/ui/Button';
import { primaryNav } from '@/content/navigation';
import { serviceIndex as publishedServices } from '@/content/serviceIndex';
import { settings } from '@/content/settings';
import { Icon } from '@/lib/icon';
import { cn } from '@/lib/cn';
import { useScrollLock } from '@/lib/hooks';
import { project, rubberband, Spring, VelocityTracker } from '@/lib/spring';

/**
 * Mobile navigation drawer on the native modal <dialog>: focus is contained,
 * Escape closes, focus returns to the trigger, background scroll is locked,
 * safe areas are respected. Enters and exits along the same path (right edge),
 * and a close requested mid-animation simply reverses it.
 *
 * Touch: swipe right to dismiss. The panel tracks the finger 1:1, resists a
 * leftward pull, and on release projects the flick's momentum: past 40% of the
 * width it closes with the finger's velocity, otherwise it springs home.
 */
export function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [shown, setShown] = useState(false);
  const location = useLocation();
  const opener = useRef<Element | null>(null);
  useScrollLock(open);

  const drag = useRef<{ id: number; x: number; y: number; axis: 'x' | 'y' | null; tracker: VelocityTracker } | null>(null);
  const suppressClick = useRef(false);
  const spring = useRef<Spring | null>(null);
  useEffect(() => {
    spring.current = new Spring(0, (v) => { if (ref.current) ref.current.style.translate = `${v}px 0`; });
    return () => spring.current?.stop();
  }, []);
  const release = () => {
    const el = ref.current;
    if (!el) return;
    el.style.translate = '';
    el.style.transition = '';
  };
  const onPointerDown = (e: React.PointerEvent<HTMLDialogElement>) => {
    if (e.pointerType === 'mouse') return;
    spring.current!.stop();
    const tracker = new VelocityTracker();
    tracker.add(e.clientX, e.clientY);
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, axis: null, tracker };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDialogElement>) => {
    const d = drag.current;
    const el = ref.current;
    if (!d || d.id !== e.pointerId || !el) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    d.tracker.add(e.clientX, e.clientY);
    if (!d.axis) {
      if (Math.hypot(dx, dy) < 10) return;
      d.axis = Math.abs(dx) > Math.abs(dy) * 1.2 ? 'x' : 'y';
      if (d.axis === 'x') { el.style.transition = 'none'; el.setPointerCapture(e.pointerId); }
    }
    if (d.axis !== 'x') return;
    suppressClick.current = true;
    spring.current!.set(dx >= 0 ? dx : -rubberband(-dx, el.clientWidth, 0.25));
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDialogElement>) => {
    const d = drag.current;
    const el = ref.current;
    drag.current = null;
    if (!d || d.id !== e.pointerId || d.axis !== 'x' || !el) return;
    const v = d.tracker.velocity().x;
    const w = el.clientWidth;
    if (spring.current!.value + project(v) > w * 0.4) {
      spring.current!.to(w, { velocity: v, response: 0.3, onRest: () => { onClose(); requestAnimationFrame(release); } });
    } else {
      spring.current!.to(0, { velocity: v, onRest: release });
    }
    window.setTimeout(() => { suppressClick.current = false; }, 0);
  };

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (open) {
      opener.current = document.activeElement;
      if (!dlg.open) dlg.showModal();
      const id = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(id);
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- drive exit transition
    setShown(false);
    const t = window.setTimeout(() => {
      if (dlg.open) dlg.close();
      (opener.current as HTMLElement | null)?.focus?.();
    }, 380);
    return () => window.clearTimeout(t);
  }, [open]);

  // Selecting a route closes the drawer.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    // Backdrop click closes; Escape (onCancel) is the keyboard equivalent.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={ref}
      id="mobile-menu"
      aria-label="Menu"
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
      onClickCapture={(e) => { if (suppressClick.current) { e.preventDefault(); e.stopPropagation(); suppressClick.current = false; } }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className={cn(
        'fixed inset-0 m-0 ml-auto h-dvh max-h-none w-full max-w-md touch-pan-y overflow-y-auto overscroll-contain bg-onyx p-0 text-ivory',
        'backdrop:bg-onyx/70 backdrop:transition-opacity',
        'wv-spring transition-[translate,opacity]',
        shown ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 motion-reduce:translate-x-0',
      )}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)', paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="flex min-h-full flex-col px-[var(--wv-margin)]">
        <div className="flex h-[var(--wv-header-h)] items-center justify-between">
          <Monogram height={26} tone="reversed" weight="compact" title="WeAmaze Visionary" />
          <button type="button" onClick={onClose} className="-mr-2 inline-flex min-h-11 items-center gap-2 px-2">
            <Icon as={X} size={22} />
            <span className="t-nav">Close</span>
          </button>
        </div>
        <nav aria-label="Primary" className="mt-6">
          <ul role="list" className="border-t border-[color-mix(in_srgb,var(--color-ivory)_12%,transparent)]">
            {primaryNav.map((item) => (
              <li key={item.to} className="border-b border-[color-mix(in_srgb,var(--color-ivory)_12%,transparent)]">
                <AppNavLink
                  to={item.to}
                  end={item.to === '/services'}
                  className={({ isActive }) => cn('t-display-3 flex min-h-16 items-center py-3', isActive && 'text-gold')}
                >
                  {item.label === 'Services' ? 'All services' : item.label}
                </AppNavLink>
                {'hasMenu' in item ? (
                  <ul role="list" className="pb-4">
                    {publishedServices.map((s) => (
                      <li key={s.slug}>
                        <AppLink to={`/services/${s.slug}`} className="t-small flex min-h-11 items-center text-platinum hover:text-ivory">
                          {s.name}
                        </AppLink>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-8 flex flex-col gap-3">
          <ButtonLink to="/start-a-project" full>Start a Project</ButtonLink>
          <ButtonLink to="/book-a-call" variant="secondary" full icon="none">Book a discovery call</ButtonLink>
        </div>
        <p className="t-label mt-auto py-8 text-platinum">{settings.tagline}</p>
      </div>
    </dialog>
  );
}
