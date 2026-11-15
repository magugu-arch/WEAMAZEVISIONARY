import { useId, useRef, useState } from 'react';
import { Play } from 'lucide-react';
import { images } from '@/content/media.generated';
import type { ProjectFilm } from '@/content/types';
import { track } from '@/lib/analytics';
import { Icon } from '@/lib/icon';

/** Largest JPEG derivative up to 1536 px wide, for the video poster. */
function posterUrl(film: ProjectFilm) {
  const img = images[film.poster];
  const widths = img.widths as readonly number[];
  const w = [...widths].reverse().find((x) => x <= 1536) ?? widths[0];
  return `/images/${img.id}-${w}.jpg`;
}

/**
 * A case-study film, inline, with sound on play (the visitor starts it; it never autoplays).
 * Native controls are present from the first paint, so it works before and without script;
 * a large Play control sits centred over the poster until the film first starts, clear of
 * the native control bar. Nothing of the film loads before play (preload="none").
 * Captions (the voice-over) and a descriptions track are attached; the same words appear
 * as text in the script and scene list beside the storyboard.
 */
export function ProjectFilmPlayer({ film }: { film: ProjectFilm }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const descId = useId();
  const play = () => {
    const v = ref.current;
    if (!v) return;
    void v.play().catch(() => { /* native controls remain */ });
  };
  return (
    <figure>
      <div className="relative aspect-video w-full max-w-full bg-black">
        <video
          ref={ref}
          className="absolute inset-0 h-full w-full"
          controls
          playsInline
          preload="none"
          poster={posterUrl(film)}
          aria-label={`${film.title}, ${film.durationLabel}`}
          aria-describedby={descId}
          onPlay={() => {
            if (!started) track({ name: 'film_open', props: { source_route: window.location.pathname } });
            setStarted(true);
          }}
          onEnded={() => track({ name: 'film_complete', props: { source_route: window.location.pathname } })}
        >
          <source src={`/video/${film.key}-720p.webm`} type='video/webm; codecs="vp9, opus"' />
          <source src={`/video/${film.key}-720p.mp4`} type="video/mp4" />
          <track kind="captions" src={`/video/${film.key}-captions.vtt`} srcLang="en" label="English" />
          <track kind="descriptions" src={`/video/${film.key}-description.vtt`} srcLang="en" label="Visual description" />
        </video>
        {!started ? (
          <button
            type="button"
            onClick={play}
            className="t-small absolute left-1/2 top-1/2 inline-flex min-h-12 -translate-x-1/2 -translate-y-1/2 items-center gap-3 border border-[color-mix(in_srgb,var(--color-ivory)_35%,transparent)] bg-[color-mix(in_srgb,var(--color-onyx)_82%,transparent)] px-5 font-medium text-ivory backdrop-blur-sm transition-[border-color,scale] duration-150 hover:border-ivory active:scale-[0.97] active:duration-0"
          >
            <Icon as={Play} size={18} />
            <span>Play film</span>
            <span aria-hidden="true" className="t-meta text-[color-mix(in_srgb,var(--color-ivory)_78%,transparent)]">{film.durationLabel}</span>
            <span className="sr-only">, {film.durationLabel.replace(/^0:/, '')} seconds, with sound</span>
          </button>
        ) : null}
      </div>
      <figcaption id={descId} className="t-caption text-2 mt-3">
        {film.format}. {film.sound} Captions and a visual description are available in the player.
      </figcaption>
    </figure>
  );
}
