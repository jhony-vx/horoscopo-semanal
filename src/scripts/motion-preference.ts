export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** True when the element starts below the fold, so animating it in cannot hide content already on screen. */
export function isBelowFold(element: Element): boolean {
  return element.getBoundingClientRect().top > window.innerHeight * 0.92;
}
