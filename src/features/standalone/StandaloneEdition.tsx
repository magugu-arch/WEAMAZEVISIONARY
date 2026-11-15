import { HorizontalLogo, Monogram, PrimaryLogo, ServiceIcon } from '@/components/brand/Logo';
import { AscentLine, MonogramSupergraphic, MotifLane } from '@/components/brand/Motifs';
import { ReturnFace, returnRow } from '@/components/navigation/ReturnHome';
import { statusDescription, STATUS_LABELS } from '@/components/ui/StatusLabel';
import { images } from '@/content/media.generated';
import type { ImageId } from '@/content/media.generated';
import { applications, approachStages, collaboration, hero, humanLedAi, philosophy } from '@/content/pages';
import { publishedProjects } from '@/content/projects';
import { publishedInsights, readingMinutes } from '@/content/insights';
import { publishedServices, serviceName } from '@/content/services';
import { publicEmail, settings } from '@/content/settings';
import { studioFilm } from '@/content/film';
import type { InsightBlock } from '@/content/types';
import { pad2, withStop } from '@/lib/format';

/**
 * The offline edition: one self-contained HTML document (see scripts/standalone.mjs)
 * that reads as the full studio story on any phone or desktop — including inside
 * WhatsApp's document viewer and iOS Quick Look, where scripts may not run.
 *
 * Rules for this file:
 *  - Everything works with JavaScript off: native <details> accordions, native
 *    scroll-snap galleries (momentum and rubber-banding come from the OS), a
 *    <video> with poster and native controls. Script only adds polish.
 *  - Only in-page anchors. No links to routes that need the server.
 *  - Images are single, embedded WebP files with intrinsic sizes and alt text.
 */
const img = (id: ImageId, w = 768) => {
  const i = images[id];
  const width = [...i.widths].reverse().find((x) => x <= w) ?? i.widths[0]!;
  return { src: `/images/${i.id}-${width}.webp`, width, height: Math.round((i.height / i.width) * width), alt: i.alt, focal: i.focal };
};
function Picture({ id, w, className = '', ratio, eager = false, alt, parallax = false }: { id: ImageId; w?: number; className?: string; ratio?: string; eager?: boolean; alt?: string; parallax?: boolean }) {
  const m = img(id, w);
  const image = <img src={m.src} width={m.width} height={m.height} alt={alt ?? m.alt} loading={eager ? 'eager' : 'lazy'} decoding="async" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: `${m.focal[0] * 100}% ${m.focal[1] * 100}%` }} />;
  return (
    <div className={`relative overflow-hidden bg-onyx-raised ${className}`} style={{ aspectRatio: ratio ?? `${m.width} / ${m.height}` }} data-parallax-frame={parallax ? '' : undefined}>
      {/* Parallax is pure CSS (scroll timelines), so it also runs where scripts cannot. */}
      {parallax ? <div data-parallax-layer="media">{image}</div> : image}
    </div>
  );
}
function Text({ blocks }: { blocks: InsightBlock[] }) {
  const strip = (t: string) => t.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  return (
    <div className="prose-wv">
      {blocks.map((b, i) =>
        b.type === 'p' ? <p key={i}>{strip(b.text)}</p>
        : b.type === 'h2' ? <h4 key={i} className="t-h3 mt-8">{b.text}</h4>
        : b.type === 'h3' ? <h5 key={i} className="font-medium">{b.text}</h5>
        : b.type === 'ul' ? <ul key={i}>{b.items.map((x, j) => <li key={j}>{strip(x)}</li>)}</ul>
        : b.type === 'ol' ? <ol key={i} className="list-decimal pl-5">{b.items.map((x, j) => <li key={j}>{strip(x)}</li>)}</ol>
        : <aside key={i} className="border-l border-gold py-1 pl-6"><p className="t-label text-2">{b.title}</p><p className="mt-2">{strip(b.text)}</p></aside>,
      )}
    </div>
  );
}

const NAV = [['Services', '#services'], ['Work', '#work'], ['Approach', '#approach'], ['Studio', '#studio'], ['Insights', '#insights'], ['Contact', '#next-steps']] as const;

export function StandaloneEdition({ generatedOn, preview }: { generatedOn: string; preview: boolean }) {
  const email = publicEmail();
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <header data-sa-header className="wv-glass sticky top-0 z-[var(--z-header)] border-b border-[color-mix(in_srgb,var(--color-ivory)_10%,transparent)] bg-[color-mix(in_srgb,var(--color-onyx)_92%,transparent)] text-ivory backdrop-blur-xl backdrop-saturate-150" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="wv-container flex h-16 items-center justify-between gap-6 lg:h-[76px]">
          <a href="#top" className="inline-flex min-h-11 min-w-11 shrink-0 items-center" aria-label="WeAmaze Visionary — back to top">
            <span className="hidden lg:block"><HorizontalLogo height={34} decorative /></span>
            <span className="lg:hidden"><Monogram height={26} weight="compact" decorative /></span>
          </a>
          <nav aria-label="Sections" className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-none">
            <ul role="list" className="flex gap-1 lg:justify-end">
              {NAV.map(([l, h]) => <li key={h}><a href={h} className="t-nav inline-flex min-h-11 items-center whitespace-nowrap px-3 no-underline hover:underline hover:underline-offset-8">{l}</a></li>)}
            </ul>
          </nav>
        </div>
      </header>

      <main id="main">
        {/* Hero: works without JS — native autoplay (muted, inline) where allowed, poster otherwise, native controls to pause. */}
        <section id="top" aria-labelledby="hero-title" className="surface-dark relative overflow-clip" data-surface="dark">
          <div className="relative">
            {/*
              The studio film has its own window at every width and the copy follows on plain Onyx,
              so nothing covers the film or its native controls. Without script (WhatsApp's viewer,
              iOS Quick Look) it is a poster with native controls: tap to play, with sound. With
              script, and when motion is welcome, it plays as a muted ambient loop with "Watch
              with sound" and Pause controls. The film layer drifts by CSS alone.
            */}
            <div className="relative aspect-square max-h-[56svh] w-full overflow-hidden bg-black md:aspect-video lg:aspect-[21/9] lg:max-h-[72svh]" data-parallax-frame="">
              <div data-parallax-layer="hero">
                <video
                  data-sa-film
                  className="sa-film absolute inset-0 h-full w-full object-cover"
                  src={studioFilm.media.compact.mp4}
                  poster={`${studioFilm.media.poster.desktop}.webp`}
                  controls
                  playsInline
                  preload="metadata"
                  data-duration={studioFilm.durationLabel}
                  aria-label={`${studioFilm.title}, ${studioFilm.durationLabel}`}
                  aria-describedby="studio-film-description"
                >
                  <track kind="captions" src={studioFilm.media.captions} srcLang="en" label="English (sound)" />
                  <track kind="descriptions" src={studioFilm.media.descriptions} srcLang="en" label="Visual description" />
                </video>
              </div>
            </div>
            <div className="wv-container relative pb-16 pt-8 md:pt-12 lg:pb-24 lg:pt-14">
              <div className="max-w-[48rem] lg:max-w-[68rem]" data-hero-copy="">
                <p className="t-label text-gold">{hero.eyebrow}</p>
                <h1 id="hero-title" className="t-display-1 mt-6"><span className="block">Ideas with intent.</span><span className="block">Experiences with impact.</span></h1>
                <p className="t-body-lg mt-6 max-w-[36rem] text-ivory">{hero.support}</p>
                <div className="mt-10 flex flex-wrap gap-3">
                  <a href="#next-steps" className="btn-primary inline-flex min-h-12 items-center px-6 font-medium no-underline active:scale-[0.985]">Start a Project</a>
                  <a href="#work" className="inline-flex min-h-12 items-center border border-rule-strong px-6 font-medium no-underline active:scale-[0.985]">View Our Work</a>
                </div>
                <details className="sa-details mt-10 max-w-[72ch] border-t border-rule">
                  <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-6 py-3 [&::-webkit-details-marker]:hidden">
                    <span className="t-small font-medium">About the film <span className="t-meta text-2 ml-2">{studioFilm.durationLabel}</span></span>
                    <span aria-hidden="true" className="sa-plus text-xl leading-none">+</span>
                  </summary>
                  <p id="studio-film-description" className="t-small text-2">{studioFilm.summary} {studioFilm.sound}</p>
                  <ol role="list" className="mt-4 space-y-3 border-l border-rule pl-4 pb-4">
                    {studioFilm.chapters.map((c) => (
                      <li key={c.title} className="t-small text-2"><span className="font-medium text-ivory">{c.title}.</span> {c.description}</li>
                    ))}
                  </ol>
                </details>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="statement-title" className="surface-dark relative overflow-clip py-20 md:py-28">
          <div className="wv-container">
            {/* From xl the ascent line has its own lane; text keeps to columns 1–9. */}
            <div className="wv-grid">
              <div className="col-span-4 md:col-span-8 lg:col-span-12 xl:col-span-9">
                <p className="t-label text-2"><span className="t-meta text-accent mr-3">01</span>The studio</p>
                <h2 id="statement-title" className="t-display-2 mt-6 max-w-[18ch]">Where human imagination and intelligent technology meet.</h2>
                <p className="t-body-lg text-2 mt-8 max-w-[58ch]">{settings.positioning}</p>
                <ul role="list" className="mt-16 grid gap-10 md:grid-cols-3 md:gap-6">
                  {philosophy.map((p, i) => (
                    <li key={p.id} className="border-t border-rule pt-6"><p className="t-meta text-2">{pad2(i + 1)}</p><h3 className="t-display-3 mt-4">{p.title}</h3><p className="text-2 mt-4">{p.text}</p></li>
                  ))}
                </ul>
              </div>
              <MotifLane className="hidden overflow-clip xl:col-span-3 xl:col-start-10 xl:row-start-1 xl:-mb-28 xl:block">
                <AscentLine height={520} className="absolute bottom-[calc(-1_*_var(--wv-parallax)_-_1px)] right-0 h-auto w-full opacity-70" />
              </MotifLane>
            </div>
          </div>
        </section>

        <section id="services" aria-labelledby="services-title" className="surface-light py-20 md:py-28" data-surface="light">
          <div className="wv-container">
            <p className="t-label text-2"><span className="t-meta text-accent mr-3">02</span>What we do</p>
            <h2 id="services-title" className="t-display-2 mt-6 max-w-[22ch]">One studio, from the first idea to the finished experience.</h2>
            <p className="t-body-lg text-2 mt-6 max-w-[56ch]">Eight connected capabilities. Open any of them to see what it covers, how it works and where its scope ends.</p>
            <div className="mt-12 border-t border-rule">
              {publishedServices.map((s, i) => (
                <details key={s.slug} className="sa-details group border-b border-rule">
                  <summary className="flex cursor-pointer list-none items-start gap-5 py-6 [&::-webkit-details-marker]:hidden md:gap-8">
                    <span className="t-meta text-2 pt-1.5">{pad2(i + 1)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="t-h3 flex items-center gap-3"><ServiceIcon slug={s.slug} size={24} />{s.name}</span>
                      <span className="text-2 mt-2 block max-w-[52ch]">{s.descriptor}</span>
                    </span>
                    <span aria-hidden="true" className="sa-plus mt-1 text-xl leading-none">+</span>
                  </summary>
                  <div className="grid gap-8 pb-10 pl-0 md:grid-cols-12 md:pl-[3.25rem]">
                    <div className="md:col-span-7">
                      <p className="t-body-lg">{s.outcome}</p>
                      {s.problem.map((p, j) => <p key={j} className="text-2 mt-4">{p}</p>)}
                      <h3 className="t-label text-2 mt-8">How it works</h3>
                      <ol role="list" className="mt-3 border-t border-rule">
                        {s.process.map((p, j) => <li key={p.stage} className="grid gap-1 border-b border-rule py-3 sm:grid-cols-[2rem_10rem_1fr] sm:gap-4"><span className="t-meta text-2">{pad2(j + 1)}</span><span className="font-medium">{p.stage}</span><span className="t-small text-2">{p.detail}</span></li>)}
                      </ol>
                    </div>
                    <div className="md:col-span-5">
                      <h3 className="t-label text-2">Deliverables</h3>
                      {s.deliverables.map((g) => (
                        <div key={g.group} className="mt-4"><p className="font-medium">{g.group}</p><ul className="t-small text-2 mt-2 list-disc space-y-1 pl-5">{g.items.map((x) => <li key={x}>{x}</li>)}</ul></div>
                      ))}
                      <h3 className="t-label text-2 mt-8">Scope boundaries</h3>
                      <ul className="t-small text-2 mt-2 space-y-2">{s.boundaries.map((b) => <li key={b} className="border-l border-rule-strong pl-3">{b}</li>)}</ul>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section id="work" aria-labelledby="work-title" className="surface-dark py-20 md:py-28">
          <div className="wv-container">
            <p className="t-label text-2"><span className="t-meta text-accent mr-3">03</span>Selected work</p>
            <h2 id="work-title" className="t-display-2 mt-6">Work, labelled honestly.</h2>
            <p className="t-body-lg text-2 mt-6 max-w-[56ch]">Every project is marked as client work, a studio concept or a capability demonstration, so you always know what you are looking at.</p>
            <div className="mt-16 space-y-24">
              {publishedProjects.map((p) => (
                <article key={p.slug} aria-labelledby={`p-${p.slug}`}>
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="t-label inline-flex items-center gap-2 border border-rule-strong px-2 py-1.5"><span aria-hidden="true" className="inline-block h-1.5 w-1.5 border border-current" />{STATUS_LABELS[p.status]}</span>
                    <span className="t-small text-2">{statusDescription(p)}</span>
                  </div>
                  <h3 id={`p-${p.slug}`} className="t-display-3 mt-6">{p.title}</h3>
                  <p className="text-2 mt-3 max-w-[60ch]">{p.summary}</p>
                  <p className="t-meta text-2 mt-4">{[p.film ? `Film ${p.film.durationLabel}` : null, p.year, ...p.services.map(serviceName)].filter(Boolean).join(' · ')}</p>
                  {p.statement ? (
                    <div className="mt-10 border-t border-rule pt-6">
                      <p className="t-label text-2">{p.statement.label}</p>
                      <p className="t-display-2 mt-4 max-w-[18ch]">{p.statement.text}</p>
                    </div>
                  ) : null}
                  {p.feature ? (
                    <figure className="mt-10">
                      <Picture id={p.feature.image} w={1536} />
                      <figcaption className="t-caption text-2 mt-3"><span className="font-medium text-ivory">{p.feature.title}.</span> {p.feature.caption}</figcaption>
                    </figure>
                  ) : null}
                  {p.film ? (
                    <figure className="mt-10">
                      {/* The whole film, embedded: a poster with native controls; it plays with sound only when tapped. */}
                      <div className="relative aspect-video bg-black">
                        <video className="absolute inset-0 h-full w-full" src={`/video/${p.film.key}-360p.mp4`} poster={img(p.film.poster, 1024).src} controls playsInline preload="metadata" aria-label={`${p.film.title}, ${p.film.durationLabel}`} aria-describedby={`film-${p.slug}`}>
                          <track kind="captions" src={`/video/${p.film.key}-captions.vtt`} srcLang="en" label="English" />
                          <track kind="descriptions" src={`/video/${p.film.key}-description.vtt`} srcLang="en" label="Visual description" />
                        </video>
                      </div>
                      <figcaption id={`film-${p.slug}`} className="t-caption text-2 mt-3">{p.film.format}. {p.film.sound}</figcaption>
                    </figure>
                  ) : null}
                  {/* Native horizontal scroll-snap: momentum, rubber-banding and swipe come from iOS/Android. */}
                  <div className="relative mt-10">
                    {/* Scrollable region must be keyboard-focusable (WCAG 2.1.1); arrow keys scroll it natively. */}
                    {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
                    <div role="region" data-sa-rail tabIndex={0} aria-label={`${p.title} images — scroll sideways`} className="-mx-[var(--wv-margin)] overflow-x-auto scroll-px-[var(--wv-margin)] snap-x snap-mandatory px-[var(--wv-margin)] pb-4 [scrollbar-width:thin]">
                    <ul role="list" className="flex gap-4">
                      {p.gallery.map((g) => (
                        <li key={g.image} className="w-[82%] shrink-0 snap-start sm:w-[60%] lg:w-[44%]">
                          <figure><Picture id={g.image} w={1024} ratio="16 / 10" /><figcaption className="t-caption text-2 mt-3">{g.caption}</figcaption></figure>
                        </li>
                      ))}
                    </ul>
                    </div>
                  </div>
                  <div className="mt-8 grid gap-8 md:grid-cols-2">
                    <div><h4 className="t-label text-2">Challenge</h4>{p.challenge.map((t, i) => <p key={i} className="mt-3">{t}</p>)}</div>
                    <div><h4 className="t-label text-2">{p.film ? 'Insight and idea' : 'Idea'}</h4>{(p.film ? [...p.insight, ...p.idea] : p.idea).map((t, i) => <p key={i} className="mt-3">{t}</p>)}</div>
                  </div>
                  {p.principles ? (
                    <div className="mt-10">
                      <h4 className="t-label text-2">{p.principles.title}</h4>
                      <ol role="list" className="mt-4 grid gap-6 md:grid-cols-2">
                        {p.principles.items.map((it, i) => (
                          <li key={it.title} className="border-t border-rule pt-4">
                            <p className="t-small"><span aria-hidden="true" className="t-meta text-accent mr-2">{String(i + 1).padStart(2, '0')}</span><span className="font-medium">{it.title}.</span> <span className="text-2">{it.text}</span></p>
                          </li>
                        ))}
                      </ol>
                    </div>
                  ) : null}
                  {p.film ? (
                    <div className="mt-8"><h4 className="t-label text-2">Execution</h4><div className="mt-3 grid gap-4 md:grid-cols-3">{p.execution.map((t, i) => <p key={i} className="t-small text-2">{t}</p>)}</div></div>
                  ) : null}
                  {p.storyboard ? (
                    <figure className="mt-10">
                      <h4 className="t-label text-2 mb-4">{p.storyboard.title}</h4>
                      <Picture id={p.storyboard.image} w={1536} />
                      <figcaption className="t-caption text-2 mt-3">{p.storyboard.caption}</figcaption>
                    </figure>
                  ) : null}
                  {p.film ? (
                    <details className="sa-details mt-6 border-y border-rule">
                      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-6 py-3 [&::-webkit-details-marker]:hidden">
                        <span className="t-small font-medium">Script and shots</span>
                        <span aria-hidden="true" className="sa-plus text-xl leading-none">+</span>
                      </summary>
                      <div className="grid gap-8 pb-6 md:grid-cols-2">
                        <div>
                          <ol role="list" className="space-y-2">{p.film.script.map((l) => <li key={l.start} className="grid grid-cols-[3rem_1fr] gap-3"><span className="t-meta text-2">{Math.floor(l.start / 60)}:{String(Math.floor(l.start % 60)).padStart(2, '0')}</span><span>{l.line}</span></li>)}</ol>
                          <p className="t-caption text-2 mt-4">{p.film.scriptNote}</p>
                        </div>
                        <ol role="list" className="space-y-2">{p.film.shots.map((x) => <li key={x.start} className="t-small text-2 grid grid-cols-[3rem_1fr] gap-3"><span className="t-meta">{Math.floor(x.start / 60)}:{String(Math.floor(x.start % 60)).padStart(2, '0')}</span><span><span className="font-medium text-ivory">{withStop(x.title)}</span> {x.description}</span></li>)}</ol>
                      </div>
                    </details>
                  ) : null}
                  {p.note ? (
                    <p className="t-small text-2 mt-8 max-w-[70ch] border-l border-gold pl-4"><span className="t-label mr-2 text-ivory">{p.note.title}</span>{p.note.text}</p>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="approach" aria-labelledby="approach-title" className="surface-raised py-20 md:py-28">
          <div className="wv-container">
            <p className="t-label text-2"><span className="t-meta text-accent mr-3">04</span>Approach</p>
            <h2 id="approach-title" className="t-display-2 mt-6 max-w-[22ch]">Six stages, each with a clear output and a decision point.</h2>
            <ol role="list" className="mt-14 grid gap-0 lg:grid-cols-6 lg:gap-6">
              {approachStages.map((s, i) => (
                <li key={s.id} className="relative border-l border-rule pb-10 pl-6 lg:border-l-0 lg:border-t lg:pb-0 lg:pl-0 lg:pt-6">
                  <span aria-hidden="true" className="absolute -left-[3px] top-0 h-[5px] w-[5px] bg-gold lg:-top-[3px] lg:left-0" />
                  <p className="t-meta text-2">{pad2(i + 1)}</p><h3 className="t-h3 mt-3">{s.name}</h3>
                  <p className="t-small text-2 mt-3">{s.purpose}</p>
                  <p className="t-small mt-4"><span className="t-label text-2 mr-2">Output</span>{s.output}</p>
                  <p className="t-small mt-2"><span className="t-label text-2 mr-2">Gate</span>{s.gate}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="studio" aria-labelledby="ai-title" className="surface-dark py-20 md:py-28">
          <div className="wv-container grid gap-12 lg:grid-cols-12 lg:gap-6">
            <div className="lg:col-span-5"><Picture id="reviewing-gold-line-artwork" ratio="4 / 5" parallax /></div>
            <div className="lg:col-span-6 lg:col-start-7 lg:self-center">
              <p className="t-label text-2"><span className="t-meta text-accent mr-3">05</span>Human-led AI</p>
              <h2 id="ai-title" className="t-display-2 mt-6">{humanLedAi.title}</h2>
              <p className="t-body-lg text-2 mt-6">{humanLedAi.intro}</p>
              <ul role="list" className="mt-10 border-t border-rule">
                {humanLedAi.points.map((p) => <li key={p.title} className="grid gap-2 border-b border-rule py-5 md:grid-cols-[13rem_1fr] md:gap-6"><h3 className="font-medium">{p.title}</h3><p className="t-small text-2">{p.text}</p></li>)}
              </ul>
            </div>
          </div>
        </section>

        <section aria-labelledby="applications-title" className="surface-light py-20 md:py-28" data-surface="light">
          <div className="wv-container">
            <p className="t-label text-2"><span className="t-meta text-accent mr-3">06</span>Applications</p>
            <h2 id="applications-title" className="t-display-2 mt-6">Where clients bring us in.</h2>
            <ul role="list" className="mt-12 grid border-t border-rule md:grid-cols-2 lg:grid-cols-3">
              {applications.map((a, i) => (
                <li key={a.title} className="border-b border-rule p-6 md:p-8">
                  <span className="t-meta text-2">{pad2(i + 1)}</span><h3 className="t-display-3 mt-6">{a.title}</h3>
                  <p className="text-2 mt-4">{a.text}</p><p className="t-small mt-6 font-medium">{serviceName(a.service)}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="collab-title" className="surface-raised py-20 md:py-28">
          <div className="wv-container grid gap-12 lg:grid-cols-12 lg:gap-6">
            <div className="lg:col-span-6">
              <p className="t-label text-2"><span className="t-meta text-accent mr-3">07</span>Global collaboration</p>
              <h2 id="collab-title" className="t-display-2 mt-6">{collaboration.title}</h2>
              <p className="t-body-lg text-2 mt-6">{collaboration.intro}</p>
            </div>
            <div className="lg:col-span-5 lg:col-start-8"><Picture id="two-people-drafting-with-ruler" ratio="4 / 3" parallax /></div>
            <ol role="list" className="grid gap-y-8 border-t border-rule pt-8 md:grid-cols-5 md:gap-6 lg:col-span-12">
              {collaboration.steps.map((s, i) => <li key={s.title}><p className="t-meta text-2">{pad2(i + 1)}</p><h3 className="mt-3 font-medium">{s.title}</h3><p className="t-small text-2 mt-2">{s.text}</p></li>)}
            </ol>
          </div>
        </section>

        <section id="insights" aria-labelledby="insights-title" className="surface-dark py-20 md:py-28">
          <div className="wv-container">
            <p className="t-label text-2"><span className="t-meta text-accent mr-3">08</span>Insights</p>
            <h2 id="insights-title" className="t-display-2 mt-6">Thinking you can use.</h2>
            <div className="mt-12 border-t border-rule">
              {publishedInsights.map((a) => (
                <details key={a.slug} className="sa-details border-b border-rule">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-6 [&::-webkit-details-marker]:hidden">
                    <span><span className="t-label text-gold block">{a.category} · {readingMinutes(a)} min read</span><span className="t-h3 mt-3 block">{a.title}</span><span className="text-2 t-small mt-2 block max-w-[64ch]">{a.summary}</span></span>
                    <span aria-hidden="true" className="sa-plus mt-1 text-xl leading-none">+</span>
                  </summary>
                  <div className="pb-10"><Text blocks={a.body} /></div>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section id="next-steps" aria-labelledby="next-title" className="surface-dark relative overflow-clip border-t border-rule">
          <div className="wv-container">
            <div className="wv-grid">
              <div className="col-span-4 py-24 md:col-span-8 md:py-32 lg:col-span-7 lg:py-36">
                <h2 id="next-title" className="t-display-2">Have an idea worth making real?</h2>
                <p className="t-body-lg text-2 mt-6 max-w-[58ch]">Before a first conversation, it helps to think about: the objective in one sentence, who the work is for, who decides, what you already have and can use, any constraints, timing and what it depends on, a sense of investment, and how you will judge success.</p>
                {email ? (
                  /* A request box that needs no server and no JavaScript: the browser turns the
                     two fields into a new email to the studio (HTML "mail with headers"). */
                  <form action={`mailto:${email}`} method="get" aria-labelledby="request-title" className="mt-10 max-w-[60ch] border border-rule-strong">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-rule px-5 py-4">
                      <p id="request-title" className="t-label text-2">Write to the studio</p>
                      <p className="t-small min-w-0"><span className="text-2 mr-3">To</span><span className="[overflow-wrap:anywhere]">WeAmaze Visionary &lt;{email}&gt;</span></p>
                    </div>
                    <div className="space-y-5 px-5 py-6">
                      <div>
                        <label htmlFor="sa-subject" className="t-small font-medium">Subject</label>
                        <input id="sa-subject" name="subject" defaultValue="Project request" maxLength={140} className="mt-2 min-h-12 w-full border border-rule-strong bg-transparent px-3 text-ivory" />
                      </div>
                      <div>
                        <label htmlFor="sa-body" className="t-small font-medium">Your request</label>
                        <p id="sa-body-hint" className="t-small text-2 mt-1">What you want to make, who it is for and any timing that matters.</p>
                        <textarea id="sa-body" name="body" rows={6} maxLength={4000} aria-describedby="sa-body-hint" className="mt-2 w-full border border-rule-strong bg-transparent px-3 py-3 text-ivory" />
                      </div>
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                        <button type="submit" className="btn-primary inline-flex min-h-12 items-center px-6 font-medium active:scale-[0.985]">Open in your email app</button>
                        <a href={`mailto:${email}`} className="t-small [overflow-wrap:anywhere] underline underline-offset-4">{email}</a>
                      </div>
                    </div>
                  </form>
                ) : (
                  <p className="t-small text-2 mt-10 border-l border-gold pl-4">The online project brief and discovery-call booking open with the website launch.</p>
                )}
              </div>
              {/* The supergraphic has its own lane: a band under the text below lg, columns 9–12 from lg. */}
              <MotifLane className="col-span-4 -mt-8 h-52 [clip-path:inset(0_-100vw_0_0)] md:col-span-8 md:-mt-12 md:h-72 lg:col-span-4 lg:col-start-9 lg:mt-0 lg:h-auto">
                <MonogramSupergraphic className="absolute left-[18%] top-6 h-auto w-[118%] max-w-none md:left-[30%] md:top-8 md:w-[84%] lg:left-0 lg:top-1/2 lg:w-[170%] lg:-translate-y-1/2" />
              </MotifLane>
            </div>
          </div>
        </section>
      </main>

      <footer className="surface-dark border-t border-[color-mix(in_srgb,var(--color-ivory)_10%,transparent)]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {/* One page, so "home" is its top. A plain anchor: works with scripts off, as in WhatsApp and Quick Look. */}
        <div className="wv-container pt-16">
          <a href="#top" className={returnRow} data-testid="return-home"><ReturnFace label="Back to top" /></a>
        </div>
        <div className="wv-container flex flex-col gap-10 py-16 md:flex-row md:items-end md:justify-between">
          <PrimaryLogo height={124} decorative />
          <div className="space-y-3 md:text-right">
            <p className="t-label text-platinum">{settings.tagline}</p>
            <p className="t-caption text-platinum">© {settings.copyrightYear} {settings.name}. All rights reserved.</p>
            <p className="t-caption text-platinum">Offline edition · generated {generatedOn}{preview ? ' · preview, content pending owner approval' : ''}</p>
          </div>
        </div>
      </footer>
    </>
  );
}
