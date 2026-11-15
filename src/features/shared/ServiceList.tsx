import { ArrowRight } from 'lucide-react';
import { ServiceIcon } from '@/components/brand/Logo';
import { AppLink } from '@/components/ui/AppLink';
import { serviceIndex as publishedServices } from '@/content/serviceIndex';
import { pad2 } from '@/lib/format';
import { Icon } from '@/lib/icon';
import { cn } from '@/lib/cn';

/** Editorial capability index: eight descriptive links, no sub-brand logos or colour coding (CI §18). */
export function ServiceList({ columns = 2, headingLevel = 3 }: { columns?: 1 | 2; headingLevel?: 2 | 3 }) {
  const H = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <ul role="list" className={cn('grid border-t border-rule', columns === 2 && 'lg:grid-cols-2 lg:gap-x-6 lg:border-t-0')}>
      {publishedServices.map((s, i) => (
        <li key={s.slug} className={cn('border-b border-rule', columns === 2 && i < 2 && 'lg:border-t')}>
          <AppLink to={`/services/${s.slug}`} className="group grid grid-cols-[auto_1fr_auto] items-start gap-x-5 gap-y-2 py-7 no-underline md:gap-x-8 md:py-8">
            <span className="t-meta text-2 pt-1.5">{pad2(i + 1)}</span>
            <span className="min-w-0">
              <H className="t-h3 flex items-center gap-3">
                <ServiceIcon slug={s.slug} size={24} className="shrink-0" />
                <span className="group-hover:underline group-hover:decoration-1 group-hover:underline-offset-[6px]">{s.name}</span>
              </H>
              <span className="text-2 mt-2 block max-w-[46ch]">{s.descriptor}</span>
            </span>
            <Icon as={ArrowRight} size={20} className="mt-1 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none" />
          </AppLink>
        </li>
      ))}
    </ul>
  );
}
