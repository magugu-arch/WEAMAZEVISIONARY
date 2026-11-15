import { ResponsiveImage } from '@/components/media/ResponsiveImage';
import { Container, Section } from '@/components/layout/Section';
import { AppLink } from '@/components/ui/AppLink';
import { publishedInsights, readingMinutes } from '@/content/insights';
import { formatDate } from '@/lib/format';
import { CtaBand } from '../shared/CtaBand';
import { PageHeader } from '../shared/PageHeader';

export default function InsightsPage() {
  const [featured, ...rest] = publishedInsights;
  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Insights', to: '/insights' }]}
        eyebrow="Insights"
        title="Thinking you can use."
        intro="Fewer, more useful pieces on human-led AI, creative process, rights and governance. Each one documents how we actually work."
      />
      <Section spacing="tight" className="pt-0 md:pt-0">
        <Container>
          {featured ? (
            <article className="group relative grid gap-8 border-t border-rule pt-10 lg:grid-cols-12 lg:gap-6">
              <div className="lg:col-span-7">
                <ResponsiveImage id={featured.heroImage} aspect="16 / 10" sizes="(min-width: 1024px) 58vw, 100vw" priority parallax />
              </div>
              <div className="lg:col-span-5 lg:flex lg:flex-col lg:justify-end">
                <p className="t-label text-gold">Featured · {featured.category}</p>
                <h2 className="t-display-3 mt-5">
                  <AppLink to={`/insights/${featured.slug}`} className="no-underline after:absolute after:inset-0 group-hover:underline group-hover:decoration-1 group-hover:underline-offset-[6px]">{featured.title}</AppLink>
                </h2>
                <p className="text-2 mt-4">{featured.summary}</p>
                <p className="t-meta text-2 mt-6"><time dateTime={featured.publishedAt}>{formatDate(featured.publishedAt)}</time> · {readingMinutes(featured)} min read</p>
              </div>
            </article>
          ) : null}
          {rest.length ? (
            <ul role="list" className="mt-20 grid gap-x-6 gap-y-16 md:grid-cols-2">
              {rest.map((a) => (
                <li key={a.slug}>
                  <article className="group relative">
                    <ResponsiveImage id={a.heroImage} aspect="16 / 10" sizes="(min-width: 768px) 45vw, 100vw" />
                    <p className="t-label text-2 mt-6">{a.category}</p>
                    <h2 className="t-h3 mt-3">
                      <AppLink to={`/insights/${a.slug}`} className="no-underline after:absolute after:inset-0 group-hover:underline group-hover:underline-offset-4">{a.title}</AppLink>
                    </h2>
                    <p className="text-2 t-small mt-3">{a.summary}</p>
                    <p className="t-meta text-2 mt-4"><time dateTime={a.publishedAt}>{formatDate(a.publishedAt)}</time> · {readingMinutes(a)} min read</p>
                  </article>
                </li>
              ))}
            </ul>
          ) : null}
        </Container>
      </Section>
      <CtaBand />
    </>
  );
}
