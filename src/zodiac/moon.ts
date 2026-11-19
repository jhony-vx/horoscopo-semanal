/** Fraction of the Moon's disc that is lit, from the phase angle (0 new, 180 full). */
export function illumination(phaseAngle: number): number {
  return (1 - Math.cos((phaseAngle * Math.PI) / 180)) / 2;
}

/**
 * SVG path of the lit part of the Moon, with the convention most calendars use:
 * waxing lit on the right, waning lit on the left.
 * The outer arc follows the limb; the inner arc is the terminator, an ellipse.
 */
export function moonLitPath(phaseAngle: number, radius: number, cx: number, cy: number): string {
  const angle = ((phaseAngle % 360) + 360) % 360;
  const cos = Math.cos((angle * Math.PI) / 180);
  const waxing = angle < 180;
  const crescent = cos > 0;
  const rx = Math.round(Math.abs(cos) * radius * 100) / 100;
  const outerSweep = waxing ? 1 : 0;
  const innerSweep = waxing ? (crescent ? 0 : 1) : crescent ? 1 : 0;
  const top = `${cx} ${cy - radius}`;
  const bottom = `${cx} ${cy + radius}`;
  return `M ${top} A ${radius} ${radius} 0 0 ${outerSweep} ${bottom} A ${rx} ${radius} 0 0 ${innerSweep} ${top} Z`;
}
