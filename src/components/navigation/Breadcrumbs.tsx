import { ChevronRight } from 'lucide-react';
import { Icon } from '@/lib/icon';
import { AppLink } from '@/components/ui/AppLink';

export type Crumb = { label: string; to: string };

/** Semantic breadcrumbs (V11.15). The current page is the last item, not a link. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="t-small text-2">
      <ol role="list" className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={c.to} className="flex items-center gap-2">
              {last ? (
                <span aria-current="page" className="text-current">{c.label}</span>
              ) : (
                <>
                  <AppLink to={c.to} className="inline-flex min-h-6 items-center underline-offset-4 hover:underline">{c.label}</AppLink>
                  <Icon as={ChevronRight} size={14} />
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
