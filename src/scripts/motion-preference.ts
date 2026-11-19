export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** True when the element starts below the fold, so animating it in cannot hide content already on screen. */
export function isBelowFold(element: Element): boolean {
  return element.getBoundingClientRect().top > window.innerHeight * 0.92;
}

/** Calls `callback` once, the first time the element enters the viewport. */
export function onceInView(element: Element, callback: () => void, rootMargin = '0px 0px -10% 0px'): void {
  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      callback();
    },
    { rootMargin },
  );
  observer.observe(element);
}

/** Ease-out with a small overshoot: reads as a soft spring without loading a physics engine. */
export const SPRING_EASE = [0.34, 1.32, 0.64, 1] as const;
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;
