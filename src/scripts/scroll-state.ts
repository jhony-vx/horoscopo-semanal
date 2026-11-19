import { prefersReducedMotion } from './motion-preference';

/** Header background and the back-to-top button both depend on leaving the top of the page. */
export function initScrollState(): void {
  const sentinel = document.querySelector('[data-top-sentinel]');
  const header = document.querySelector('[data-site-header]');
  const backToTop = document.querySelector<HTMLButtonElement>('[data-back-to-top]');
  if (!sentinel || !('IntersectionObserver' in window)) return;

  new IntersectionObserver(([entry]) => {
    const scrolled = !entry.isIntersecting;
    header?.classList.toggle('is-scrolled', scrolled);
    if (backToTop) backToTop.hidden = !scrolled;
  }).observe(sentinel);

  backToTop?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  });
}
