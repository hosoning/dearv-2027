// GitHub Pages currently publishes this repository in legacy branch mode.
// The build workflow writes the exported Next.js app into /site, so assets
// need to be generated with that subpath included. Other hosts stay at root.
const isGithubPages = process.env.GITHUB_PAGES === 'true';
const pagesSubdir = process.env.GITHUB_PAGES_SUBDIR || '';
const basePath = isGithubPages ? `/dearv-2027${pagesSubdir ? `/${pagesSubdir}` : ''}` : '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  basePath,
  assetPrefix: basePath ? `${basePath}/` : undefined,
};

export default nextConfig;
