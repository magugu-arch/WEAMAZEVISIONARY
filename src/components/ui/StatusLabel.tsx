import type { ProjectStatus } from '@/content/types';
import { cn } from '@/lib/cn';

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  'client-work': 'Client Work',
  'studio-concept': 'Studio Concept',
  'capability-demonstration': 'Capability Demonstration',
  confidential: 'Confidential / Anonymised',
};
export const STATUS_DESCRIPTIONS: Record<ProjectStatus, string> = {
  'client-work': 'Commissioned work, published with the client’s permission.',
  'studio-concept': 'Created internally by the studio. Not a paid client commission.',
  'capability-demonstration': 'An illustrative piece showing how we would approach a type of work.',
  confidential: 'Client work shared with permission, with identifying details removed.',
};

/**
 * The provenance line for one project. Client work, or work featuring another company's
 * brand, whose written permission is not yet recorded appears only in staging previews
 * (never in production, see publishableProjects), and says so rather than claiming permission.
 */
export function statusDescription(project: { status: ProjectStatus; permission: { publicationApproved: boolean; thirdParty?: boolean } }): string {
  if (project.status === 'client-work' && !project.permission.publicationApproved) return 'Client work, shown in this preview. Publication awaits the client’s written permission.';
  if (project.permission.thirdParty && !project.permission.publicationApproved) return 'Shown in this preview only. It features a named brand, so publication awaits that brand’s written permission.';
  return STATUS_DESCRIPTIONS[project.status];
}

/** Text label (never colour alone) for portfolio provenance — V10 §08. */
export function StatusLabel({ status, className }: { status: ProjectStatus; className?: string }) {
  return (
    <span className={cn('t-label inline-flex w-fit items-center gap-2 border border-rule-strong px-2 py-1.5', className)}>
      <span aria-hidden="true" className={cn('inline-block h-1.5 w-1.5', status === 'client-work' ? 'bg-gold' : 'border border-current')} />
      {STATUS_LABELS[status]}
    </span>
  );
}
