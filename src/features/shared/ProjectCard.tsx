import { ResponsiveImage } from '@/components/media/ResponsiveImage';
import { AppLink } from '@/components/ui/AppLink';
import { StatusLabel } from '@/components/ui/StatusLabel';
import type { Project } from '@/content/types';
import { serviceName } from '@/content/serviceIndex';
import { cn } from '@/lib/cn';

/** Whole card is one link (no nested controls). Status label is text, not colour. */
export function ProjectCard({ project, variant = 'standard', headingLevel = 3, priority = false }: { project: Project; variant?: 'featured' | 'standard' | 'compact'; headingLevel?: 2 | 3; priority?: boolean }) {
  const H = headingLevel === 2 ? 'h2' : 'h3';
  const featured = variant === 'featured';
  return (
    <article className={cn('group relative', featured && 'lg:grid lg:grid-cols-12 lg:gap-6')}>
      <div className={cn(featured && 'lg:col-span-7')}>
        <ResponsiveImage
          id={project.heroImage}
          aspect={variant === 'compact' ? '4 / 3' : '16 / 10'}
          sizes={featured ? '(min-width: 1024px) 58vw, 100vw' : '(min-width: 1024px) 45vw, 100vw'}
          priority={priority}
          imgClassName="transition-transform duration-700 ease-out group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
      </div>
      <div className={cn('mt-6', featured && 'lg:col-span-5 lg:mt-0 lg:flex lg:flex-col lg:justify-end')}>
        <StatusLabel status={project.status} />
        <H className={cn('mt-5', featured ? 't-display-3' : 't-h3')}>
          <AppLink to={`/work/${project.slug}`} className="no-underline after:absolute after:inset-0 group-hover:underline group-hover:decoration-1 group-hover:underline-offset-[6px]">
            {project.title}
          </AppLink>
        </H>
        <p className="text-2 mt-3 max-w-[52ch]">{project.summary}</p>
        <p className="t-meta text-2 mt-5">
          {[project.film ? `Film ${project.film.durationLabel}` : null, project.year, ...project.services.map(serviceName)].filter(Boolean).join(' · ')}
        </p>
      </div>
    </article>
  );
}
