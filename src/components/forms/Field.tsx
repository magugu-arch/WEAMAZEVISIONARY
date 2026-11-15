import { useId } from 'react';
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { AlertCircle, Check } from 'lucide-react';
import { Icon } from '@/lib/icon';
import { cn } from '@/lib/cn';

/**
 * Form primitives (V11.16 state matrix): persistent labels, visible
 * required/optional status, help text and errors programmatically associated,
 * 2 px Gold focus ring, no placeholder-only labels.
 */
const control = 'block w-full border bg-transparent px-4 py-3 text-base transition-[border-color] duration-150 border-rule-strong hover:border-current focus-visible:border-current disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-error';

type Base = { label: string; name: string; hint?: ReactNode; error?: string; required?: boolean; className?: string };

function FieldShell({ id, label, hint, error, required, className, children }: Base & { id: string; children: ReactNode }) {
  return (
    <div className={cn('min-w-0', className)}>
      <label htmlFor={id} className="flex flex-wrap items-baseline justify-between gap-x-4 font-medium">
        <span>{label}</span>
        <span className="t-caption text-2 font-normal">{required ? 'Required' : 'Optional'}</span>
      </label>
      {hint ? <p id={`${id}-hint`} className="t-small text-2 mt-1.5">{hint}</p> : null}
      <div className="mt-3">{children}</div>
      {error ? (
        <p id={`${id}-error`} className="t-small text-error mt-2 flex items-start gap-2">
          <Icon as={AlertCircle} size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}
const describedBy = (id: string, hint?: unknown, error?: string) => [hint ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined;

export function TextField({ label, name, hint, error, required, className, ...rest }: Base & Omit<InputHTMLAttributes<HTMLInputElement>, 'name'>) {
  const id = `f-${name}-${useId()}`;
  return (
    <FieldShell id={id} label={label} name={name} hint={hint} error={error} required={required} className={className}>
      <input id={id} name={name} required={required} aria-required={required} aria-invalid={error ? true : undefined} aria-describedby={describedBy(id, hint, error)} className={cn(control, 'min-h-12')} data-field={name} {...rest} />
    </FieldShell>
  );
}

export function TextArea({ label, name, hint, error, required, className, rows = 5, ...rest }: Base & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'name'>) {
  const id = `f-${name}-${useId()}`;
  return (
    <FieldShell id={id} label={label} name={name} hint={hint} error={error} required={required} className={className}>
      <textarea id={id} name={name} rows={rows} required={required} aria-required={required} aria-invalid={error ? true : undefined} aria-describedby={describedBy(id, hint, error)} className={cn(control, 'resize-y leading-relaxed')} data-field={name} {...rest} />
    </FieldShell>
  );
}

export function SelectField({ label, name, hint, error, required, className, children, ...rest }: Base & Omit<SelectHTMLAttributes<HTMLSelectElement>, 'name'> & { children: ReactNode }) {
  const id = `f-${name}-${useId()}`;
  return (
    <FieldShell id={id} label={label} name={name} hint={hint} error={error} required={required} className={className}>
      <select id={id} name={name} required={required} aria-required={required} aria-invalid={error ? true : undefined} aria-describedby={describedBy(id, hint, error)} className={cn(control, 'min-h-12 appearance-none bg-[length:16px] bg-[right_1rem_center] bg-no-repeat pr-10 [&>option]:bg-onyx [&>option]:text-ivory')} style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 fill=%27none%27 stroke=%27%23BFC0C2%27 stroke-width=%271.25%27%3E%3Cpath d=%27M3 6l5 5 5-5%27/%3E%3C/svg%3E")' }} data-field={name} {...rest}>
        {children}
      </select>
    </FieldShell>
  );
}

/** Group of checkboxes or radios rendered as large, labelled options. Selection is shown by a mark + border, not colour alone. */
export function ChoiceGroup<T extends string>({
  legend, name, hint, error, required, options, value, onChange, multiple = false, columns = 2, className,
}: {
  legend: string; name: string; hint?: ReactNode; error?: string; required?: boolean; className?: string; columns?: 1 | 2 | 3;
  options: readonly { value: T; label: string; description?: string; disabled?: boolean }[];
  value: T[]; onChange: (next: T[]) => void; multiple?: boolean;
}) {
  const base = `g-${name}-${useId()}`;
  return (
    <fieldset className={cn('min-w-0', className)} aria-describedby={describedBy(base, hint, error)} aria-invalid={error ? true : undefined} data-field={name}>
      <legend className="flex w-full flex-wrap items-baseline justify-between gap-x-4 font-medium">
        <span>{legend}</span>
        <span className="t-caption text-2 font-normal">{required ? 'Required' : 'Optional'}</span>
      </legend>
      {hint ? <p id={`${base}-hint`} className="t-small text-2 mt-1.5">{hint}</p> : null}
      <div className={cn('mt-4 grid gap-3', columns === 2 && 'md:grid-cols-2', columns === 3 && 'md:grid-cols-3')}>
        {options.map((o) => {
          const checked = value.includes(o.value);
          const id = `${base}-${o.value}`;
          return (
            <label key={o.value} htmlFor={id} className={cn('group relative flex min-h-14 cursor-pointer items-start gap-4 border p-4 transition-colors', checked ? 'border-current' : 'border-rule-strong hover:border-current', o.disabled && 'cursor-not-allowed opacity-50', error && !checked && 'border-error')}>
              <input
                id={id}
                type={multiple ? 'checkbox' : 'radio'}
                name={name}
                value={o.value}
                checked={checked}
                disabled={o.disabled}
                onChange={(e) => onChange(multiple ? (e.target.checked ? [...value, o.value] : value.filter((v) => v !== o.value)) : [o.value])}
                className="peer sr-only"
              />
              <span aria-hidden="true" className={cn('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold', multiple ? '' : 'rotate-45 scale-75', checked ? 'border-current bg-ivory text-onyx [.surface-light_&]:bg-onyx [.surface-light_&]:text-ivory' : 'border-rule-strong')}>
                {checked ? <Icon as={Check} size={14} className={multiple ? '' : '-rotate-45'} /> : null}
              </span>
              <span className="min-w-0">
                <span className="block font-medium">{o.label}</span>
                {o.description ? <span className="t-small text-2 mt-1 block">{o.description}</span> : null}
              </span>
            </label>
          );
        })}
      </div>
      {error ? (
        <p id={`${base}-error`} className="t-small text-error mt-3 flex items-start gap-2"><Icon as={AlertCircle} size={16} className="mt-0.5 shrink-0" /><span>{error}</span></p>
      ) : null}
    </fieldset>
  );
}

export function Checkbox({ name, label, checked, onChange, error, children }: { name: string; label: ReactNode; checked: boolean; onChange: (v: boolean) => void; error?: string; children?: ReactNode }) {
  const id = `c-${name}-${useId()}`;
  return (
    <div data-field={name}>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-4">
        <input id={id} type="checkbox" name={name} checked={checked} onChange={(e) => onChange(e.target.checked)} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : undefined} className="peer sr-only" />
        <span aria-hidden="true" className={cn('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold', checked ? 'border-current bg-ivory text-onyx' : error ? 'border-error' : 'border-rule-strong')}>
          {checked ? <Icon as={Check} size={14} /> : null}
        </span>
        <span className="t-small">{label}{children}</span>
      </label>
      {error ? <p id={`${id}-error`} className="t-small text-error mt-2 flex items-start gap-2 pl-9"><Icon as={AlertCircle} size={16} className="mt-0.5 shrink-0" /><span>{error}</span></p> : null}
    </div>
  );
}

/** Error summary: focusable, lists problems and links to each field (V11.21). */
export function ErrorSummary({ errors, labels, id = 'error-summary' }: { errors: Record<string, string>; labels: Record<string, string>; id?: string }) {
  const entries = Object.entries(errors);
  if (!entries.length) return null;
  return (
    <div id={id} tabIndex={-1} role="alert" aria-labelledby={`${id}-title`} className="border border-error p-5 outline-none focus-visible:outline-2">
      <p id={`${id}-title`} className="flex items-center gap-2 font-medium text-error"><Icon as={AlertCircle} size={18} /> {entries.length === 1 ? 'One answer needs attention' : `${entries.length} answers need attention`}</p>
      <ul className="t-small mt-3 space-y-1.5 pl-6">
        {entries.map(([k, msg]) => (
          <li key={k} className="list-disc">
            <a href={`#${k}`} className="underline underline-offset-4" onClick={(e) => { e.preventDefault(); const el = document.querySelector<HTMLElement>(`[data-field="${k.split('.').pop()}"]`); (el?.matches('fieldset') ? el.querySelector<HTMLElement>('input') : el)?.focus(); el?.scrollIntoView({ block: 'center' }); }}>
              {labels[k] ?? k}: {msg}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Visually hidden honeypot. Real visitors never see or fill it. */
export function Honeypot({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label>Website<input type="text" name="website" tabIndex={-1} autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} /></label>
    </div>
  );
}
