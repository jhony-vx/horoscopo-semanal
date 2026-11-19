import { addDays, type IsoDate } from './calendar.ts';
import { DOMAINS, influencesFor, toScores, type AspectKey, type Domain, type Influence, type RankedSign, type RawScores } from './scoring.ts';
import { getSign, ZODIAC_SIGNS, type SignSlug } from './signs.ts';
import { lunationsBetween, skyOn, type BodyKey, type MoonPhaseKey, type Sky } from './sky.ts';

/**
 * Spanish copy for the generated readings. Every choice is seeded by date and sign,
 * so a rerun produces the same text while consecutive days read differently.
 */

const BODY_NAMES: Record<BodyKey, string> = {
  sun: 'el Sol',
  moon: 'la Luna',
  mercury: 'Mercurio',
  venus: 'Venus',
  mars: 'Marte',
  jupiter: 'Júpiter',
  saturn: 'Saturno',
};

const ASPECT_PHRASES: Record<AspectKey, string> = {
  conjunction: 'en tu propio signo',
  sextile: 'en sextil con tu signo',
  square: 'en cuadratura con tu signo',
  trine: 'en trígono con tu signo',
  opposition: 'en oposición a tu signo',
};

export const MOON_PHASE_NAMES: Record<MoonPhaseKey, string> = {
  new: 'luna nueva',
  'waxing-crescent': 'luna creciente',
  'first-quarter': 'cuarto creciente',
  'waxing-gibbous': 'luna gibosa creciente',
  full: 'luna llena',
  'waning-gibbous': 'luna gibosa menguante',
  'last-quarter': 'cuarto menguante',
  'waning-crescent': 'luna menguante',
};

const SIGN_FOCUS: Record<SignSlug, string> = {
  aries: 'canalizar tu iniciativa con intención',
  tauro: 'fortalecer lo que ya funciona',
  geminis: 'ordenar tus ideas antes de compartirlas',
  cancer: 'cuidar tus límites con serenidad',
  leo: 'mostrar tu talento sin forzar el ritmo',
  virgo: 'resolver lo esencial con flexibilidad',
  libra: 'decidir con equilibrio y confianza',
  escorpio: 'transformar la tensión en claridad',
  sagitario: 'darle estructura a una idea nueva',
  capricornio: 'avanzar con disciplina y perspectiva',
  acuario: 'convertir una idea original en acción',
  piscis: 'combinar intuición con pasos concretos',
};

type Tone = 'low' | 'mid' | 'high';

/** Sentences start in lowercase so they can follow a lead such as "Hoy," or a sky clause. */
export const PHRASES: Record<Domain, Record<Tone, string[]>> = {
  general: {
    high: [
      'el ambiente acompaña tus planes y conviene aprovecharlo para dar un paso que venías postergando.',
      'tienes viento a favor: una decisión clara puede abrir más puertas de las que esperas.',
      'la energía fluye con facilidad, así que es buen momento para mostrar lo que sabes hacer.',
    ],
    mid: [
      'el momento pide equilibrio entre lo que quieres y lo que realmente puedes sostener.',
      'avanzar paso a paso te dará más resultados que intentar resolverlo todo a la vez.',
      'hay espacio para crecer si eliges una prioridad y le das tu mejor atención.',
    ],
    low: [
      'conviene bajar el ritmo y revisar antes de comprometerte con algo nuevo.',
      'puede haber algo de fricción; tómalo como una señal para ajustar el rumbo con calma.',
      'la paciencia será tu mejor recurso para atravesar un momento más exigente.',
    ],
  },
  love: {
    high: [
      'los vínculos se sienten cálidos y una muestra de cariño tendrá buena respuesta.',
      'es un buen momento para expresar lo que sientes sin rodeos y con ternura.',
      'la cercanía crece cuando compartes un plan sencillo con quien te importa.',
    ],
    mid: [
      'escuchar hasta el final evitará malentendidos y acercará posiciones.',
      'un gesto pequeño de atención puede decir más que una larga explicación.',
      'los acuerdos fluyen mejor si nombras lo que necesitas sin esperar que lo adivinen.',
    ],
    low: [
      'las emociones pueden estar sensibles; elige bien el momento para conversar.',
      'evita sacar conclusiones apresuradas y date tiempo antes de responder.',
      'cuidar tu espacio personal también es una forma de cuidar la relación.',
    ],
  },
  professional: {
    high: [
      'tu trabajo gana visibilidad y una propuesta bien presentada puede destacar.',
      'es un buen día para liderar, coordinar y cerrar pendientes importantes.',
      'tu enfoque rinde de verdad: aprovecha para avanzar en lo que más pesa.',
    ],
    mid: [
      'priorizar dos tareas clave será más productivo que dispersarte en muchas.',
      'una revisión cuidadosa de los detalles evitará repetir trabajo más adelante.',
      'tu método funciona si aceptas un ajuste práctico sin perder la calidad.',
    ],
    low: [
      'confirma plazos y acuerdos antes de avanzar; un malentendido podría retrasarte.',
      'no es el mejor momento para decisiones apresuradas: revisa, consulta y luego actúa.',
      'pide apoyo si lo necesitas; repartir la carga te permitirá rendir mejor.',
    ],
  },
  financial: {
    high: [
      'se abre una oportunidad para ordenar tus cuentas y planear con optimismo.',
      'una decisión económica pensada con calma puede darte buenos resultados.',
      'es buen momento para invertir en algo que te haga crecer a largo plazo.',
    ],
    mid: [
      'comparar opciones antes de comprar cuidará tu presupuesto sin privarte de disfrutar.',
      'una revisión breve de tus gastos te dará claridad y tranquilidad.',
      'busca un punto medio entre disfrutar el presente y reservar para lo que viene.',
    ],
    low: [
      'conviene evitar las compras impulsivas y dejar margen para imprevistos.',
      'revisa la letra pequeña antes de asumir cualquier compromiso económico.',
      'pospón los gastos grandes hasta tener más perspectiva sobre tus prioridades.',
    ],
  },
  wellbeing: {
    high: [
      'tu energía está alta: mover el cuerpo te ayudará a canalizarla con alegría.',
      'te sentirás con ánimo para retomar un hábito que te hace bien.',
      'el descanso y la actividad encuentran un buen equilibrio natural.',
    ],
    mid: [
      'alternar movimiento con pausas breves te ayudará a sostener el ritmo.',
      'una rutina sencilla, agua suficiente y buen descanso harán la diferencia.',
      'reducir estímulos por un rato favorecerá una pausa mental reparadora.',
    ],
    low: [
      'escucha a tu cuerpo y no te exijas de más; el descanso también es productivo.',
      'un espacio tranquilo y un rato sin pantallas te ayudarán a recuperar equilibrio.',
      'prioriza dormir bien y aflojar la exigencia para recuperar energía de a poco.',
    ],
  },
};

export const FORECAST_HEADINGS: Record<Domain, string> = {
  general: 'Suerte general',
  love: 'Suerte amorosa',
  professional: 'Suerte profesional',
  financial: 'Suerte económica',
  wellbeing: 'Energía y bienestar',
};

function hash(text: string): number {
  let value = 2166136261;
  for (let index = 0; index < text.length; index++) {
    value ^= text.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function pick<T>(options: readonly T[], seed: string): T {
  return options[hash(seed) % options.length];
}

/** ["Marte", "Júpiter", "Saturno"] -> "Marte, Júpiter y Saturno". */
function joinWithY(items: readonly string[]): string {
  return items.length > 1 ? items.slice(0, -1).join(', ') + ' y ' + items[items.length - 1] : items.join('');
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function toneFor(score: number): Tone {
  return score >= 4 ? 'high' : score <= 2 ? 'low' : 'mid';
}

export function signName(signIndex: number): string {
  return ZODIAC_SIGNS[signIndex].name;
}

/** "Venus en Libra, en sextil con tu signo" (retrograde planets say so). */
export function describeInfluence(sky: Sky, influence: Influence): string {
  const position = sky.bodies[influence.body];
  const retrograde = position.retrograde ? ' retrógrado' : '';
  return `${BODY_NAMES[influence.body]}${retrograde} en ${signName(position.signIndex)}, ${ASPECT_PHRASES[influence.aspect]}`;
}

/**
 * The strongest influence that agrees with the tone of the section: a supportive aspect
 * for a good score, a tense one for a low score. Mid scores accept either.
 */
function influenceMatching(influences: readonly Influence[], tone: Tone, exclude: readonly BodyKey[]): Influence | undefined {
  return influences.find((influence) => {
    if (exclude.includes(influence.body)) return false;
    if (tone === 'high') return influence.weight > 0;
    if (tone === 'low') return influence.weight < 0;
    return true;
  });
}

export interface ComposedReading {
  summary: string;
  body: string;
}

interface ReadingInput {
  sign: SignSlug;
  /** Sky that names the influences of the reading. */
  sky: Sky;
  raw: RawScores;
  /** Lead word for every paragraph: "Hoy", "Mañana", "Este mes"... */
  lead: string;
  seed: string;
  /** Bodies too fast to describe a long period (the Moon for weeks and months). */
  excludeBodies?: BodyKey[];
}

function composeSections({ sign, sky, raw, lead, seed, excludeBodies = [] }: ReadingInput): { summary: string; sections: Record<Domain, string> } {
  const scores = toScores(raw);
  // Each body is named at most once per reading so sections do not repeat the same clause.
  const named: BodyKey[] = [...excludeBodies];
  const clauses = {} as Record<Domain, Influence | undefined>;
  const sections = Object.fromEntries(
    DOMAINS.map((domain) => {
      const tone = toneFor(scores[domain]);
      const phrase = pick(PHRASES[domain][tone], `${seed}:${sign}:${domain}`);
      const influence = influenceMatching(influencesFor(sky, sign, domain), tone, named);
      clauses[domain] = influence;
      if (influence) named.push(influence.body);
      const text = influence ? `${lead}, con ${describeInfluence(sky, influence)}, ${phrase}` : `${lead}, ${phrase}`;
      return [domain, text];
    }),
  ) as Record<Domain, string>;
  const main = clauses.general;
  const name = getSign(sign)!.name;
  const skyClause = main ? `con ${describeInfluence(sky, main)}, ` : '';
  const advice = toneFor(scores.general) === 'low' ? `conviene ${SIGN_FOCUS[sign]} sin apurarte` : `es buen momento para ${SIGN_FOCUS[sign]}`;
  const summary = `${lead}, ${name}: ${skyClause}${advice}.`;
  return { summary, sections };
}

export function composeForecast(input: ReadingInput): ComposedReading {
  const { summary, sections } = composeSections(input);
  const body = DOMAINS.map((domain) => `## ${FORECAST_HEADINGS[domain]}\n\n${sections[domain]}`).join('\n\n') + '\n';
  return { summary, body };
}

export function composeDailyForecast(sign: SignSlug, date: IsoDate, lead: 'Hoy' | 'Mañana', raw: RawScores): ComposedReading {
  const sky = skyOn(date);
  const reading = composeForecast({ sign, sky, raw, lead, seed: date });
  const moon = `La Luna transita ${signName(sky.bodies.moon.signIndex)} en fase de ${MOON_PHASE_NAMES[sky.moonPhase]}.`;
  return { ...reading, body: reading.body + `\n> ${moon}\n` };
}

export function composeMonthlyForecast(sign: SignSlug, start: IsoDate, monthName: string, raw: RawScores): ComposedReading {
  return composeForecast({ sign, sky: skyOn(addDays(start, 14)), raw, lead: `Durante ${monthName}`, seed: start, excludeBodies: ['moon'] });
}

export function composeWeeklyHoroscope(sign: SignSlug, start: IsoDate, raw: RawScores): ComposedReading {
  const { summary, sections } = composeSections({
    sign,
    sky: skyOn(addDays(start, 3)),
    raw,
    lead: 'Esta semana',
    seed: start,
    excludeBodies: ['moon'],
  });
  const body = [
    `## El tono de tu semana\n\n${sections.general}`,
    `## Amor y vínculos\n\n${sections.love}`,
    `## Trabajo y bienestar\n\n${sections.professional} ${capitalize(sections.wellbeing.replace(/^Esta semana, /, ''))}`,
  ].join('\n\n');
  return { summary, body: body + '\n' };
}

export interface WeekEdition {
  title: string;
  theme: string;
  intro: string;
  body: string;
}

function sunIngressIn(start: IsoDate): { date: IsoDate; signIndex: number } | undefined {
  for (let offset = 1; offset < 7; offset++) {
    const date = addDays(start, offset);
    const today = skyOn(date).bodies.sun.signIndex;
    if (today !== skyOn(addDays(date, -1)).bodies.sun.signIndex) return { date, signIndex: today };
  }
  return undefined;
}

export function composeWeekEdition(start: IsoDate, end: IsoDate, ranking: readonly RankedSign[], formatDay: (date: IsoDate) => string): WeekEdition {
  const midweek = skyOn(addDays(start, 3));
  const ingress = sunIngressIn(start);
  const [moon] = lunationsBetween(start, end);
  const leader = getSign(ranking[0].sign)!.name;
  const closing = getSign(ranking[ranking.length - 1].sign)!.name;
  const retrogrades = (['mercury', 'venus', 'mars', 'jupiter', 'saturn'] as const).filter((body) => midweek.bodies[body].retrograde);

  const title = ingress
    ? `El Sol entra en ${signName(ingress.signIndex)}`
    : moon
      ? `${capitalize(MOON_PHASE_NAMES[moon.phase])} en ${signName(moon.signIndex)}`
      : pick(['Avanzar con intención', 'Un cielo para ordenar prioridades', 'Pasos firmes, ritmo propio', 'Claridad antes que prisa', 'Escuchar antes de decidir', 'Una semana para sembrar', 'El valor de lo constante', 'Mirar el mapa completo'], start);

  const events = [
    `El Sol recorre ${signName(skyOn(start).bodies.sun.signIndex)}`,
    ingress ? `y el ${formatDay(ingress.date)} entra en ${signName(ingress.signIndex)}` : '',
  ].filter(Boolean).join(' ');
  const moonLine = moon ? ` La ${MOON_PHASE_NAMES[moon.phase]} del ${formatDay(moon.date)} cae en ${signName(moon.signIndex)}.` : '';
  const retroLine = retrogrades.length
    ? ` ${joinWithY(retrogrades.map((body) => capitalize(BODY_NAMES[body])))} ${retrogrades.length > 1 ? 'están retrógrados' : 'está retrógrado'}: buen momento para revisar antes de lanzar.`
    : '';

  const theme = pick(
    [
      'La claridad crece cuando el entusiasmo encuentra una forma concreta de avanzar.',
      'Ordenar prioridades deja espacio para lo que de verdad importa.',
      'Escuchar el ritmo propio ayuda a decidir con más calma.',
      'Los pequeños avances sostenidos pesan más que los grandes saltos.',
    ],
    `${start}:theme`,
  );
  const intro = `Del ${formatDay(start)} al ${formatDay(end)}, ${leader} encabeza el ranking y ${closing} cierra la tabla. ${events}.${moonLine} Es una lectura de entretenimiento: quédate con lo que te ayude a decidir con más claridad.`;
  const body = `${events}.${moonLine}${retroLine}\n\nEl ranking se calcula con las posiciones reales del Sol, la Luna y los planetas durante la semana. Cada signo recibe más puntos cuando los astros forman aspectos armónicos con él y menos cuando forman tensiones.\n`;

  return { title, theme, intro, body };
}
