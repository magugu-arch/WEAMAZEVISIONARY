import { settings, type SocialNetwork } from '@/content/settings';

/**
 * The studio's own channels, as icon links (owner request, 27 Nov 2026: a monochrome YouTube
 * icon). Each network's mark is drawn exactly as the network publishes it, in one colour
 * only: the text colour of the surface it sits on. The outlines are Simple Icons' (CC0).
 */
const MARKS: Record<SocialNetwork, string> = {
  youtube:
    'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
};

/**
 * A row of 44 px targets holding 24 px marks. The negative start margin lines the first mark
 * up with the edge of whatever sits above it. Platinum at rest, Ivory on hover; on a press the
 * mark dips at once (touch-down, not release), and the global touch rule dims it on phones.
 */
export function SocialLinks({ className = '' }: { className?: string }) {
  if (!settings.social.length) return null;
  return (
    <ul role="list" aria-label={`${settings.name} elsewhere`} className={`-ms-2.5 flex items-center gap-2 ${className}`}>
      {settings.social.map((s) => (
        <li key={s.url}>
          <a
            href={s.url}
            rel="me noopener"
            data-testid={`social-${s.network}`}
            className="inline-flex size-11 items-center justify-center text-platinum transition-[color,transform] duration-150 ease-out hover:text-ivory active:scale-[0.92] active:duration-0 motion-reduce:active:scale-100"
          >
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true" focusable="false">
              <path d={MARKS[s.network]} />
            </svg>
            <span className="sr-only">{`${settings.name} on ${s.label}`}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
