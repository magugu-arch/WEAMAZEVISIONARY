import type { Project } from './types';

/**
 * Portfolio. Every item carries a provenance label (V10 §08). Client work is
 * owner-supplied material (7 Nov 2026), written up only from what it shows: no
 * metrics, outcomes, quotes or dates are added, and publication waits on written
 * permission (B-14). Studio concepts are internally created, not paid commissions.
 */
const governance = { publish: 'published', approval: 'pending', owner: 'Owner / creative director' } as const;

export const projects: Project[] = [
  {
    slug: 'digitfms-nothing-moves-unseen',
    title: 'DigitFMS: Nothing moves unseen',
    sector: 'Fleet management and security',
    services: ['brand-strategy-creative-direction', '3d-animation-motion-design'],
    status: 'client-work',
    summary: 'A 30-second TVC that turns six security services into one journey: a single truck, watched over from the first turn of the key to sunrise, under one line. Nothing moves unseen.',
    scope: 'TVC storyboard, voice-over script and a 30-second film with an end card.',
    context: [
      'DigitFMS brings together fleet tracking, fuel intelligence, AI CCTV, access control, 24/7 monitoring and response. The film had to introduce all six to business owners in thirty seconds and end on one action: book a free security assessment.',
    ],
    challenge: [
      'Security and telematics are usually sold with dashboards and feature lists. Six services in thirty seconds can easily become a list, and a list does not make anyone feel what is at stake.',
    ],
    insight: [
      'What an owner wants is not more data but certainty: knowing what is happening while there is still time to act. The script says it plainly: “The difference is knowing what is happening, now.”',
    ],
    idea: [
      'Nothing moves unseen. Follow one truck through one journey and let each service appear at the moment it matters: a route deviation on the highway, a fuel drop at the pump, a number plate at the gate. The film opens on a human eye and closes on the logo with a single call to action, so the system reads as attention rather than surveillance.',
    ],
    execution: [
      'Fifteen shots in thirty seconds, each specified in the storyboard with its line, sound and lens: a 100 mm macro for the eye, a 120 fps insert for the ignition, low chase rigs for scale and a CCTV insert for access control.',
      'One colour carries every alert. A red line traces the deviated route, labels the fuel drop and frames the number plate; everything else stays in dusk blues and sodium light, so the eye goes where the system is looking.',
      'Sound follows the same logic: a single alert pulse, a low electronic rise in the control room and the music peaking as the system takes over, under a short, plain voice-over. The end card carries one action: Book your free security assessment.',
    ],
    deliverables: ['30-second TVC, 16:9', 'TVC storyboard with timing, voice-over, sound and camera notes', 'End card with call to action'],
    outcome: null,
    credits: [
      { role: 'Storyboard and film', name: 'WeAmaze Visionary' },
      { role: 'Client', name: 'DigitFMS' },
    ],
    heroImage: 'digitfms-frame-truck-at-dawn',
    gallery: [
      { image: 'digitfms-frame-eye', caption: '“Every business has something worth protecting.” The film opens on a human eye.' },
      { image: 'digitfms-frame-route-deviation', caption: 'Route deviation detected: red is reserved for the moments the system notices.' },
      { image: 'digitfms-frame-live-tracking', caption: '“Knowing what is happening. Now.” Location, speed, fuel and driver events, live.' },
      { image: 'digitfms-frame-control-room', caption: 'The 24/7 control room follows the same red route.' },
      { image: 'digitfms-frame-fuel-alert', caption: 'Fuel intelligence: a fuel drop, verified at the pump.' },
      { image: 'digitfms-frame-sunrise', caption: '“See more. Control more.” The journey ends at sunrise.' },
    ],
    film: {
      key: 'digitfms',
      title: 'DigitFMS: Nothing moves unseen',
      durationSec: 30.05,
      durationLabel: '0:30',
      isoDuration: 'PT30S',
      format: '30-second TVC, 16:9',
      poster: 'digitfms-frame-truck-at-dawn',
      sound: 'Voice-over, music and sound effects.',
      script: [
        { start: 0, end: 1.58, line: 'Every business' },
        { start: 1.58, end: 3.0, line: 'has something worth protecting.' },
        { start: 5.0, end: 7.08, line: 'Vehicles. Fuel.' },
        { start: 7.08, end: 9.54, line: 'People. Property.' },
        { start: 12.62, end: 15.0, line: 'The difference is knowing what is happening, now.' },
        { start: 16.71, end: 18.38, line: 'So you can respond' },
        { start: 18.38, end: 19.58, line: 'before risk becomes loss.' },
        { start: 24.96, end: 27.79, line: 'DigitFMS. See more. Control more.' },
        { start: 27.79, end: 30.05, line: 'Protect what keeps your business moving.' },
      ],
      scriptNote: 'Voice-over as written in the storyboard, placed on the film’s matching shots. To be checked against the final mix.',
      shots: [
        { start: 0, end: 1.58, title: 'Every business', description: 'A macro close-up of an eye.' },
        { start: 1.58, end: 3.0, title: 'Something worth protecting', description: 'A gloved hand on the steering wheel in a dark cab, the dashboard glowing.' },
        { start: 3.0, end: 5.0, title: 'Ignition', description: 'A truck’s wheel and chrome steps on a wet road as the air brakes release.' },
        { start: 5.0, end: 7.08, title: 'Vehicles. Fuel.', description: 'A DigitFMS truck pulls away on a wet road at dawn.' },
        { start: 7.08, end: 9.54, title: 'People. Property.', description: 'The view from the cab: the highway ahead and the navigation screen.' },
        { start: 9.54, end: 12.62, title: 'Route deviation detected', description: 'Tail lights on a dusk highway; a red line and label flag a route deviation.' },
        { start: 12.62, end: 15.0, title: 'Knowing what is happening', description: 'The truck rounds a bend while labels track its location, speed, fuel and driver events.' },
        { start: 15.0, end: 16.71, title: '24/7 control room', description: 'An operator on a headset follows a red route across a wall of maps.' },
        { start: 16.71, end: 18.38, title: 'Fleet', description: 'A depot at night; a red line leads across the wet yard to a truck.' },
        { start: 18.38, end: 19.58, title: 'Sites. Access.', description: 'A security camera on a warehouse wall watches the perimeter.' },
        { start: 19.58, end: 21.04, title: 'Fuel intelligence', description: 'A fuel display with a red label: Fuel drop verified.' },
        { start: 21.04, end: 22.75, title: 'AI CCTV. Access control.', description: 'At the gate, a red box recognises the truck’s number plate and the barrier lifts.' },
        { start: 22.75, end: 24.96, title: 'Mobile video. Live fleet map.', description: 'A gloved hand holds a phone showing the truck’s live route.' },
        { start: 24.96, end: 27.79, title: 'See more. Control more.', description: 'The truck crosses a bridge towards a city skyline at sunrise.' },
        { start: 27.79, end: 30.05, title: 'End card', description: 'The DigitFMS logo on black: Book your free security assessment. Protect what keeps your business moving.' },
      ],
    },
    storyboard: {
      image: 'digitfms-storyboard',
      title: '30-second TVC storyboard',
      caption: 'Fifteen frames, each with its timing, line, sound and camera note. The film follows it shot for shot.',
    },
    permission: { publicationApproved: true, note: 'Client work supplied by the owner for the Work section. Permission to publish received from DigitFMS (owner confirmation, 12 Nov 2026). Still to confirm: credits, and music and voice-over rights; check the captions against the final mix (B-14, B-24).' },
    seo: {
      title: 'DigitFMS “Nothing moves unseen” TVC — client work',
      description: 'A 30-second TVC for DigitFMS that turns six fleet and security services into one journey, with its storyboard and the strategy behind it.',
      ogImage: 'digitfms-frame-truck-at-dawn',
    },
    governance,
  },
  {
    slug: 'miss-rhee-beauty-the-space-of-restoration',
    title: 'Miss Rhee Beauty: The Space of Restoration',
    sector: 'Beauty and skincare',
    services: ['brand-strategy-creative-direction', '3d-animation-motion-design'],
    status: 'client-work',
    summary: 'A 20-second hero film built on one promise: “Your beauty was never lost. It was waiting to be restored.” Skin becomes a landscape, light behaves like moisture, and the product arrives only once the glow has returned.',
    scope: 'Director’s storyboard and a 20-second hero film, 16:9.',
    context: [
      'Miss Rhee Beauty makes body lotion, body butters and oil around ingredients including shea, coconut and grapeseed. Its hero film had to carry the brand’s promise of restoration in twenty seconds.',
    ],
    challenge: [
      'Skincare films often open on the product and list what it does. Restoration is a feeling, and a feeling needs time on screen before any product appears.',
    ],
    insight: [
      'Restoration means returning to something that was already there. The line “Your beauty was never lost. It was waiting to be restored.” turns the product from a fix into a return, and gives the film its shape.',
    ],
    idea: [
      'The Space of Restoration. A single pearl rises from liquid darkness, the camera travels the skin like a landscape, and light behaves like moisture within it. The glow returns at 0:14, the product appears at 0:17, presented like fine jewellery, and the monogram forms from cream light.',
    ],
    execution: [
      'Eight shots, each specified for camera, light, VFX, transition and audio. The transitions are match cuts: a bead of cream becomes fingertips, an oil sphere becomes the light in her eye, and a ribbon of cream resolves into the monogram.',
      'A signature effect, the Restoration Field, shows light behaving like moisture within living skin. A six-colour palette runs from obsidian black through rich brown, warm beige and ivory to champagne gold and pearlescent cream.',
      'The storyboard sets the production standard: large-format anamorphic and 100 mm macro photography, 1,000 fps high-speed liquids, motion-control robotics, simulated fluids and path-traced rendering.',
    ],
    deliverables: ['20-second hero film, 16:9', 'Director’s storyboard with camera, light, VFX, transition and audio notes', 'Colour palette and signature VFX direction'],
    outcome: null,
    credits: [
      { role: 'Storyboard and film', name: 'WeAmaze Visionary' },
      { role: 'Client', name: 'Miss Rhee Beauty' },
    ],
    heroImage: 'mrb-frame-awaken',
    gallery: [
      { image: 'mrb-frame-awaken', caption: 'Awaken: a single pearl rises from liquid darkness, her face held inside it.' },
      { image: 'mrb-frame-skin', caption: 'Skin: the camera travels her cheek like a landscape.' },
      { image: 'mrb-frame-touch', caption: 'Touch: cream meets skin, and restoration begins.' },
      { image: 'mrb-frame-restoration-field', caption: 'The Restoration Field: light behaving like moisture within living skin.' },
      { image: 'mrb-frame-ingredients', caption: 'The ingredient world: shea, coconut and grapeseed become one world.' },
      { image: 'mrb-frame-product', caption: 'Product reveal: as precious as fine jewellery.' },
    ],
    film: {
      key: 'mrb',
      title: 'Miss Rhee Beauty: The Space of Restoration',
      durationSec: 20.09,
      durationLabel: '0:20',
      isoDuration: 'PT20S',
      format: '20-second hero film, 16:9',
      poster: 'mrb-frame-awaken',
      sound: 'Voice-over, score and sound design.',
      script: [
        { start: 6.0, end: 8.2, line: 'Your beauty was never lost…' },
        { start: 14.9, end: 17.0, line: '…it was waiting to be restored.' },
        { start: 17.2, end: 19.9, line: 'Miss Rhee Beauty. The Space of Restoration.' },
      ],
      scriptNote: 'Voice-over as written in the director’s storyboard, timed to the speech in the soundtrack. To be checked against the final mix.',
      shots: [
        { start: 0, end: 3.0, title: 'Awaken', description: 'A single pearl of liquid rises from a splash in darkness; a woman’s face is reflected inside it.' },
        { start: 3.0, end: 5.0, title: 'Skin', description: 'A bead of cream on deep brown skin, seen in extreme close-up.' },
        { start: 5.0, end: 8.0, title: 'Touch', description: 'A woman with eyes closed smooths cream onto her cheek in warm light.' },
        { start: 8.0, end: 11.0, title: 'The Restoration Field', description: 'Ribbons and droplets of golden light move like moisture across skin.' },
        { start: 11.0, end: 14.0, title: 'The ingredient world', description: 'Shea nuts, coconut and golden oil spheres in a glowing still life.' },
        { start: 14.0, end: 17.0, title: 'The glow returns', description: 'A woman’s face in close-up, glowing, confident and radiant.' },
        { start: 17.0, end: 19.4, title: 'Product reveal', description: 'Miss Rhee Beauty body lotion, body butters and oil on a stone plinth, draped in cream silk.' },
        { start: 19.4, end: 20.09, title: 'Brand lock-up', description: 'The MR monogram on black: The Space of Restoration. Restore your natural beauty and your skin will thank you.' },
      ],
    },
    storyboard: {
      image: 'mrb-storyboard',
      title: 'Director’s storyboard',
      caption: 'Eight frames with camera, light, VFX, transition and audio notes, the colour palette, the production standard and the signature effect.',
    },
    permission: { publicationApproved: true, note: 'Client work supplied by the owner for the Work section. Permission to publish received from Miss Rhee Beauty (owner confirmation, 12 Nov 2026). Still to confirm: credits, and music and voice-over rights; check the captions against the final mix (B-14, B-24).' },
    seo: {
      title: 'Miss Rhee Beauty “The Space of Restoration” — client work',
      description: 'A 20-second hero film for Miss Rhee Beauty built on the promise “Your beauty was never lost”, with its director’s storyboard and the strategy behind it.',
      ogImage: 'mrb-frame-awaken',
    },
    governance,
  },
  {
    slug: 'my-backyard',
    title: 'My Backyard',
    sector: 'Family animation',
    services: ['3d-animation-motion-design'],
    status: 'studio-concept',
    summary: 'A 15-second animated short in a felt-textured world: a girl, a magnifying glass and a ball that might be alive. A whole story, from wonder to alarm to a laugh, in fifteen seconds.',
    scope: 'Story, fifteen-panel storyboard and a 15-second animated film.',
    context: [
      'My Backyard is set in The Jacaranda Corner, a golden-hour garden under a jacaranda tree, where Lina explores with a magnifying glass while her father watches from the window.',
    ],
    challenge: [
      'Fifteen seconds is the length of a short social post. That is usually enough for a single gag or a mood, rarely for a complete story with a beginning, a turn and a release that any age can read without words.',
    ],
    insight: [
      'A magnifying glass changes scale, and scale changes feeling. The lens that turns a blossom into a landscape can also make a smiling felt ball loom like a monster, so one prop carries both the wonder and the joke.',
    ],
    idea: [
      'Let the lens tell the story. Lina finds wonder through it (a blossom, a ladybird), then fright as the ball’s face fills the glass, then sees the ball as it really is, harmless, over her shoulder. Her father’s single line, “What’s happening?”, lands the comedy.',
    ],
    execution: [
      'A needle-felt look runs through everything, from Lina’s hair to the ladybird and the stitched smile on the ball. The world feels handmade and safe, so the scare stays funny rather than frightening.',
      'One palette holds the film together: golden-hour light, jacaranda purple, warm brick and wool.',
      'The film condenses the fifteen-panel storyboard into ten shots, alternating wide views of the garden with views through the lens, and saves the only dialogue for the father at the window.',
    ],
    deliverables: ['15-second animated short, 16:9', 'Fifteen-panel storyboard with timings and actions', 'Characters: Lina and her father, in a felt-textured world'],
    outcome: null,
    credits: [{ role: 'Story, storyboard and film', name: 'WeAmaze Visionary' }],
    heroImage: 'backyard-frame-lens',
    gallery: [
      { image: 'backyard-frame-garden', caption: 'The Jacaranda Corner at golden hour.' },
      { image: 'backyard-frame-ladybird', caption: 'Through the lens, a ladybird crosses a blossom the size of a landscape.' },
      { image: 'backyard-frame-ball', caption: 'The same lens turns a smiling felt ball into a looming face.' },
      { image: 'backyard-frame-alarm', caption: 'Delight turns to alarm.' },
      { image: 'backyard-frame-window', caption: '“What’s happening?” Her father, at the window.' },
      { image: 'backyard-frame-harmless', caption: 'Over her shoulder, the ball sits harmlessly.' },
    ],
    film: {
      key: 'backyard',
      title: 'My Backyard',
      durationSec: 15.07,
      durationLabel: '0:15',
      isoDuration: 'PT15S',
      format: '15-second animated short, 16:9',
      poster: 'backyard-frame-lens',
      sound: 'Sound design and one line of dialogue.',
      script: [
        { start: 8.9, end: 10.4, line: '[Lina cries out]' },
        { start: 12.4, end: 13.3, line: 'FATHER: What’s happening?' },
        { start: 13.8, end: 14.8, line: '[Lina laughs]' },
      ],
      scriptNote: 'Dialogue and sounds as written in the storyboard, timed to the soundtrack. To be checked against the final mix.',
      shots: [
        { start: 0, end: 2.08, title: 'The Jacaranda Corner', description: 'Golden hour under a jacaranda tree: Lina crouches among fallen purple blossom with a magnifying glass, a lantern glowing by the stone wall.' },
        { start: 2.08, end: 3.17, title: 'Curious delight', description: 'Close-up: Lina peers through the magnifying glass, her eye huge in the lens, smiling.' },
        { start: 3.17, end: 5.79, title: 'Through the lens', description: 'A ladybird crawls across a felted blossom.' },
        { start: 5.79, end: 6.83, title: 'Unnoticed', description: 'Among the roots, a golden felt ball with a stitched smile trembles loose.' },
        { start: 6.83, end: 8.21, title: 'The ball looms', description: 'Through the lens, the ball’s smiling face fills the glass.' },
        { start: 8.21, end: 9.46, title: 'Alarm', description: 'Lina’s delight turns to alarm.' },
        { start: 9.46, end: 11.0, title: 'Scramble', description: 'Lina scrambles back under the tree as the ball rolls towards her.' },
        { start: 11.0, end: 11.88, title: 'Stopped short', description: 'Low angle: the ball stops short in front of her.' },
        { start: 11.88, end: 13.58, title: 'At the window', description: 'Her father jolts upright at the window and leans out: “What’s happening?”' },
        { start: 13.58, end: 15.07, title: 'Harmless', description: 'Over her shoulder, the ball sits harmlessly beside the magnifying glass, and Lina laughs.' },
      ],
    },
    storyboard: {
      image: 'backyard-storyboard',
      title: 'Fifteen-panel storyboard',
      caption: 'One panel per second, each with its timing and action. The film condenses it into ten shots.',
    },
    permission: { publicationApproved: false, note: 'Supplied by the owner for the Work section with no client named, so labelled Studio Concept. Confirm the studio owns it (or name the client and relabel), the credits, and the music and voice rights; check the captions against the final mix (B-14, B-24).' },
    seo: {
      title: 'My Backyard animated short — studio concept',
      description: 'A 15-second felt-textured animated short in which a magnifying glass turns wonder into a scare and back into a laugh, with its storyboard and the strategy behind it.',
      ogImage: 'backyard-frame-lens',
    },
    governance,
  },
];

/**
 * Published projects for a site environment. Client work, and work that features another
 * company's brand, without written permission on record is shown in staging previews but
 * never in a production build (V11.06, B-14, B-26); `npm run launch-check` lists it until
 * permission is recorded.
 */
export function publishableProjects(list: readonly Project[], siteEnv: string): Project[] {
  return list.filter((p) => p.governance.publish === 'published' && (siteEnv !== 'production' || !(p.status === 'client-work' || p.permission.thirdParty) || p.permission.publicationApproved));
}
const SITE_ENV = (import.meta as { env?: Record<string, string | undefined> }).env?.PUBLIC_SITE_ENV ?? 'staging';
export const publishedProjects = publishableProjects(projects, SITE_ENV);
export function getProject(slug: string): Project | undefined {
  return publishedProjects.find((p) => p.slug === slug);
}
