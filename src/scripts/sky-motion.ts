import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * The wheel already turns slowly with CSS. While the reader scrolls, GSAP adds a little extra
 * rotation, grows it and dims it, so the text below the hero sits on a quieter background.
 */
export function initSkyMotion(): void {
  const track = document.querySelector('[data-sky-wheel]');
  if (!track) return;

  gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
    gsap.fromTo(
      track,
      { rotation: 0, scale: 1, opacity: 0.62 },
      {
        rotation: 45,
        scale: 1.18,
        opacity: 0.26,
        ease: 'none',
        scrollTrigger: { trigger: document.documentElement, start: 'top top', end: () => `+=${window.innerHeight * 1.6}`, scrub: 0.8 },
      },
    );
  });
}
