import type { ServiceSlug } from './types';

/** Lightweight service index for navigation (keeps full service copy out of the main bundle). */
export type ServiceIndexEntry = { slug: ServiceSlug; order: number; name: string; shortName: string; descriptor: string };
export const serviceIndex: ServiceIndexEntry[] = [
  { slug: 'ai-creative-studio', order: 1, name: 'AI Creative Studio', shortName: 'Creative Studio', descriptor: 'Campaigns, content and brand worlds made with human direction and generative craft.' },
  { slug: 'ai-presentations-pitch-decks', order: 2, name: 'AI Presentations & Pitch Decks', shortName: 'Presentations', descriptor: 'Investor, sales and leadership narratives designed to persuade.' },
  { slug: 'websites-digital-experiences', order: 3, name: 'Websites & Digital Experiences', shortName: 'Digital Experiences', descriptor: 'Websites, platforms and interactive experiences built for performance.' },
  { slug: 'apps-digital-products', order: 4, name: 'Apps & Digital Products', shortName: 'Digital Products', descriptor: 'Mobile and web products, from concept and interface to launch.' },
  { slug: 'ai-solutions-automation', order: 5, name: 'AI Solutions & Automation', shortName: 'AI Solutions', descriptor: 'Intelligent workflows, assistants and automation that remove friction.' },
  { slug: '3d-animation-motion-design', order: 6, name: '3D, Animation & Motion Design', shortName: '3D & Motion', descriptor: 'Three-dimensional design, animation and motion systems for every screen.' },
  { slug: 'brand-strategy-creative-direction', order: 7, name: 'Brand Strategy & Creative Direction', shortName: 'Brand Strategy', descriptor: 'Positioning, identity and creative leadership that give brands direction.' },
  { slug: 'digital-innovation-technology', order: 8, name: 'Digital Innovation & Technology', shortName: 'Innovation', descriptor: 'Emerging technology prototypes and innovation programmes.' },
];
export function serviceName(slug: ServiceSlug): string {
  return serviceIndex.find((s) => s.slug === slug)?.name ?? slug;
}
