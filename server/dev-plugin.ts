import type { Plugin } from 'vite';
import type * as RouterModule from './api/router';
import type * as AdapterModule from './lib/nodeAdapter';

/** Mounts the same API handlers in the Vite dev server (hot-reloaded via ssrLoadModule). */
export function apiDevPlugin(): Plugin {
  return {
    name: 'wv-api-dev',
    apply: 'serve',
    configureServer(server) {
      process.env.NODE_ENV ??= 'development';
      process.env.BOOKING_PROVIDER ??= 'mock';
      process.env.EMAIL_PROVIDER ??= 'log';
      process.env.LEAD_STORE_DIR ??= 'data/dev';
      process.env.PUBLIC_SITE_ENV ??= 'development';
      process.env.MIN_FORM_SECONDS ??= '2';
      let api: { handle(req: Request, ip: string): Promise<Response> } | null = null;
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next();
        try {
          const { createApi } = (await server.ssrLoadModule('/server/api/router.ts')) as typeof RouterModule;
          const { toRequest, sendResponse, clientIp } = (await server.ssrLoadModule('/server/lib/nodeAdapter.ts')) as typeof AdapterModule;
          api ??= createApi();
          const request = await toRequest(req, `http://${req.headers.host ?? 'localhost'}`);
          await sendResponse(res, await api.handle(request, clientIp(req, false)));
        } catch (e) {
          next(e);
        }
      });
    },
  };
}
