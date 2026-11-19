import { animate } from 'motion/mini';
import { EASE_OUT, isBelowFold, onceInView, prefersReducedMotion } from './motion-preference';

/**
 * Fades sections in as they enter the viewport (Motion mini, on the Web Animations API).
 * Content is never hidden by CSS: only elements that start below the fold are prepared,
 * so the page reads fine without JavaScript and nothing on screen blinks.
 */
export function initReveal(): void {
  if (prefersReducedMotion()) return;

  document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((element) => {
    if (!isBelowFold(element)) return;
    const order = Math.min(Number(element.dataset.revealOrder ?? 0), 10);
    element.style.opacity = '0';
    element.style.translate = '0 28px';

    onceInView(element, () => {
      animate(element, { opacity: [0, 1], translate: ['0 28px', '0 0'] }, { duration: 0.6, delay: order * 0.04, ease: EASE_OUT }).then(() => {
        element.style.removeProperty('opacity');
        element.style.removeProperty('translate');
      });
    });
  });
}
