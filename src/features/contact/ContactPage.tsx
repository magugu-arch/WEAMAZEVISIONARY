import { useState } from 'react';
import { ArrowRight, Check, Copy } from 'lucide-react';
import { Container, Section } from '@/components/layout/Section';
import { AppLink } from '@/components/ui/AppLink';
import { publicEmail, settings } from '@/content/settings';
import { Icon } from '@/lib/icon';
import { PageHeader } from '../shared/PageHeader';
import { RequestComposer } from './RequestComposer';

/** The studio inbox, with one-tap copy. */
function InboxLine({ email }: { email: string }) {
  const [copied, setCopied] = useState<'' | 'yes' | 'no'>('');
  const copy = async () => {
    try { await navigator.clipboard.writeText(email); setCopied('yes'); } catch { setCopied('no'); }
    window.setTimeout(() => setCopied(''), 2500);
  };
  return (
    <div className="mt-8">
      <p className="t-label text-2">Studio inbox</p>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
        <a href={`mailto:${email}`} className="t-body-lg [overflow-wrap:anywhere] underline-offset-4 hover:underline">{email}</a>
        <button type="button" onClick={() => void copy()} className="t-small inline-flex min-h-11 items-center gap-2 border border-rule-strong px-3 transition-colors hover:border-current active:scale-[0.98] active:duration-0">
          <Icon as={copied === 'yes' ? Check : Copy} size={16} /> {copied === 'yes' ? 'Copied' : 'Copy'}<span className="sr-only"> email address</span>
        </button>
      </div>
      <span role="status" className="sr-only">{copied === 'yes' ? 'Email address copied' : copied === 'no' ? 'Could not copy the email address' : ''}</span>
    </div>
  );
}

/** Shown only if no public address is configured: the server form is the sole route. */
function LegacyNotice() {
  return <p className="t-small text-2 border-l border-gold pl-4">The request box opens once the studio inbox is confirmed. Meanwhile, use Start a project or Book a call above.</p>;
}

/** Contact (V11.03): project brief, discovery call, or a request written straight to the studio. */
export default function ContactPage() {
  const email = publicEmail();

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Contact', to: '/contact' }]}
        eyebrow="Contact"
        title="Let’s talk about what you want to make."
        intro="Choose the route that fits: a guided project brief, a call, or a request written straight to the studio."
      />
      <Section spacing="tight" className="pt-0 md:pt-0">
        <Container>
          <div className="grid gap-6 md:grid-cols-2">
            <AppLink to="/start-a-project" className="group border border-rule-strong p-6 no-underline transition-colors hover:border-ivory md:p-8">
              <p className="t-label text-gold">Project</p>
              <h2 className="t-display-3 mt-4">Start a project brief</h2>
              <p className="text-2 mt-3">A few guided steps about what you want to make, for whom and by when.</p>
              <span className="mt-6 inline-flex items-center gap-2 font-medium">Start a Project <Icon as={ArrowRight} size={18} className="transition-transform group-hover:translate-x-0.5" /></span>
            </AppLink>
            <AppLink to="/book-a-call" className="group border border-rule-strong p-6 no-underline transition-colors hover:border-ivory md:p-8">
              <p className="t-label text-2">Conversation</p>
              <h2 className="t-display-3 mt-4">Book a discovery call</h2>
              <p className="text-2 mt-3">Prefer to talk first? Choose a time in your own time zone.</p>
              <span className="mt-6 inline-flex items-center gap-2 font-medium">Book a call <Icon as={ArrowRight} size={18} className="transition-transform group-hover:translate-x-0.5" /></span>
            </AppLink>
          </div>

          <section aria-labelledby="form-title" className="mt-24 grid gap-12 lg:grid-cols-12 lg:gap-6">
            <div className="lg:col-span-4">
              <h2 className="t-display-3" id="form-title">Write to the studio</h2>
              <p className="text-2 mt-4">Put your request in your own words. Send it from here, or open it in your own email app, already addressed to the studio.</p>
              {email ? <InboxLine email={email} /> : null}
              <dl className="mt-10 space-y-5 border-t border-rule pt-6">
                <div>
                  <dt className="t-label text-2">Wherever you are</dt>
                  <dd className="t-small mt-2">{settings.workingModel}</dd>
                </div>
                <div>
                  <dt className="t-label text-2">Partnerships</dt>
                  <dd className="t-small mt-2">Agencies and production partners: choose A partnership. Partnership requests are routed separately from client projects.</dd>
                </div>
                <div>
                  <dt className="t-label text-2">A fuller brief</dt>
                  <dd className="t-small mt-2">For a new project with several parts, <AppLink to="/start-a-project" className="underline underline-offset-4">Start a project</AppLink> walks you through it.</dd>
                </div>
              </dl>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              {email ? <RequestComposer to={email} /> : <LegacyNotice />}
            </div>
          </section>
        </Container>
      </Section>
    </>
  );
}
