// GitHub Pages serves this repo at /<repo-name>/, not the domain root, so
// the deploy workflow sets GITHUB_PAGES=true to prefix every route/asset
// with a basePath. Other hosts (Vercel, local dev, a custom domain) leave
// it unset and get root-path URLs as usual.
const isGithubPages = process.env.GITHUB_PAGES === 'true';
const basePath = isGithubPages ? '/dearv-2027' : '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  basePath,
  assetPrefix: basePath ? `${basePath}/` : undefined,
};

export default nextConfig;
