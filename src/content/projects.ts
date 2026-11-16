import type { Project } from './types';

/**
 * Portfolio. Every item carries a provenance label (V10 §08). Client work is
 * owner-supplied material (7 Nov 2026), written up only from what it shows: no
 * metrics, outcomes, quotes or dates are added, and publication waits on written
 * permission (B-14). A World of Her Own is a speculative film featuring a named
 * fragrance, labelled Capability Demonstration, published with the brand owner's permission
 * (owner-confirmed 16 Nov 2026, B-27). Studio concepts are internally created, not paid
 * commissions; The Form of What's Next is the studio's own brand film.
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
  {
    slug: 'the-form-of-whats-next',
    title: 'The Form of What’s Next',
    sector: 'Creative technology',
    services: ['ai-creative-studio', 'brand-strategy-creative-direction', '3d-animation-motion-design'],
    status: 'studio-concept',
    summary: 'A 60-second brand film for WeAmaze Visionary. A single line of light travels from an untouched mountain valley, through a forest and into monumental architecture, then folds into the studio’s monogram: Creative Intelligence, Made Real, told without a word.',
    scope: 'Concept, fifteen-frame storyboard and a 60-second brand film, 16:9, in black and white with a gold brand reveal.',
    context: [
      'The studio’s own film, made to show what WeAmaze Visionary stands for before anyone reads a line about it. The studio film shows the range of worlds the studio builds for others; this one is about the studio itself.',
    ],
    challenge: [
      'A creative studio’s brand film is judged twice: as a statement, and as a sample of the work. The easy answer is a fast showreel of everything the studio can do, and the brand gets lost among the clips. With no words to lean on, the pictures had to carry one clear idea from the first frame to the last.',
    ],
    insight: [
      'The studio’s line, Creative Intelligence, Made Real, describes a journey: from an idea nobody can touch to something built that people can stand inside. That journey can be shown with a single element moving through the world, and light is the oldest sign of an idea.',
    ],
    idea: [
      'The Form of What’s Next. A vertical line of light appears far off in a wilderness and keeps appearing: between walls of rock, between the trees, at the heart of a building, at the end of a hall of columns. Then it breaks into lines that come together as the W monogram. The light is the idea, the places are the work it passes through, and the monogram is where it becomes the brand.',
    ],
    execution: [
      'Twelve movements in sixty seconds, from nature to architecture to abstraction. The line of light stays at or near the centre of almost every frame, so the eye knows where to look after every cut, and each place is a little more made than the last: mountains, rock, forest, a building across still water, raw concrete, a studio, a hall, a maze of walls seen from above.',
      'Black and white throughout, with one rule: gold is reserved for the brand. The film stays monochrome until its final seconds, when the monogram turns gold and the wordmark and the line Creative Intelligence. Made Real. appear, so the only colour in the film belongs to WeAmaze Visionary.',
      'No dialogue. The score carries the climb, falls to near silence as the lines draw the monogram, and lands a single deep hit as it turns gold. The fifteen-frame storyboard was drawn for 30 seconds at two seconds a frame; the film gives each movement about twice that time, so the same board is the plan for a 30-second version.',
    ],
    statement: { label: 'The idea', text: 'An idea becomes real when it takes form.' },
    deliverables: ['60-second brand film, 16:9', 'Fifteen-frame storyboard with timings, shot titles and camera moves', 'Three visual rules: monochrome architectural cinematography, a recurring vertical light, gold only for the brand', 'A board already timed for a 30-second version'],
    outcome: null,
    credits: [{ role: 'Concept, storyboard and film', name: 'WeAmaze Visionary' }],
    heroImage: 'form-frame-architecture',
    gallery: [
      { image: 'form-frame-unknown', caption: 'The unknown. The line of light first appears, far off, in a wilderness.' },
      { image: 'form-frame-presence', caption: 'The presence. Between walls of rock, the light rises.' },
      { image: 'form-frame-studio', caption: 'The studio. The same line of light, now inside the work.' },
      { image: 'form-frame-hall', caption: 'The hall. Symmetry brings the eye back to the light.' },
      { image: 'form-frame-geometry', caption: 'The geometry. From above, the architecture becomes a pattern.' },
      { image: 'form-frame-signature', caption: 'The signature. Gold, used once, for the brand.' },
    ],
    film: {
      key: 'form',
      title: 'The Form of What’s Next',
      durationSec: 60.32,
      durationLabel: '1:00',
      isoDuration: 'PT1M',
      format: '60-second brand film, 16:9, black and white with a gold reveal',
      poster: 'form-frame-architecture',
      sound: 'Score and sound design, with no dialogue.',
      script: [
        { start: 0.5, end: 52.0, line: '[Score and sound design]' },
        { start: 52.0, end: 55.4, line: '[The sound falls to near silence]' },
        { start: 55.5, end: 59.5, line: '[A deep hit as the monogram turns gold]' },
      ],
      scriptNote: 'There are no words in the film. The sound cues, which become the captions, are described from the soundtrack. To be checked against the final mix.',
      shots: [
        { start: 0, end: 4.42, title: 'The unknown', description: 'Extreme wide, in black and white: a misty mountain valley with a stream, and a thin line of light far in the distance.' },
        { start: 4.42, end: 9.71, title: 'The presence', description: 'Low angle between sheer rock walls: a tall column of light rises from wet ground.' },
        { start: 9.71, end: 15.08, title: 'Through the trees', description: 'A dark forest of tall trunks; moving through it, the light appears between them.' },
        { start: 15.08, end: 20.58, title: 'Architecture', description: 'Through the pines, a monumental building stands across still water, the light at its centre.' },
        { start: 20.58, end: 22.5, title: 'Material', description: 'Extreme close-up: the camera slides across textured concrete to a lit edge.' },
        { start: 22.5, end: 30.13, title: 'The studio', description: 'A concrete interior with a glass wall and a curved wall lit from below; the column of light stands in the room, reflected in the floor.' },
        { start: 30.13, end: 35.29, title: 'The hall', description: 'A long hall of concrete columns, the light at its far end.' },
        { start: 35.29, end: 40.67, title: 'Ascent', description: 'Looking up: the column of light rises through cone-shaped concrete forms.' },
        { start: 40.67, end: 45.17, title: 'The geometry', description: 'From above, the camera descends over angular walls, steps and small lights, the line of light among them.' },
        { start: 45.17, end: 49.38, title: 'Transformation', description: 'In mist, the column of light splits into sharp facets.' },
        { start: 49.38, end: 55.17, title: 'The form', description: 'Thin lines of light cross the dark and come together as the W monogram, in white.' },
        { start: 55.17, end: 60.32, title: 'The signature', description: 'The monogram turns gold; the WeAmaze Visionary wordmark appears, then the line Creative Intelligence. Made Real.' },
      ],
    },
    storyboard: {
      image: 'form-storyboard',
      title: 'Fifteen-frame storyboard',
      caption: 'Drawn as a 30-second film, two seconds a frame, each with its timing, title and camera move, under three rules: monochrome architectural cinematography, a recurring vertical light, and gold only for the brand reveal.',
    },
    permission: { publicationApproved: true, note: 'The studio’s own brand film, supplied by the owner on 16 November 2026. No client or other company’s brand appears. Confirm the music and sound rights and check the caption cues against the final mix (B-24).' },
    seo: {
      title: 'The Form of What’s Next — WeAmaze Visionary brand film',
      description: 'A 60-second black-and-white brand film in which a line of light travels from mountains to architecture and becomes the WeAmaze Visionary monogram, with its storyboard and the thinking behind it.',
      ogImage: 'form-frame-architecture',
    },
    governance,
  },
  {
    slug: 'a-world-of-her-own',
    title: 'A World of Her Own',
    sector: 'Luxury fragrance',
    services: ['brand-strategy-creative-direction', '3d-animation-motion-design'],
    status: 'capability-demonstration',
    summary: 'A 60-second fragrance film featuring BOSS The Scent for Her, made by the studio to show how a scent can be felt on screen. It begins in silence with the bottle, opens into a world that answers her every step, and returns to the bottle as the signature that stays.',
    scope: 'Concept, storyboard treatment, voice-over and a 60-second film, 16:9, with a plan for cut-downs.',
    context: [
      'A self-initiated film for an existing fragrance, made to show how the studio would bring a luxury scent to the screen. The product, its blush-pink carton and its name belong to their owners; everything else, from the idea to the final frame, is the studio’s.',
    ],
    challenge: [
      'A fragrance cannot be smelt through a screen. Films in the category often fall back on glamour and a hero bottle, and the feeling of wearing the scent, the part that sells it, is left to the viewer’s imagination.',
    ],
    insight: [
      'A scent is personal before it is public. It changes how the wearer feels in her own space before anyone else notices. The film is told from inside that feeling, not from the outside looking at her.',
    ],
    idea: [
      'A World of Her Own. The bottle opens the film in silence; a breath at the window and a single bloom open her world; the garden responds to her steps; and the camera passes through a flower of light before the bottle returns as the signature that stays. Product, world, product: the scent becomes the place she goes, and the bottle is how to get there.',
    ],
    execution: [
      'Ten movements of six seconds, each with one image and at most one line. The voice-over is spare, closer to a poem than a script, and saves the name for the final shot: “BOSS The Scent for Her. A World of Her Own.” Because every movement stands alone, the treatment plans 30- and 15-second cut-downs and a 9:16 version without losing the story.',
      'One palette, taken from the carton: blush, warm ivory and gold in low golden-hour light. Petals are the thread that carries the eye from the box to the window, the garden and back to the bottle. The bloom does the work a scent cannot: it opens at 0:12, and at 0:42 the camera travels through it into light, so the fragrance is seen in motion.',
      'The camera follows her rather than watching her. She enters her world from behind, through a rose arch, and meets the lens only once, in the close-up “Every detail. Every feeling.” The storyboard sets the production standard: 100 mm macro for the bottle and the bloom, portrait lenses for her, procedural bloom, petal and particle simulation, an accurate 3D bottle with glass and liquid, and a warm blush grade.',
      'A character board keeps her the same woman in every shot: her face and freckles, loosely pinned curls, gold hoops and a pleated ivory gown, seen close up and from the front and the back. The gown’s open back is what the camera sees as she walks into her world, and its movement is what the garden answers.',
    ],
    statement: { label: 'The idea', text: 'A world that feels entirely her own.' },
    deliverables: ['60-second film, 16:9', 'Ten-frame storyboard treatment with shot, VFX and voice-over notes', 'Character board: face, hair, jewellery and gown, from the front and the back', 'Production approach: cinematography, simulation, 3D product and finishing', 'Cut-down plan: 30 and 15 seconds, and 9:16'],
    outcome: null,
    note: {
      title: 'What this is',
      text: 'A speculative film made by the studio to show its approach to luxury fragrance, published with the permission of the brand’s owner. It was not commissioned by them. The product, packaging and name are theirs and are shown to present the idea.',
    },
    credits: [
      { role: 'Concept, storyboard and film', name: 'WeAmaze Visionary' },
      { role: 'Product featured', name: 'BOSS The Scent for Her' },
    ],
    heroImage: 'herown-frame-entering',
    gallery: [
      { image: 'herown-frame-first-impression', caption: '“Some moments begin in silence.” The bottle and its carton, as a petal drifts down.' },
      { image: 'herown-frame-first-bloom', caption: '“And the world begins to open.” The first bloom, in extreme macro.' },
      { image: 'herown-frame-nature-responds', caption: '“One step becomes a thousand possibilities.” The garden answers her steps.' },
      { image: 'herown-frame-beauty', caption: '“Every detail. Every feeling.” The only moment she meets the lens.' },
      { image: 'herown-frame-fragrance-in-motion', caption: 'The fragrance in motion: the camera passes through the bloom into light.' },
      { image: 'herown-frame-final-hero', caption: '“A signature that stays.” The film closes where it began, on the bottle.' },
    ],
    film: {
      key: 'herown',
      title: 'A World of Her Own',
      durationSec: 59.88,
      durationLabel: '1:00',
      isoDuration: 'PT1M',
      format: '60-second fragrance film, 16:9',
      poster: 'herown-frame-entering',
      sound: 'Voice-over and score.',
      script: [
        { start: 0.95, end: 2.75, line: 'Some moments begin in silence.' },
        { start: 12.4, end: 13.0, line: 'A breath.' },
        { start: 14.5, end: 15.3, line: 'A shift in the light.' },
        { start: 18.3, end: 20.2, line: 'And the world begins to open.' },
        { start: 24.5, end: 27.2, line: 'One step becomes a thousand possibilities.' },
        { start: 30.0, end: 30.7, line: 'Every detail.' },
        { start: 32.2, end: 33.2, line: 'Every feeling.' },
        { start: 42.0, end: 45.3, line: 'A world that feels entirely her own.' },
        { start: 47.8, end: 48.7, line: 'More than a fragrance.' },
        { start: 50.0, end: 51.5, line: 'A signature that stays.' },
        { start: 53.9, end: 55.5, line: 'BOSS The Scent for Her.' },
        { start: 56.4, end: 57.7, line: 'A World of Her Own.' },
      ],
      scriptNote: 'Voice-over as written in the storyboard treatment, timed to the speech in the soundtrack. To be checked against the final mix.',
      shots: [
        { start: 0, end: 6.0, title: 'The first impression', description: 'The bottle and its blush-pink carton on stone in soft morning light, as a petal drifts down.' },
        { start: 6.0, end: 12.0, title: 'A moment of possibility', description: 'A woman by a sheer curtain turns her head towards the light.' },
        { start: 12.0, end: 18.0, title: 'The first bloom', description: 'A blush flower opens in extreme close-up, flecks of pollen catching the light.' },
        { start: 18.0, end: 24.0, title: 'Entering her world', description: 'Seen from behind in a white gown, she walks through a rose-covered stone arch into a sunlit garden.' },
        { start: 24.0, end: 30.0, title: 'Nature responds', description: 'She walks between flowering shrubs, her gown trailing as petals drift.' },
        { start: 30.0, end: 34.21, title: 'The beauty of the moment', description: 'Close-up: she meets the camera as petals fall past.' },
        { start: 34.21, end: 36.0, title: 'Her signature', description: 'Her hand holds the bottle at her neck.' },
        { start: 36.0, end: 42.0, title: 'A world unfolds', description: 'She walks a garden path to a still reflecting pool, and the camera rises over formal gardens.' },
        { start: 42.0, end: 48.0, title: 'The fragrance in motion', description: 'The camera travels into a blush bloom towards a glowing light at its heart.' },
        { start: 48.0, end: 54.0, title: 'The product reveal', description: 'The bottle on a polished surface among fallen petals.' },
        { start: 54.0, end: 59.88, title: 'The final hero', description: 'The bottle and its carton among blush roses: a clean end frame.' },
      ],
    },
    feature: {
      image: 'herown-character-board',
      title: 'Character board',
      caption: 'One reference for her face, hair, jewellery and gown, close up and from the front and the back, so she stays the same person in every shot.',
    },
    storyboard: {
      image: 'herown-storyboard',
      title: 'Storyboard treatment',
      caption: 'Ten frames of six seconds, each with its shot, VFX and voice-over notes, and the production approach from cinematography to finishing. The film follows it movement for movement.',
    },
    permission: {
      publicationApproved: true,
      thirdParty: true,
      note: 'A speculative film featuring BOSS The Scent for Her, not commissioned by the brand’s owners. On 16 November 2026 the owner confirmed that permission to publish it has been received from the brand owner (B-27). Keep the written permission on file; check the captions against the final mix (B-24).',
    },
    seo: {
      title: 'A World of Her Own — fragrance film concept',
      description: 'A 60-second fragrance film concept that makes a scent felt on screen: a bottle, a bloom and a world that answers her steps, with its storyboard and the strategy behind it.',
      ogImage: 'herown-frame-entering',
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
