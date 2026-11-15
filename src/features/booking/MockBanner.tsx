import { FlaskConical } from 'lucide-react';
import { Icon } from '@/lib/icon';

/** Shown on every booking screen when the development mock is active. Impossible to miss. */
export function MockBanner() {
  return (
    <div role="note" className="flex items-start gap-3 border border-dashed border-ivory p-4" data-testid="booking-mock-banner">
      <Icon as={FlaskConical} size={20} className="mt-0.5" />
      <p className="t-small"><span className="font-medium">Development mock.</span> Times are simulated and no meeting is booked, no invitation is sent and no one is notified. This mode cannot run in production.</p>
    </div>
  );
}
