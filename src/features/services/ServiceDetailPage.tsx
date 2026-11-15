import { useEffect } from 'react';
import { useParams } from 'react-router';
import { ServiceIcon } from '@/components/brand/Logo';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { Container, Section } from '@/components/layout/Section';
import { ResponsiveImage } from '@/components/media/ResponsiveImage';
import { Accordion } from '@/components/ui/Accordion';
import { AppLink } from '@/components/ui/AppLink';
import { ButtonLink } from '@/components/ui/Button';
import { getService } from '@/content/services';
import { publishedProjects } from '@/content/projects';
import { track } from '@/lib/analytics';
import { pad2 } from '@/lib/format';
import { CtaBand } from '../shared/CtaBand';
import { ProjectCard } from '../shared/ProjectCard';
import NotFoundPage from '../not-found/NotFoundPage';

function Block({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="wv-grid gap-y-6 border-t border-rule pt-8">
      <h2 id={id} className="t-label text-2 col-span-4 md:col-span-8 lg:col-span-3">{label}</h2>
      <div className="col-span-4 md:col-span-8 lg:col-span-8">{children}</div>
    </section>
  );
}

/** Service template (V10 §07): title → problem → what we do → deliverables → process → work → related → FAQ → CTA. */
export default function ServiceDetailPage() {
  const { slug = '' } = useParams();
  const service = getService(slug);
  useEffect(() => {
    if (service) track({ name: 'service_view', props: { service_slug: service.slug } });
  }, [service]);
  if (!service) return <NotFoundPage />;
  const work = publishedProjects.filter((p) => p.services.includes(service.slug));
  const related = service.related.map((s) => getService(s)).filter((s): s is NonNullable<typeof s> => Boolean(s));

  return (
    <>
      <header className="surface-dark" data-surface="dark">
        <div className="wv-container pb-16 pt-12 md:pb-20 md:pt-20">
          <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Services', to: '/services' }, { label: service.name, to: `/services/${service.slug}` }]} />
          <div className="wv-grid mt-12 gap-y-10">
            <div className="col-span-4 md:col-span-8 lg:col-span-7">
              <p className="t-label flex items-center gap-3 text-gold">
                <ServiceIcon slug={service.slug} size={20} />
                <span><span className="t-meta normal-case tracking-normal">{pad2(service.order)}</span> · Service</span>
              </p>
              <h1 className="t-display-1 mt-6">{service.name}</h1>
              <p className="t-body-lg text-2 mt-8 max-w-[52ch]">{service.outcome}</p>
              <div className="mt-10 flex flex-wrap gap-3">
                <ButtonLink to={`/start-a-project?service=${service.slug}`}>Start a Project</ButtonLink>
                <ButtonLink to="/book-a-call" variant="secondary" icon="none">Book a discovery call</ButtonLink>
              </div>
            </div>
            <div className="col-span-4 md:col-span-8 lg:col-span-5">
              <ResponsiveImage id={service.image} aspect="4 / 5" sizes="(min-width: 1024px) 38vw, 100vw" priority parallax />
            </div>
          </div>
        </div>
      </header>

      <Section spacing="tight">
        <Container className="space-y-16">
          <Block id="problem" label="The situation">
            <div className="space-y-5">{service.problem.map((p, i) => <p key={i} className="t-display-3 max-w-[30ch]">{p}</p>)}</div>
          </Block>
          <Block id="what" label="What we do">
            <div className="space-y-5">{service.whatWeDo.map((p, i) => <p key={i} className="t-body-lg max-w-[62ch]">{p}</p>)}</div>
          </Block>
          <Block id="deliverables" label="Deliverables">
            <div className="grid gap-10 md:grid-cols-3">
              {service.deliverables.map((g) => (
                <div key={g.group}>
                  <h3 className="font-medium">{g.group}</h3>
                  <ul role="list" className="mt-4 border-t border-rule">
                    {g.items.map((it) => <li key={it} className="t-small border-b border-rule py-3">{it}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </Block>
          <Block id="how" label="How it works">
            <ol role="list" className="border-t border-rule">
              {service.process.map((p, i) => (
                <li key={p.stage} className="grid gap-2 border-b border-rule py-5 md:grid-cols-[3rem_14rem_1fr] md:gap-6">
                  <span className="t-meta text-2">{pad2(i + 1)}</span>
                  <h3 className="font-medium">{p.stage}</h3>
                  <p className="text-2">{p.detail}</p>
                </li>
              ))}
            </ol>
            <div className="mt-12 grid gap-10 md:grid-cols-2">
              <div>
                <h3 className="font-medium">What we will need from you</h3>
                <ul className="prose-wv mt-4 space-y-2 pl-5 [&>li]:list-disc">{service.clientInputs.map((c) => <li key={c} className="t-small">{c}</li>)}</ul>
              </div>
              {service.humanRole ? (
                <div>
                  <h3 className="font-medium">{service.humanRole.title}</h3>
                  <ul className="prose-wv mt-4 space-y-2 pl-5 [&>li]:list-disc">{service.humanRole.points.map((c) => <li key={c} className="t-small">{c}</li>)}</ul>
                </div>
              ) : null}
            </div>
          </Block>
          <Block id="scope" label="Scope boundaries">
            <ul role="list" className="space-y-3">{service.boundaries.map((b) => <li key={b} className="text-2 border-l border-rule-strong pl-4">{b}</li>)}</ul>
          </Block>
        </Container>
      </Section>

      {work.length ? (
        <Section surface="raised" labelledBy="work-title" spacing="tight">
          <Container>
            <h2 id="work-title" className="t-h2">Relevant work</h2>
            <div className="mt-10 grid gap-16 lg:grid-cols-2 lg:gap-6">{work.map((p) => <ProjectCard key={p.slug} project={p} />)}</div>
          </Container>
        </Section>
      ) : null}

      <Section labelledBy="faq-title" spacing="tight">
        <Container>
          <div className="grid gap-10 lg:grid-cols-12">
            <h2 id="faq-title" className="t-h2 lg:col-span-4">Questions about {service.name}</h2>
            <div className="lg:col-span-8"><Accordion items={service.faqs.map((f) => ({ id: f.id, title: f.question, content: <p>{f.answer}</p> }))} /></div>
          </div>
          {related.length ? (
            <nav aria-labelledby="related-title" className="mt-24">
              <h2 id="related-title" className="t-label text-2">Related capabilities</h2>
              <ul role="list" className="mt-6 grid border-t border-rule md:grid-cols-3 md:gap-6 md:border-t-0">
                {related.map((r) => (
                  <li key={r.slug} className="border-b border-rule md:border-t">
                    <AppLink to={`/services/${r.slug}`} className="group flex items-start gap-4 py-6 no-underline">
                      <ServiceIcon slug={r.slug} size={24} />
                      <span><span className="block font-medium group-hover:underline group-hover:underline-offset-4">{r.name}</span><span className="t-small text-2 mt-1 block">{r.descriptor}</span></span>
                    </AppLink>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
        </Container>
      </Section>
      <CtaBand title={`Talk to us about ${service.shortName.toLowerCase()}.`} />
    </>
  );
}
