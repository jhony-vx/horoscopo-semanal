import { SIGN_SLUGS, type SignSlug } from './signs.ts';

/**
 * Sign-to-sign compatibility from the distance between signs on the wheel,
 * the same geometry the scoring model uses for aspects. Entertainment only.
 */

export type RelationKind = 'same' | 'semisextile' | 'sextile' | 'square' | 'trine' | 'quincunx' | 'opposition';

export interface Relation {
  kind: RelationKind;
  /** Affinity from 0 to 100. */
  score: number;
  label: string;
  text: string;
}

const RELATIONS: Record<RelationKind, Omit<Relation, 'kind'>> = {
  trine: { score: 92, label: 'Sintonía natural', text: 'Comparten elemento: se entienden sin explicarse demasiado y se impulsan mutuamente.' },
  sextile: { score: 84, label: 'Complicidad', text: 'Sus elementos se alimentan: hay chispa, conversación y ganas de hacer cosas juntos.' },
  same: { score: 76, label: 'Espejo', text: 'Se reconocen al instante; el desafío es no amplificar los mismos defectos.' },
  opposition: { score: 70, label: 'Atracción de opuestos', text: 'Cada uno tiene lo que al otro le falta: funciona cuando aceptan aprender del contraste.' },
  semisextile: { score: 60, label: 'Vecinos', text: 'Ritmos distintos pero cercanos: con curiosidad, la diferencia se vuelve complemento.' },
  quincunx: { score: 54, label: 'Ajuste fino', text: 'Miran la vida desde lugares muy distintos; piden paciencia y acuerdos claros.' },
  square: { score: 46, label: 'Fricción creativa', text: 'Chocan con facilidad, pero esa tensión puede empujarlos a crecer si eligen dialogar.' },
};

const KIND_BY_DISTANCE: RelationKind[] = ['same', 'semisextile', 'sextile', 'square', 'trine', 'quincunx', 'opposition'];

export function relationBetween(a: SignSlug, b: SignSlug): Relation {
  const distance = Math.abs(SIGN_SLUGS.indexOf(a) - SIGN_SLUGS.indexOf(b));
  const kind = KIND_BY_DISTANCE[Math.min(distance, 12 - distance)];
  return { kind, ...RELATIONS[kind] };
}

export interface Affinities {
  best: SignSlug[];
  complement: SignSlug;
  challenging: SignSlug[];
}

/** The signs that flow (trines and sextiles), the opposite one and the tense ones (squares). */
export function affinitiesFor(sign: SignSlug): Affinities {
  const others = SIGN_SLUGS.filter((other) => other !== sign);
  const byKind = (...kinds: RelationKind[]) => others.filter((other) => kinds.includes(relationBetween(sign, other).kind));
  return {
    best: [...byKind('trine'), ...byKind('sextile')],
    complement: byKind('opposition')[0],
    challenging: byKind('square'),
  };
}

/** Every pair, for the client-side compatibility tool. */
export function compatibilityMatrix(): Record<string, Relation> {
  return Object.fromEntries(SIGN_SLUGS.flatMap((a) => SIGN_SLUGS.map((b) => [`${a}:${b}`, relationBetween(a, b)])));
}
