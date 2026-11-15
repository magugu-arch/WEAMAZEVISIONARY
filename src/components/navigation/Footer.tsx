import { PrimaryLogo } from '@/components/brand/Logo';
import { AppLink } from '@/components/ui/AppLink';
import { ReturnHome } from './ReturnHome';
import { legalNav } from '@/content/navigation';
import { serviceIndex as publishedServices } from '@/content/serviceIndex';
import { publicEmail, settings } from '@/content/settings';
import { ANALYTICS_PROVIDER } from '@/lib/env';

/** Footer (CI §22, V11.15). Only verified contact details and existing routes are linked. */
export function Footer() {
  const email = publicEmail();
  const services = publishedServices.slice(0, 4);
  const capabilities = publishedServices.slice(4);
  // Single-line links keep a 40 px target; links that wrap in a narrow column get the same air between them.
  const col = 't-small flex min-h-10 items-center py-2 leading-snug text-platinum hover:text-ivory';
  return (
    <footer className="surface-dark border-t border-[color-mix(in_srgb,var(--color-ivory)_10%,transparent)]" data-surface="dark">
      <div className="wv-container pb-10 pt-20 md:pt-24">
        <div className="wv-grid gap-y-12">
          <div className="col-span-4 md:col-span-8 lg:col-span-3">
            <AppLink to="/" aria-label="WeAmaze Visionary — home" className="inline-block">
              <PrimaryLogo height={124} tone="reversed" decorative />
            </AppLink>
          </div>
          <nav aria-label="Services" className="col-span-2 md:col-span-2 lg:col-span-2">
            <p className="t-label mb-4 text-ivory">Services</p>
            <ul role="list">{services.map((s) => <li key={s.slug}><AppLink to={`/services/${s.slug}`} className={col}>{s.shortName}</AppLink></li>)}</ul>
          </nav>
          <nav aria-label="Capabilities" className="col-span-2 md:col-span-2 lg:col-span-2">
            <p className="t-label mb-4 text-ivory">Capabilities</p>
            <ul role="list">{capabilities.map((s) => <li key={s.slug}><AppLink to={`/services/${s.slug}`} className={col}>{s.shortName}</AppLink></li>)}</ul>
          </nav>
          <nav aria-label="Studio" className="col-span-2 md:col-span-2 lg:col-span-2">
            <p className="t-label mb-4 text-ivory">Studio</p>
            <ul role="list">
              {[['Work', '/work'], ['Approach', '/approach'], ['Studio', '/studio'], ['Insights', '/insights']].map(([l, to]) => (
                <li key={to}><AppLink to={to!} className={col}>{l}</AppLink></li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Get in touch" className="col-span-2 md:col-span-2 lg:col-span-3">
            <p className="t-label mb-4 text-ivory">Contact</p>
            <ul role="list">
              <li><AppLink to="/start-a-project" className={col}>Start a project</AppLink></li>
              <li><AppLink to="/book-a-call" className={col}>Book a discovery call</AppLink></li>
              <li><AppLink to="/contact" className={col}>Contact and partnerships</AppLink></li>
              {/* If the address must wrap in a narrow column, it breaks once, after the @. */}
              {email ? <li className="min-w-0"><a href={`mailto:${email}`} className={`${col} [overflow-wrap:anywhere]`}><span>{email.split('@')[0]}@<wbr />{email.split('@')[1]}</span></a></li> : null}
              {settings.social.map((s) => <li key={s.url}><a href={s.url} className={col} rel="me noopener">{s.label}</a></li>)}
            </ul>
          </nav>
        </div>
        <div className="mt-20">
          <ReturnHome />
        </div>
        <div className="flex flex-col gap-6 pt-8 md:flex-row md:items-center md:justify-between">
          <p className="t-label text-platinum">{settings.tagline}</p>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-8">
            <ul role="list" className="flex flex-wrap gap-x-6">
              {legalNav.map((l) => <li key={l.to}><AppLink to={l.to} className={col}>{l.label}</AppLink></li>)}
              <li><a href="/downloads/weamaze-visionary.html" download className={col}>Offline edition (HTML)</a></li>
              {ANALYTICS_PROVIDER !== 'none' ? (
                <li><button type="button" className={col} onClick={() => window.dispatchEvent(new Event('wv:open-consent'))}>Cookie preferences</button></li>
              ) : null}
            </ul>
            <p className="t-caption text-platinum">© {settings.copyrightYear} {settings.name}. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
