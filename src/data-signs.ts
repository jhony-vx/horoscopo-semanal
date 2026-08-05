export const ZODIAC_SIGNS = [
  { slug: 'aries', name: 'Aries', symbol: '♈', element: 'Fuego', elementKey: 'fire', dateRange: '21 mar - 19 abr', logoSrc: '/assets/zodiac/aries.svg' },
  { slug: 'tauro', name: 'Tauro', symbol: '♉', element: 'Tierra', elementKey: 'earth', dateRange: '20 abr - 20 may', logoSrc: '/assets/zodiac/tauro.svg' },
  { slug: 'geminis', name: 'Géminis', symbol: '♊', element: 'Aire', elementKey: 'air', dateRange: '21 may - 20 jun', logoSrc: '/assets/zodiac/geminis.svg' },
  { slug: 'cancer', name: 'Cáncer', symbol: '♋', element: 'Agua', elementKey: 'water', dateRange: '21 jun - 22 jul', logoSrc: '/assets/zodiac/cancer.svg' },
  { slug: 'leo', name: 'Leo', symbol: '♌', element: 'Fuego', elementKey: 'fire', dateRange: '23 jul - 22 ago', logoSrc: '/assets/zodiac/leo.svg' },
  { slug: 'virgo', name: 'Virgo', symbol: '♍', element: 'Tierra', elementKey: 'earth', dateRange: '23 ago - 22 sep', logoSrc: '/assets/zodiac/virgo.svg' },
  { slug: 'libra', name: 'Libra', symbol: '♎', element: 'Aire', elementKey: 'air', dateRange: '23 sep - 22 oct', logoSrc: '/assets/zodiac/libra.svg' },
  { slug: 'escorpio', name: 'Escorpio', symbol: '♏', element: 'Agua', elementKey: 'water', dateRange: '23 oct - 21 nov', logoSrc: '/assets/zodiac/escorpio.svg' },
  { slug: 'sagitario', name: 'Sagitario', symbol: '♐', element: 'Fuego', elementKey: 'fire', dateRange: '22 nov - 21 dic', logoSrc: '/assets/zodiac/sagitario.svg' },
  { slug: 'capricornio', name: 'Capricornio', symbol: '♑', element: 'Tierra', elementKey: 'earth', dateRange: '22 dic - 19 ene', logoSrc: '/assets/zodiac/capricornio.svg' },
  { slug: 'acuario', name: 'Acuario', symbol: '♒', element: 'Aire', elementKey: 'air', dateRange: '20 ene - 18 feb', logoSrc: '/assets/zodiac/acuario.svg' },
  { slug: 'piscis', name: 'Piscis', symbol: '♓', element: 'Agua', elementKey: 'water', dateRange: '19 feb - 20 mar', logoSrc: '/assets/zodiac/piscis.svg' },
] as const;

export type SignSlug = (typeof ZODIAC_SIGNS)[number]['slug'];
export type SignElementKey = (typeof ZODIAC_SIGNS)[number]['elementKey'];
export type ZodiacSign = (typeof ZODIAC_SIGNS)[number];

export function getSign(slug: string): ZodiacSign | undefined {
  return ZODIAC_SIGNS.find((sign) => sign.slug === slug);
}
