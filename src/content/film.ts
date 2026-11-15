/**
 * The studio film: the website's film from 9 November 2026 (owner upload
 * `source-assets/05_studio_film/WV_FILM_2026-11-09.mp4`, 1280 × 720, 24 fps, 1:45, stereo).
 * It is the 7 November cut (`WV_FILM.mp4`, kept unchanged) without the half-second red line
 * on black at 0:36: everything after it plays 13 frames (0.54 s) earlier.
 *
 * Single source of truth for the film's words. The chapter descriptions below
 * become the WebVTT descriptions track (`scripts/build-media.mjs`), the visible
 * description in the player, and the offline edition's description. They
 * describe only what is on screen: no clients, places or claims are named.
 *
 * Kept free of imports so Node can load it directly in build scripts.
 */
export type FilmChapter = { start: number; end: number; title: string; description: string };

export const studioFilm = {
  title: 'WeAmaze Visionary studio film',
  durationSec: 104.92,
  durationLabel: '1:45',
  isoDuration: 'PT1M45S',
  /** Date first published on this site; publication itself awaits owner approval (B-23). */
  uploadDate: '2026-11-09',
  summary:
    'A 1 minute 45 second film of moving-image work across six worlds: city technology, logistics, heritage, fashion and dance, food, and animation.',
  sound: 'Music throughout, with sound effects. No dialogue.',
  /**
   * Captions for the soundtrack. The film has no dialogue; the music bed runs to about 1:41
   * (measured from the waveform, 0.54 s earlier than in the 7 November cut). Confirm on a listen-through before launch (B-23).
   */
  captions: [{ start: 0, end: 100.96, text: '[Music]' }] as const,
  /** The hero's ambient loop is the film's opening sequence, cut to cut (frames 0–206). */
  loop: { start: 0, end: 8.625 },
  chapters: [
    {
      start: 0,
      end: 8.62,
      title: 'City',
      description:
        'A hand touches a glowing glass disc on a desk. Gold light traces a path through a city of glass towers at dusk. A woman in a white blouse walks across an office floor lit with projected interface rings, then works at a laptop beside floating glass icons.',
    },
    {
      start: 8.62,
      end: 36.42,
      title: 'Logistics',
      description:
        'A close-up of an eye, and a driver’s gloved hand on the wheel in a dark cab. A branded truck waits on a wet road at dawn. From the cab, the dashboard and navigation screen; behind the tail lights, on-screen labels flag a route deviation. A person follows the route on a wall of maps, a camera watches a depot at night, a fuel reading is flagged, and a camera recognises the number plate as the barrier lifts. The truck drives towards a city skyline at sunrise.',
    },
    {
      start: 36.42,
      end: 47.08,
      title: 'Heritage',
      description:
        'From above, a waterfall falls into a forest gorge. A woman in a dark suit stands before a waterfall in shafts of light, rain falls on ferns, and an older woman with cowrie shells in her braids looks out across the water.',
    },
    {
      start: 47.08,
      end: 72.79,
      title: 'Fashion and dance',
      description:
        'Women in black evening dresses stand among rings of light. Close-ups of a face and of an eye lined with gold. Dancers in cream skirts move between beams of gold light, forming kaleidoscope patterns seen from above, then dance through a sunlit field.',
    },
    {
      start: 72.79,
      end: 93.04,
      title: 'Food',
      description:
        'Coffee beans fall into a bowl; espresso is ground, tamped and poured, and milk is poured into latte art. A chef slices tomato and courgette, drizzles olive oil over a spiral vegetable tart and watches it bake; a fork lifts the first slice, and the chef stands at the kitchen door.',
    },
    {
      start: 93.04,
      end: 104.92,
      title: 'Animation',
      description:
        'In a felt-textured animated world under purple blossom, a girl with a magnifying glass finds a felt ladybird and a smiling felt ball, gasps, and falls back as the ball rolls towards her.',
    },
  ] satisfies readonly FilmChapter[],
  media: {
    loop: {
      desktop: { webm: '/video/studio-film-loop-desktop.webm', mp4: '/video/studio-film-loop-desktop.mp4' },
      mobile: { webm: '/video/studio-film-loop-mobile.webm', mp4: '/video/studio-film-loop-mobile.mp4' },
    },
    poster: { desktop: '/video/studio-film-poster-desktop', mobile: '/video/studio-film-poster-mobile' },
    still: { desktop: '/video/studio-film-still-desktop', mobile: '/video/studio-film-still-mobile' },
    full: { webm: '/video/studio-film-720p.webm', mp4: '/video/studio-film-720p.mp4', width: 1280, height: 720 },
    /** Compact encode embedded in the offline edition. */
    compact: { mp4: '/video/studio-film-360p.mp4', width: 640, height: 360 },
    descriptions: '/video/studio-film-description.vtt',
    captions: '/video/studio-film-captions.vtt',
  },
} as const;

const ts = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = (s - m * 60).toFixed(3).padStart(6, '0');
  return `${String(m).padStart(2, '0')}:${sec}`;
};

/** WebVTT descriptions track generated from the chapters (one cue per chapter). */
export function filmDescriptionsVtt(): string {
  const cues = studioFilm.chapters.map((c) => `${ts(c.start)} --> ${ts(c.end)}\n${c.title}. ${c.description}`);
  return ['WEBVTT', 'Kind: descriptions', 'Language: en', '', ...cues.flatMap((c) => [c, ''])].join('\n');
}

/** WebVTT captions track (sound only: the film has no dialogue). */
export function filmCaptionsVtt(): string {
  const cues = studioFilm.captions.map((c) => `${ts(c.start)} --> ${ts(c.end)}\n${c.text}`);
  return ['WEBVTT', 'Kind: captions', 'Language: en', '', ...cues.flatMap((c) => [c, ''])].join('\n');
}

/** The full written description: summary, sound, then every chapter in order. */
export function filmLongDescription(): string {
  return [studioFilm.summary, studioFilm.sound, ...studioFilm.chapters.map((c) => `${c.title}: ${c.description}`)].join(' ');
}
