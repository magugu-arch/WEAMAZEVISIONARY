import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import { AppRoutes } from './app/App';
import { matchRouteDef, routeDefs } from './app/routes';
import { renderHead, resolveMeta, publicRoutes, sitemapRoutes, llmsTxt } from './lib/seo';
import { SITE_URL, INDEXABLE, SITE_ENV } from './lib/env';
import { StandaloneEdition } from './features/standalone/StandaloneEdition';
import { standaloneHead } from './features/standalone/head';
import { REFERRER_POLICY, metaCsp } from '@shared/security';
import { settings } from './content/settings';

export async function render(url: string) {
  await Promise.all(routeDefs.map((r) => r.Component.preload()));
  const pathname = new URL(url, 'http://local').pathname;
  const html = renderToString(
    <StrictMode>
      <StaticRouter location={url}>
        <AppRoutes />
      </StaticRouter>
    </StrictMode>,
  );
  const meta = resolveMeta(pathname);
  return { html, head: renderHead(meta), status: meta.status, routeFile: matchRouteDef(pathname).file };
}

/** Offline single-file edition (scripts/standalone.mjs inlines every asset). */
export function renderStandalone(generatedOn: string) {
  const preview = SITE_ENV !== 'production';
  const html = renderToString(<StandaloneEdition generatedOn={generatedOn} preview={preview} />);
  return { html, head: standaloneHead() };
}

export { publicRoutes, sitemapRoutes, llmsTxt, SITE_URL, INDEXABLE, SITE_ENV };
/** Where vulnerability reports go (security.txt): the studio inbox the owner supplied. */
export const SECURITY_CONTACT = settings.contactEmail.value;
/** The page-level copy of the security policy, written into every prerendered page's <head>. */
export const META_CSP = metaCsp();
export { REFERRER_POLICY };
