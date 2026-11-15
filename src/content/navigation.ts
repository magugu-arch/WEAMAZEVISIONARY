/** Single source of truth for primary navigation (V10 §04). */
export const primaryNav = [
  { label: 'Work', to: '/work' },
  { label: 'Services', to: '/services', hasMenu: true },
  { label: 'Approach', to: '/approach' },
  { label: 'Studio', to: '/studio' },
  { label: 'Insights', to: '/insights' },
  { label: 'Contact', to: '/contact' },
] as const;

export const legalNav = [
  { label: 'Privacy', to: '/privacy' },
  { label: 'Terms', to: '/terms' },
  { label: 'Cookies', to: '/cookies' },
] as const;
