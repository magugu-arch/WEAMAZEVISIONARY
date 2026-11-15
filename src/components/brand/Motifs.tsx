import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { monogramPrimary } from './artwork.generated';

/** CI §11: spine angle 59.04° — rise 5 over run 3. All layout diagonals use this or the 68.20° arm angle. */
export const SPINE_RISE = 5;
export const SPINE_RUN = 3;

/**
 * Ascent line (CI §19): two spine-angle hairlines, one interval apart, rising
 * from a page edge. Use once per surface as a quiet signature.
 */
export function AscentLine({ className, height = 480, tone = 'gold' }: { className?: string; height?: number; tone?: 'gold' | 'onyx' }) {
  const run = (height * SPINE_RUN) / SPINE_RISE;
  const gap = height / 30; // one interval, scaled to the motif
  const stroke = tone === 'gold' ? 'var(--color-gold)' : 'var(--color-onyx)';
  return (
    <svg className={cn('pointer-events-none', className)} width={run + gap * 2} height={height} viewBox={`0 0 ${run + gap * 2} ${height}`} aria-hidden="true" focusable="false" preserveAspectRatio="xMinYMax meet">
      <line x1={0} y1={height} x2={run} y2={0} stroke={stroke} strokeWidth={1} vectorEffect="non-scaling-stroke" />
      <line x1={gap * 2} y1={height} x2={run + gap * 2} y2={0} stroke={stroke} strokeWidth={1} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/**
 * A decorative lane for one motif, kept clear of text by layout (its own grid
 * columns or band). The motif drifts with gentle depth inside it (motion.css);
 * the lane itself never moves, so the separation from text always holds.
 */
export function MotifLane({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div aria-hidden="true" data-motif-lane="" data-parallax-frame="" className={cn('pointer-events-none relative', className)}>
      <div data-parallax-layer="motif">{children}</div>
    </div>
  );
}

/** Echo field (CI §19): repeated spine-angle lines, Gold at 20–40% on Onyx, for large surfaces. */
export function EchoField({ className, opacity = 0.24, spacing = 28 }: { className?: string; opacity?: number; spacing?: number }) {
  const id = `echo-${spacing}`;
  return (
    <svg className={cn('pointer-events-none absolute inset-0 h-full w-full', className)} aria-hidden="true" focusable="false">
      <defs>
        {/* A vertical line rotated 30.96° clockwise rises left→right at the 59.04° spine angle. */}
        <pattern id={id} width={spacing} height={spacing} patternUnits="userSpaceOnUse" patternTransform={`rotate(${90 - 59.04})`}>
          <line x1={0.5} y1={0} x2={0.5} y2={spacing} stroke="var(--color-gold)" strokeWidth={1} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} opacity={opacity} />
    </svg>
  );
}

/** Datum rule (CI §19): hairline horizontal that organises sections and tables. */
export function DatumRule({ className, label, index }: { className?: string; label?: string; index?: string }) {
  if (!label && !index) return <hr className={cn('m-0 border-0 border-t border-rule', className)} />;
  return (
    <div className={cn('flex items-baseline gap-4 border-t border-rule pt-4', className)}>
      {index ? <span className="t-meta text-2">{index}</span> : null}
      {label ? <span className="t-label text-2">{label}</span> : null}
    </div>
  );
}

/**
 * Monogram supergraphic (CI §19): the primary-weight monogram at 300% or more,
 * cropped by the format edge. Never shares a crop with the wordmark.
 */
export function MonogramSupergraphic({ className, opacity = 1 }: { className?: string; opacity?: number }) {
  return (
    <svg viewBox={monogramPrimary.viewBox} width={monogramPrimary.width} height={monogramPrimary.height} className={cn('pointer-events-none', className)} aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid meet" style={{ opacity, aspectRatio: `${monogramPrimary.width} / ${monogramPrimary.height}` }}>
      {monogramPrimary.paths.map((p, i) => (
        <path key={i} d={p.d} fill="var(--color-gold)" />
      ))}
    </svg>
  );
}
