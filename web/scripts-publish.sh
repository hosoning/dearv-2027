#!/usr/bin/env bash
# Build the three.js home and publish it into ../site, which GitHub Pages serves
# (the repository root index.html redirects to ./site/).
set -euo pipefail
cd "$(dirname "$0")"
npm run build
rm -rf ../site
cp -R dist ../site
# Kill switch for the old PWA service worker that visitors of the previous site still have.
cat > ../site/sw.js <<'SW'
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) await caches.delete(key);
    await self.registration.unregister();
    for (const client of await self.clients.matchAll({ type: 'window' })) client.navigate(client.url);
  })());
});
SW
touch ../.nojekyll ../site/.nojekyll
echo "published to site/"
