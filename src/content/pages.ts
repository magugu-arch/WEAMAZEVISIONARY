import type { ServiceSlug } from './types';

/**
 * Page copy for templates without their own collection. Written from the CI
 * manual (§01–§03, §17) and the V10–V12 briefs. Pending owner approval (B-15).
 */

export const hero = {
  eyebrow: 'AI creative studio · Working worldwide',
  title: 'Ideas with intent. Experiences with impact.',
  support: 'We unite strategy, human creative direction and intelligent technology to build brands, content, experiences and digital products.',
  primary: { label: 'Start a Project', to: '/start-a-project' },
  secondary: { label: 'View Our Work', to: '/work' },
} as const;

/** CI §02 brand philosophy. */
export const philosophy = [
  { id: 'imagination', title: 'Imagination leads', text: 'Every project begins with a human idea and a question worth answering. Technology is chosen to serve the idea, never the reverse.' },
  { id: 'intelligence', title: 'Intelligence amplifies', text: 'Artificial intelligence widens what a small, senior team can explore, test and make. It accelerates craft. It does not replace judgement.' },
  { id: 'precision', title: 'Precision makes it real', text: 'Ideas only matter once they exist in the world. We hold the last detail to the same standard as the first sketch.' },
] as const;

/** V10 §09 — six stages; a flexible framework, not a fixed timeline. */
export const approachStages = [
  {
    id: 'discover', name: 'Discover', purpose: 'Understand the brief, audience, context, constraints and opportunity.',
    output: 'Discovery summary, needs map and project objectives.', gate: 'Are we solving the right problem?',
    you: 'Share context, existing material and access to the people who know the problem.', we: 'Listen, research and summarise what we heard, including what is still unknown.',
  },
  {
    id: 'define', name: 'Define', purpose: 'Agree strategy, scope, creative direction, requirements and success measures.',
    output: 'Strategic direction, scope and experience requirements.', gate: 'Is the direction and scope approved?',
    you: 'Confirm priorities, decision-makers and how success will be judged.', we: 'Propose direction and scope in writing, with assumptions and exclusions.',
  },
  {
    id: 'design', name: 'Design', purpose: 'Shape the experience, identity, story or product before production or build.',
    output: 'Concepts, wireframes, prototypes, boards and specifications.', gate: 'Is the design or prototype approved?',
    you: 'Review against the agreed objective and give consolidated feedback.', we: 'Design, prototype and test before committing to production.',
  },
  {
    id: 'create', name: 'Create', purpose: 'Produce and build the agreed work.',
    output: 'Creative assets, film, web or app build, presentation or automation.', gate: 'Does the work meet the brief and the quality standard?',
    you: 'Supply final content and approvals at the agreed checkpoints.', we: 'Produce, build and run human quality review before anything is presented as final.',
  },
  {
    id: 'launch', name: 'Launch', purpose: 'Release and hand over the approved deliverable.',
    output: 'Deployment, final masters, documentation and training.', gate: 'Is the release ready and accepted?',
    you: 'Accept the release and confirm owners for what happens next.', we: 'Release, document and hand over files, accounts and knowledge.',
  },
  {
    id: 'evolve', name: 'Evolve', purpose: 'Support, measure, refine and extend where agreed.',
    output: 'Performance review, iteration roadmap and maintenance.', gate: 'What should improve next?',
    you: 'Share results and priorities as they emerge.', we: 'Review, recommend and iterate within the agreed support scope.',
  },
] as const;

/** V10 §05 row 07 — real use-case areas, each pointing to the relevant service. */
export const applications: { title: string; text: string; service: ServiceSlug }[] = [
  { title: 'Brand launch', text: 'A new or renewed brand, from positioning and identity to the first campaign and website.', service: 'brand-strategy-creative-direction' },
  { title: 'Campaign', text: 'Concepts, films and content suites for a launch, season or message that must stand out.', service: 'ai-creative-studio' },
  { title: 'Presentation', text: 'An investor pitch, sales story or leadership narrative that has to persuade.', service: 'ai-presentations-pitch-decks' },
  { title: 'Digital platform', text: 'A website or digital experience that explains the offer and converts the right visitors.', service: 'websites-digital-experiences' },
  { title: 'App or product', text: 'A new digital service, tested as a prototype before it is built in full.', service: 'apps-digital-products' },
  { title: 'Automation', text: 'A repetitive workflow redesigned with AI assistance and people kept in the loop.', service: 'ai-solutions-automation' },
];

/** V12.02 — how AI is used; client-facing treatment of each control. */
export const humanLedAi = {
  title: 'AI accelerates the craft. People stay accountable.',
  intro: 'We use artificial intelligence where it helps us explore further and produce faster. People set the direction, review every output and remain responsible for the result.',
  points: [
    { title: 'Human direction', text: 'A named lead owns the brief, the creative and technical direction, every selection and the final approval.' },
    { title: 'Human review', text: 'Outputs are checked for accuracy, text, faces and hands, product details, brand compliance and rights before they are finished.' },
    { title: 'Rights before generation', text: 'We confirm permission for supplied images, footage, voices, logos and data, and choose tools whose terms suit the project.' },
    { title: 'Confidential inputs', text: 'Confidential or restricted material only goes into approved tools, and we agree how it is handled before you share it.' },
    { title: 'Agreed disclosure', text: 'Whether and how AI assistance is disclosed in a deliverable is agreed with you for each use, not assumed.' },
  ],
} as const;

/** V10 §05 row 08 and V11.10 — remote collaboration without implying offices. */
export const collaboration = {
  title: 'One studio, working with teams across time zones.',
  intro: 'We collaborate remotely with clear English, shared review and a written record of every decision. Meeting times are always shown in your own time zone.',
  steps: [
    { title: 'Briefing', text: 'A structured brief and a discovery conversation at a time that suits you.' },
    { title: 'Shared review', text: 'Work is reviewed in shared links and documents, with feedback consolidated into one list.' },
    { title: 'Approvals', text: 'Each stage ends with a clear decision point, recorded in writing.' },
    { title: 'Milestones', text: 'Agreed checkpoints, so everyone knows what is due and when.' },
    { title: 'Handover', text: 'Final files, documentation and access transferred to the people who will own them.' },
  ],
} as const;

/** CI §03 — we are / we are not; personality pairs; primary audiences. */
export const studio = {
  weAre: 'A studio of makers and strategists. Fluent in technology, led by ideas. Accountable for outcomes, not activity.',
  weAreNot: 'A software vendor, a template shop or an AI novelty. We never lead with the tool.',
  personality: [
    ['Intelligent', 'but approachable'],
    ['Premium', 'but not pretentious'],
    ['Innovative', 'but practical'],
    ['Creative', 'but commercially aware'],
    ['Modern', 'but timeless'],
    ['Confident', 'but understated'],
  ] as const,
  audiences: [
    { title: 'Marketing and brand leaders', text: 'A strategic creative partner for brand, campaigns, content or connected digital work.' },
    { title: 'Founders and executive teams', text: 'Turning an idea into a brand, presentation, website, app, content system or prototype.' },
    { title: 'Agencies seeking a technology partner', text: 'Specialist creative, AI, motion or digital capability with clear roles and confidentiality.' },
    { title: 'Public and private institutions', text: 'Modernising how they communicate, with governance, accessibility and accountability.' },
  ],
} as const;

/** V12.03 — engagement models (no prices, no capacity promises). */
export const engagementModels = [
  { title: 'Defined project', text: 'One identifiable outcome, such as an identity, deck, campaign, film, website, app prototype or workflow, with scope, review rounds and exclusions agreed up front.' },
  { title: 'Integrated programme', text: 'Connected strategic and creative work across several services, with one programme owner, milestones and change control.' },
  { title: 'Ongoing creative partner', text: 'Recurring creative, content or digital support with an agreed monthly scope, where studio capacity allows.' },
  { title: 'Agency partnership', text: 'Specialist support for another agency or production company, with confidentiality, client ownership and credits agreed in writing.' },
] as const;
