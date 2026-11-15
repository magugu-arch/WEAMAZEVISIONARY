import { useEffect } from 'react';
import { useParams } from 'react-router';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { Container, Section } from '@/components/layout/Section';
import { Gallery } from '@/components/media/Gallery';
import { ResponsiveImage } from '@/components/media/ResponsiveImage';
import { AppLink } from '@/components/ui/AppLink';
import { StatusLabel, statusDescription } from '@/components/ui/StatusLabel';
import { ShareBar } from '@/components/ui/ShareBar';
import { TextLink } from '@/components/ui/TextLink';
import { getProject, publishedProjects } from '@/content/projects';
import { getService, serviceName } from '@/content/services';
import { track } from '@/lib/analytics';
import { withStop } from '@/lib/format';
import { CtaBand } from '../shared/CtaBand';
import { ProjectCard } from '../shared/ProjectCard';
import NotFoundPage from '../not-found/NotFoundPage';
import { ProjectFilmPlayer } from './ProjectFilmPlayer';
import type { Project } from '@/content/types';

const tc = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/** The storyboard, uncropped and openable full screen, with its script and shots as readable text. */
function StoryboardSection({ project }: { project: Project }) {
  const { storyboard, film } = project;
  if (!storyboard) return null;
  return (
    <Section surface="light" labelledBy="storyboard-title">
      <Container>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <h2 id="storyboard-title" className="t-display-2">{storyboard.title}</h2>
          <p className="text-2 max-w-[52ch]">{storyboard.caption}</p>
        </div>
        <div className="mt-10">
          <Gallery single items={[{ image: storyboard.image, caption: `${storyboard.title}. Select to view full size.` }]} label={`${project.title} storyboard`} />
        </div>
        {film ? (
          <div className="mt-14 grid gap-12 border-t border-rule pt-10 lg:grid-cols-12 lg:gap-6">
            <div className="lg:col-span-5">
              <h3 className="t-label text-2">Script</h3>
              <ol role="list" className="mt-5 space-y-3">
                {film.script.map((l) => (
                  <li key={l.start} className="grid grid-cols-[3.25rem_1fr] gap-3">
                    <span className="t-meta text-2 pt-1">{tc(l.start)}</span>
                    <span className="t-body-lg">{l.line}</span>
                  </li>
                ))}
              </ol>
              <p className="t-caption text-2 mt-6 max-w-[48ch]">{film.scriptNote}</p>
            </div>
            <div className="lg:col-span-6 lg:col-start-7">
              <h3 className="t-label text-2">Shot by shot</h3>
              <ol role="list" className="mt-5 border-t border-rule">
                {film.shots.map((s) => (
                  <li key={s.start} className="grid grid-cols-[3.25rem_1fr] gap-3 border-b border-rule py-3">
                    <span className="t-meta text-2 pt-0.5">{tc(s.start)}</span>
                    <span className="t-small"><span className="font-medium">{withStop(s.title)}</span> <span className="text-2">{s.description}</span></span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        ) : null}
      </Container>
    </Section>
  );
}

/** Deliverables, the note on what is withheld, and any sourced outcome. */
function Facts({ project }: { project: Project }) {
  return (
    <>
      <div className="wv-grid gap-y-4 border-t border-rule pt-8">
        <h2 className="t-label text-2 col-span-4 md:col-span-8 lg:col-span-3">Deliverables</h2>
        <ul role="list" className="col-span-4 grid gap-x-6 md:col-span-8 md:grid-cols-2 lg:col-span-7">
          {project.deliverables.map((d) => <li key={d} className="border-b border-rule py-3">{d}</li>)}
        </ul>
      </div>
      {project.note ? (
        <div className="wv-grid gap-y-4 border-t border-rule pt-8">
          <h2 className="t-label text-2 col-span-4 md:col-span-8 lg:col-span-3">{project.note.title}</h2>
          <p className="t-body-lg col-span-4 border-l border-gold pl-5 md:col-span-8 lg:col-span-7">{project.note.text}</p>
        </div>
      ) : null}
      {project.outcome ? (
        <div className="wv-grid gap-y-4 border-t border-rule pt-8">
          <h2 className="t-label text-2 col-span-4 md:col-span-8 lg:col-span-3">Outcome</h2>
          <div className="col-span-4 md:col-span-8 lg:col-span-7"><p className="t-body-lg">{project.outcome.text}</p><p className="t-caption text-2 mt-3">Source: {project.outcome.source}</p></div>
        </div>
      ) : null}
    </>
  );
}

/** The idea in one line: an editorial pause that opens the story. */
function Statement({ project }: { project: Project }) {
  const { statement } = project;
  if (!statement) return null;
  return (
    <div className="wv-grid gap-y-6 pb-4">
      <p className="t-label text-2 col-span-4 md:col-span-8 lg:col-span-3 lg:pt-5">
        <span aria-hidden="true" className="mb-5 block h-px w-12 bg-gold" />
        {statement.label}
      </p>
      <h2 id="statement-title" className="t-display-1 col-span-4 max-w-[16ch] text-balance md:col-span-8 lg:col-span-9">{statement.text}</h2>
    </div>
  );
}

/** A few numbered principles: how the work holds together, readable at a glance. */
function PrinciplesSection({ project }: { project: Project }) {
  const { principles } = project;
  if (!principles?.items.length) return null;
  return (
    <Section surface="raised" labelledBy="principles-title">
      <Container>
        <h2 id="principles-title" className="t-display-2 max-w-[20ch]">{principles.title}</h2>
        <ol role="list" className="mt-14 grid gap-x-6 gap-y-12 md:grid-cols-2 lg:grid-cols-4">
          {principles.items.map((item, i) => (
            <li key={item.title} className="border-t border-rule-strong pt-6">
              <p aria-hidden="true" className="t-meta text-accent">{String(i + 1).padStart(2, '0')}</p>
              <h3 className="t-h3 mt-4">{item.title}</h3>
              <p className="t-small text-2 mt-3">{item.text}</p>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}

/** One image shown whole, at its own proportions, on a light band; it opens full screen. */
function FeatureSection({ project }: { project: Project }) {
  const { feature } = project;
  if (!feature) return null;
  return (
    <Section surface="light" labelledBy="feature-title">
      <Container>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <h2 id="feature-title" className="t-display-2 max-w-[18ch]">{feature.title}</h2>
          <p className="text-2 max-w-[52ch]">{feature.caption}</p>
        </div>
        <div className="mt-10">
          <Gallery single items={[{ image: feature.image, caption: `${feature.title}. Select to view full size.` }]} label={`${project.title}: ${feature.title}`} />
        </div>
      </Container>
    </Section>
  );
}

function Story({ title, paras }: { title: string; paras: string[] }) {
  if (!paras.length) return null;
  return (
    <div className="wv-grid gap-y-4 border-t border-rule pt-8">
      <h2 className="t-label text-2 col-span-4 md:col-span-8 lg:col-span-3">{title}</h2>
      <div className="col-span-4 space-y-5 md:col-span-8 lg:col-span-7">
        {paras.map((p, i) => <p key={i} className="t-body-lg">{p}</p>)}
      </div>
    </div>
  );
}

export default function CaseStudyPage() {
  const { slug = '' } = useParams();
  const project = getProject(slug);
  useEffect(() => {
    if (project) track({ name: 'project_view', props: { project_slug: project.slug, project_status: project.status } });
  }, [project]);
  if (!project) return <NotFoundPage />;
  const related = publishedProjects.filter((p) => p.slug !== project.slug).slice(0, 2);
  const editorial = Boolean(project.principles?.items.length);

  return (
    <>
      <header className="surface-dark" data-surface="dark">
        <div className="wv-container pb-12 pt-12 md:pt-20">
          <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Work', to: '/work' }, { label: project.title, to: `/work/${project.slug}` }]} />
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <StatusLabel status={project.status} />
            <p className="t-small text-2">{statusDescription(project)}</p>
          </div>
          <h1 className="t-display-1 mt-8 max-w-[18ch]">{project.title}</h1>
          <p className="t-body-lg text-2 mt-8 max-w-[58ch]">{project.summary}</p>
          <dl className="mt-14 grid gap-6 border-t border-rule pt-8 sm:grid-cols-2 lg:grid-cols-4">
            {project.year ? <div><dt className="t-label text-2">Year</dt><dd className="t-meta mt-2 text-ivory">{project.year}</dd></div> : project.film ? <div><dt className="t-label text-2">Format</dt><dd className="mt-2">{project.film.format}</dd></div> : null}
            <div><dt className="t-label text-2">Sector</dt><dd className="mt-2">{project.sector}</dd></div>
            <div>
              <dt className="t-label text-2">Capabilities</dt>
              <dd className="mt-2">
                <ul role="list">{project.services.map((s) => <li key={s}>{getService(s) ? <AppLink to={`/services/${s}`} className="underline-offset-4 hover:underline">{serviceName(s)}</AppLink> : serviceName(s)}</li>)}</ul>
              </dd>
            </div>
            <div><dt className="t-label text-2">Scope</dt><dd className="t-small mt-2">{project.scope}</dd></div>
          </dl>
        </div>
      </header>

      <div className="surface-dark">
        <div className="wv-container">
          {/* A film case study leads with the film itself; others with their hero image. */}
          {project.film ? <ProjectFilmPlayer film={project.film} /> : <ResponsiveImage id={project.heroImage} sizes="(min-width: 1440px) 1440px, 100vw" aspect="16 / 9" priority parallax />}
        </div>
      </div>

      <Section>
        <Container className="space-y-16">
          <Statement project={project} />
          <Story title="Context" paras={project.context} />
          <Story title="Challenge" paras={project.challenge} />
          <Story title="Insight" paras={project.insight} />
          <Story title="Idea" paras={project.idea} />
          <Story title="Execution" paras={project.execution} />
          {editorial ? null : <Facts project={project} />}
        </Container>
      </Section>

      {editorial ? (
        <>
          <PrinciplesSection project={project} />
          <FeatureSection project={project} />
          <Section spacing="tight">
            <Container className="space-y-16"><Facts project={project} /></Container>
          </Section>
        </>
      ) : null}

      <StoryboardSection project={project} />

      <Section surface="raised" labelledBy="gallery-title" spacing="tight">
        <Container>
          <h2 id="gallery-title" className="t-h2 mb-10">From the work</h2>
          <Gallery items={project.gallery} label={`${project.title} images`} />
        </Container>
      </Section>

      <Section spacing="tight">
        <Container>
          <div className="wv-grid gap-y-4 border-t border-rule pt-8">
            <h2 className="t-label text-2 col-span-4 md:col-span-8 lg:col-span-3">Credits</h2>
            <dl className="col-span-4 md:col-span-8 lg:col-span-7">
              {project.credits.map((c) => (
                <div key={c.role} className="grid gap-1 border-b border-rule py-3 sm:grid-cols-2"><dt className="text-2">{c.role}</dt><dd>{c.name}</dd></div>
              ))}
            </dl>
          </div>
          <div className="mt-12 border-t border-rule pt-8"><ShareBar title={`${project.title} — WeAmaze Visionary`} path={`/work/${project.slug}`} /></div>
          {related.length ? (
            <div className="mt-24">
              <div className="flex items-end justify-between gap-6">
                <h2 className="t-h2">More work</h2>
                <TextLink to="/work">All work</TextLink>
              </div>
              <div className="mt-10 grid gap-16 lg:grid-cols-2 lg:gap-6">{related.map((p) => <ProjectCard key={p.slug} project={p} />)}</div>
            </div>
          ) : null}
        </Container>
      </Section>
      <CtaBand />
    </>
  );
}
