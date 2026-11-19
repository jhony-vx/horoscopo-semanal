import { ZODIAC_SIGNS, type SignElementKey, type SignSlug } from './signs.ts';

/**
 * Geometry of the decorative zodiac wheel (SVG units, viewBox 0 0 1000 1000).
 * Angles are SVG degrees: clockwise from the positive x axis, because the y axis points down.
 * Like a natal chart, Aries sits on the left and the signs follow counterclockwise.
 */

export const WHEEL_SIZE = 1000;
export const WHEEL_CENTER = WHEEL_SIZE / 2;

export const WHEEL_RADII = {
  outer: 490,
  ticks: 470,
  labels: 432,
  labelsInner: 396,
  glyphs: 350,
  glyphsInner: 300,
  hub: 120,
  core: 64,
} as const;

/** The labels path starts on a sector boundary so no name is cut at the path start. */
export const LABEL_PATH_START = 15;

export interface Point {
  x: number;
  y: number;
}

export interface WheelSector {
  slug: SignSlug;
  name: string;
  symbol: string;
  elementKey: SignElementKey;
  /** Angle of the sector middle. */
  angle: number;
  /** `startOffset` for the label `textPath`, in percent. */
  labelOffset: number;
  glyph: Point & { rotate: number };
}

const round = (value: number) => Math.round(value * 100) / 100;

export function signAngle(index: number): number {
  return (((180 - 30 * index) % 360) + 360) % 360;
}

export function polar(radius: number, angle: number): Point {
  const radians = (angle * Math.PI) / 180;
  return { x: round(WHEEL_CENTER + radius * Math.cos(radians)), y: round(WHEEL_CENTER + radius * Math.sin(radians)) };
}

/** A full clockwise circle that starts at `startAngle`, usable as a `textPath`. */
export function circlePath(radius: number, startAngle = LABEL_PATH_START): string {
  const start = polar(radius, startAngle);
  const opposite = polar(radius, startAngle + 180);
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 1 1 ${opposite.x} ${opposite.y} A ${radius} ${radius} 0 1 1 ${start.x} ${start.y}`;
}

export function wheelSectors(): WheelSector[] {
  return ZODIAC_SIGNS.map((sign, index) => {
    const angle = signAngle(index);
    const glyph = polar((WHEEL_RADII.glyphs + WHEEL_RADII.glyphsInner) / 2 + 12, angle);
    return {
      slug: sign.slug,
      name: sign.name,
      symbol: sign.symbol,
      elementKey: sign.elementKey,
      angle,
      labelOffset: round(((((angle - LABEL_PATH_START) % 360) + 360) % 360) / 3.6),
      // The glyph top points away from the centre, like the labels.
      glyph: { ...glyph, rotate: round(angle + 90) },
    };
  });
}

/** Degree ticks: a short one every 2°, a long one every 10°. */
export function ticksPath(): string {
  const segments: string[] = [];
  for (let angle = 0; angle < 360; angle += 2) {
    const length = angle % 10 === 0 ? 16 : 7;
    const from = polar(WHEEL_RADII.ticks, angle);
    const to = polar(WHEEL_RADII.ticks + length, angle);
    segments.push(`M${from.x} ${from.y}L${to.x} ${to.y}`);
  }
  return segments.join('');
}

/** Sector boundaries, from the hub to the outer ring. */
export function spokesPath(): string {
  return Array.from({ length: 12 }, (_, index) => {
    const angle = signAngle(index) + 15;
    const from = polar(WHEEL_RADII.hub, angle);
    const to = polar(WHEEL_RADII.ticks, angle);
    return `M${from.x} ${from.y}L${to.x} ${to.y}`;
  }).join('');
}

/** One triangle per element joining its three signs (the classic trines), forming a twelve-point star. */
export function trinePaths(): { elementKey: SignElementKey; d: string }[] {
  return [0, 1, 2, 3].map((first) => {
    const points = [first, first + 4, first + 8].map((index) => polar(WHEEL_RADII.glyphsInner - 8, signAngle(index)));
    return {
      elementKey: ZODIAC_SIGNS[first].elementKey,
      d: `M${points.map((point) => `${point.x} ${point.y}`).join('L')}Z`,
    };
  });
}
