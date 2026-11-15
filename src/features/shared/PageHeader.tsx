import type { ReactNode } from 'react';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import type { Crumb } from '@/components/navigation/Breadcrumbs';
import { Eyebrow } from '@/components/layout/Section';
import { cn } from '@/lib/cn';

/** Inner-page header: breadcrumbs, label, display H1, intro and optional actions. */
export function PageHeader({ crumbs, eyebrow, title, intro, children, className }: { crumbs?: Crumb[]; eyebrow?: string; title: ReactNode; intro?: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <header className={cn('surface-dark', className)} data-surface="dark">
      <div className="wv-container pb-16 pt-12 md:pb-24 md:pt-20">
        {crumbs && crumbs.length > 2 ? <Breadcrumbs items={crumbs} /> : null}
        {eyebrow ? <Eyebrow className={cn('text-gold', crumbs && crumbs.length > 2 ? 'mt-10' : '')}>{eyebrow}</Eyebrow> : null}
        <h1 className="t-display-1 mt-6 max-w-[16ch]">{title}</h1>
        {intro ? <div className="t-body-lg text-2 mt-8 max-w-[58ch]">{intro}</div> : null}
        {children ? <div className="mt-10">{children}</div> : null}
      </div>
    </header>
  );
}
