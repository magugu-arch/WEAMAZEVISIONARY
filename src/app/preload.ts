/** Route-chunk preloading registry, decoupled from the route table to avoid import cycles. */
type Preloader = (pathname: string) => Promise<void>;
let preloader: Preloader = async () => {};
export function registerPreloader(fn: Preloader) {
  preloader = fn;
}
export function preloadPath(href: string): void {
  if (!href.startsWith('/')) return;
  void preloader(href.split(/[?#]/)[0] ?? href).catch(() => {});
}
