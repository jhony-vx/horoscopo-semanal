/** `accent` is each sign's color on the dark theme; it must stay legible on the night background. */
export const ZODIAC_SIGNS = [
  { slug: 'aries', name: 'Aries', symbol: '♈', element: 'Fuego', elementKey: 'fire', dateRange: '21 mar - 19 abr', accent: '#ff7a5c' },
  { slug: 'tauro', name: 'Tauro', symbol: '♉', element: 'Tierra', elementKey: 'earth', dateRange: '20 abr - 20 may', accent: '#d9b26a' },
  { slug: 'geminis', name: 'Géminis', symbol: '♊', element: 'Aire', elementKey: 'air', dateRange: '21 may - 20 jun', accent: '#7cc8ff' },
  { slug: 'cancer', name: 'Cáncer', symbol: '♋', element: 'Agua', elementKey: 'water', dateRange: '21 jun - 22 jul', accent: '#6fd6c6' },
  { slug: 'leo', name: 'Leo', symbol: '♌', element: 'Fuego', elementKey: 'fire', dateRange: '23 jul - 22 ago', accent: '#ffc04d' },
  { slug: 'virgo', name: 'Virgo', symbol: '♍', element: 'Tierra', elementKey: 'earth', dateRange: '23 ago - 22 sep', accent: '#c9b79c' },
  { slug: 'libra', name: 'Libra', symbol: '♎', element: 'Aire', elementKey: 'air', dateRange: '23 sep - 22 oct', accent: '#a7abff' },
  { slug: 'escorpio', name: 'Escorpio', symbol: '♏', element: 'Agua', elementKey: 'water', dateRange: '23 oct - 21 nov', accent: '#ff6f9f' },
  { slug: 'sagitario', name: 'Sagitario', symbol: '♐', element: 'Fuego', elementKey: 'fire', dateRange: '22 nov - 21 dic', accent: '#ff9a5c' },
  { slug: 'capricornio', name: 'Capricornio', symbol: '♑', element: 'Tierra', elementKey: 'earth', dateRange: '22 dic - 19 ene', accent: '#a9c7b2' },
  { slug: 'acuario', name: 'Acuario', symbol: '♒', element: 'Aire', elementKey: 'air', dateRange: '20 ene - 18 feb', accent: '#5fd3e0' },
  { slug: 'piscis', name: 'Piscis', symbol: '♓', element: 'Agua', elementKey: 'water', dateRange: '19 feb - 20 mar', accent: '#a493ff' },
] as const;

export type SignSlug = (typeof ZODIAC_SIGNS)[number]['slug'];

export const SIGN_SLUGS = ZODIAC_SIGNS.map((sign) => sign.slug) as [SignSlug, ...SignSlug[]];
export type SignElementKey = (typeof ZODIAC_SIGNS)[number]['elementKey'];
export type ZodiacSign = (typeof ZODIAC_SIGNS)[number];

export function getSign(slug: string): ZodiacSign | undefined {
  return ZODIAC_SIGNS.find((sign) => sign.slug === slug);
}
