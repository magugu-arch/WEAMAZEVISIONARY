import { useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { RotateCcw } from 'lucide-react';
import { Container, Section } from '@/components/layout/Section';
import { ButtonLink } from '@/components/ui/Button';
import { STATUS_DESCRIPTIONS, STATUS_LABELS } from '@/components/ui/StatusLabel';
import { publishedProjects } from '@/content/projects';
import { serviceIndex as publishedServices } from '@/content/serviceIndex';
import type { ProjectStatus } from '@/content/types';
import { track } from '@/lib/analytics';
import { Icon } from '@/lib/icon';
import { cn } from '@/lib/cn';
import { CtaBand } from '../shared/CtaBand';
import { ProjectCard } from '../shared/ProjectCard';
import { PageHeader } from '../shared/PageHeader';

const STATUSES = Object.keys(STATUS_LABELS) as ProjectStatus[];

/** Work index with keyboard-accessible filters, URL state, announced counts and an empty state (V11.03). */
export default function WorkPage() {
  const [params, setParams] = useSearchParams();
  const service = params.get('service');
  const status = params.get('status') as ProjectStatus | null;
  const results = useMemo(
    () => publishedProjects.filter((p) => (!service || p.services.includes(service as never)) && (!status || p.status === status)),
    [service, status],
  );
  const servicesWithWork = publishedServices.filter((s) => publishedProjects.some((p) => p.services.includes(s.slug)));
  const set = (key: 'service' | 'status', value: string | null) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next, { replace: true, preventScrollReset: true });
    const count = publishedProjects.filter((p) => {
      const sv = key === 'service' ? value : service;
      const st = key === 'status' ? value : status;
      return (!sv || p.services.includes(sv as never)) && (!st || p.status === st);
    }).length;
    track({ name: 'work_filter_change', props: { filter_type: key, filter_value: value ?? 'all', result_count: count } });
  };
  const reset = () => setParams(new URLSearchParams(), { replace: true, preventScrollReset: true });
  const chip = (active: boolean, disabled = false) =>
    cn('t-small inline-flex min-h-11 items-center gap-2 border px-4 transition-colors', active ? 'border-ivory bg-ivory text-onyx' : 'border-rule-strong hover:border-ivory', disabled && 'cursor-not-allowed opacity-40 hover:border-rule-strong');

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Work', to: '/work' }]}
        eyebrow="Work"
        title="Selected work"
        intro="Every project is labelled so you know exactly what you are looking at: client work published with permission, a concept created by the studio, or a demonstration of how we would approach a type of work."
      />
      <Section spacing="tight" className="pt-0 md:pt-0">
        <Container>
          <div className="border-y border-rule py-6" role="group" aria-labelledby="filter-title">
            <h2 id="filter-title" className="sr-only">Filter work</h2>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-12">
              <fieldset className="min-w-0">
                <legend className="t-label text-2 mb-3">Capability</legend>
                <div className="flex flex-wrap gap-2">
                  <button type="button" aria-pressed={!service} className={chip(!service)} onClick={() => set('service', null)}>All</button>
                  {servicesWithWork.map((s) => (
                    <button key={s.slug} type="button" aria-pressed={service === s.slug} className={chip(service === s.slug)} onClick={() => set('service', service === s.slug ? null : s.slug)}>
                      {s.shortName}
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset className="min-w-0">
                <legend className="t-label text-2 mb-3">Label</legend>
                <div className="flex flex-wrap gap-2">
                  <button type="button" aria-pressed={!status} className={chip(!status)} onClick={() => set('status', null)}>All</button>
                  {STATUSES.map((st) => {
                    const count = publishedProjects.filter((p) => p.status === st).length;
                    return (
                      <button key={st} type="button" aria-pressed={status === st} disabled={count === 0} className={chip(status === st, count === 0)} onClick={() => set('status', status === st ? null : st)} title={STATUS_DESCRIPTIONS[st]}>
                        {STATUS_LABELS[st]} <span className="t-meta">({count})</span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            </div>
            <div className="mt-6 flex items-center justify-between gap-4">
              <p className="t-meta text-2" aria-live="polite" aria-atomic="true">
                Showing {results.length} of {publishedProjects.length} {publishedProjects.length === 1 ? 'project' : 'projects'}
              </p>
              {service || status ? (
                <button type="button" onClick={reset} className="t-small inline-flex min-h-11 items-center gap-2 underline-offset-4 hover:underline">
                  <Icon as={RotateCcw} size={16} /> Clear filters
                </button>
              ) : null}
            </div>
          </div>

          {results.length ? (
            <ul role="list" className="mt-16 grid gap-x-6 gap-y-20 lg:grid-cols-2">
              {results.map((p, i) => <li key={p.slug}><ProjectCard project={p} headingLevel={2} priority={i === 0} /></li>)}
            </ul>
          ) : (
            <div className="mt-16 max-w-xl border border-rule p-8">
              <h2 className="t-h3">No work matches these filters yet.</h2>
              <p className="text-2 mt-3">Clear the filters to see everything, or tell us about your project and we will show you relevant thinking in a conversation.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button type="button" onClick={reset} className="inline-flex min-h-12 items-center border border-rule-strong px-6 font-medium">Clear filters</button>
                <ButtonLink to="/start-a-project" variant="secondary">Start a Project</ButtonLink>
              </div>
            </div>
          )}

          <dl className="mt-24 grid gap-6 border-t border-rule pt-10 md:grid-cols-2 lg:grid-cols-4">
            {STATUSES.map((st) => (
              <div key={st}>
                <dt className="t-label">{STATUS_LABELS[st]}</dt>
                <dd className="t-small text-2 mt-2">{STATUS_DESCRIPTIONS[st]}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </Section>
      <CtaBand />
    </>
  );
}
