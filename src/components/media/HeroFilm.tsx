import { useCallback, useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { studioFilm } from '@/content/film';
import { Icon } from '@/lib/icon';
import { cn } from '@/lib/cn';
import { WatchFilm } from './WatchFilm';

/** Derived web encodes of the studio film (scripts/build-media.mjs): its opening sequence as a muted loop. */
const HERO_MEDIA = {
  desktop: studioFilm.media.loop.desktop,
  mobile: studioFilm.media.loop.mobile,
  poster: studioFilm.media.poster,
  still: studioFilm.media.still,
} as const;

const PREF_KEY = 'wv:hero-film';
const MOBILE = '(max-width: 47.99rem)';
const REDUCED = '(prefers-reduced-motion: reduce)';
type State = 'poster' | 'loading' | 'playing' | 'paused' | 'unavailable';

function readPref(): 'paused' | null {
  try { return window.localStorage.getItem(PREF_KEY) === 'paused' ? 'paused' : null; } catch { return null; }
}
function writePref(paused: boolean) {
  try { if (paused) window.localStorage.setItem(PREF_KEY, 'paused'); else window.localStorage.removeItem(PREF_KEY); } catch { /* ignore */ }
}

/**
 * Poster-first hero film (V10 §11, V11.14): the studio film's opening, muted and looping.
 *  - The poster <picture> is the LCP element; the video never blocks first paint.
 *  - Video loads only after the page has loaded and the browser is idle.
 *  - Never autoplays for reduced-motion or save-data users; a still is shown.
 *  - Visible pause/play control; preference remembered on this device.
 *  - Pauses while offscreen; falls back to the poster on any media error.
 *  - "Watch the film" opens the full film with sound; the loop pauses meanwhile.
 */
export function HeroFilm({ className }: { className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<State>('poster');
  const [canPlay, setCanPlay] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const wantsPlay = useRef(true);

  const attach = useCallback(async (autoplay: boolean) => {
    const v = videoRef.current;
    if (!v) return;
    if (!v.currentSrc) {
      const m = window.matchMedia(MOBILE).matches ? HERO_MEDIA.mobile : HERO_MEDIA.desktop;
      const webm = v.canPlayType('video/webm; codecs="vp9"') ? m.webm : null;
      v.src = webm ?? m.mp4;
      v.load();
    }
    if (!autoplay) return;
    setState('loading');
    try {
      await v.play();
    } catch {
      setState('paused'); // autoplay blocked: poster stays, control offers play
    }
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia(REDUCED).matches;
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const saveData = Boolean(conn?.saveData);
    const pref = readPref();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reflect browser capabilities after hydration
    setCanPlay(true);
    if (reduced || saveData || pref === 'paused') {
      wantsPlay.current = false;
      setState('paused');
      return;
    }
    let idle: number | undefined;
    const start = () => {
      const ric = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
      idle = ric ? ric(() => void attach(true), { timeout: 2500 }) : window.setTimeout(() => void attach(true), 600);
    };
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });
    return () => {
      window.removeEventListener('load', start);
      if (idle !== undefined) window.clearTimeout(idle);
    };
  }, [attach]);

  // Pause offscreen to save battery and bandwidth; resume if the visitor had it playing.
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e) return;
      if (!e.isIntersecting && !v.paused) v.pause();
      else if (e.isIntersecting && wantsPlay.current && v.paused && v.currentSrc) void v.play().catch(() => {});
    }, { threshold: 0.1 });
    io.observe(v);
    return () => io.disconnect();
  }, []);

  // The full film takes over: pause the loop while it plays, resume afterwards if it was running.
  const resumeAfterFilm = useRef(false);
  const onFilmOpen = useCallback((open: boolean) => {
    const v = videoRef.current;
    if (!v) return;
    if (open) {
      resumeAfterFilm.current = !v.paused;
      v.pause();
    } else if (resumeAfterFilm.current && wantsPlay.current) {
      void v.play().catch(() => {});
    }
  }, []);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (state === 'playing' || state === 'loading') {
      wantsPlay.current = false;
      v.pause();
      writePref(true);
      setState('paused');
    } else {
      wantsPlay.current = true;
      writePref(false);
      void attach(true);
    }
  };

  // Once playback has started, pausing freezes the current frame instead of jumping back to the poster.
  const showVideo = state === 'playing' || (state === 'paused' && hasPlayed);
  const playing = state === 'playing' || state === 'loading';
  const pictureSources = (base: { desktop: string; mobile: string }, media?: string) => (
    <>
      <source media={media ? `${MOBILE} and ${media}` : MOBILE} type="image/avif" srcSet={`${base.mobile}.avif`} />
      <source media={media ? `${MOBILE} and ${media}` : MOBILE} type="image/webp" srcSet={`${base.mobile}.webp`} />
      <source media={media} type="image/avif" srcSet={`${base.desktop}.avif`} />
      <source media={media} type="image/webp" srcSet={`${base.desktop}.webp`} />
    </>
  );

  return (
    <div className={cn('absolute inset-0 overflow-hidden bg-onyx', className)} data-parallax-frame="">
      {/* The film drifts on its own layer (motion.css, hero parallax); the control stays put. */}
      <div data-parallax-layer="hero">
      {/* Static layer: reduced-motion visitors get the meaningful 5 s still; others the first frame for a seamless start. */}
      <picture>
        {pictureSources(HERO_MEDIA.still, REDUCED)}
        {pictureSources(HERO_MEDIA.poster)}
        <img
          src={`${HERO_MEDIA.poster.desktop}.jpg`}
          alt=""
          width={1280}
          height={720}
          fetchPriority="high"
          decoding="sync"
          className={cn('absolute inset-0 h-full w-full object-cover transition-opacity duration-700')}
        />
      </picture>
      <video
        ref={videoRef}
        className={cn('absolute inset-0 h-full w-full object-cover transition-opacity duration-700 motion-reduce:duration-150', showVideo ? 'opacity-100' : 'opacity-0')}
        muted
        playsInline
        loop
        preload="none"
        aria-hidden="true"
        tabIndex={-1}
        disablePictureInPicture
        onPlaying={() => { setHasPlayed(true); setState('playing'); }}
        onPause={() => setState((s) => (s === 'unavailable' ? s : 'paused'))}
        onError={() => setState('unavailable')}
      />
      </div>
      {/* Film controls stay with the film, outside the drifting layer, on their own 82% Onyx fill. */}
      <div className="absolute bottom-4 right-[max(var(--wv-margin),calc((100%_-_var(--wv-max))_/_2))] z-10 flex flex-wrap justify-end gap-2 lg:bottom-8">
        {/* Always rendered at a fixed width (invisible until the film can play), so neither its
            arrival after hydration nor the Play/Pause label change moves anything (CLS 0). */}
        <button
          type="button"
          onClick={toggle}
          aria-pressed={!playing}
          aria-label={playing ? 'Pause background film' : 'Play background film'}
          className={cn(
            't-caption inline-flex min-h-11 min-w-[5.75rem] items-center justify-center gap-2 border border-[color-mix(in_srgb,var(--color-ivory)_30%,transparent)] bg-[color-mix(in_srgb,var(--color-onyx)_82%,transparent)] px-3 text-ivory backdrop-blur-sm transition-[border-color,scale] duration-150 hover:border-ivory active:scale-[0.97] active:duration-0',
            (!canPlay || state === 'unavailable') && 'invisible',
          )}
        >
          <Icon as={playing ? Pause : Play} size={16} />
          <span>{playing ? 'Pause' : 'Play'}</span>
        </button>
        <WatchFilm onOpenChange={onFilmOpen} />
      </div>
    </div>
  );
}
