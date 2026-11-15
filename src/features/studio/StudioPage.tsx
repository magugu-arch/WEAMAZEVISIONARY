import { AscentLine, MotifLane } from '@/components/brand/Motifs';
import { Container, Section, SectionHeading } from '@/components/layout/Section';
import { ResponsiveImage } from '@/components/media/ResponsiveImage';
import { TextLink } from '@/components/ui/TextLink';
import { collaboration, humanLedAi, philosophy, studio } from '@/content/pages';
import { settings } from '@/content/settings';
import { pad2 } from '@/lib/format';
import { CtaBand } from '../shared/CtaBand';
import { PageHeader } from '../shared/PageHeader';

/** Studio (V11.03): positioning, philosophy, responsible AI, collaboration. No team claims until verified (B-16). */
export default function StudioPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Studio', to: '/studio' }]}
        eyebrow="Studio"
        title="Creative Intelligence, Made Real."
        intro={settings.boilerplateFull}
      />
      <Section spacing="tight" className="overflow-clip pt-0 md:pt-0">
        <Container>
          <ResponsiveImage id="curved-plaster-interior-daylight" aspect="21 / 9" sizes="(min-width: 1440px) 1440px, 100vw" priority parallax />
        </Container>
      </Section>
      <Section labelledBy="position-title">
        <Container>
          <div className="wv-grid gap-y-10">
            <p className="t-label text-2 col-span-4 md:col-span-8 lg:col-span-3">Positioning</p>
            <h2 id="position-title" className="t-display-2 col-span-4 md:col-span-8 lg:col-span-8">{settings.positioning}</h2>
          </div>
          <div className="wv-grid mt-20 gap-y-10">
            <div className="col-span-4 border-t border-rule pt-6 md:col-span-4 lg:col-span-5 lg:col-start-4">
              <h3 className="t-label text-2">We are</h3>
              <p className="t-display-3 mt-4">{studio.weAre}</p>
            </div>
            <div className="col-span-4 border-t border-rule pt-6 md:col-span-4 lg:col-span-4">
              <h3 className="t-label text-2">We are not</h3>
              <p className="t-display-3 mt-4">{studio.weAreNot}</p>
            </div>
          </div>
        </Container>
      </Section>
      <Section surface="light" labelledBy="philosophy-title" className="overflow-clip">
        <Container>
          {/* From xl the ascent line has its own three-column lane; text keeps to columns 1–9. */}
          <div className="wv-grid">
            <div className="col-span-4 md:col-span-8 lg:col-span-12 xl:col-span-9">
              <SectionHeading id="philosophy-title" eyebrow="Philosophy" title="A stroke and its echo, rising together." intro="The identity expresses one idea: human imagination and intelligent technology moving together." />
              <ul role="list" className="mt-16 grid gap-x-[var(--wv-gutter)] gap-y-10 lg:grid-cols-3">
                {philosophy.map((p, i) => (
                  <li key={p.id} className="border-t border-rule pt-6">
                    <p className="t-meta text-2">{pad2(i + 1)}</p>
                    <h3 className="t-display-3 mt-4">{p.title}</h3>
                    <p className="text-2 mt-4 max-w-[40ch]">{p.text}</p>
                  </li>
                ))}
              </ul>
              <div className="mt-20 border-t border-rule pt-8">
                <h3 className="t-label text-2">Personality</h3>
                <ul role="list" className="mt-6 grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                  {studio.personality.map(([a, b]) => <li key={a} className="t-display-3">{a} <span className="text-2">{b}</span></li>)}
                </ul>
              </div>
            </div>
            <MotifLane className="hidden overflow-clip xl:col-span-3 xl:col-start-10 xl:row-start-1 xl:-mb-32 xl:block">
              <AscentLine height={520} tone="onyx" className="absolute bottom-[calc(-1_*_var(--wv-parallax)_-_1px)] right-0 h-auto w-full opacity-40" />
            </MotifLane>
          </div>
        </Container>
      </Section>
      <Section labelledBy="ai-title">
        <Container>
          <div className="wv-grid gap-y-12">
            <div className="col-span-4 md:col-span-8 lg:col-span-6">
              <SectionHeading id="ai-title" eyebrow="Responsible AI" title={humanLedAi.title} intro={humanLedAi.intro} />
              <TextLink to="/insights/rights-in-ai-assisted-creative-work" className="mt-8">How we handle rights in AI-assisted work</TextLink>
            </div>
            <div className="col-span-4 md:col-span-8 lg:col-span-5 lg:col-start-8">
              <ResponsiveImage id="gold-foil-lines-on-black-paper" aspect="4 / 5" sizes="(min-width: 1024px) 36vw, 100vw" parallax />
            </div>
          </div>
          <ul role="list" className="mt-16 grid gap-6 border-t border-rule pt-8 md:grid-cols-2 lg:grid-cols-5">
            {humanLedAi.points.map((p) => <li key={p.title}><h3 className="font-medium">{p.title}</h3><p className="t-small text-2 mt-2">{p.text}</p></li>)}
          </ul>
        </Container>
      </Section>
      <Section surface="raised" labelledBy="who-title">
        <Container>
          <SectionHeading id="who-title" eyebrow="Who we work with" title="Teams with ideas worth making real." intro={collaboration.intro} />
          <ul role="list" className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {studio.audiences.map((a) => <li key={a.title} className="border-t border-rule pt-6"><h3 className="font-medium">{a.title}</h3><p className="t-small text-2 mt-2">{a.text}</p></li>)}
          </ul>
        </Container>
      </Section>
      <CtaBand />
    </>
  );
}
