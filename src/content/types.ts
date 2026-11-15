import type { ImageId } from './media.generated';
import type { ServiceIconSlug } from '@/components/brand/artwork.generated';

/** Publication workflow (V10 §16): drafts never build, never index, never enter the sitemap. */
export type PublishState = 'draft' | 'published';
/** Owner approval of facts and wording. Launch-check blocks production while anything is pending. */
export type ApprovalState = 'pending' | 'approved';
export type Governance = { publish: PublishState; approval: ApprovalState; owner: string; reviewedAt?: string };

export type Seo = { title: string; description: string; ogImage?: ImageId };

export type ServiceSlug = ServiceIconSlug;

export type Faq = { id: string; question: string; answer: string };

export type Service = {
  slug: ServiceSlug;
  order: number;
  /** Exact CI service name (CI §18). */
  name: string;
  /** CI navigation short form. */
  shortName: string;
  /** CI one-line descriptor. */
  descriptor: string;
  outcome: string;
  problem: string[];
  whatWeDo: string[];
  deliverables: { group: string; items: string[] }[];
  process: { stage: string; detail: string }[];
  clientInputs: string[];
  humanRole?: { title: string; points: string[] };
  boundaries: string[];
  faqs: Faq[];
  related: ServiceSlug[];
  image: ImageId;
  seo: Seo;
  governance: Governance;
};

export type ProjectStatus = 'client-work' | 'studio-concept' | 'capability-demonstration' | 'confidential';

/** A film shown on a case study (owner-supplied; masters in source-assets, encodes from scripts/build-media.mjs). */
export type ProjectFilm = {
  /** Media file prefix in /video: `<key>-720p.{webm,mp4}`, `<key>-360p.mp4`, `<key>-{captions,description}.vtt`. */
  key: string;
  title: string;
  durationSec: number;
  durationLabel: string;
  isoDuration: string;
  format: string;
  poster: ImageId;
  sound: string;
  /** Voice-over lines, which become the captions track. */
  script: { start: number; end: number; line: string }[];
  /** Where the script and its timings come from, shown beside it. */
  scriptNote: string;
  /** Shot list, which becomes the descriptions track and the scene list. */
  shots: { start: number; end: number; title: string; description: string }[];
};

export type ProjectStoryboard = { image: ImageId; title: string; caption: string };

export type Project = {
  slug: string;
  title: string;
  /** Omitted when the owner has not stated it; never guessed. */
  year?: number;
  sector: string;
  services: ServiceSlug[];
  status: ProjectStatus;
  summary: string;
  scope: string;
  context: string[];
  challenge: string[];
  insight: string[];
  idea: string[];
  execution: string[];
  deliverables: string[];
  /** Omitted unless sourced, dated and approved (V11.06). */
  outcome: { text: string; source: string } | null;
  /** A short visible note on what the page deliberately leaves out (e.g. a client before launch). */
  note?: { title: string; text: string };
  /**
   * Editorial case studies (no film): the idea set as a display line between the hero and
   * the story, a few numbered principles in place of long execution paragraphs, and one
   * feature image shown whole on a light band. All optional; film case studies omit them.
   */
  statement?: { label: string; text: string };
  principles?: { title: string; items: { title: string; text: string }[] };
  feature?: { image: ImageId; title: string; caption: string };
  credits: { role: string; name: string }[];
  heroImage: ImageId;
  gallery: { image: ImageId; caption: string }[];
  film?: ProjectFilm;
  storyboard?: ProjectStoryboard;
  /**
   * `thirdParty`: the page names or shows another company's brand (for example a
   * working concept made for a prospective client). Like unapproved client work, it is
   * shown only in staging previews until that company's written permission is recorded.
   */
  permission: { publicationApproved: boolean; thirdParty?: boolean; note: string };
  seo: Seo;
  governance: Governance;
};

export type InsightBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; id: string; text: string }
  | { type: 'h3'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'note'; title: string; text: string };

export type Insight = {
  slug: string;
  title: string;
  summary: string;
  category: 'Responsible AI' | 'Process' | 'Rights & governance';
  author: { name: string; kind: 'organisation' | 'person' };
  publishedAt: string;
  updatedAt?: string;
  heroImage: ImageId;
  body: InsightBlock[];
  sources: { label: string; note: string }[];
  relatedServices: ServiceSlug[];
  seo: Seo;
  governance: Governance;
};
