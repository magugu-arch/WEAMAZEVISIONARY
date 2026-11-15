import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import { Plus } from 'lucide-react';
import { Icon } from '@/lib/icon';
import { cn } from '@/lib/cn';

export type AccordionItem = { id: string; title: string; content: ReactNode };

/**
 * Disclosure list (button + region, aria-expanded). Height animates with a
 * grid-rows transition, which is interruptible; reduced motion cross-fades.
 */
export function Accordion({ items, headingLevel = 3, multiple = true, className }: { items: AccordionItem[]; headingLevel?: 2 | 3 | 4; multiple?: boolean; className?: string }) {
  const [open, setOpen] = useState<string[]>([]);
  const base = useId();
  const H = `h${headingLevel}` as 'h2' | 'h3' | 'h4';
  const toggle = (id: string) =>
    setOpen((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : multiple ? [...cur, id] : [id]));
  return (
    <div className={cn('border-t border-rule', className)}>
      {items.map((item) => {
        const isOpen = open.includes(item.id);
        const btnId = `${base}-${item.id}-btn`;
        const panelId = `${base}-${item.id}-panel`;
        return (
          <div key={item.id} className="border-b border-rule">
            <H className="m-0">
              <button
                id={btnId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(item.id)}
                className="group flex w-full items-center justify-between gap-6 py-5 text-left font-medium md:py-6 md:text-lg"
              >
                <span>{item.title}</span>
                <Icon as={Plus} size={20} className={cn('wv-spring shrink-0 transition-transform', isOpen && 'rotate-45')} />
              </button>
            </H>
            <div
              id={panelId}
              role="region"
              aria-labelledby={btnId}
              className={cn('wv-spring grid transition-[grid-template-rows,opacity]', isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}
              inert={!isOpen}
            >
              <div className="overflow-hidden">
                <div className="text-2 max-w-[68ch] pb-6 pr-10 leading-relaxed">{item.content}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
