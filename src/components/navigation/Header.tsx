import { useEffect, useId, useRef, useState } from 'react';
import { useLocation } from 'react-router';
import { ChevronDown, Menu } from 'lucide-react';
import { HorizontalLogo, Monogram, ServiceIcon } from '@/components/brand/Logo';
import { AppLink, AppNavLink } from '@/components/ui/AppLink';
import { ButtonLink } from '@/components/ui/Button';
import { primaryNav } from '@/content/navigation';
import { serviceIndex as publishedServices } from '@/content/serviceIndex';
import { Icon } from '@/lib/icon';
import { cn } from '@/lib/cn';
import { MobileDrawer } from './MobileDrawer';

/**
 * Global header (V10 §04, V11.15).
 *  - Compact horizontal lockup at 38 px on desktop; compact monogram at 26 px on mobile (CI §22).
 *  - Transparent over the hero only; becomes a stable Onyx surface after scroll with no layout shift.
 *  - Services disclosure works by click and keyboard, closes on Escape / outside click / focus out.
 */
export function Header({ overlay }: { overlay: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const panelId = useId();
  const menuBtn = useRef<HTMLButtonElement>(null);
  const menuWrap = useRef<HTMLLIElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close menus on route change.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync UI with navigation
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        menuBtn.current?.focus();
      }
    };
    const onPointer = (e: PointerEvent) => {
      if (menuWrap.current && !menuWrap.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [menuOpen]);

  const solid = !overlay || scrolled || menuOpen;
  const servicesActive = location.pathname.startsWith('/services');

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-[var(--z-header)] text-ivory transition-[background-color,border-color,backdrop-filter] duration-300',
        'border-b',
        !solid && 'border-transparent bg-transparent',
        // Scrolled: a restrained translucent Onyx material that content scrolls beneath (CI allows glass
        // only where it aids legibility). With a menu open it turns solid so translucent layers never stack.
        // prefers-reduced-transparency (.wv-glass) falls back to solid Onyx.
        solid && (menuOpen ? 'border-[color-mix(in_srgb,var(--color-ivory)_10%,transparent)] bg-onyx' : 'wv-glass border-[color-mix(in_srgb,var(--color-ivory)_10%,transparent)] bg-[color-mix(in_srgb,var(--color-onyx)_90%,transparent)] backdrop-blur-xl backdrop-saturate-150'),
      )}
    >
      {/* Scroll-edge gradient keeps the transparent header legible over the hero. */}
      {/* Calibrated like the hero scrim: nav text keeps ≥ 4.5:1 even over a white film frame. */}
      {!solid ? <div aria-hidden="true" data-header-scrim="" className="wv-header-scrim pointer-events-none absolute inset-x-0 top-0 -z-10 h-[calc(var(--wv-header-h)+64px+env(safe-area-inset-top))]" /> : null}
      <div className="wv-container flex h-[var(--wv-header-h)] items-center justify-between gap-6">
        {/* Clear space: X or 16 px, whichever is greater (CI §12). */}
        <AppLink to="/" className="-m-4 inline-flex items-center p-4" aria-label="WeAmaze Visionary — home">
          <span className="hidden lg:block"><HorizontalLogo height={38} tone="reversed" decorative /></span>
          <span className="lg:hidden"><Monogram height={26} tone="reversed" weight="compact" decorative /></span>
        </AppLink>

        <nav aria-label="Primary" className="hidden lg:block">
          <ul role="list" className="flex items-center gap-1 xl:gap-2">
            {primaryNav.map((item) =>
              'hasMenu' in item ? (
                <li key={item.to} ref={menuWrap} className="relative" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setMenuOpen(false); }}>
                  <button
                    ref={menuBtn}
                    type="button"
                    aria-expanded={menuOpen}
                    aria-controls={panelId}
                    onClick={() => setMenuOpen((o) => !o)}
                    onKeyDown={(e) => { if (e.key === 'ArrowDown') { e.preventDefault(); setMenuOpen(true); requestAnimationFrame(() => document.getElementById(panelId)?.querySelector('a')?.focus()); } }}
                    className={cn('t-nav inline-flex min-h-11 items-center gap-1.5 px-3', servicesActive && 'nav-active')}
                  >
                    {item.label}
                    <Icon as={ChevronDown} size={16} className={cn('wv-spring transition-transform', menuOpen && 'rotate-180')} />
                  </button>
                  <div
                    id={panelId}
                    hidden={!menuOpen}
                    className="fixed inset-x-0 top-[var(--wv-header-h)] z-[var(--z-dropdown)] border-b border-[color-mix(in_srgb,var(--color-ivory)_10%,transparent)] bg-onyx"
                  >
                    <div className="wv-container grid grid-cols-12 gap-6 py-10">
                      <div className="col-span-3">
                        <p className="t-label text-platinum">Services</p>
                        <p className="t-display-3 mt-4">One studio, eight capabilities.</p>
                        <AppLink to="/services" className="mt-6 inline-flex min-h-11 items-center border-b border-gold pb-0.5 font-medium">All services</AppLink>
                      </div>
                      <ul role="list" className="col-span-9 grid grid-cols-2 gap-x-6">
                        {publishedServices.map((s) => (
                          <li key={s.slug} className="border-t border-[color-mix(in_srgb,var(--color-ivory)_12%,transparent)]">
                            <AppLink to={`/services/${s.slug}`} className="group flex gap-4 py-4">
                              <ServiceIcon slug={s.slug} size={24} className="mt-0.5 text-gold" />
                              <span>
                                <span className="block font-medium group-hover:underline group-hover:underline-offset-4">{s.name}</span>
                                <span className="t-small mt-1 block text-platinum">{s.descriptor}</span>
                              </span>
                            </AppLink>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </li>
              ) : (
                <li key={item.to}>
                  <AppNavLink to={item.to} className={({ isActive }) => cn('t-nav inline-flex min-h-11 items-center px-3', isActive && 'nav-active')}>
                    {item.label}
                  </AppNavLink>
                </li>
              ),
            )}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          {/* Hidden on small screens, where the hero and drawer already carry the primary action. */}
          <span className="hidden sm:block">
            <ButtonLink to="/start-a-project" variant="secondary" size="sm" icon="none">Start a Project</ButtonLink>
          </span>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-expanded={drawerOpen}
            aria-controls="mobile-menu"
            className="t-nav -mr-2 inline-flex min-h-11 items-center gap-2 px-2 lg:hidden"
          >
            <Icon as={Menu} size={22} />
            <span>Menu</span>
          </button>
        </div>
      </div>
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </header>
  );
}
