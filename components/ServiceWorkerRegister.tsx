'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Relative path so this also resolves correctly when the app is
      // served from a subpath (e.g. GitHub Pages' /<repo>/ basePath).
      navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then((registration) => registration.update()).catch((err) => console.warn('Service worker registration failed', err));
    }
  }, []);
  return null;
}
