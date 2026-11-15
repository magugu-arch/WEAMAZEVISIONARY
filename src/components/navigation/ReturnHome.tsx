import { ArrowUp } from 'lucide-react';
import { useLocation } from 'react-router';
import { AppLink } from '@/components/ui/AppLink';
import { settings } from '@/content/settings';
import { Icon } from '@/lib/icon';

export const returnRow =
  'group flex w-full min-h-24 items-center justify-between gap-6 border-y border-[color-mix(in_srgb,var(--color-ivory)_10%,transparent)] py-6 text-left no-underline ' +
  'transition-[scale] duration-150 active:scale-[0.99] active:duration-0';
const key =
  'grid size-14 shrink-0 place-items-center border border-[color-mix(in_srgb,var(--color-ivory)_24%,transparent)] text-ivory ' +
  'wv-spring transition-[border-color,background-color] group-hover:border-ivory group-focus-visible:border-ivory group-active:bg-[color-mix(in_srgb,var(--color-ivory)_8%,transparent)]';

export function ReturnFace({ label }: { label: string }) {
  return (
    <>
      <span className="min-w-0">
        <span className="t-label block text-platinum">{settings.name}</span>
        <span className="t-display-3 relative mt-2 inline-block text-ivory">
          {label}
          {/* A gold hairline draws in under the words on hover: an accent on the dark surface, never text. */}
          <span aria-hidden="true" className="wv-spring absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-gold transition-transform group-hover:scale-x-100 group-focus-visible:scale-x-100" />
        </span>
      </span>
      <span aria-hidden="true" className={key}>
        {/* The arrow leans the way the page will move: up, towards the top and home. */}
        <Icon as={ArrowUp} size={22} className="wv-spring transition-transform group-hover:-translate-y-0.5 group-focus-visible:-translate-y-0.5" />
      </span>
    </>
  );
}

/**
 * The page's closing gesture, the last thing before the legal line on every page.
 * Elsewhere it returns home; on the home page there is nowhere further home to go, so it
 * returns to the top instead (smoothly, or instantly with reduced motion) and hands keyboard
 * focus back to the start of the content.
 */
export function ReturnHome() {
  const { pathname } = useLocation();
  if (pathname !== '/') {
    return (
      <AppLink to="/" className={returnRow} data-testid="return-home">
        <ReturnFace label="Return home" />
      </AppLink>
    );
  }
  const toTop = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, left: 0, behavior: reduce ? 'instant' as ScrollBehavior : 'smooth' });
    document.getElementById('main')?.focus({ preventScroll: true });
  };
  return (
    <button type="button" onClick={toTop} className={`${returnRow} cursor-pointer`} data-testid="return-home">
      <ReturnFace label="Back to top" />
    </button>
  );
}
