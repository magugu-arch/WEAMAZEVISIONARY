import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { filmCaptionsVtt, filmDescriptionsVtt, filmLongDescription, studioFilm } from '@/content/film';

describe('studio film content', () => {
  it('chapters cover the whole film, in order, with no gaps', () => {
    const c = studioFilm.chapters;
    expect(c[0]!.start).toBe(0);
    for (let i = 1; i < c.length; i++) expect(c[i]!.start).toBe(c[i - 1]!.end);
    expect(c[c.length - 1]!.end).toBeCloseTo(studioFilm.durationSec, 2);
    expect(studioFilm.durationLabel).toBe('1:45');
    expect(studioFilm.isoDuration).toBe('PT1M45S');
  });
  it('published tracks match the content they are generated from', () => {
    expect(readFileSync('public/video/studio-film-description.vtt', 'utf8')).toBe(filmDescriptionsVtt());
    expect(readFileSync('public/video/studio-film-captions.vtt', 'utf8')).toBe(filmCaptionsVtt());
    expect(filmDescriptionsVtt()).toMatch(/^WEBVTT\nKind: descriptions/);
  });
  it('describes only what is on screen: no clients, brands or claims named', () => {
    const text = filmLongDescription();
    for (const banned of [/digit/i, /client/i, /award/i, /\bfor\s+[A-Z][a-z]+\b/]) expect(text).not.toMatch(banned);
  });
  it('the hero loop is the opening sequence, ending on a cut', () => {
    expect(studioFilm.loop.start).toBe(0);
    expect(studioFilm.loop.end * 24).toBeCloseTo(207, 5); // frames 0–206 at 24 fps
    expect(Math.abs(studioFilm.loop.end - studioFilm.chapters[0]!.end)).toBeLessThan(1 / 24);
  });
});
