import { useEffect, useState } from 'react';
import { Check, Link2, MessageCircle, Share2 } from 'lucide-react';
import { Icon } from '@/lib/icon';
import { SITE_URL } from '@/lib/env';

/**
 * Share controls that work across iOS, Android, WhatsApp and desktop:
 *  - "Share…" opens the native share sheet (iOS/Android, includes WhatsApp) when the Web Share API exists.
 *  - "WhatsApp" uses the wa.me universal link, which opens the app on phones and WhatsApp Web on desktop.
 *  - "Copy link" uses the Clipboard API with a visible, announced confirmation.
 * The shared URL is the address the visitor is on, so previews resolve on whichever host serves the site.
 */
export function ShareBar({ title, path }: { title: string; path: string }) {
  const [href, setHref] = useState(`${SITE_URL}${path}`);
  const [canShare, setCanShare] = useState(false);
  const [status, setStatus] = useState<'' | 'copied' | 'failed'>('');
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only values after hydration
    setHref(window.location.href.split('#')[0]!);
    setCanShare(typeof navigator.share === 'function');
  }, []);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(href);
      setStatus('copied');
    } catch {
      setStatus('failed');
    }
    window.setTimeout(() => setStatus(''), 2500);
  };
  const btn = 't-small inline-flex min-h-11 items-center gap-2 border border-rule-strong px-4 transition-colors hover:border-current active:scale-[0.98]';
  return (
    <div role="group" aria-labelledby="share-label" className="flex flex-wrap items-center gap-3">
      <span id="share-label" className="t-label text-2 mr-2">Share</span>
      {canShare ? (
        <button type="button" className={btn} onClick={() => void navigator.share({ title, url: href }).catch(() => {})}>
          <Icon as={Share2} size={16} /> Share…
        </button>
      ) : null}
      <a className={`${btn} no-underline`} href={`https://wa.me/?text=${encodeURIComponent(`${title} — ${href}`)}`} target="_blank" rel="noopener noreferrer">
        <Icon as={MessageCircle} size={16} /> WhatsApp<span className="sr-only"> (opens WhatsApp)</span>
      </a>
      <button type="button" className={btn} onClick={() => void copy()}>
        <Icon as={status === 'copied' ? Check : Link2} size={16} /> {status === 'copied' ? 'Link copied' : 'Copy link'}
      </button>
      <span role="status" className="sr-only">{status === 'copied' ? 'Link copied to clipboard' : status === 'failed' ? 'Could not copy the link' : ''}</span>
    </div>
  );
}
