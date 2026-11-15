import { MonogramSupergraphic, MotifLane } from '@/components/brand/Motifs';
import { ButtonLink } from '@/components/ui/Button';
import { TextLink } from '@/components/ui/TextLink';

/**
 * Closing call to action with one Gold action and the cropped monogram
 * supergraphic (CI §19). The supergraphic has its own lane, so text never sits on it:
 *  - below lg, a band under the text, flush with the section's bottom edge;
 *  - from lg, columns 8–12 at full section height, cropped by the format edges.
 * Text keeps to columns 1–6 on plain Onyx.
 */
export function CtaBand({ title = 'Have an idea worth making real?', text = 'Tell us what you want to make and where you are starting from. A few guided questions, and you can review every answer before you send it.', id = 'closing-cta' }: { title?: string; text?: string; id?: string }) {
  return (
    <section aria-labelledby={id} className="surface-dark relative overflow-clip border-t border-rule" data-surface="dark">
      <div className="wv-container">
        <div className="wv-grid">
          <div className="col-span-4 py-24 md:col-span-8 md:py-32 lg:col-span-6 lg:py-40" data-reveal>
            <h2 id={id} className="t-display-2">{title}</h2>
            <p className="t-body-lg text-2 mt-6 max-w-[48ch]">{text}</p>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
              <ButtonLink to="/start-a-project">Start a Project</ButtonLink>
              <TextLink to="/book-a-call">Or book a discovery call</TextLink>
            </div>
          </div>
          <MotifLane className="col-span-4 -mt-8 h-52 [clip-path:inset(0_-100vw_0_0)] md:col-span-8 md:-mt-12 md:h-72 lg:col-span-5 lg:col-start-8 lg:mt-0 lg:h-auto">
            <MonogramSupergraphic className="absolute left-[18%] top-6 h-auto w-[118%] max-w-none md:left-[30%] md:top-8 md:w-[84%] lg:left-0 lg:top-1/2 lg:w-[170%] lg:-translate-y-1/2" />
          </MotifLane>
        </div>
      </div>
    </section>
  );
}
