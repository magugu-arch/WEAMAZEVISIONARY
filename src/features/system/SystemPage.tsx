import { useState } from 'react';
import { HorizontalLogo, Monogram, PrimaryLogo, ServiceIcon } from '@/components/brand/Logo';
import type { LogoTone } from '@/components/brand/Logo';
import { AscentLine, DatumRule, EchoField, MonogramSupergraphic } from '@/components/brand/Motifs';
import { Container, Section } from '@/components/layout/Section';
import { Checkbox, ChoiceGroup, SelectField, TextArea, TextField } from '@/components/forms/Field';
import { Accordion } from '@/components/ui/Accordion';
import { Alert } from '@/components/ui/Alert';
import { Button, ButtonLink } from '@/components/ui/Button';
import { StatusLabel } from '@/components/ui/StatusLabel';
import { Spinner } from '@/components/ui/Spinner';
import { publishedProjects } from '@/content/projects';
import { publishedServices } from '@/content/services';
import { ProjectCard } from '../shared/ProjectCard';

const SWATCHES = [
  { name: 'Onyx', hex: '#111114', use: 'Primary dark identity, text, interfaces', cls: 'bg-onyx', ring: true },
  { name: 'Champagne Gold', hex: '#C6A16A', use: 'Monogram, accents, one action per view. 7.8:1 on Onyx. Never text on Ivory.', cls: 'bg-gold' },
  { name: 'Warm Ivory', hex: '#F4F0E8', use: 'Primary light background. 16.6:1 with Onyx.', cls: 'bg-ivory' },
  { name: 'Graphite', hex: '#34343A', use: 'Secondary dark surfaces, body text on light. 10.9:1 on Ivory.', cls: 'bg-graphite' },
  { name: 'Soft Platinum', hex: '#BFC0C2', use: 'Secondary text on dark. 10.4:1 on Onyx.', cls: 'bg-platinum' },
];
const TYPE = [
  ['t-display-1', 'Display 1 · Cormorant 96/1.00 −1%', 'Ideas with intent.'],
  ['t-display-2', 'Display 2 · Cormorant 56/1.05 −0.5%', 'Experiences with impact.'],
  ['t-display-3', 'Display 3 · Cormorant 40/1.10', 'One studio, eight capabilities.'],
  ['t-h2', 'Section heading · Geist Medium 32/1.15 −1%', 'Selected work'],
  ['t-h3', 'Subheading · Geist Medium 20/1.30 −0.5%', 'AI Creative Studio'],
  ['t-body-lg', 'Body large · Geist 18/1.55', 'We unite strategy, human creative direction and intelligent technology.'],
  ['t-body', 'Body · Geist 16/1.55', 'Running text for longer reading.'],
  ['t-caption', 'Caption · Geist 12/1.45 +0.5%', 'Image captions and notes'],
  ['t-label', 'Label · Geist Medium caps 11/1.20 +14%', 'Creative technology studio'],
  ['t-meta', 'Metadata · Geist Mono 12/1.40', '07 / 24 · 2026'],
] as const;

function Panel({ title, children, light = false }: { title: string; children: React.ReactNode; light?: boolean }) {
  return (
    <Section surface={light ? 'light' : 'dark'} spacing="tight" labelledBy={title.replace(/\W+/g, '-').toLowerCase()}>
      <Container>
        <h2 id={title.replace(/\W+/g, '-').toLowerCase()} className="t-label text-2 border-t border-rule pt-4">{title}</h2>
        <div className="mt-8">{children}</div>
      </Container>
    </Section>
  );
}

/** Component and state library (development and staging only; noindex; excluded from sitemap). */
export default function SystemPage() {
  const [choice, setChoice] = useState<string[]>(['ai-creative-studio']);
  const [checked, setChecked] = useState(true);
  return (
    <>
      <Section spacing="tight">
        <Container>
          <p className="t-label text-gold">Staging only</p>
          <h1 className="t-display-1 mt-6">Design system</h1>
          <p className="t-body-lg text-2 mt-6 max-w-[60ch]">Tokens, components and states as implemented. Source of truth: Corporate Identity Manual v1.0. This route does not exist in production builds.</p>
        </Container>
      </Section>
      <Panel title="Colour tokens">
        <ul role="list" className="grid gap-6 md:grid-cols-5">
          {SWATCHES.map((s) => (
            <li key={s.hex}><div className={`${s.cls} aspect-[4/3] ${s.ring ? 'border border-rule-strong' : ''}`} /><p className="mt-3 font-medium">{s.name}</p><p className="t-meta text-2">{s.hex}</p><p className="t-caption text-2 mt-1">{s.use}</p></li>
          ))}
        </ul>
      </Panel>
      <Panel title="Typography">
        <div className="space-y-8">{TYPE.map(([cls, spec, sample]) => <div key={cls} className="grid gap-2 border-b border-rule pb-6 lg:grid-cols-[20rem_1fr]"><p className="t-meta text-2">{spec}</p><p className={cls}>{sample}</p></div>)}</div>
      </Panel>
      <Panel title="Logo family and optical weights">
        <div className="grid gap-10 md:grid-cols-3">
          <div><p className="t-caption text-2 mb-4">Primary weight · 96 px</p><Monogram height={96} /></div>
          <div><p className="t-caption text-2 mb-4">Compact weight · 40 px / 26 px</p><div className="flex items-end gap-6"><Monogram height={40} /><Monogram height={26} /></div></div>
          <div><p className="t-caption text-2 mb-4">Micro weight · 20 px / 16 px</p><div className="flex items-end gap-6"><Monogram height={20} /><Monogram height={16} /></div></div>
          <div><p className="t-caption text-2 mb-4">Horizontal compact · header 38 px</p><HorizontalLogo height={38} /></div>
          <div><p className="t-caption text-2 mb-4">Horizontal primary · 64 px</p><HorizontalLogo height={64} /></div>
          <div><p className="t-caption text-2 mb-4">Primary stacked · 140 px</p><PrimaryLogo height={140} /></div>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-4">
          {(['light', 'mono-onyx'] as LogoTone[]).map((t) => <div key={t} className="surface-light p-6"><p className="t-caption mb-4">{t}</p><HorizontalLogo height={48} tone={t} /></div>)}
          {(['mono-ivory', 'mono-gold'] as LogoTone[]).map((t) => <div key={t} className="border border-rule p-6"><p className="t-caption text-2 mb-4">{t}</p><HorizontalLogo height={48} tone={t} /></div>)}
        </div>
      </Panel>
      <Panel title="Service icons (CI §20)">
        <ul role="list" className="grid grid-cols-2 gap-6 md:grid-cols-4">{publishedServices.map((s) => <li key={s.slug} className="flex items-center gap-4"><ServiceIcon slug={s.slug} size={32} className="text-gold" /><span className="t-small">{s.name}</span></li>)}</ul>
      </Panel>
      <Panel title="Graphic elements">
        <div className="grid gap-6 md:grid-cols-4">
          {/* Labels sit under each specimen, never on the motif. */}
          <figure><div className="relative h-56 overflow-hidden border border-rule"><AscentLine height={224} className="absolute bottom-0 left-8" /></div><figcaption className="t-caption text-2 mt-3">Ascent line</figcaption></figure>
          <figure><div className="relative h-56 overflow-hidden border border-rule"><EchoField opacity={0.3} /></div><figcaption className="t-caption text-2 mt-3">Echo field</figcaption></figure>
          <figure><div className="relative h-56 overflow-hidden border border-rule"><MonogramSupergraphic className="absolute -right-1/3 top-1/2 h-[180%] -translate-y-1/2" /></div><figcaption className="t-caption text-2 mt-3">Supergraphic</figcaption></figure>
          <div className="flex h-56 flex-col justify-center gap-6 border border-rule p-6"><DatumRule /><DatumRule index="01" label="Datum rule" /><DatumRule /></div>
        </div>
      </Panel>
      <Panel title="Buttons — dark surface">
        <div className="flex flex-wrap items-center gap-4"><Button icon="arrow">Primary</Button><Button variant="secondary">Secondary</Button><Button variant="quiet">Quiet</Button><Button disabled>Disabled</Button><Button loading loadingLabel="Sending…">Loading</Button><ButtonLink to="/system" variant="secondary" icon="external">Link</ButtonLink><Spinner /></div>
      </Panel>
      <Panel title="Buttons — light surface" light>
        <div className="flex flex-wrap items-center gap-4"><Button icon="arrow">Primary (Onyx on Ivory)</Button><Button variant="secondary">Secondary</Button><Button variant="quiet">Quiet</Button><Button disabled>Disabled</Button></div>
      </Panel>
      <Panel title="Form fields and states">
        <div className="grid gap-8 md:grid-cols-2">
          <TextField label="Pristine" name="s-pristine" hint="Help text sits under the label." />
          <TextField label="Filled" name="s-filled" defaultValue="WeAmaze Visionary" required />
          <TextField label="Invalid" name="s-invalid" defaultValue="name@" required error="Enter an email address in the format name@example.com." />
          <TextField label="Disabled" name="s-disabled" disabled defaultValue="Not editable" />
          <SelectField label="Select" name="s-select" defaultValue="b"><option value="a">Option A</option><option value="b">Option B</option></SelectField>
          <TextArea label="Text area" name="s-area" rows={3} />
        </div>
        <div className="mt-10 grid gap-8 md:grid-cols-2">
          <ChoiceGroup legend="Choice group (multi)" name="s-choice" multiple options={publishedServices.slice(0, 4).map((s) => ({ value: s.slug, label: s.name }))} value={choice} onChange={setChoice} />
          <div className="space-y-6"><Checkbox name="s-check" label="Checkbox" checked={checked} onChange={setChecked} /><Checkbox name="s-check-err" label="Checkbox with error" checked={false} onChange={() => {}} error="Please confirm you agree." /></div>
        </div>
      </Panel>
      <Panel title="Alerts and status labels">
        <div className="grid gap-4 md:grid-cols-2"><Alert tone="info" title="Info" live={false}><p>Neutral information.</p></Alert><Alert tone="success" title="Success" live={false}><p>Server-confirmed outcome.</p></Alert><Alert tone="warning" title="Warning" live={false}><p>Attention needed.</p></Alert><Alert tone="error" title="Error" live={false}><p>Nothing was sent.</p></Alert></div>
        <div className="mt-8 flex flex-wrap gap-3"><StatusLabel status="client-work" /><StatusLabel status="studio-concept" /><StatusLabel status="capability-demonstration" /><StatusLabel status="confidential" /></div>
      </Panel>
      <Panel title="Accordion">
        <Accordion items={[{ id: 'a', title: 'Closed by default', content: <p>Disclosure content with an accessible expanded state.</p> }, { id: 'b', title: 'Second item', content: <p>Multiple items can be open.</p> }]} />
      </Panel>
      <Panel title="Project cards">
        <div className="space-y-16">{publishedProjects[0] ? <ProjectCard project={publishedProjects[0]} variant="featured" /> : null}<div className="grid gap-6 md:grid-cols-3">{publishedProjects.map((p) => <ProjectCard key={p.slug} project={p} variant="compact" />)}</div></div>
      </Panel>
    </>
  );
}
