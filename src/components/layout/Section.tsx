import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type Surface = 'dark' | 'raised' | 'light';

export function Section({ children, surface = 'dark', className, id, labelledBy, as: As = 'section', spacing = 'default' }: { children: ReactNode; surface?: Surface; className?: string; id?: string; labelledBy?: string; as?: 'section' | 'div' | 'header' | 'aside'; spacing?: 'default' | 'tight' | 'none' }) {
  return (
    <As
      id={id}
      aria-labelledby={labelledBy}
      data-surface={surface === 'light' ? 'light' : 'dark'}
      className={cn(
        surface === 'light' ? 'surface-light' : surface === 'raised' ? 'surface-raised' : 'surface-dark',
        'relative',
        spacing === 'default' && 'py-24 md:py-32',
        spacing === 'tight' && 'py-16 md:py-24',
        className,
      )}
    >
      {children}
    </As>
  );
}

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('wv-container', className)}>{children}</div>;
}

/** Eyebrow / label above headings (CI: Geist Medium caps 11 px, +14%). */
export function Eyebrow({ children, className, index }: { children: ReactNode; className?: string; index?: string }) {
  return (
    <p className={cn('t-label flex items-center gap-3', className)}>
      {index ? <span className="t-meta normal-case tracking-normal text-accent">{index}</span> : null}
      <span>{children}</span>
    </p>
  );
}

/** Section heading block used across templates: eyebrow, display or UI heading, intro. */
export function SectionHeading({ id, eyebrow, index, title, intro, display = true, className, level = 2 }: { id?: string; eyebrow?: string; index?: string; title: ReactNode; intro?: ReactNode; display?: boolean; className?: string; level?: 1 | 2 }) {
  const H = level === 1 ? 'h1' : 'h2';
  return (
    <div className={cn('max-w-3xl', className)}>
      {eyebrow ? <Eyebrow index={index} className="text-2 mb-6">{eyebrow}</Eyebrow> : null}
      <H id={id} className={display ? 't-display-2' : 't-h2'}>{title}</H>
      {intro ? <div className="t-body-lg text-2 mt-6 max-w-[60ch]">{intro}</div> : null}
    </div>
  );
}
