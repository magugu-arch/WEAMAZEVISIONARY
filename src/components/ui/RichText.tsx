import { Fragment } from 'react';
import type { ReactNode } from 'react';
import type { InsightBlock } from '@/content/types';
import { AppLink } from './AppLink';

/** Renders `[label](/path)` links inside plain copy. No HTML is ever injected. */
export function Inline({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  const re = /\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const [, label, href] = m;
    parts.push(<AppLink key={m.index} to={href!} className="underline decoration-1 underline-offset-4 hover:decoration-2">{label}</AppLink>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts.map((p, i) => <Fragment key={i}>{p}</Fragment>)}</>;
}

export function Blocks({ blocks }: { blocks: InsightBlock[] }) {
  return (
    <div className="prose-wv">
      {blocks.map((b, i) => {
        switch (b.type) {
          case 'p': return <p key={i}><Inline text={b.text} /></p>;
          case 'h2': return <h2 key={i} id={b.id}>{b.text}</h2>;
          case 'h3': return <h3 key={i}>{b.text}</h3>;
          case 'ul': return <ul key={i}>{b.items.map((it, j) => <li key={j}><Inline text={it} /></li>)}</ul>;
          case 'ol': return <ol key={i} className="list-decimal pl-5">{b.items.map((it, j) => <li key={j}><Inline text={it} /></li>)}</ol>;
          case 'note': return (
            <aside key={i} className="border-l border-gold py-1 pl-6">
              <p className="t-label text-2">{b.title}</p>
              <p className="mt-2"><Inline text={b.text} /></p>
            </aside>
          );
        }
      })}
    </div>
  );
}
