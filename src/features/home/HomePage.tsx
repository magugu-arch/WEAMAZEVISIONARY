import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { AscentLine, MotifLane } from '@/components/brand/Motifs';
import { HeroFilm } from '@/components/media/HeroFilm';
import { ResponsiveImage } from '@/components/media/ResponsiveImage';
import { Container, Eyebrow, Section, SectionHeading } from '@/components/layout/Section';
import { AppLink } from '@/components/ui/AppLink';
import { ButtonLink } from '@/components/ui/Button';
import { TextLink } from '@/components/ui/TextLink';
import { applications, collaboration, hero, humanLedAi, philosophy } from '@/content/pages';
import { publishedProjects } from '@/content/projects';
import { serviceName } from '@/content/serviceIndex';
import { settings } from '@/content/settings';
import { track } from '@/lib/analytics';
import { pad2 } from '@/lib/format';
import { Icon } from '@/lib/icon';
import { CtaBand } from '../shared/CtaBand';
import { ProjectCard } from '../shared/ProjectCard';
import { ServiceList } from '../shared/ServiceList';
import { StageTimeline } from '../shared/StageTimeline';

/**
 * Home: cinematic hero → brand statement → eight capabilities → selected work →
 * approach → human-led AI → applications → global collaboration → closing CTA.
 */
export default function HomePage() {
  // A featured lead and two more, so the grid below fills its two columns.
  const [lead, ...others] = publishedProjects;
  const rest = others.slice(0, 2);
  return (
    <>
      <Hero />

      {/* 02 — Brand statement */}
      <Section labelledBy="statement-title" className="overflow-clip">
        <Container>
          {/* From xl the ascent line has its own three-column lane; text keeps to columns 1–9. */}
          <div className="wv-grid gap-y-10">
            <Eyebrow index="01" className="text-2 col-span-4 md:col-span-8 lg:col-span-3 lg:self-start lg:pt-4">The studio</Eyebrow>
            <div className="col-span-4 md:col-span-8 lg:col-span-8 xl:col-span-6" data-reveal>
              <h2 id="statement-title" className="t-display-2 max-w-[18ch]">
                Where human imagination and intelligent technology meet.
              </h2>
              <p className="t-body-lg text-2 mt-8 max-w-[58ch]">{settings.positioning}</p>
            </div>
            <ul role="list" className="col-span-4 mt-10 grid gap-x-[var(--wv-gutter)] gap-y-10 md:col-span-8 md:mt-18 lg:col-span-12 lg:grid-cols-3 xl:col-span-9">
              {philosophy.map((p, i) => (
                <li key={p.id} className="border-t border-rule pt-6">
                  <p className="t-meta text-2">{pad2(i + 1)}</p>
                  <h3 className="t-display-3 mt-4">{p.title}</h3>
                  <p className="text-2 mt-4 max-w-[40ch]">{p.text}</p>
                </li>
              ))}
            </ul>
            <MotifLane className="hidden overflow-clip xl:col-span-3 xl:col-start-10 xl:row-span-2 xl:row-start-1 xl:-mb-32 xl:block">
              <AscentLine height={560} className="absolute bottom-[calc(-1_*_var(--wv-parallax)_-_1px)] right-0 h-auto w-full opacity-70" />
            </MotifLane>
          </div>
        </Container>
      </Section>

      {/* 03 — Capabilities */}
      <Section surface="light" labelledBy="capabilities-title">
        <Container>
          <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeading id="capabilities-title" eyebrow="What we do" index="02" title="One studio, from the first idea to the finished experience." />
            <TextLink to="/services" className="shrink-0">All services</TextLink>
          </div>
          <div className="mt-16 md:mt-20">
            <ServiceList />
          </div>
        </Container>
      </Section>

      {/* 04 — Selected work */}
      <Section labelledBy="work-title">
        <Container>
          <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeading
              id="work-title"
              eyebrow="Selected work"
              index="03"
              title="Work, labelled honestly."
              intro="Every project is marked as client work, a studio concept or a capability demonstration, so you always know what you are looking at."
            />
            <TextLink to="/work" className="shrink-0">View all work</TextLink>
          </div>
          <div className="mt-16 space-y-20 md:mt-20">
            {lead ? <ProjectCard project={lead} variant="featured" /> : null}
            {rest.length ? (
              <div className="grid gap-16 lg:grid-cols-2 lg:gap-6">
                {rest.map((p) => <ProjectCard key={p.slug} project={p} />)}
              </div>
            ) : null}
          </div>
        </Container>
      </Section>

      {/* 05 — Approach */}
      <Section surface="raised" labelledBy="approach-title">
        <Container>
          <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeading
              id="approach-title"
              eyebrow="Approach"
              index="04"
              title="Six stages, each with a clear output and a decision point."
              intro="A flexible framework rather than a fixed timeline. Every stage is reviewed with your team before the next begins, so investment follows evidence."
            />
            <TextLink to="/approach" className="shrink-0">Explore our approach</TextLink>
          </div>
          <div className="mt-16 md:mt-24">
            <StageTimeline />
          </div>
        </Container>
      </Section>

      {/* 06 — Human-led AI */}
      <Section labelledBy="ai-title">
        <Container>
          <div className="wv-grid gap-y-12">
            <div className="col-span-4 md:col-span-8 lg:col-span-5" data-reveal>
              <ResponsiveImage id="reviewing-gold-line-artwork" aspect="4 / 5" sizes="(min-width: 1024px) 40vw, 100vw" parallax />
            </div>
            <div className="col-span-4 md:col-span-8 lg:col-span-6 lg:col-start-7 lg:self-center">
              <Eyebrow index="05" className="text-2 mb-6">Human-led AI</Eyebrow>
              <h2 id="ai-title" className="t-display-2">{humanLedAi.title}</h2>
              <p className="t-body-lg text-2 mt-6 max-w-[54ch]">{humanLedAi.intro}</p>
              <ul role="list" className="mt-10 border-t border-rule">
                {humanLedAi.points.map((p) => (
                  <li key={p.title} className="grid gap-2 border-b border-rule py-5 md:grid-cols-[13rem_1fr] md:gap-6">
                    <h3 className="font-medium">{p.title}</h3>
                    <p className="text-2 t-small">{p.text}</p>
                  </li>
                ))}
              </ul>
              <TextLink to="/insights/human-led-ai-how-we-direct-review-and-stay-accountable" className="mt-8">Read how we use AI responsibly</TextLink>
            </div>
          </div>
        </Container>
      </Section>

      {/* 07 — Applications */}
      <Section surface="light" labelledBy="applications-title">
        <Container>
          <SectionHeading id="applications-title" eyebrow="Applications" index="06" title="Where clients bring us in." intro="Most projects start with one of these. Many connect several capabilities." />
          <ul role="list" className="mt-16 grid border-t border-rule md:mt-20 md:grid-cols-2 lg:grid-cols-3">
            {applications.map((a, i) => (
              // Dividers sit between columns only: after the first of two (tablet), after the first two of three (desktop).
              <li key={a.title} className={`border-b border-rule ${i % 2 === 0 ? 'md:border-r' : ''} ${i % 3 === 2 ? 'lg:border-r-0' : 'lg:border-r'}`}>
                <AppLink to={`/services/${a.service}`} className="group flex h-full flex-col p-6 no-underline md:p-8">
                  <span className="t-meta text-2">{pad2(i + 1)}</span>
                  <h3 className="t-display-3 mt-6">{a.title}</h3>
                  <p className="text-2 mt-4">{a.text}</p>
                  <span className="t-small mt-8 inline-flex items-center gap-2 font-medium">
                    <span className="border-b border-rule-strong pb-0.5 group-hover:border-current">{serviceName(a.service)}</span>
                    <Icon as={ArrowRight} size={16} className="transition-transform duration-300 group-hover:translate-x-0.5" />
                  </span>
                </AppLink>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* 08 — Global collaboration */}
      <Section surface="raised" labelledBy="collab-title">
        <Container>
          <div className="wv-grid gap-y-12">
            <div className="col-span-4 md:col-span-8 lg:col-span-6">
              <Eyebrow index="07" className="text-2 mb-6">Global collaboration</Eyebrow>
              <h2 id="collab-title" className="t-display-2">{collaboration.title}</h2>
              <p className="t-body-lg text-2 mt-6 max-w-[52ch]">{collaboration.intro}</p>
              <LocalTimeNote />
              <div className="mt-10">
                <ButtonLink to="/book-a-call" variant="secondary">Book a discovery call</ButtonLink>
              </div>
            </div>
            <div className="col-span-4 md:col-span-8 lg:col-span-5 lg:col-start-8" data-reveal>
              <ResponsiveImage id="two-people-drafting-with-ruler" aspect="4 / 3" sizes="(min-width: 1024px) 40vw, 100vw" />
            </div>
          </div>
          <ol role="list" className="mt-16 grid gap-y-8 border-t border-rule pt-8 md:mt-24 md:grid-cols-5 md:gap-6">
            {collaboration.steps.map((s, i) => (
              <li key={s.title}>
                <p className="t-meta text-2">{pad2(i + 1)}</p>
                <h3 className="mt-3 font-medium">{s.title}</h3>
                <p className="t-small text-2 mt-2">{s.text}</p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <CtaBand />
    </>
  );
}

function Hero() {
  return (
    <section aria-labelledby="hero-title" className="surface-dark relative overflow-clip" data-surface="dark">
      <div className="relative lg:min-h-[max(100svh,640px)]">
        {/*
          Legibility (V10 §11): below lg the film sits in its own window and the text
          follows on plain Onyx, so no text ever covers the film. From lg the film is
          full-bleed and the text sits on a calibrated scrim that holds ≥ 4.5:1 even
          over a pure-white frame (tests/e2e/legibility.spec.ts). The scrim is static;
          only the film layer drifts.
        */}
        <div className="relative aspect-square max-h-[56svh] w-full overflow-clip md:aspect-video lg:absolute lg:inset-0 lg:aspect-auto lg:max-h-none">
          <HeroFilm />
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-onyx to-transparent lg:hidden" />
          <div aria-hidden="true" className="wv-hero-scrim-b pointer-events-none absolute inset-0 hidden lg:block" />
          <div aria-hidden="true" className="wv-hero-scrim-l pointer-events-none absolute inset-0 hidden lg:block" />
        </div>
        <div className="wv-container relative pb-16 pt-8 md:pt-12 lg:flex lg:min-h-[max(100svh,640px)] lg:items-end lg:pb-28 lg:pt-[calc(var(--wv-header-h)+48px)]">
          <div className="max-w-[48rem] lg:max-w-[68rem]" data-hero-copy="">
            <Eyebrow className="text-gold">{hero.eyebrow}</Eyebrow>
            <h1 id="hero-title" className="t-display-1 mt-6">
              <span className="block">Ideas with intent.</span>
              <span className="block">Experiences with impact.</span>
            </h1>
            <p className="t-body-lg mt-6 max-w-[36rem] text-ivory">{hero.support}</p>
            <div className="mt-10 flex flex-wrap gap-3">
              <ButtonLink to={hero.primary.to} onClick={() => track({ name: 'hero_primary_cta_click', props: { source_route: '/' } })}>
                {hero.primary.label}
              </ButtonLink>
              <ButtonLink to={hero.secondary.to} variant="secondary" icon="none" onClick={() => track({ name: 'hero_secondary_cta_click', props: { source_route: '/' } })}>
                {hero.secondary.label}
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Shows the visitor's own IANA time zone after hydration (no server guess, no IP lookup). */
function LocalTimeNote() {
  const [zone, setZone] = useState<string | null>(null);
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only value
      setZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    } catch {
      /* unsupported */
    }
  }, []);
  if (!zone) return null;
  return (
    <p className="t-meta text-2 mt-6">
      Your time zone: <span className="text-ivory">{zone.replace(/_/g, ' ')}</span>. Booking times are shown in it.
    </p>
  );
}
