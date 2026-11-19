import { animate, inView } from 'motion';
import { isBelowFold, prefersReducedMotion } from './motion-preference';

/**
 * Fades sections in as they enter the viewport (Motion `inView`).
 * Content is never hidden by CSS: only elements that start below the fold are prepared,
 * so the page reads fine without JavaScript and nothing on screen blinks.
 */
export function initReveal(): void {
  if (prefersReducedMotion()) return;

  document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((element) => {
    if (!isBelowFold(element)) return;
    const order = Number(element.dataset.revealOrder ?? 0);
    element.style.opacity = '0';
    element.style.transform = 'translateY(28px)';

    inView(
      element,
      () => {
        animate(element, { opacity: 1, y: [28, 0] }, { duration: 0.6, delay: Math.min(order, 10) * 0.04, ease: [0.22, 1, 0.36, 1] });
      },
      { margin: '0px 0px -10% 0px' },
    );
  });
}
