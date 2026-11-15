import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Play, X } from 'lucide-react';
import { studioFilm } from '@/content/film';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/cn';
import { useScrollLock } from '@/lib/hooks';
import { Icon } from '@/lib/icon';

/**
 * "Watch the film": the full studio film, with sound, on demand.
 *
 * The hero shows a short muted loop; the whole film only loads and plays when a
 * visitor asks for it (no autoplaying sound, WCAG 1.4.2; no data spent up front).
 *  - Native modal <dialog>: focus moves to the player, Escape closes, focus returns
 *    to the button, page scroll is locked.
 *  - The player grows out of the button that opened it and shrinks back into it
 *    (spatial consistency): CSS transitions on a critically damped spring, which
 *    retarget from the current value if the visitor closes mid-open.
 *  - Native controls, a WebVTT descriptions track and a written, scene-by-scene
 *    description stand in for the visuals (WCAG 1.2.3 / 1.2.5).
 */
export function WatchFilm({ className, onOpenChange, label = 'Watch the film' }: { className?: string; onOpenChange?: (open: boolean) => void; label?: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const descId = useId();
  useScrollLock(open);

  const show = useCallback(() => {
    const dialog = dialogRef.current;
    const video = videoRef.current;
    if (!dialog || !video || dialog.open) return;
    // Grow from the button: origin at its centre, in viewport coordinates.
    const r = triggerRef.current?.getBoundingClientRect();
    if (r && panelRef.current) panelRef.current.style.transformOrigin = `${r.left + r.width / 2}px ${r.top + r.height / 2}px`;
    dialog.showModal();
    setOpen(true);
    onOpenChange?.(true);
    video.focus({ preventScroll: true });
    // Same user gesture as the click, so the film may start with sound.
    void video.play().catch(() => { /* blocked: native controls remain */ });
    track({ name: 'film_open', props: { source_route: window.location.pathname } });
  }, [onOpenChange]);

  const close = useCallback(() => dialogRef.current?.close(), []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onClose = () => {
      videoRef.current?.pause();
      setOpen(false);
      onOpenChange?.(false);
      triggerRef.current?.focus({ preventScroll: true });
    };
    dialog.addEventListener('close', onClose);
    return () => dialog.removeEventListener('close', onClose);
  }, [onOpenChange]);

  const { full, still, descriptions, captions } = studioFilm.media;
  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={show}
        aria-haspopup="dialog"
        className={cn('t-caption inline-flex min-h-11 items-center gap-2 border border-[color-mix(in_srgb,var(--color-ivory)_30%,transparent)] bg-[color-mix(in_srgb,var(--color-onyx)_82%,transparent)] px-3 text-ivory backdrop-blur-sm transition-[border-color,scale] duration-150 hover:border-ivory active:scale-[0.97] active:duration-0', className)}
      >
        <Icon as={Play} size={16} />
        <span>{label}</span>
        <span aria-hidden="true" className="t-meta text-[color-mix(in_srgb,var(--color-ivory)_78%,transparent)]">{studioFilm.durationLabel}</span>
        <span className="sr-only">, {Math.floor(studioFilm.durationSec / 60)} minute {Math.round(studioFilm.durationSec % 60)} seconds, with sound</span>
      </button>

      {/* A click on the dimmed surround closes, as Escape does from the keyboard (native <dialog>). */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
      <dialog ref={dialogRef} aria-labelledby={titleId} className="wv-film-dialog" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
        <div ref={panelRef} className="wv-film-panel flex min-h-full flex-col">
          <div className="wv-container flex items-center justify-between gap-4 py-3" style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}>
            <h2 id={titleId} className="t-label text-platinum">
              {studioFilm.title} <span className="t-meta ml-2 normal-case tracking-normal">{studioFilm.durationLabel}</span>
            </h2>
            <button type="button" onClick={close} className="-mr-2 inline-flex min-h-11 min-w-11 items-center justify-center text-ivory transition-[scale] duration-150 hover:text-gold active:scale-[0.94] active:duration-0" aria-label="Close film">
              <Icon as={X} size={22} />
            </button>
          </div>
          <div className="wv-container flex flex-1 flex-col justify-center pb-8">
            <div className="relative mx-auto aspect-video w-full max-w-[min(100%,calc((100svh-11rem)*16/9))] bg-black">
              <video
                ref={videoRef}
                className="absolute inset-0 h-full w-full outline-offset-4"
                controls
                playsInline
                preload="none"
                tabIndex={0}
                poster={`${still.desktop}.jpg`}
                aria-describedby={descId}
                onEnded={() => track({ name: 'film_complete', props: { source_route: window.location.pathname } })}
              >
                <source src={full.webm} type='video/webm; codecs="vp9, opus"' />
                <source src={full.mp4} type="video/mp4" />
                <track kind="captions" src={captions} srcLang="en" label="English (sound)" />
                <track kind="descriptions" src={descriptions} srcLang="en" label="Visual description" />
              </video>
            </div>
            <div className="mx-auto mt-6 w-full max-w-[min(100%,calc((100svh-11rem)*16/9))]">
              <p id={descId} className="t-small text-platinum max-w-[72ch]">
                {studioFilm.summary} {studioFilm.sound}
              </p>
              <details className="group mt-3 max-w-[72ch]">
                <summary className="t-small inline-flex min-h-11 cursor-pointer list-none items-center gap-2 font-medium text-ivory [&::-webkit-details-marker]:hidden">
                  <span aria-hidden="true" className="inline-block transition-transform duration-200 group-open:rotate-45">+</span>
                  Scene-by-scene description
                </summary>
                <ol role="list" className="mt-2 space-y-3 border-l border-[color-mix(in_srgb,var(--color-ivory)_18%,transparent)] pl-4">
                  {studioFilm.chapters.map((c) => (
                    <li key={c.title} className="t-small text-platinum">
                      <span className="t-meta mr-2 text-ivory">{fmt(c.start)}</span>
                      <span className="font-medium text-ivory">{c.title}.</span> {c.description}
                    </li>
                  ))}
                </ol>
              </details>
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
