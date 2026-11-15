import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { Icon } from '@/lib/icon';
import { cn } from '@/lib/cn';

export type AlertTone = 'info' | 'success' | 'warning' | 'error';
const ICONS = { info: Info, success: CheckCircle2, warning: AlertTriangle, error: XCircle } as const;

/** Inline status message. Tone is conveyed by icon + heading text, never colour alone. */
export function Alert({ tone = 'info', title, children, className, live = true, id }: { tone?: AlertTone; title: string; children?: ReactNode; className?: string; live?: boolean; id?: string }) {
  return (
    <div
      id={id}
      role={live ? (tone === 'error' ? 'alert' : 'status') : undefined}
      className={cn('flex gap-4 border p-4 md:p-5', tone === 'error' ? 'border-error' : 'border-rule-strong', className)}
    >
      <Icon as={ICONS[tone]} size={20} className={cn('mt-0.5', tone === 'error' ? 'text-error' : tone === 'success' ? 'text-gold' : '')} />
      <div className="min-w-0">
        <p className="font-medium">{title}</p>
        {children ? <div className="t-small text-2 mt-1.5 space-y-2">{children}</div> : null}
      </div>
    </div>
  );
}
