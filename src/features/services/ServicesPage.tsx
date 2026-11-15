import { Container, Section, SectionHeading } from '@/components/layout/Section';
import { Accordion } from '@/components/ui/Accordion';
import { AppLink } from '@/components/ui/AppLink';
import { applications, engagementModels } from '@/content/pages';
import { serviceName } from '@/content/serviceIndex';
import { pad2 } from '@/lib/format';
import { CtaBand } from '../shared/CtaBand';
import { PageHeader } from '../shared/PageHeader';
import { ServiceList } from '../shared/ServiceList';
import { StageTimeline } from '../shared/StageTimeline';

const faqs = [
  { id: 'connected', question: 'Do we have to use several services?', answer: 'No. Many projects start with one capability. Where several are needed, one team carries the idea from strategy to finished work, so concept and execution do not drift apart.' },
  { id: 'partners', question: 'Do you work with specialist partners?', answer: 'Where a project needs specialist skills beyond the core team, we say so in the proposal and make clear who does what.' },
  { id: 'start', question: 'How do we start?', answer: 'Send a project brief or book a discovery conversation. We review what you share, then agree scope in a written proposal before any work begins.' },
  { id: 'pricing', question: 'Do you publish prices?', answer: 'No. Each engagement is estimated after we understand the scope. The proposal states assumptions, exclusions and third-party costs.' },
];

export default function ServicesPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Services', to: '/services' }]}
        eyebrow="Services"
        title="One connected studio."
        intro="Eight capabilities that work together. Strategy, creative direction, production and digital delivery share one team, so the idea that starts a project is the idea that ships."
      />
      <Section surface="light" labelledBy="list-title" spacing="tight">
        <Container>
          <h2 id="list-title" className="sr-only">All services</h2>
          <ServiceList headingLevel={3} />
        </Container>
      </Section>
      <Section labelledBy="connect-title">
        <Container>
          <SectionHeading id="connect-title" eyebrow="How capabilities connect" title="Start with the outcome, not the department." intro="Common starting points, and the capability that usually leads." />
          <ul role="list" className="mt-14 grid gap-x-6 border-t border-rule md:grid-cols-2 lg:grid-cols-3">
            {applications.map((a, i) => (
              <li key={a.title} className="border-b border-rule py-6">
                <p className="t-meta text-2">{pad2(i + 1)}</p>
                <h3 className="t-h3 mt-3">{a.title}</h3>
                <p className="text-2 t-small mt-2">{a.text}</p>
                <AppLink to={`/services/${a.service}`} className="t-small mt-4 inline-flex min-h-11 items-center font-medium underline underline-offset-4">{serviceName(a.service)}</AppLink>
              </li>
            ))}
          </ul>
        </Container>
      </Section>
      <Section surface="raised" labelledBy="process-title">
        <Container>
          <SectionHeading id="process-title" eyebrow="Process" title="The same six stages for every capability." />
          <div className="mt-14"><StageTimeline /></div>
        </Container>
      </Section>
      <Section labelledBy="models-title">
        <Container>
          <SectionHeading id="models-title" eyebrow="Ways to work together" title="Engagements shaped to the work." />
          <ul role="list" className="mt-14 grid gap-6 md:grid-cols-2">
            {engagementModels.map((m) => (
              <li key={m.title} className="border-t border-rule pt-6"><h3 className="t-h3">{m.title}</h3><p className="text-2 mt-3">{m.text}</p></li>
            ))}
          </ul>
          <div className="mt-24 grid gap-10 lg:grid-cols-12">
            <h2 className="t-h2 lg:col-span-4">Questions</h2>
            <div className="lg:col-span-8"><Accordion items={faqs.map((f) => ({ id: f.id, title: f.question, content: <p>{f.answer}</p> }))} /></div>
          </div>
        </Container>
      </Section>
      <CtaBand />
    </>
  );
}
