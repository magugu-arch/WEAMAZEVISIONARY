import { horizontalCompact, horizontalPrimary, logoPrimary, monogramCompact, monogramMicro, monogramPrimary, serviceIcons } from './artwork.generated';
import type { Artwork, ServiceIconSlug } from './artwork.generated';
import { cn } from '@/lib/cn';

/**
 * Official artwork only (extracted byte-for-byte from the CI manual — see
 * public/brand/PROVENANCE.md). Colour variants follow CI §05, §08 and §09.
 * Optical weight is chosen by rendered size (CI §10, §13): micro 16–24 px,
 * compact 24–64 px, primary from 64 px.
 */
export type LogoTone =
  | 'light' // Gold mark, Onyx wordmark (on Ivory/white)
  | 'reversed' // Gold mark, Ivory wordmark (on Onyx/Graphite)
  | 'mono-onyx'
  | 'mono-ivory'
  | 'mono-gold';

const TONES: Record<LogoTone, { mark: string; word: string }> = {
  light: { mark: 'var(--color-gold)', word: 'var(--color-onyx)' },
  reversed: { mark: 'var(--color-gold)', word: 'var(--color-ivory)' },
  'mono-onyx': { mark: 'var(--color-onyx)', word: 'var(--color-onyx)' },
  'mono-ivory': { mark: 'var(--color-ivory)', word: 'var(--color-ivory)' },
  'mono-gold': { mark: 'var(--color-gold)', word: 'var(--color-gold)' },
};

type ArtProps = {
  art: Artwork;
  tone: LogoTone;
  /** Rendered height in CSS px. Width follows the artwork ratio — never stretched. */
  height: number;
  title?: string;
  decorative?: boolean;
  className?: string;
};

function ArtworkSvg({ art, tone, height, title = 'WeAmaze Visionary', decorative = false, className }: ArtProps) {
  const fills = TONES[tone];
  const width = Math.round((art.width / art.height) * height * 100) / 100;
  return (
    <svg
      viewBox={art.viewBox}
      width={width}
      height={height}
      className={cn('shrink-0', className)}
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : title}
      focusable="false"
    >
      {art.paths.map((p, i) => (
        <path key={i} d={p.d} fill={p.role === 'mark' ? fills.mark : fills.word} />
      ))}
    </svg>
  );
}

export type MonogramWeight = 'primary' | 'compact' | 'micro';
const MONOGRAMS: Record<MonogramWeight, Artwork> = { primary: monogramPrimary, compact: monogramCompact, micro: monogramMicro };

/** Picks the CI optical weight for a given rendered monogram height. */
export function weightForHeight(height: number): MonogramWeight {
  if (height < 24) return 'micro';
  if (height < 64) return 'compact';
  return 'primary';
}

export function Monogram({ height, tone = 'reversed', weight, ...rest }: { height: number; tone?: LogoTone; weight?: MonogramWeight; title?: string; decorative?: boolean; className?: string }) {
  return <ArtworkSvg art={MONOGRAMS[weight ?? weightForHeight(height)]} tone={tone} height={height} {...rest} />;
}

/** Horizontal lockup. Compact weight below 200 px wide (CI §07, §13); website header at 38 px height (CI §22). */
export function HorizontalLogo({ height, tone = 'reversed', ...rest }: { height: number; tone?: LogoTone; title?: string; decorative?: boolean; className?: string }) {
  const widthAtPrimary = (horizontalPrimary.width / horizontalPrimary.height) * height;
  const art = widthAtPrimary >= 200 ? horizontalPrimary : horizontalCompact;
  return <ArtworkSvg art={art} tone={tone} height={height} {...rest} />;
}

/** Stacked primary logo: monogram above two-line wordmark (CI §05). Minimum 120 px wide. */
export function PrimaryLogo({ height, tone = 'reversed', ...rest }: { height: number; tone?: LogoTone; title?: string; decorative?: boolean; className?: string }) {
  return <ArtworkSvg art={logoPrimary} tone={tone} height={height} {...rest} />;
}

/** CI §20 service icon. Icons describe services; never larger than the monogram on the same surface. */
export function ServiceIcon({ slug, size = 32, className }: { slug: ServiceIconSlug; size?: number; className?: string }) {
  const art = serviceIcons[slug];
  return (
    <svg viewBox={art.viewBox} width={size} height={size} className={cn('shrink-0', className)} aria-hidden="true" focusable="false">
      {art.paths.map((p, i) => (
        <path key={i} d={p.d} fill="currentColor" />
      ))}
    </svg>
  );
}
