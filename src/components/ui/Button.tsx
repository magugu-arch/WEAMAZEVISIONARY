import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Icon } from '@/lib/icon';
import { AppLink } from './AppLink';
import { Spinner } from './Spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'quiet';
export type ButtonSize = 'md' | 'sm';

/**
 * CI: square corners, hairline borders, no shadows. One Gold primary per view.
 * On light surfaces the primary becomes Onyx (Gold is never text/fill on Ivory
 * for actions with text — CI §15 contrast table).
 * Press feedback is instant on pointer-down (scale 0.985, 100 ms).
 */
export function buttonClass(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', full = false) {
  return cn(
    'group/btn relative inline-flex select-none items-center justify-center gap-3 whitespace-nowrap font-medium',
    'transition-[background-color,border-color,color,scale] duration-150 ease-out active:scale-[0.985] active:duration-0',
    'disabled:cursor-not-allowed disabled:opacity-45 aria-disabled:cursor-not-allowed aria-disabled:opacity-45',
    size === 'md' ? 'min-h-12 px-6 text-[0.9375rem]' : 'min-h-10 px-4 text-sm',
    full && 'w-full',
    variant === 'primary' && 'btn-primary',
    variant === 'secondary' && 'border border-rule-strong hover:border-current',
    variant === 'quiet' && 'px-0 min-h-11 underline-offset-[0.3em] hover:underline',
  );
}

type CommonProps = { variant?: ButtonVariant; size?: ButtonSize; full?: boolean; icon?: 'arrow' | 'external' | 'none'; children: ReactNode; className?: string };

function Trailing({ icon }: { icon: CommonProps['icon'] }) {
  if (icon === 'none') return null;
  return (
    <Icon
      as={icon === 'external' ? ArrowUpRight : ArrowRight}
      size={18}
      className="transition-transform duration-300 ease-out group-hover/btn:translate-x-0.5 motion-reduce:transition-none"
    />
  );
}

export function ButtonLink({ to, variant = 'primary', size = 'md', full, icon = 'arrow', children, className, ...rest }: CommonProps & { to: string; onClick?: () => void; 'data-testid'?: string }) {
  return (
    <AppLink to={to} className={cn(buttonClass(variant, size, full), 'no-underline', className)} {...rest}>
      <span>{children}</span>
      <Trailing icon={icon} />
    </AppLink>
  );
}

export const Button = forwardRef<HTMLButtonElement, CommonProps & ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean; loadingLabel?: string }>(
  function Button({ variant = 'primary', size = 'md', full, icon = 'none', children, className, loading = false, loadingLabel, disabled, type = 'button', ...rest }, ref) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(buttonClass(variant, size, full), className)}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...rest}
      >
        {loading ? <Spinner /> : null}
        <span>{loading && loadingLabel ? loadingLabel : children}</span>
        {!loading ? <Trailing icon={icon} /> : null}
      </button>
    );
  },
);
