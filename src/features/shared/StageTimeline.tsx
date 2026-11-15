import { approachStages } from '@/content/pages';
import { pad2 } from '@/lib/format';

/** Six stages. Horizontal on desktop, vertical on mobile; nothing depends on hover (V11.03). */
export function StageTimeline({ detail = false }: { detail?: boolean }) {
  return (
    <ol role="list" className="grid gap-0 lg:grid-cols-6 lg:gap-6">
      {approachStages.map((s, i) => (
        <li key={s.id} className="relative border-l border-rule pb-10 pl-6 lg:border-l-0 lg:border-t lg:pb-0 lg:pl-0 lg:pt-6">
          <span aria-hidden="true" className="absolute -left-[3px] top-0 h-[5px] w-[5px] bg-gold lg:-top-[3px] lg:left-0" />
          <p className="t-meta text-2">{pad2(i + 1)}</p>
          <h3 className="t-h3 mt-3">{s.name}</h3>
          <p className="text-2 mt-3 t-small">{s.purpose}</p>
          {detail ? (
            <dl className="t-small mt-5 space-y-3">
              <div><dt className="t-label text-2">Output</dt><dd className="mt-1">{s.output}</dd></div>
              <div><dt className="t-label text-2">Decision</dt><dd className="mt-1">{s.gate}</dd></div>
            </dl>
          ) : (
            <p className="t-small mt-4"><span className="sr-only">Decision point: </span><span aria-hidden="true" className="t-label text-2 mr-2">Gate</span>{s.gate}</p>
          )}
        </li>
      ))}
    </ol>
  );
}
