import { useParams } from 'react-router';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { Container, Section } from '@/components/layout/Section';
import { ResponsiveImage } from '@/components/media/ResponsiveImage';
import { AppLink } from '@/components/ui/AppLink';
import { Blocks } from '@/components/ui/RichText';
import { ShareBar } from '@/components/ui/ShareBar';
import { getInsight, publishedInsights, readingMinutes } from '@/content/insights';
import { getService } from '@/content/services';
import { formatDate } from '@/lib/format';
import { CtaBand } from '../shared/CtaBand';
import NotFoundPage from '../not-found/NotFoundPage';

export default function InsightPage() {
  const { slug = '' } = useParams();
  const article = getInsight(slug);
  if (!article) return <NotFoundPage />;
  const toc = article.body.filter((b): b is Extract<typeof b, { type: 'h2' }> => b.type === 'h2');
  const more = publishedInsights.filter((a) => a.slug !== article.slug).slice(0, 2);
  const services = article.relatedServices.map(getService).filter((s): s is NonNullable<typeof s> => Boolean(s));
  return (
    <>
      <article>
        <header className="surface-dark" data-surface="dark">
          <div className="wv-container pb-12 pt-12 md:pt-20">
            <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Insights', to: '/insights' }, { label: article.title, to: `/insights/${article.slug}` }]} />
            <p className="t-label mt-10 text-gold">{article.category}</p>
            <h1 className="t-display-2 mt-6 max-w-[24ch]">{article.title}</h1>
            <p className="t-body-lg text-2 mt-6 max-w-[60ch]">{article.summary}</p>
            <p className="t-meta text-2 mt-8">
              By {article.author.name} · <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
              {article.updatedAt ? <> · Updated <time dateTime={article.updatedAt}>{formatDate(article.updatedAt)}</time></> : null} · {readingMinutes(article)} min read
            </p>
          </div>
          <div className="wv-container"><ResponsiveImage id={article.heroImage} aspect="21 / 9" sizes="(min-width: 1440px) 1440px, 100vw" priority parallax /></div>
        </header>
        <Section spacing="tight">
          <Container>
            <div className="grid gap-12 lg:grid-cols-12 lg:gap-6">
              {toc.length > 3 ? (
                <nav aria-labelledby="toc-title" className="lg:col-span-3">
                  <div className="lg:sticky lg:top-[calc(var(--wv-header-h)+24px)]">
                    <h2 id="toc-title" className="t-label text-2">Contents</h2>
                    <ol role="list" className="mt-4 space-y-1 border-l border-rule">
                      {toc.map((h) => <li key={h.id}><a href={`#${h.id}`} className="t-small block py-1.5 pl-4 text-platinum hover:text-ivory">{h.text}</a></li>)}
                    </ol>
                  </div>
                </nav>
              ) : null}
              <div className="lg:col-span-8 lg:col-start-5">
                <Blocks blocks={article.body} />
                {article.sources.length ? (
                  <aside aria-labelledby="sources-title" className="mt-16 border-t border-rule pt-6">
                    <h2 id="sources-title" className="t-label text-2">Basis for this article</h2>
                    <ul role="list" className="mt-4 space-y-2">{article.sources.map((s) => <li key={s.label} className="t-small"><span className="font-medium">{s.label}.</span> <span className="text-2">{s.note}</span></li>)}</ul>
                  </aside>
                ) : null}
                <div className="mt-12 border-t border-rule pt-6"><ShareBar title={article.title} path={`/insights/${article.slug}`} /></div>
                {services.length ? (
                  <aside aria-labelledby="related-services" className="mt-12 border-t border-rule pt-6">
                    <h2 id="related-services" className="t-label text-2">Related services</h2>
                    <ul role="list" className="mt-4 flex flex-wrap gap-x-6 gap-y-2">{services.map((s) => <li key={s.slug}><AppLink to={`/services/${s.slug}`} className="inline-flex min-h-11 items-center underline underline-offset-4">{s.name}</AppLink></li>)}</ul>
                  </aside>
                ) : null}
              </div>
            </div>
          </Container>
        </Section>
      </article>
      {more.length ? (
        <Section surface="raised" labelledBy="more-title" spacing="tight">
          <Container>
            <h2 id="more-title" className="t-h2">More insights</h2>
            <ul role="list" className="mt-10 grid gap-6 md:grid-cols-2">
              {more.map((a) => (
                <li key={a.slug} className="border-t border-rule pt-6">
                  <p className="t-label text-2">{a.category}</p>
                  <AppLink to={`/insights/${a.slug}`} className="t-h3 mt-3 block hover:underline hover:underline-offset-4">{a.title}</AppLink>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}
      <CtaBand />
    </>
  );
}
