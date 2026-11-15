import { useEffect, useState } from 'react';
import { AppLink } from '@/components/ui/AppLink';
import { Button } from '@/components/ui/Button';
import { getConsent, setConsent } from '@/lib/consent';
import { ANALYTICS_PROVIDER } from '@/lib/env';

/**
 * Consent panel (V11.05 ConsentPanel). Rendered only when a non-essential
 * analytics provider is configured; with none, there is nothing to consent to.
 * Reject is as prominent as accept; choices persist and can be reopened.
 */
export function ConsentPanel({ forceOpen = false }: { forceOpen?: boolean }) {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState<null | 'accepted' | 'rejected'>(null);
  useEffect(() => {
    if (ANALYTICS_PROVIDER === 'none' && !forceOpen) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read persisted choice after hydration
    if (forceOpen || !getConsent()) setOpen(true);
    const reopen = () => { setSaved(null); setOpen(true); };
    window.addEventListener('wv:open-consent', reopen);
    return () => window.removeEventListener('wv:open-consent', reopen);
  }, [forceOpen]);
  if (!open) return null;
  const choose = (analytics: boolean) => {
    setConsent(analytics);
    setSaved(analytics ? 'accepted' : 'rejected');
    window.setTimeout(() => setOpen(false), 1200);
  };
  return (
    <section aria-labelledby="consent-title" className="surface-raised fixed inset-x-0 bottom-0 z-[var(--z-consent)] border-t border-rule-strong md:inset-x-auto md:bottom-6 md:right-6 md:max-w-md md:border">
      <div className="p-6">
        <h2 id="consent-title" className="font-medium">Your privacy choices</h2>
        <p className="t-small text-2 mt-2">We would like to measure how the site is used, without collecting your name, email or what you write in forms. Analytics stay off unless you agree. <AppLink to="/cookies" className="underline">Cookie notice</AppLink></p>
        {saved ? (
          <p role="status" className="t-small mt-4">Saved: analytics {saved}. You can change this from the footer.</p>
        ) : (
          <div className="mt-5 flex flex-wrap gap-3">
            <Button variant="secondary" size="sm" onClick={() => choose(false)}>Reject analytics</Button>
            <Button variant="secondary" size="sm" onClick={() => choose(true)}>Accept analytics</Button>
          </div>
        )}
      </div>
    </section>
  );
}
