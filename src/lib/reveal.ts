/**
 * Progressive scroll reveal. Elements render visible in HTML; this opts them in
 * only after hydration, only when motion is allowed and only if they start
 * below the fold, so no content is ever hidden by a failed script.
 */
export function initReveal(root: ParentNode = document): () => void {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return () => {};
  const els = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]:not([data-reveal="shown"])'));
  const vh = window.innerHeight;
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          (e.target as HTMLElement).dataset.reveal = 'shown';
          io.unobserve(e.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );
  for (const el of els) {
    if (el.getBoundingClientRect().top < vh * 0.92) {
      el.dataset.reveal = 'shown';
      continue;
    }
    el.dataset.reveal = 'pending';
    io.observe(el);
  }
  return () => io.disconnect();
}
