import type { Insight, InsightBlock } from './types';

/**
 * Editorial. Each article documents the studio's own stated process and
 * governance (V12.02, V12.11, V11.16) rather than unsourced claims. Authored by
 * the studio as an organisation; no individual byline is invented.
 * Dates become final on owner approval (B-15).
 */
const governance = { publish: 'published', approval: 'pending', owner: 'Owner / editorial reviewer' } as const;
const studioAuthor = { name: 'WeAmaze Visionary', kind: 'organisation' } as const;

export const insights: Insight[] = [
  {
    slug: 'human-led-ai-how-we-direct-review-and-stay-accountable',
    title: 'Human-led AI: how we direct, review and stay accountable',
    summary: 'AI can widen what a creative team explores and shorten the path to a finished piece. It does not take responsibility for the result. Here is how we keep people in charge at every stage.',
    category: 'Responsible AI',
    author: studioAuthor,
    publishedAt: '2026-11-04',
    heroImage: 'reviewing-gold-line-artwork',
    body: [
      { type: 'p', text: 'When a client asks whether a piece of work was “made with AI”, the honest answer is usually: partly, and under direction. Generative tools are good at producing options quickly. They are not good at knowing which option is right for your audience, whether a hand has six fingers, or whether a reference image was ever cleared for use. Those judgements stay with people.' },
      { type: 'p', text: 'This article sets out how we work, so you know what to expect before a project starts.' },
      { type: 'h2', id: 'direction', text: 'A named person owns the direction' },
      { type: 'p', text: 'Every project has a creative or technical lead who is responsible for the brief, the direction, every selection and the final approval. AI assists that person. It never replaces the decision.' },
      { type: 'p', text: 'In practice, that means the idea comes first. We agree what the work must achieve, who it is for and how the brand should look and sound before anyone opens a tool. Tool choice follows from the project’s needs, including its rights, data and geography, not the other way round.' },
      { type: 'h2', id: 'workflow', text: 'Six control points in the workflow' },
      { type: 'ol', items: [
        'Brief and permissions: purpose, audience, channels, the rights to every input asset, restricted content and any disclosure requirement.',
        'Creative development: human-led concepts, references, styleframes and narrative, plus the decision about which tools are appropriate.',
        'Generation or build: controlled prompts, approved assets, version tracking, access controls and reproducible settings where possible.',
        'Human review: factual, visual, technical, brand, rights and quality checks, with a list of corrections.',
        'Finishing: compositing, editing, typography, sound, colour, accessibility and adaptation to each format.',
        'Delivery: files, usage notes and credits, plus source or working files where the contract includes them.',
      ] },
      { type: 'h2', id: 'review', text: 'What human review actually checks' },
      { type: 'p', text: 'Review is where most of the craft happens. We look for the problems that generative output commonly introduces:' },
      { type: 'ul', items: [
        'Text and typography inside images, which models often distort.',
        'Faces, hands and bodies, and whether a realistic person could be mistaken for someone real.',
        'Product features, which must never be shown doing something the real product cannot do.',
        'Brand compliance: logos, colours and type come from approved files, never regenerated.',
        'Rights: client-supplied material, likenesses, voices, music, fonts and provider terms.',
      ] },
      { type: 'h2', id: 'confidential', text: 'Confidential material stays in approved tools' },
      { type: 'p', text: 'Before you share anything sensitive, we agree how it will be handled: which tools may process it, who can access it and how long it is kept. Confidential or restricted material only goes into tools approved for that purpose. If a project needs a confidentiality agreement, raise it before sending files.' },
      { type: 'note', title: 'What we do not promise', text: 'We do not claim that every AI output is automatically cleared for every use, or that a provider never retains or trains on data, unless the provider’s current terms and our agreement with you support that statement.' },
      { type: 'h2', id: 'disclosure', text: 'Disclosure is agreed, not assumed' },
      { type: 'p', text: 'Whether and how AI assistance is disclosed depends on the use, the channel and the relevant contract and legal terms. We agree it with you for each deliverable rather than applying one label to everything.' },
      { type: 'h2', id: 'why', text: 'Why this matters to you' },
      { type: 'p', text: 'The value of a creative partner is judgement: knowing what to make, what to keep and what to throw away. AI makes exploration faster and production more flexible. It is the people directing it who make the result yours.' },
      { type: 'p', text: 'If you would like to talk through how this applies to a specific project, [start a project brief](/start-a-project) or [book a conversation](/book-a-call).' },
    ],
    sources: [{ label: 'WeAmaze Visionary AI production governance', note: 'Internal studio process, as described on this page. Not legal advice.' }],
    relatedServices: ['ai-creative-studio', 'ai-solutions-automation', '3d-animation-motion-design'],
    seo: {
      title: 'Human-led AI: how we direct, review and stay accountable',
      description: 'How WeAmaze Visionary uses AI in creative production: a named lead owns direction, six control points, human review checks, confidential inputs and agreed disclosure.',
    },
    governance,
  },
  {
    slug: 'before-you-brief-a-creative-technology-studio',
    title: 'Before you brief a creative technology studio: eight things to prepare',
    summary: 'A good brief saves weeks. You do not need every answer, but thinking through these eight points will make the first conversation far more useful.',
    category: 'Process',
    author: studioAuthor,
    publishedAt: '2026-11-04',
    heroImage: 'two-people-drafting-with-ruler',
    body: [
      { type: 'p', text: 'Most projects that go wrong do so at the start, when nobody has agreed what the work must achieve. You do not need a polished document to brief us; our project builder asks these questions step by step, and “not sure yet” is always an acceptable answer. But a little preparation goes a long way.' },
      { type: 'h2', id: 'objective', text: '1. The objective, in one sentence' },
      { type: 'p', text: 'What should be different when this is finished? “Investors understand why now” is more useful than “a new deck”. If you cannot write it yet, that is what discovery is for.' },
      { type: 'h2', id: 'audience', text: '2. Who it is for' },
      { type: 'p', text: 'Name the people who will see, use or decide on the work, and what they already believe. Different audiences often need different things from the same project.' },
      { type: 'h2', id: 'decisions', text: '3. Who decides' },
      { type: 'p', text: 'List who approves direction, who approves final work and who has a veto. Consolidated feedback from one decision-maker keeps a project moving; contradictory comments from many reviewers slow it down.' },
      { type: 'h2', id: 'assets', text: '4. What you already have, and whether you can use it' },
      { type: 'p', text: 'Brand guidelines, logo files, photography, footage, research, data and previous work. For each, check that you have permission to supply it for this purpose. This matters even more when AI tools are involved.' },
      { type: 'h2', id: 'constraints', text: '5. Constraints' },
      { type: 'p', text: 'Technical systems the work must connect to, accessibility or regulatory requirements, markets and languages, and anything that cannot change.' },
      { type: 'h2', id: 'timing', text: '6. Timing and what it depends on' },
      { type: 'p', text: 'A launch date, an event or a board meeting. Tell us what the date depends on, so we can plan review points backwards from it. A timeline is confirmed in the proposal, not from a form.' },
      { type: 'h2', id: 'budget', text: '7. A sense of investment' },
      { type: 'p', text: 'Sharing a range, even a rough one, helps us suggest the right approach rather than the most expensive one. It is not a quote, and it is optional. Final scope and cost are always confirmed in writing.' },
      { type: 'h2', id: 'success', text: '8. How you will judge success' },
      { type: 'p', text: 'Agreed measures, whether qualitative or quantitative, let both sides know when the work has done its job and what to improve next.' },
      { type: 'note', title: 'What happens next', text: 'After you send a brief, we review it personally and reply to arrange a discovery conversation or ask what is missing. Nothing is binding until a written proposal is agreed.' },
      { type: 'p', text: 'Ready? [Start a project brief](/start-a-project). It takes a few minutes, and you can go back and edit any answer before sending.' },
    ],
    sources: [{ label: 'WeAmaze Visionary project builder and approach', note: 'The questions mirror the studio’s project enquiry steps and its six-stage approach.' }],
    relatedServices: ['brand-strategy-creative-direction', 'websites-digital-experiences', 'ai-presentations-pitch-decks'],
    seo: {
      title: 'What to prepare before briefing a creative studio',
      description: 'Objective, audience, decision-makers, assets and rights, constraints, timing, investment and success measures: what to prepare before a creative brief.',
    },
    governance,
  },
  {
    slug: 'rights-in-ai-assisted-creative-work',
    title: 'Rights in AI-assisted creative work: questions to settle before production',
    summary: 'AI-assisted and third-party media can involve provider terms, copyright, likeness, trademarks, music and stock licences. These are the questions we settle with clients before production starts.',
    category: 'Rights & governance',
    author: studioAuthor,
    publishedAt: '2026-11-04',
    heroImage: 'hand-drafting-geometric-construction',
    body: [
      { type: 'p', text: 'Creative work has always involved rights: photography licences, music sync, fonts, talent releases. AI-assisted production adds new questions, and the answers depend on the project, the tools and the contract. Settling them early avoids surprises at the point of launch.' },
      { type: 'note', title: 'Not legal advice', text: 'This article describes how we approach rights in our projects. It is not legal advice. Project-specific rights, warranties and usage terms belong in a signed agreement, reviewed by your legal advisers where needed.' },
      { type: 'h2', id: 'supplied', text: 'Material you supply' },
      { type: 'p', text: 'Do you have permission to supply each image, video, voice, logo, document and dataset for this purpose? We ask clients not to send assets they do not have rights to use, and the project agreement records who is responsible.' },
      { type: 'h2', id: 'third-party', text: 'Stock and third-party assets' },
      { type: 'p', text: 'For every licensed asset we record the licence type, permitted channels, territory, term, editing rights and whether the licence can be transferred to you.' },
      { type: 'h2', id: 'music-voice', text: 'Music and voice' },
      { type: 'p', text: 'Synchronisation, master, composition, performer and voice permissions are separate rights. Synthetic voices need the same care as recorded ones, and sometimes more.' },
      { type: 'h2', id: 'likeness', text: 'Likeness and synthetic people' },
      { type: 'p', text: 'We do not create or distribute an identifiable person’s likeness or voice without appropriate consent and authority for the intended use. A generated person who looks real still needs thought: could they be mistaken for someone, and does the context imply endorsement?' },
      { type: 'h2', id: 'trademarks', text: 'Trademarks and brand files' },
      { type: 'p', text: 'Client logos and brand assets come from approved files. They are never recreated by an image model, and their use must not imply an endorsement that does not exist.' },
      { type: 'h2', id: 'fonts', text: 'Fonts and software' },
      { type: 'p', text: 'Commercial use, embedding, redistribution and handover terms vary by licence. Where a deliverable includes fonts or software, we provide the licence details.' },
      { type: 'h2', id: 'ownership', text: 'Who owns the deliverable' },
      { type: 'p', text: 'Ownership of final deliverables, source and working files, third-party licences and portfolio rights are defined in the contract. Because AI-provider terms vary by plan and change over time, we review them for each project instead of promising universal ownership.' },
      { type: 'h2', id: 'portfolio', text: 'Portfolio publication' },
      { type: 'p', text: 'We only publish client work, names, logos, quotes or results with written permission. Work created internally is labelled as a studio concept so it is never mistaken for a client commission.' },
      { type: 'h2', id: 'checklist', text: 'A short checklist' },
      { type: 'ul', items: [
        'Have we listed every input asset and confirmed permission for each?',
        'Do the chosen tools’ current terms suit this project’s commercial use and data?',
        'Are any real or realistic people, voices or brands involved, and do we have consent?',
        'Which licences need to transfer to the client at handover?',
        'Has the agreement defined ownership, source files and portfolio rights?',
      ] },
      { type: 'p', text: 'If your project raises any of these questions, mention it in your [project brief](/start-a-project) and we will address it in discovery.' },
    ],
    sources: [{ label: 'WeAmaze Visionary rights and publication controls', note: 'Studio project controls for client-supplied assets, third-party licences, likeness, trademarks, fonts and ownership. Not legal advice.' }],
    relatedServices: ['ai-creative-studio', 'brand-strategy-creative-direction', '3d-animation-motion-design'],
    seo: {
      title: 'Rights in AI-assisted creative work: what to settle first',
      description: 'Supplied assets, stock licences, music and voice, likeness, trademarks, fonts, ownership and portfolio rights: the questions to settle before AI-assisted production.',
    },
    governance,
  },
  {
    slug: 'what-an-ai-creative-studio-does',
    title: 'What an AI creative studio does, and when to hire one',
    summary: 'An AI creative studio uses generative tools inside a human-led creative process. Here is what that means in practice, what you can expect to receive, and when it is the right partner for the work.',
    category: 'Process',
    author: studioAuthor,
    publishedAt: '2026-11-07',
    heroImage: 'pair-reviewing-work-on-screen',
    body: [
      { type: 'p', text: '“AI creative studio” can mean almost anything, from a single person with a prompt to a full production team. The useful question is not whether a studio uses AI, but who directs the work, who checks it and who is accountable for the result.' },
      { type: 'h2', id: 'definition', text: 'A working definition' },
      { type: 'p', text: 'An AI creative studio is a creative team that uses generative and intelligent tools as part of its craft: to explore ideas, make imagery, film and motion, build interfaces and automate repetitive work. People set the direction, choose what is kept and finish the work. The tools widen what a small senior team can explore and make; they do not replace its judgement.' },
      { type: 'h2', id: 'what-you-get', text: 'What you can expect to receive' },
      { type: 'ul', items: [
        'Strategy and direction: what the work must achieve, for whom, and how the brand should look and sound.',
        'Films, campaigns and content directed by people and produced with generative craft where it serves the idea.',
        'Presentations and pitch decks that make a case clearly.',
        'Websites, apps and digital products designed and built to a standard you can maintain.',
        'Automation and AI assistants that remove repetitive steps from your workflows.',
        'Usage notes and credits with every delivery, so you know what you can do with the work.',
      ] },
      { type: 'h2', id: 'when', text: 'When it is the right partner' },
      { type: 'ul', items: [
        'You need distinctive work at a pace that traditional production makes difficult.',
        'You want several directions explored before committing to one.',
        'The work spans more than one discipline, such as a brand film, a pitch deck and a website for the same launch.',
        'You need the rights in AI-assisted work settled before production, not after.',
      ] },
      { type: 'h2', id: 'when-not', text: 'When it is not' },
      { type: 'p', text: 'If the work depends on filming real people in a real place, a traditional production partner may be the better lead, with generative work used for previsualisation or finishing. A good studio will tell you so in the first conversation.' },
      { type: 'h2', id: 'questions', text: 'Questions to ask any AI creative studio' },
      { type: 'ol', items: [
        'Who owns the creative direction, and who approves each output?',
        'How is generated work reviewed for errors, likeness, trademarks and brand compliance?',
        'Which tools will process our material, and how is confidential material handled?',
        'What rights transfer to us at handover, and what is excluded?',
        'How is AI assistance disclosed, if at all, for each channel?',
      ] },
      { type: 'p', text: 'Our own answers are set out in [Human-led AI](/insights/human-led-ai-how-we-direct-review-and-stay-accountable). To talk about a specific project, [start a project brief](/start-a-project) or [book a discovery call](/book-a-call) in your own time zone.' },
    ],
    sources: [{ label: 'WeAmaze Visionary services and production governance', note: 'How this studio defines and runs its work, as described across this website. Not legal advice.' }],
    relatedServices: ['ai-creative-studio', 'brand-strategy-creative-direction', 'ai-solutions-automation'],
    seo: {
      title: 'What an AI creative studio does, and when to hire one',
      description: 'What an AI creative studio is, what you should receive, when it is the right partner, and five questions to ask before you hire one.',
    },
    governance,
  },
  {
    slug: 'what-shapes-the-cost-of-an-ai-assisted-brand-film',
    title: 'What shapes the cost of an AI-assisted brand film',
    summary: 'AI changes where the effort goes in a brand film, not whether there is effort. These are the decisions that move the cost, so you can shape a brief that fits your budget.',
    category: 'Process',
    author: studioAuthor,
    publishedAt: '2026-11-07',
    heroImage: 'layout-review-laptop-and-screen',
    body: [
      { type: 'p', text: 'Generative tools can make a brand film faster to explore and more flexible to produce. They do not make it free: direction, review, sound, finishing and rights still take skilled time. Knowing what drives that time lets you decide where to spend.' },
      { type: 'h2', id: 'drivers', text: 'The decisions that move the cost' },
      { type: 'ol', items: [
        'Length and shot count. A 15-second film with eight shots is a different job from a 30-second film with fifteen. Each shot is directed, generated or built, reviewed and finished.',
        'Realism. Stylised worlds forgive more than photoreal ones. The closer a film comes to real people, products and places, the more review and correction it needs.',
        'People and likeness. Realistic characters must not resemble real people without consent. Keeping characters consistent from shot to shot takes extra work.',
        'Your product on screen. A real product must look and behave exactly as it does. That usually means supplied assets or 3D, not generation.',
        'Sound. Original music, licensed tracks, voice-over and sound design each carry their own cost and terms.',
        'Versions. Cut-downs, aspect ratios for each channel, languages, captions and end cards multiply finishing time.',
        'Revision rounds. Agreeing the storyboard before production is the cheapest place to change your mind.',
      ] },
      { type: 'h2', id: 'storyboard', text: 'Why the storyboard matters most' },
      { type: 'p', text: 'A storyboard with timing, lines, sound and camera notes for every shot turns a brief into a plan both sides can price. The case-study films on this site began that way, and the finished films follow their boards closely.' },
      { type: 'h2', id: 'quote', text: 'How to get an accurate quote' },
      { type: 'ul', items: [
        'Share where the film will run, and in which formats.',
        'Say how real it needs to look, and whether real people or products appear.',
        'Say what you already have: logos, product files, music, footage.',
        'Give a budget range if you have one. It shapes options; it is not a commitment.',
      ] },
      { type: 'p', text: 'We estimate every project after understanding its scope, and the proposal states its assumptions, exclusions and third-party costs. [Start a project brief](/start-a-project) to get one.' },
    ],
    sources: [{ label: 'WeAmaze Visionary film production practice', note: 'How this studio scopes AI-assisted films, as shown in the storyboards and films on this site. No prices are given because every project is estimated on its scope.' }],
    relatedServices: ['ai-creative-studio', '3d-animation-motion-design'],
    seo: {
      title: 'What shapes the cost of an AI-assisted brand film',
      description: 'Length, realism, likeness, product accuracy, sound, versions and revision rounds: the decisions that move the cost of an AI-assisted brand film, and how to brief for a quote.',
    },
    governance,
  },
];

export const publishedInsights = insights
  .filter((i) => i.governance.publish === 'published')
  .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
export function getInsight(slug: string): Insight | undefined {
  return publishedInsights.find((i) => i.slug === slug);
}
const textOf = (b: InsightBlock): string =>
  b.type === 'ul' || b.type === 'ol' ? b.items.join(' ') : b.type === 'note' ? `${b.title} ${b.text}` : b.text;
/** Reading time at 220 words per minute. */
export function readingMinutes(i: Insight): number {
  const words = i.body.map(textOf).join(' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}
