import type { Service } from './types';

/**
 * The eight CI capabilities (CI §18, V10 §06). Names and descriptors are exact.
 * Copy is written from the CI manual and briefs only: no client names, numbers,
 * durations, prices or tool brands. All records await owner approval (B-15).
 */
const governance = { publish: 'published', approval: 'pending', owner: 'Owner / service lead' } as const;

const rightsFaq = {
  id: 'ownership',
  question: 'Who owns the finished work?',
  answer:
    'Ownership, licences, source files and portfolio rights are set out in the project agreement. Third-party assets, fonts, music and AI-provider terms can affect what can be transferred, so we review them for each project rather than make a blanket promise.',
};
const timingFaq = {
  id: 'timing',
  question: 'How long does a project take?',
  answer:
    'It depends on scope, the number of review rounds and how quickly decisions can be made. We confirm a timeline with review points in a written proposal after discovery, not before.',
};
const costFaq = {
  id: 'cost',
  question: 'How is the work priced?',
  answer:
    'Each engagement is estimated after we understand the scope. The proposal states assumptions, exclusions, third-party costs and how long the estimate is valid. Any budget you share in a brief helps us shape options; it is not a quote.',
};

export const services: Service[] = [
  {
    slug: 'ai-creative-studio',
    order: 1,
    name: 'AI Creative Studio',
    shortName: 'Creative Studio',
    descriptor: 'Campaigns, content and brand worlds made with human direction and generative craft.',
    outcome: 'Distinctive campaigns, films and visual worlds, directed by people and produced with generative tools where they serve the idea.',
    problem: [
      'You need campaign ideas, content or a visual world that feels like your brand and nobody else’s, and you need it at a pace that traditional production makes difficult.',
      'Generative tools promise speed, but unguided output tends to look generic, drift off-brand and raise questions about rights. Speed without direction is not useful.',
    ],
    whatWeDo: [
      'We start with the idea: what the audience should feel, believe or do, and how the brand should look and sound while it happens. Creative direction comes before any tool is opened.',
      'From there we develop concepts, references and styleframes, then use AI-assisted image and video generation alongside design, editing, compositing and sound to explore further and produce faster. Every output is selected, corrected and finished by people.',
    ],
    deliverables: [
      { group: 'Concept and direction', items: ['Campaign concepts and creative routes', 'Art direction and styleframes', 'Storyboards and animatics'] },
      { group: 'Production', items: ['AI-assisted imagery and video', 'Branded films and short-form edits', 'Product visualisation', 'Social and campaign asset suites'] },
      { group: 'Finishing', items: ['Editing, compositing and colour', 'Typography and brand compliance', 'Format adaptation for each channel'] },
    ],
    process: [
      { stage: 'Brief and permissions', detail: 'Purpose, audience, channels, the assets you can supply and any restricted content or disclosure requirements.' },
      { stage: 'Creative development', detail: 'Human-led concepts, references and styleframes, and a decision on which tools suit the project’s rights and data needs.' },
      { stage: 'Generation and build', detail: 'Controlled production using approved assets, with version tracking and access controls.' },
      { stage: 'Human review', detail: 'Visual, factual, brand, technical and rights checks before anything is presented as final.' },
      { stage: 'Finishing and delivery', detail: 'Editing, sound, colour and accessibility, then masters in the agreed formats with usage notes.' },
    ],
    clientInputs: ['Brand guidelines and approved logo files', 'Any footage, images or voices you have the right to supply', 'A decision-maker for creative approvals', 'Channel and format requirements'],
    humanRole: {
      title: 'What people direct and check',
      points: [
        'The idea, the creative route and every final selection.',
        'Faces, hands, text, product details and brand compliance in every frame.',
        'Rights: client-supplied assets, likenesses, voices, music and provider terms.',
        'Whether and how AI assistance is disclosed, agreed with you for each use.',
      ],
    },
    boundaries: [
      'Media buying and paid placement are not included unless agreed.',
      'Licensed music, stock and talent are third-party costs, cleared per project.',
      'We do not promise that any AI output is automatically cleared for every use.',
    ],
    faqs: [
      { id: 'how-much-ai', question: 'How much of the work is made with AI?', answer: 'It varies by project. Some work uses generative tools heavily during exploration and production; some barely uses them. People always set the direction, choose what is kept and finish the work.' },
      { id: 'likeness', question: 'Can you create realistic people or voices?', answer: 'Only with the appropriate consent and releases for the intended use. We will not generate or alter identifiable real people in ways that imply endorsement or events that did not happen.' },
      { id: 'own-assets', question: 'Can we supply our own footage and images?', answer: 'Yes. Please only supply material you have permission to use. If something is confidential, raise it before sharing so we can agree an approved way to handle it.' },
      rightsFaq,
      timingFaq,
    ],
    related: ['3d-animation-motion-design', 'brand-strategy-creative-direction', 'ai-presentations-pitch-decks'],
    image: 'team-reviewing-printed-frames',
    seo: {
      title: 'AI Creative Studio — human-led AI films',
      description: 'Campaigns, branded films and visual worlds directed by people and produced with generative craft. Concepts, styleframes, AI-assisted video and finishing.',
    },
    governance,
  },
  {
    slug: 'ai-presentations-pitch-decks',
    order: 2,
    name: 'AI Presentations & Pitch Decks',
    shortName: 'Presentations',
    descriptor: 'Investor, sales and leadership narratives designed to persuade.',
    outcome: 'Presentations that make a complex case clear, with a narrative, information design and editable files your team can keep using.',
    problem: [
      'An important decision is about to be made in a room, on a call or in a reader’s inbox, and your material is not yet doing the work. The argument is buried, the data is hard to read or the deck looks like everyone else’s.',
    ],
    whatWeDo: [
      'We shape the argument first: who must be persuaded, what they already believe and what they need to see, in what order. Then we design the information so each page carries one clear idea.',
      'AI tools help us explore structures, draft visual options and produce supporting imagery quickly. Facts, figures and claims come from you and are checked by people before they appear on a slide.',
    ],
    deliverables: [
      { group: 'Narrative', items: ['Storyline and page-by-page structure', 'Key messages and headline writing', 'Data storytelling'] },
      { group: 'Design', items: ['Investor and pitch decks', 'Sales and executive presentations', 'Proposals and company profiles', 'Reports'] },
      { group: 'Handover', items: ['Editable master files and templates', 'Presenter notes where agreed', 'Export formats for sharing and print'] },
    ],
    process: [
      { stage: 'Discover', detail: 'Audience, objective, decision context, existing material and the facts that must be proved.' },
      { stage: 'Define', detail: 'Storyline and structure, agreed before visual design begins.' },
      { stage: 'Design', detail: 'Visual direction on key pages first, then the full document.' },
      { stage: 'Create and review', detail: 'Production in agreed review rounds, with fact and figure checks by people.' },
      { stage: 'Handover', detail: 'Editable files, templates and exports in the formats your team uses.' },
    ],
    clientInputs: ['Your existing materials and data', 'A named owner for facts and figures', 'Brand guidelines and templates you already use', 'The software your team will edit in'],
    humanRole: {
      title: 'What people are responsible for',
      points: ['The argument and the order it is told in.', 'Accuracy of every number, name and claim.', 'Final layout, typography and brand compliance.'],
    },
    boundaries: ['We design and write from facts you supply. We do not verify financial models or legal statements.', 'Translation is out of scope unless agreed and professionally reviewed.'],
    faqs: [
      { id: 'editable', question: 'Will we be able to edit the deck ourselves?', answer: 'Yes. Editable files in the presentation software your team uses are part of the handover, unless we agree otherwise in the proposal.' },
      { id: 'data', question: 'Can you work with our financial or sales data?', answer: 'Yes, as long as we agree how confidential material is handled before you share it. We design and visualise the data you provide; you remain responsible for its accuracy.' },
      { id: 'revisions', question: 'How many revisions are included?', answer: 'Review rounds are defined in each proposal so that everyone knows when feedback is due and what happens after the last round.' },
      timingFaq,
    ],
    related: ['brand-strategy-creative-direction', 'ai-creative-studio', 'websites-digital-experiences'],
    image: 'meeting-room-presentation-discussion',
    seo: {
      title: 'AI Pitch Decks & Presentations',
      description: 'Pitch decks, sales and leadership presentations, proposals and company profiles. Narrative first, clear information design and editable files at handover.',
    },
    governance,
  },
  {
    slug: 'websites-digital-experiences',
    order: 3,
    name: 'Websites & Digital Experiences',
    shortName: 'Digital Experiences',
    descriptor: 'Websites, platforms and interactive experiences built for performance.',
    outcome: 'Websites and digital experiences that make your offer clear, work for every visitor and give your team control after launch.',
    problem: [
      'Your website should explain what you do, earn trust and turn the right visitors into conversations. Too often it is slow, hard to update, difficult to use with a keyboard or screen reader, or simply unclear.',
    ],
    whatWeDo: [
      'We begin with the people who will use the site and what they need to do, then design the structure, content and journeys before any visual polish. Design and build happen together so the finished site behaves the way it was designed.',
      'We build for accessibility, performance and search from the start, connect the systems you rely on and hand over a site your team can maintain.',
    ],
    deliverables: [
      { group: 'Strategy and UX', items: ['Discovery and audience research', 'Sitemap, journeys and content structure', 'Wireframes and prototypes'] },
      { group: 'Design and build', items: ['Corporate, campaign and portfolio sites', 'Landing pages', 'E-commerce experiences', 'UX/UI design systems'] },
      { group: 'Foundations', items: ['Content management set-up', 'Accessibility (WCAG 2.2 AA target)', 'SEO and analytics foundations', 'Integrations with forms, CRM and booking tools'] },
    ],
    process: [
      { stage: 'Discover', detail: 'Goals, audiences, current site, content, systems and constraints.' },
      { stage: 'Define', detail: 'Sitemap, journeys, content model, integrations and success measures.' },
      { stage: 'Design', detail: 'Wireframes for desktop and mobile, then high-fidelity design and a clickable prototype.' },
      { stage: 'Create', detail: 'Build, content entry, integration and testing across devices, browsers and assistive technology.' },
      { stage: 'Launch and evolve', detail: 'Release, redirects, search console set-up, training and agreed ongoing support.' },
    ],
    clientInputs: ['Access to your domain, hosting and existing analytics', 'Content owners and approvers', 'Accounts for the systems to integrate', 'Legal text reviewed by your advisers'],
    boundaries: [
      'Hosting, domains, CMS and third-party service fees are paid to those providers.',
      'Legal wording for privacy, terms and cookies must come from your legal advisers.',
      'No one can guarantee search rankings. We build the technical and content foundations that give a site the best chance to perform.',
    ],
    faqs: [
      { id: 'cms', question: 'Will we be able to update the site ourselves?', answer: 'That is the goal. We recommend a content-management approach based on who edits, how often and what it costs to run, then train your team on it.' },
      { id: 'seo', question: 'Can you guarantee first place on Google?', answer: 'No, and nobody honestly can. We build crawlable pages, clear content, correct metadata and good performance, and we help you set up Search Console so progress can be measured.' },
      { id: 'accessibility', question: 'Is accessibility included?', answer: 'Yes. We design and test against WCAG 2.2 AA, including keyboard use, screen readers, contrast, zoom and reduced motion. We report what was tested rather than claiming certification.' },
      { id: 'support', question: 'Do you support the site after launch?', answer: 'Ongoing support can be agreed as part of the proposal, with a defined scope and cadence.' },
      costFaq,
    ],
    related: ['apps-digital-products', 'brand-strategy-creative-direction', 'ai-solutions-automation'],
    image: 'layout-review-laptop-and-screen',
    seo: {
      title: 'Websites & Digital Experiences',
      description: 'Corporate, campaign and portfolio websites, landing pages and e-commerce. UX-led design, accessible builds, CMS, SEO and analytics foundations.',
    },
    governance,
  },
  {
    slug: 'apps-digital-products',
    order: 4,
    name: 'Apps & Digital Products',
    shortName: 'Digital Products',
    descriptor: 'Mobile and web products, from concept and interface to launch.',
    outcome: 'Useful digital products, shaped through research and prototypes before they are built, so effort goes into what people actually need.',
    problem: [
      'You have an idea for a service, tool or app, or an existing product that people find hard to use. Building the wrong thing is the most expensive mistake a product can make.',
    ],
    whatWeDo: [
      'We map the people, jobs and journeys first, then prototype the experience so it can be tested before full investment. We are clear about what a prototype proves and what it does not.',
      'When the direction is right, we design the interface and work through build, testing and release, with documentation for whoever maintains it next.',
    ],
    deliverables: [
      { group: 'Product definition', items: ['Product strategy and scope', 'User journeys and service maps', 'Interactive prototypes'] },
      { group: 'Design', items: ['UX/UI design and design systems', 'Web apps and mobile experiences', 'Dashboards and portals'] },
      { group: 'Delivery', items: ['Build or build support', 'Integrations', 'Usability and accessibility testing', 'Release planning and handover documentation'] },
    ],
    process: [
      { stage: 'Discover', detail: 'Who the product is for, the problem it solves and the constraints it must respect.' },
      { stage: 'Define', detail: 'Scope, platform, priorities and what the first release must prove.' },
      { stage: 'Design', detail: 'Journeys, prototypes and interface design, tested with representative users where possible.' },
      { stage: 'Create', detail: 'Build, integration and testing, with clear boundaries between prototype and production code.' },
      { stage: 'Launch and evolve', detail: 'Release, measurement and an agreed roadmap for iteration.' },
    ],
    clientInputs: ['A product owner who can make decisions', 'Access to users or customers for research and testing', 'Technical constraints and existing systems', 'App store and platform accounts where relevant'],
    boundaries: ['App store fees, hosting and third-party services are paid to those providers.', 'A prototype is a learning tool, not a production system, unless scoped and built as one.'],
    faqs: [
      { id: 'prototype-vs-mvp', question: 'What is the difference between a prototype and a first release?', answer: 'A prototype tests whether an experience works and is worth building. A first release is production software that real users rely on. We agree in writing which one we are making.' },
      { id: 'platforms', question: 'Do you build native or web apps?', answer: 'The platform is chosen from your users’ needs, your budget and who will maintain the product. We recommend an approach in the proposal and explain the trade-offs.' },
      { id: 'maintenance', question: 'Who maintains the product after launch?', answer: 'That is agreed up front. We document the product for your team or a partner, and ongoing support can be scoped separately.' },
      rightsFaq,
    ],
    related: ['websites-digital-experiences', 'digital-innovation-technology', 'ai-solutions-automation'],
    image: 'mobile-interface-on-stone',
    seo: {
      title: 'Apps & Digital Products — UX/UI design',
      description: 'Web apps, mobile experiences, dashboards and portals, from product strategy and prototypes to interface design, build and release.',
    },
    governance,
  },
  {
    slug: 'ai-solutions-automation',
    order: 5,
    name: 'AI Solutions & Automation',
    shortName: 'AI Solutions',
    descriptor: 'Intelligent workflows, assistants and automation that remove friction.',
    outcome: 'Workflows, assistants and automations that remove repetitive work, with human oversight, data controls and evaluation built in.',
    problem: [
      'Manual, repetitive or fragmented processes slow your team down: copying between systems, answering the same questions, assembling content by hand. You want AI to help, but you also need to know where your data goes and who checks the result.',
    ],
    whatWeDo: [
      'We map the workflow as it really runs today, find the steps where automation helps and is safe, and design where people stay in the loop. Then we build and connect the solution using approved tools and integrations.',
      'Before anything goes live we agree how it will be evaluated and monitored, so you can tell whether it is working and switch it off if it is not.',
    ],
    deliverables: [
      { group: 'Discovery', items: ['Workflow mapping', 'Opportunity and risk assessment', 'Data and security requirements'] },
      { group: 'Build', items: ['Assistants and knowledge search', 'Content operations workflows', 'Automation and approved integrations'] },
      { group: 'Operation', items: ['Evaluation criteria and testing', 'Monitoring and human review steps', 'Documentation and team training'] },
    ],
    process: [
      { stage: 'Discover', detail: 'How the work happens now, who does it and where the friction is.' },
      { stage: 'Define', detail: 'Which steps to automate, which stay human, and the data, security and approval rules.' },
      { stage: 'Design', detail: 'The workflow, interfaces and fallbacks when the automation is unsure.' },
      { stage: 'Create', detail: 'Build, integrate and evaluate against agreed test cases.' },
      { stage: 'Launch and evolve', detail: 'Controlled roll-out, monitoring, adoption support and iteration.' },
    ],
    clientInputs: ['People who do the work today', 'Access to the systems involved', 'Your data-handling and security requirements', 'An owner for the workflow after launch'],
    humanRole: {
      title: 'Where people stay in control',
      points: ['Approving the data a system may use.', 'Reviewing outputs where errors would matter.', 'Owning the workflow, its monitoring and the decision to change it.'],
    },
    boundaries: [
      'AI provider, platform and API usage fees are paid to those providers.',
      'We only use client data with approved tools and an agreed basis. We do not make blanket promises about provider training or retention beyond what current terms support.',
    ],
    faqs: [
      { id: 'data', question: 'What happens to our data?', answer: 'We agree which tools may process which data before any is shared, based on the provider’s current terms, your requirements and your contract with us. Confidential material only goes into approved tools.' },
      { id: 'accuracy', question: 'What if the AI gets something wrong?', answer: 'We design for it: confidence thresholds, human review where mistakes matter, clear fallbacks and monitoring. Automation is evaluated before launch and watched afterwards.' },
      { id: 'existing-tools', question: 'Can you work with the tools we already use?', answer: 'Often, yes. Integration options depend on what your systems allow; we confirm them during discovery.' },
      timingFaq,
    ],
    related: ['digital-innovation-technology', 'apps-digital-products', 'websites-digital-experiences'],
    image: 'pair-reviewing-work-on-screen',
    seo: {
      title: 'AI Solutions & Workflow Automation',
      description: 'Workflow mapping, AI assistants, knowledge search and automation with approved integrations, human oversight, evaluation and monitoring.',
    },
    governance,
  },
  {
    slug: '3d-animation-motion-design',
    order: 6,
    name: '3D, Animation & Motion Design',
    shortName: '3D & Motion',
    descriptor: 'Three-dimensional design, animation and motion systems for every screen.',
    outcome: '3D, animation and motion that explain, visualise and bring a story to life, delivered in the formats each screen needs.',
    problem: [
      'Some ideas are hard to show with photography or words: a product that does not exist yet, a process that happens inside a machine or a brand that needs to move consistently across every screen.',
    ],
    whatWeDo: [
      'We storyboard first, so timing and meaning are agreed before production. Then we design, model, animate, render and finish, using AI-assisted tools where they speed up exploration or production without compromising control.',
      'For brands, we can define motion principles and reusable elements so movement stays consistent across channels.',
    ],
    deliverables: [
      { group: 'Design', items: ['3D design and product visualisation', 'Storyboards and styleframes', 'Motion principles for brands'] },
      { group: 'Production', items: ['2D and 3D animation', 'Motion graphics', 'VFX and compositing'] },
      { group: 'Delivery', items: ['Cut-downs for each channel', 'Masters in agreed formats', 'Usage notes and credits'] },
    ],
    process: [
      { stage: 'Storyboard', detail: 'Narrative, timing and key frames agreed before production starts.' },
      { stage: 'Design', detail: 'Look development, styleframes and, where needed, 3D models.' },
      { stage: 'Production', detail: 'Animation, render and review at agreed checkpoints.' },
      { stage: 'Post', detail: 'Compositing, sound, colour and finishing.' },
      { stage: 'Delivery', detail: 'Formats, cut-downs and usage rights confirmed.' },
    ],
    clientInputs: ['Product data, CAD or reference where relevant', 'Brand guidelines', 'Channel and format specifications', 'A decision-maker for storyboard approval'],
    boundaries: ['Licensed music, voice-over talent and stock are third-party costs.', 'Changes after storyboard approval may affect timing and cost; these are handled through agreed change control.'],
    faqs: [
      { id: 'formats', question: 'Which formats do you deliver?', answer: 'Formats are agreed per project from the channels the work will run on, including aspect ratios, durations and file types.' },
      { id: 'music', question: 'Is music included?', answer: 'Music and voice can be arranged, but they are licensed per project and the licence terms decide where and how long the work can be used.' },
      rightsFaq,
      timingFaq,
    ],
    related: ['ai-creative-studio', 'brand-strategy-creative-direction', 'apps-digital-products'],
    image: 'film-frame-structure-and-light',
    seo: {
      title: '3D, Animation & Motion Design',
      description: '3D design and product visualisation, 2D/3D animation, motion graphics, VFX and compositing, from storyboard to channel-ready masters.',
    },
    governance,
  },
  {
    slug: 'brand-strategy-creative-direction',
    order: 7,
    name: 'Brand Strategy & Creative Direction',
    shortName: 'Brand Strategy',
    descriptor: 'Positioning, identity and creative leadership that give brands direction.',
    outcome: 'A clear position, a distinctive identity and the creative leadership to keep every touchpoint consistent.',
    problem: [
      'Your brand says different things in different places, looks like its competitors or no longer reflects what the business has become. Without a clear position, every piece of creative work starts from zero.',
    ],
    whatWeDo: [
      'We research the market, the audience and the business, then define a position and the messages that support it. From that we develop identity direction and a creative platform that campaigns, content and products can build on.',
      'We document the system so others can use it well, and can stay on as creative directors to guide how it rolls out.',
    ],
    deliverables: [
      { group: 'Strategy', items: ['Research and audience insight', 'Positioning and messaging hierarchy', 'Brand narrative'] },
      { group: 'Identity', items: ['Identity direction and logo systems', 'Typography, colour and graphic language', 'Brand guidelines'] },
      { group: 'Leadership', items: ['Campaign platform', 'Rollout planning', 'Creative direction and governance'] },
    ],
    process: [
      { stage: 'Discover', detail: 'Stakeholder interviews, audience insight and a review of the market and current brand.' },
      { stage: 'Define', detail: 'Positioning, messaging and the creative platform, agreed with decision-makers.' },
      { stage: 'Design', detail: 'Identity routes, refinement and a tested system across key applications.' },
      { stage: 'Create', detail: 'Guidelines, master artwork and launch applications.' },
      { stage: 'Evolve', detail: 'Rollout support and creative direction as the brand is used.' },
    ],
    clientInputs: ['Access to leadership and key stakeholders', 'Existing research, brand materials and performance data', 'A decision process for approving direction'],
    boundaries: ['A brand similarity review is not a legal trademark clearance. Registration should go through a trademark attorney.'],
    faqs: [
      { id: 'research', question: 'Do you run customer research?', answer: 'Research is scoped per project. It can range from stakeholder interviews and existing data to direct audience conversations, depending on what the decision needs.' },
      { id: 'trademark', question: 'Will you check that a new name or logo is available?', answer: 'We can review visual similarity at design level, but that is not legal clearance. We recommend a formal trademark search and registration through an attorney before commercial release.' },
      { id: 'guidelines', question: 'What do brand guidelines include?', answer: 'The scope is agreed in the proposal. Typically it covers the logo family, colour, typography, graphic elements, imagery, tone of voice and key applications.' },
      timingFaq,
    ],
    related: ['ai-creative-studio', 'ai-presentations-pitch-decks', 'websites-digital-experiences'],
    image: 'strategy-session-with-colour-swatches',
    seo: {
      title: 'Brand Strategy & Creative Direction',
      description: 'Research, positioning, messaging, identity direction, campaign platforms and brand guidelines, with creative direction through rollout.',
    },
    governance,
  },
  {
    slug: 'digital-innovation-technology',
    order: 8,
    name: 'Digital Innovation & Technology',
    shortName: 'Innovation',
    descriptor: 'Emerging technology prototypes and innovation programmes.',
    outcome: 'New digital capabilities explored, prototyped and tested, with an honest account of what has been validated and what has not.',
    problem: [
      'You see an opportunity in a new technology but cannot yet tell whether it is worth the investment. You need evidence quickly, without committing to a full build.',
    ],
    whatWeDo: [
      'We frame the opportunity as a question that can be tested, assess feasibility and build the smallest prototype or pilot that answers it. We separate what has been proven from what is still exploratory.',
      'If the answer is yes, we plan the integration and roadmap; if it is no, you have learned that cheaply.',
    ],
    deliverables: [
      { group: 'Framing', items: ['Opportunity framing', 'Feasibility assessment', 'Technical dependencies and risks'] },
      { group: 'Testing', items: ['Prototypes and proofs of concept', 'Pilots with real users', 'Findings and recommendations'] },
      { group: 'Next steps', items: ['Integration planning', 'Product roadmaps', 'Handover to product or engineering teams'] },
    ],
    process: [
      { stage: 'Frame', detail: 'Turn the opportunity into a question, success criteria and constraints.' },
      { stage: 'Assess', detail: 'Technical feasibility, data, security and cost considerations.' },
      { stage: 'Prototype', detail: 'Build the smallest thing that can answer the question.' },
      { stage: 'Test', detail: 'Pilot with real users or data where possible; record what was learned.' },
      { stage: 'Decide', detail: 'Recommend whether to stop, iterate or invest, with a roadmap if it proceeds.' },
    ],
    clientInputs: ['A sponsor who owns the question', 'Access to data, systems or users needed for testing', 'Clear constraints on security and budget'],
    boundaries: ['A prototype or pilot is not production-ready software unless it is scoped and built that way.', 'Platform and API usage costs are paid to those providers.'],
    faqs: [
      { id: 'validated', question: 'How do we know if a prototype has worked?', answer: 'Success criteria are agreed at the start. At the end we report against them, including what remains unproven.' },
      { id: 'production', question: 'Can a prototype become the real product?', answer: 'Sometimes, but usually it should not. We say clearly which parts can be reused and what needs to be rebuilt for production.' },
      costFaq,
    ],
    related: ['ai-solutions-automation', 'apps-digital-products', 'websites-digital-experiences'],
    image: 'hand-drafting-geometric-construction',
    seo: {
      title: 'Digital Innovation — prototypes & pilots',
      description: 'Opportunity framing, feasibility, prototypes, pilots, integration planning and product roadmaps for new digital capabilities.',
    },
    governance,
  },
];

export const publishedServices = services.filter((s) => s.governance.publish === 'published').sort((a, b) => a.order - b.order);
export function getService(slug: string): Service | undefined {
  return publishedServices.find((s) => s.slug === slug);
}
export { serviceName } from './serviceIndex';
