import { Container, Section, SectionHeading } from '@/components/layout/Section';
import { ResponsiveImage } from '@/components/media/ResponsiveImage';
import { approachStages, collaboration, engagementModels, humanLedAi } from '@/content/pages';
import { pad2 } from '@/lib/format';
import { CtaBand } from '../shared/CtaBand';
import { PageHeader } from '../shared/PageHeader';

export default function ApproachPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Approach', to: '/approach' }]}
        eyebrow="Approach"
        title="How a project moves from idea to impact."
        intro="Six stages, each with a clear output and a decision point. It is a flexible framework, not a promise that every project takes the same time: timelines and review cycles are scoped for each engagement."
      />
      <Section spacing="tight" className="pt-0 md:pt-0">
        <Container>
          <ResponsiveImage id="two-people-drafting-with-ruler" aspect="21 / 9" sizes="(min-width: 1440px) 1440px, 100vw" priority parallax />
        </Container>
      </Section>
      <Section labelledBy="stages-title">
        <Container>
          <h2 id="stages-title" className="sr-only">The six stages</h2>
          <ol role="list" className="space-y-0">
            {approachStages.map((s, i) => (
              <li key={s.id} id={s.id} className="wv-grid gap-y-6 border-t border-rule py-12 md:py-16">
                <div className="col-span-4 md:col-span-8 lg:col-span-4">
                  <p className="t-meta text-gold">{pad2(i + 1)}</p>
                  <h3 className="t-display-2 mt-3">{s.name}</h3>
                  <p className="t-body-lg text-2 mt-4 max-w-[36ch]">{s.purpose}</p>
                </div>
                <dl className="col-span-4 grid gap-6 md:col-span-8 md:grid-cols-2 lg:col-span-7 lg:col-start-6">
                  <div><dt className="t-label text-2">Your role</dt><dd className="mt-2">{s.you}</dd></div>
                  <div><dt className="t-label text-2">Our role</dt><dd className="mt-2">{s.we}</dd></div>
                  <div><dt className="t-label text-2">Typical output</dt><dd className="mt-2">{s.output}</dd></div>
                  <div className="border-l border-gold pl-4"><dt className="t-label text-2">Decision gate</dt><dd className="mt-2 font-medium">{s.gate}</dd></div>
                </dl>
              </li>
            ))}
          </ol>
        </Container>
      </Section>
      <Section surface="light" labelledBy="quality-title">
        <Container>
          <div className="wv-grid gap-y-10">
            <div className="col-span-4 md:col-span-8 lg:col-span-5">
              <SectionHeading id="quality-title" eyebrow="Quality and review" title="People review everything before it is final." intro={humanLedAi.intro} />
            </div>
            <ul role="list" className="col-span-4 border-t border-rule md:col-span-8 lg:col-span-6 lg:col-start-7">
              {humanLedAi.points.map((p) => <li key={p.title} className="border-b border-rule py-5"><h3 className="font-medium">{p.title}</h3><p className="text-2 t-small mt-1">{p.text}</p></li>)}
            </ul>
          </div>
        </Container>
      </Section>
      <Section labelledBy="remote-title">
        <Container>
          <SectionHeading id="remote-title" eyebrow="Working together" title={collaboration.title} intro={collaboration.intro} />
          <ol role="list" className="mt-14 grid gap-y-8 border-t border-rule pt-8 md:grid-cols-5 md:gap-6">
            {collaboration.steps.map((s, i) => <li key={s.title}><p className="t-meta text-2">{pad2(i + 1)}</p><h3 className="mt-3 font-medium">{s.title}</h3><p className="t-small text-2 mt-2">{s.text}</p></li>)}
          </ol>
        </Container>
      </Section>
      <Section surface="raised" labelledBy="commercial-title">
        <Container>
          <div className="wv-grid gap-y-12">
            <div className="col-span-4 md:col-span-8 lg:col-span-5">
              <SectionHeading id="commercial-title" eyebrow="Commercial clarity" title="Nothing is binding until it is written down." />
              <ul className="prose-wv mt-8 pl-5 [&>li]:list-disc">
                <li>Scope, timeline, cost and rights are confirmed in a written proposal or agreement.</li>
                <li>Every estimate states its assumptions, exclusions, third-party costs and validity period.</li>
                <li>Any budget range you share in a brief helps us shape options. It is not a quote.</li>
                <li>Changes after approval go through agreed change control, so cost and timing stay visible.</li>
              </ul>
            </div>
            <div className="col-span-4 md:col-span-8 lg:col-span-6 lg:col-start-7">
              <h3 className="t-label text-2">Engagement models</h3>
              <ul role="list" className="mt-6 border-t border-rule">
                {engagementModels.map((m) => <li key={m.title} className="border-b border-rule py-5"><h4 className="font-medium">{m.title}</h4><p className="t-small text-2 mt-1">{m.text}</p></li>)}
              </ul>
            </div>
          </div>
        </Container>
      </Section>
      <CtaBand />
    </>
  );
}
