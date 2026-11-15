import { lazy } from 'react';
import type { ComponentType } from 'react';
import { matchPath } from 'react-router';
import { registerPreloader } from './preload';
import { SHOW_SYSTEM_ROUTES } from '@/lib/env';

type Loader = () => Promise<{ default: ComponentType }>;

/**
 * Route-level code splitting that is also SSR/hydration-safe: once a chunk is
 * preloaded, the component renders synchronously (no Suspense flash), so the
 * prerendered HTML and the first client render match exactly.
 */
export type RouteComponent = ComponentType & { preload: () => Promise<void> };
function lazyRoute(load: Loader): RouteComponent {
  let Loaded: ComponentType | null = null;
  const Lazy = lazy(async () => {
    const m = await load();
    Loaded = m.default;
    return m;
  });
  const Route = (() => (Loaded ? <Loaded /> : <Lazy />)) as unknown as RouteComponent;
  Route.preload = async () => {
    if (!Loaded) Loaded = (await load()).default;
  };
  return Route;
}

export type RouteDef = { id: string; path: string; file: string; Component: RouteComponent; system?: boolean };

const def = (id: string, path: string, file: string, load: Loader, system = false): RouteDef => ({ id, path, file, Component: lazyRoute(load), system });

const all: RouteDef[] = [
  def('home', '/', 'src/features/home/HomePage.tsx', () => import('@/features/home/HomePage')),
  def('work', '/work', 'src/features/work/WorkPage.tsx', () => import('@/features/work/WorkPage')),
  def('project', '/work/:slug', 'src/features/work/CaseStudyPage.tsx', () => import('@/features/work/CaseStudyPage')),
  def('services', '/services', 'src/features/services/ServicesPage.tsx', () => import('@/features/services/ServicesPage')),
  def('service', '/services/:slug', 'src/features/services/ServiceDetailPage.tsx', () => import('@/features/services/ServiceDetailPage')),
  def('approach', '/approach', 'src/features/approach/ApproachPage.tsx', () => import('@/features/approach/ApproachPage')),
  def('studio', '/studio', 'src/features/studio/StudioPage.tsx', () => import('@/features/studio/StudioPage')),
  def('insights', '/insights', 'src/features/insights/InsightsPage.tsx', () => import('@/features/insights/InsightsPage')),
  def('insight', '/insights/:slug', 'src/features/insights/InsightPage.tsx', () => import('@/features/insights/InsightPage')),
  def('start', '/start-a-project', 'src/features/project-enquiry/ProjectBuilderPage.tsx', () => import('@/features/project-enquiry/ProjectBuilderPage')),
  def('book', '/book-a-call', 'src/features/booking/BookingPage.tsx', () => import('@/features/booking/BookingPage')),
  def('book-manage', '/book-a-call/manage', 'src/features/booking/ManageBookingPage.tsx', () => import('@/features/booking/ManageBookingPage')),
  def('contact', '/contact', 'src/features/contact/ContactPage.tsx', () => import('@/features/contact/ContactPage')),
  def('privacy', '/privacy', 'src/features/legal/LegalPage.tsx', () => import('@/features/legal/LegalPage')),
  def('terms', '/terms', 'src/features/legal/LegalPage.tsx', () => import('@/features/legal/LegalPage')),
  def('cookies', '/cookies', 'src/features/legal/LegalPage.tsx', () => import('@/features/legal/LegalPage')),
  def('system', '/system', 'src/features/system/SystemPage.tsx', () => import('@/features/system/SystemPage'), true),
  def('not-found', '*', 'src/features/not-found/NotFoundPage.tsx', () => import('@/features/not-found/NotFoundPage')),
];

/** System/QA routes exist only in development and staging builds. */
export const routeDefs: RouteDef[] = all.filter((r) => !r.system || SHOW_SYSTEM_ROUTES);

export function matchRouteDef(pathname: string): RouteDef {
  const clean = pathname.replace(/\/+$/, '') || '/';
  return routeDefs.find((r) => r.path !== '*' && matchPath({ path: r.path, end: true }, clean)) ?? routeDefs[routeDefs.length - 1]!;
}

export async function preloadPathname(pathname: string) {
  await matchRouteDef(pathname).Component.preload();
}
registerPreloader(preloadPathname);
