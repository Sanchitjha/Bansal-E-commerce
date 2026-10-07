/** Public base URL of the storefront, used for canonical links, sitemap and links inside emails. */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, '');
  const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelProd) return `https://${vercelProd}`;
  return 'http://localhost:3000';
}

/** Turns a site-relative path such as /products/a.jpg into a full link; full links pass through unchanged. */
export function absoluteUrl(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `${siteUrl()}${url.startsWith('/') ? '' : '/'}${url}`;
}
