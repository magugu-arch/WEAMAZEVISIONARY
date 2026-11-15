import { Suspense, useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import { Header } from '@/components/navigation/Header';
import { Footer } from '@/components/navigation/Footer';
import { ConsentPanel } from '@/components/overlays/ConsentPanel';
import { initReveal } from '@/lib/reveal';
import { initParallaxFallback } from '@/lib/parallax';
import { SITE_ENV } from '@/lib/env';
import { ErrorBoundary } from './ErrorBoundary';

/** Pages whose first section is a full-bleed dark hero the header may float over. */
const OVERLAY_ROUTES = new Set(['/']);

export function Layout() {
  const location = useLocation();
  const overlay = OVERLAY_ROUTES.has(location.pathname);
  const [announcement, setAnnouncement] = useState('');
  const firstRender = useRef(true);

  // Client navigation: head sync, scroll restoration, focus to the new page heading, announcement.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
    } else {
      // Metadata (and the content it depends on) loads on demand, keeping it out of the initial bundle.
      void import('@/lib/seo').then(({ applyHead, resolveMeta }) => {
        const meta = resolveMeta(location.pathname);
        applyHead(meta);
        setAnnouncement(meta.title);
      });
      if (location.hash) {
        document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
      } else {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      }
      const h1 = document.querySelector<HTMLElement>('main h1');
      if (h1) {
        h1.setAttribute('tabindex', '-1');
        h1.focus({ preventScroll: true });
      }
    }
    let stopParallax = () => {};
    const raf = requestAnimationFrame(() => {
      initReveal();
      stopParallax = initParallaxFallback();
    });
    return () => {
      cancelAnimationFrame(raf);
      stopParallax();
    };
  }, [location.pathname, location.hash]);

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <Header overlay={overlay} />
      <main id="main" tabIndex={-1} className={overlay ? 'outline-none' : 'pt-[var(--wv-header-h)] outline-none'}>
        <ErrorBoundary key={location.pathname}>
          <Suspense fallback={<div className="min-h-[70svh]" aria-busy="true" />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
      {SITE_ENV !== 'production' ? (
        <p className="surface-dark t-caption border-t border-[color-mix(in_srgb,var(--color-ivory)_10%,transparent)] py-3 text-center text-platinum">
          Staging build · not indexed · content pending owner approval
        </p>
      ) : null}
      <div aria-live="polite" aria-atomic="true" className="sr-only">{announcement}</div>
      <ConsentPanel />
    </>
  );
}
