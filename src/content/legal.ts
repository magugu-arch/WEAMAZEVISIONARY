import type { InsightBlock } from './types';

/**
 * DRAFTS FOR LEGAL REVIEW (B-12). They describe what this website actually
 * does with data, as implemented, so that counsel can review real data flows.
 * They are not legal advice and are not approved. `scripts/launch-check.mjs`
 * blocks a production build while `approved` is false.
 */
export type LegalPage = { slug: 'privacy' | 'terms' | 'cookies'; title: string; summary: string; approved: boolean; lastReviewed: string | null; body: InsightBlock[] };

const CONFIRM = 'To be confirmed by the owner and legal adviser.';

export const legalPages: LegalPage[] = [
  {
    slug: 'privacy',
    title: 'Privacy notice',
    summary: 'What this website collects, why, where it goes and the choices you have.',
    approved: false,
    lastReviewed: null,
    body: [
      { type: 'h2', id: 'who', text: 'Who we are' },
      { type: 'p', text: `This website is operated by WeAmaze Visionary. Registered entity, address and privacy contact: ${CONFIRM}` },
      { type: 'h2', id: 'collect', text: 'What we collect' },
      { type: 'ul', items: [
        'Information you enter in our forms: your name, work email, role, organisation, country, time zone, optional phone number and the details of your project, partnership or call request.',
        'Technical information needed to run the site securely: your IP address is used briefly to limit abusive form submissions. It is not stored with your enquiry.',
        'We do not use analytics, advertising or tracking cookies on this website at present.',
      ] },
      { type: 'h2', id: 'why', text: 'Why we use it' },
      { type: 'ul', items: [
        'To read and respond to your enquiry, and to arrange a conversation if you ask for one.',
        'To keep a record of our correspondence and any project that follows.',
        'To protect the website against spam and abuse.',
      ] },
      { type: 'p', text: `Lawful basis for each purpose under the laws that apply (for example POPIA, GDPR or UK GDPR): ${CONFIRM}` },
      { type: 'h2', id: 'where', text: 'Where it goes' },
      { type: 'p', text: `Enquiries are stored securely on the server that runs this website. Once they are configured, enquiries are also passed to our customer-relationship and email providers so the right person can respond. Requests written in the Contact page’s request box are also sent to the studio’s email inbox (weamazevisionary@gmail.com, provided by Google) so we can reply to you directly. Named processors and the countries where they store data: ${CONFIRM}` },
      { type: 'p', text: 'We do not sell your information, and we do not use it to train AI systems.' },
      { type: 'h2', id: 'retention', text: 'How long we keep it' },
      { type: 'p', text: `Retention periods for enquiries, call requests and related correspondence: ${CONFIRM}` },
      { type: 'h2', id: 'rights', text: 'Your rights' },
      { type: 'p', text: `Depending on where you live, you may have the right to access, correct or delete your information, or to object to how it is used. How to make a request and our response process: ${CONFIRM}` },
      { type: 'h2', id: 'storage', text: 'Information stored in your browser' },
      { type: 'p', text: 'See the cookie notice for the small number of preferences this site stores on your device.' },
    ],
  },
  {
    slug: 'cookies',
    title: 'Cookie notice',
    summary: 'This website does not currently use analytics, advertising or tracking cookies.',
    approved: false,
    lastReviewed: null,
    body: [
      { type: 'h2', id: 'now', text: 'What we use today' },
      { type: 'p', text: 'This website sets no cookies. It stores a small number of strictly necessary preferences in your browser:' },
      { type: 'ul', items: [
        'Film preference (local storage): remembers if you paused the background film, so it stays paused.',
        'Project brief draft (session storage): keeps your answers while you move between steps of the project builder. It is deleted when your brief is sent or when you close the tab.',
        'Contact request draft (session storage): keeps what you have written in the Contact page’s request box if you leave and come back in the same tab. It is deleted when your request is sent or when you close the tab.',
      ] },
      { type: 'h2', id: 'future', text: 'If this changes' },
      { type: 'p', text: 'If we add analytics in future, they will stay off until you agree, and you will be able to change your choice at any time from a link in the footer.' },
      { type: 'p', text: `Final wording and the categories that apply in each market: ${CONFIRM}` },
    ],
  },
  {
    slug: 'terms',
    title: 'Website terms',
    summary: 'The terms that apply to using the WeAmaze Visionary website, and how enquiries relate to contracts.',
    approved: false,
    lastReviewed: null,
    body: [
      { type: 'h2', id: 'use', text: 'Using this website' },
      { type: 'p', text: 'This website describes the services of WeAmaze Visionary. You may browse it, share links to it and contact us through it.' },
      { type: 'h2', id: 'no-offer', text: 'Enquiries are not contracts' },
      { type: 'p', text: 'Sending a brief, a call request or any other message does not create an agreement. Scope, timing, cost, rights and responsibilities are set out only in a written proposal or agreement signed by both parties.' },
      { type: 'h2', id: 'ip', text: 'Our content' },
      { type: 'p', text: 'The WeAmaze Visionary name, monogram, logo, text, images and film on this website belong to WeAmaze Visionary or are used with permission. Please do not reuse them without our written consent.' },
      { type: 'h2', id: 'accuracy', text: 'Accuracy' },
      { type: 'p', text: 'We aim to keep this website accurate and current. Descriptions of services are general and do not constitute a commitment for any specific project.' },
      { type: 'h2', id: 'law', text: 'Liability and governing law' },
      { type: 'p', text: `Limitation of liability, governing law and jurisdiction: ${CONFIRM}` },
    ],
  },
];

export function getLegalPage(slug: string): LegalPage | undefined {
  return legalPages.find((p) => p.slug === slug);
}
