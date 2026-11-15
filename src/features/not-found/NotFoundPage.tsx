import { Container, Section } from '@/components/layout/Section';
import { AppLink } from '@/components/ui/AppLink';
import { ButtonLink } from '@/components/ui/Button';

/** Branded 404. The server returns HTTP 404 for unknown and unpublished routes. */
export default function NotFoundPage() {
  return (
    <Section className="min-h-[70svh]">
      <Container>
        <p className="t-meta text-gold">404</p>
        <h1 className="t-display-1 mt-6 max-w-[14ch]">This page does not exist.</h1>
        <p className="t-body-lg text-2 mt-8 max-w-[52ch]">It may have moved, or the link may be mistyped. These are good places to continue:</p>
        <ul role="list" className="mt-10 flex flex-wrap gap-x-8 gap-y-2">
          {[['Services', '/services'], ['Work', '/work'], ['Approach', '/approach'], ['Insights', '/insights'], ['Contact', '/contact']].map(([l, to]) => (
            <li key={to}><AppLink to={to!} className="inline-flex min-h-11 items-center underline underline-offset-4">{l}</AppLink></li>
          ))}
        </ul>
        <div className="mt-12"><ButtonLink to="/">Go to home page</ButtonLink></div>
      </Container>
    </Section>
  );
}
