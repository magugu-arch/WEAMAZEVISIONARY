# syntax=docker/dockerfile:1
#
# WeAmaze Visionary: a prerendered React site and its Node API, served by one small Node
# server (no Nginx needed: the server handles static files, compression, caching, security
# headers, direct URLs and the 404 page itself). Built for Fly.io; see docs/12_DEPLOY_FLY.md.

# ---- Build: install, compile and prerender ---------------------------------------------
FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV npm_config_update_notifier=false npm_config_fund=false npm_config_audit=false
COPY package.json package-lock.json .npmrc ./
RUN npm ci
COPY . .
# Public, build-time settings (never secrets). Production builds leave out work not yet
# cleared for publication (scripts/hold-back.ts) and are indexable by search engines.
ARG PUBLIC_SITE_ENV=production
ARG PUBLIC_SITE_URL=https://weamazevisionary.com
ARG PUBLIC_ANALYTICS_PROVIDER=none
ENV PUBLIC_SITE_ENV=$PUBLIC_SITE_ENV PUBLIC_SITE_URL=$PUBLIC_SITE_URL PUBLIC_ANALYTICS_PROVIDER=$PUBLIC_ANALYTICS_PROVIDER
RUN npm run build

# ---- Run: only the built site and the bundled server (no node_modules, no source) ------
FROM node:22-bookworm-slim AS runtime
WORKDIR /app
# The server must run in the same mode the site was built in (indexing, headers, routes).
ARG PUBLIC_SITE_ENV=production
ARG PUBLIC_SITE_URL=https://weamazevisionary.com
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8080 \
    LEAD_STORE_DIR=/data \
    PUBLIC_SITE_ENV=$PUBLIC_SITE_ENV \
    PUBLIC_SITE_URL=$PUBLIC_SITE_URL
COPY --from=build /app/dist/client ./dist/client
COPY --from=build /app/dist/server ./dist/server
COPY scripts/docker-entrypoint.sh /usr/local/bin/docker-entrypoint
RUN chmod 0755 /usr/local/bin/docker-entrypoint && mkdir -p /data && chown node:node /data
VOLUME ["/data"]
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8080)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
# Starts as root only to hand /data to the "node" user, then runs the server as "node".
ENTRYPOINT ["docker-entrypoint"]
CMD ["node", "dist/server/node.js"]
