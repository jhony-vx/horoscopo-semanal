/**
 * Pure helpers for the weekly editions (no Astro imports, so `node --test` can run them).
 * An edition is a published week with its twelve published horoscopes.
 */

export interface RankedEntry {
  sign: string;
  rank: number;
}

export interface EditionTimeline<T> {
  current?: T;
  /** The edition published right before the current one. */
  previous?: T;
  /** Every edition up to the current one, newest first. */
  archive: T[];
}

/**
 * Orders complete editions and splits them around `today`: the current one is the latest
 * that already started; future editions (prepared ahead of time) stay out of the archive.
 */
export function editionTimeline<T>(editions: readonly T[], weekStartOf: (edition: T) => string, today: string): EditionTimeline<T> {
  const ordered = [...editions].sort((a, b) => weekStartOf(b).localeCompare(weekStartOf(a)));
  const started = ordered.filter((edition) => weekStartOf(edition) <= today);
  // If nothing started yet (a fresh site), show the newest prepared edition, as the home always did.
  const archive = started.length > 0 ? started : ordered.slice(0, 1);
  return { current: archive[0], previous: archive[1], archive };
}

export type Movement = { kind: 'up' | 'down'; places: number } | { kind: 'same' } | { kind: 'new' };

/** How a sign moved compared with the previous edition. */
export function rankMovement(rank: number, previousRank: number | undefined): Movement {
  if (previousRank === undefined) return { kind: 'new' };
  if (previousRank === rank) return { kind: 'same' };
  return previousRank > rank ? { kind: 'up', places: previousRank - rank } : { kind: 'down', places: rank - previousRank };
}

export function ranksBySign(entries: readonly RankedEntry[]): Map<string, number> {
  return new Map(entries.map((entry) => [entry.sign, entry.rank]));
}

/** Short label shown next to the position: "+2", "−1" or "=". */
export function movementLabel(movement: Movement): string {
  if (movement.kind === 'up') return `+${movement.places}`;
  if (movement.kind === 'down') return `−${movement.places}`;
  return movement.kind === 'same' ? '=' : '';
}

/** Full sentence for screen readers and tooltips. */
export function movementDescription(movement: Movement): string {
  if (movement.kind === 'up') return `Subió ${movement.places} ${movement.places === 1 ? 'puesto' : 'puestos'} desde la semana pasada`;
  if (movement.kind === 'down') return `Bajó ${movement.places} ${movement.places === 1 ? 'puesto' : 'puestos'} desde la semana pasada`;
  return movement.kind === 'same' ? 'Mantiene su puesto de la semana pasada' : '';
}
