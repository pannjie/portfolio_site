// Prefix a root-relative path with the site's base path (e.g. /portfolio_site on GitHub Pages),
// so links and public assets work whether the site is served from / or a subfolder.
export function withBase(path: string): string {
	const base = import.meta.env.BASE_URL.replace(/\/$/, '');
	return `${base}${path}`;
}
