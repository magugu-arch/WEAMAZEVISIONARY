import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Icon } from '@/lib/icon';
import { AppLink } from './AppLink';

/** Quiet arrow link for "View case study", "Explore our approach" etc. */
export function TextLink({ to, children, className }: { to: string; children: ReactNode; className?: string }) {
  return (
    <AppLink to={to} className={cn('group/tl inline-flex min-h-11 items-center gap-2 font-medium no-underline', className)}>
      <span className="border-b border-rule-strong pb-0.5 transition-colors group-hover/tl:border-current">{children}</span>
      <Icon as={ArrowRight} size={18} className="transition-transform duration-300 group-hover/tl:translate-x-0.5 motion-reduce:transition-none" />
    </AppLink>
  );
}
