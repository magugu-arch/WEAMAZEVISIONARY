/**
 * Start file for hosts that ask for an "entry file", such as Hostinger's managed Node.js
 * web apps (docs/14_DEPLOY_HOSTINGER.md). It starts the built server, dist/server/node.js,
 * which serves the prerendered site and the enquiry API on PORT (default 4173).
 * Run the build first: npm run build:production
 */
import { existsSync } from 'node:fs';

const server = new URL('./dist/server/node.js', import.meta.url);
if (!existsSync(server)) {
  console.error('dist/server/node.js is missing: run "npm run build:production" before starting the site.');
  process.exit(1);
}
await import(server.href);
