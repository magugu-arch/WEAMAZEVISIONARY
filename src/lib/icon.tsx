import type { LucideIcon, LucideProps } from 'lucide-react';

/** lucide-react icon with CI geometry: square terminals, mitred joins, 1.25 stroke. */
export function Icon({ as: As, size = 20, ...rest }: { as: LucideIcon } & LucideProps) {
  return <As size={size} strokeWidth={1.25} strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true" focusable="false" {...rest} />;
}
