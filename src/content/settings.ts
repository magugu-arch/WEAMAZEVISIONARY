/**
 * Global settings (V10 §16 "Site settings"). Every business fact carries a
 * verification flag. Unverified facts are never rendered publicly.
 */
export const settings = {
  name: 'WeAmaze Visionary',
  legalName: null as string | null, // Unknown — owner to confirm registered entity (B-04/B-12)
  category: 'Creative technology studio',
  tagline: 'Creative Intelligence, Made Real.',
  /**
   * International line system (D-33). The CI tagline above stays the slogan; these lines
   * say what the studio is and where it works, in the same words on every profile.
   */
  descriptor: 'AI creative studio',
  globalLine: 'An AI creative studio for brands worldwide.',
  workingModel: 'We work with clients anywhere: calls are booked in your own time zone, and briefs, proposals and reviews happen in English, online.',
  supportingLine: 'Ideas with intent. Experiences with impact.',
  boilerplateShort: 'WeAmaze Visionary is a creative technology studio building brands, content, experiences and digital products.',
  boilerplateFull:
    'WeAmaze Visionary is a creative technology studio combining human imagination, artificial intelligence, strategic thinking and digital craft to build brands, content, experiences and digital products that move people and businesses forward.',
  positioning:
    'For ambitious brands and businesses that need ideas made real quickly and well, WeAmaze Visionary is the creative technology studio that unites strategy, design, artificial intelligence and digital craft in one senior team, so concept and execution never drift apart.',
  /**
   * Supplied by the owner on 7 Nov 2026 as the address for requests (B-06). The CI's
   * hello@weamazevisionary.com can replace it in one line once that mailbox is live.
   */
  contactEmail: { value: 'weamazevisionary@gmail.com', verified: true },
  /** No phone or physical address is published (CI §23: none printed on stationery). */
  phone: null as string | null,
  address: null as string | null,
  /** CI footer names LinkedIn and Instagram but no URLs were supplied (B-19). */
  social: [] as { label: string; url: string }[],
  /** Budget ranges are an owner decision (B-17). Empty = no ranges shown. */
  budgetRanges: [] as { id: string; label: string }[],
  /** No response-time promise until an SLA is approved (B-18). */
  responseSla: null as string | null,
  copyrightYear: 2026,
} as const;

export function publicEmail(): string | null {
  return settings.contactEmail.verified ? settings.contactEmail.value : null;
}
