import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef } from 'react';
import { Link, NavLink } from 'react-router';
import { preloadPath } from '@/app/preload';

type Props = Omit<ComponentPropsWithoutRef<'a'>, 'href'> & { to: string };

/** Internal link that warms the destination route chunk on hover/focus/touch. */
export const AppLink = forwardRef<HTMLAnchorElement, Props>(function AppLink({ to, onPointerEnter, onFocus, onTouchStart, ...rest }, ref) {
  const isExternal = /^(https?:|mailto:|tel:)/.test(to);
  // Children arrive via ...rest.
  // eslint-disable-next-line jsx-a11y/anchor-has-content
  if (isExternal) return <a ref={ref} href={to} {...rest} />;
  return (
    <Link
      ref={ref}
      to={to}
      onPointerEnter={(e) => { preloadPath(to); onPointerEnter?.(e); }}
      onFocus={(e) => { preloadPath(to); onFocus?.(e); }}
      onTouchStart={(e) => { preloadPath(to); onTouchStart?.(e); }}
      {...rest}
    />
  );
});

export const AppNavLink = forwardRef<HTMLAnchorElement, Omit<Props, 'className'> & { className?: string | ((s: { isActive: boolean }) => string); end?: boolean }>(
  function AppNavLink({ to, className, end, onPointerEnter, onFocus, ...rest }, ref) {
    return (
      <NavLink
        ref={ref}
        to={to}
        end={end}
        className={className}
        onPointerEnter={(e) => { preloadPath(to); onPointerEnter?.(e); }}
        onFocus={(e) => { preloadPath(to); onFocus?.(e); }}
        {...rest}
      />
    );
  },
);
