import { useLocation } from 'react-router';
import { Container, Section } from '@/components/layout/Section';
import { Alert } from '@/components/ui/Alert';
import { Blocks } from '@/components/ui/RichText';
import { getLegalPage } from '@/content/legal';
import { formatDate } from '@/lib/format';
import NotFoundPage from '../not-found/NotFoundPage';
import { PageHeader } from '../shared/PageHeader';

export default function LegalPage() {
  const { pathname } = useLocation();
  const page = getLegalPage(pathname.replace(/^\//, ''));
  if (!page) return <NotFoundPage />;
  return (
    <>
      <PageHeader eyebrow="Legal" title={page.title} intro={page.summary} />
      <Section spacing="tight" className="pt-0 md:pt-0">
        <Container>
          <div className="max-w-[68ch]">
            {!page.approved ? (
              <Alert tone="warning" title="Draft for legal review" className="mb-12" live={false}>
                <p>This text describes what the website actually does, so that it can be reviewed. It has not yet been approved and is not legal advice.</p>
              </Alert>
            ) : null}
            <Blocks blocks={page.body} />
            {page.lastReviewed ? <p className="t-meta text-2 mt-16">Last reviewed {formatDate(page.lastReviewed)}</p> : null}
          </div>
        </Container>
      </Section>
    </>
  );
}
