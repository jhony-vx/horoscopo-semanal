export const ZODIAC_SIGNS = [
  { slug: 'aries', name: 'Aries', symbol: '♈', element: 'Fuego', elementKey: 'fire', dateRange: '21 mar - 19 abr' },
  { slug: 'tauro', name: 'Tauro', symbol: '♉', element: 'Tierra', elementKey: 'earth', dateRange: '20 abr - 20 may' },
  { slug: 'geminis', name: 'Géminis', symbol: '♊', element: 'Aire', elementKey: 'air', dateRange: '21 may - 20 jun' },
  { slug: 'cancer', name: 'Cáncer', symbol: '♋', element: 'Agua', elementKey: 'water', dateRange: '21 jun - 22 jul' },
  { slug: 'leo', name: 'Leo', symbol: '♌', element: 'Fuego', elementKey: 'fire', dateRange: '23 jul - 22 ago' },
  { slug: 'virgo', name: 'Virgo', symbol: '♍', element: 'Tierra', elementKey: 'earth', dateRange: '23 ago - 22 sep' },
  { slug: 'libra', name: 'Libra', symbol: '♎', element: 'Aire', elementKey: 'air', dateRange: '23 sep - 22 oct' },
  { slug: 'escorpio', name: 'Escorpio', symbol: '♏', element: 'Agua', elementKey: 'water', dateRange: '23 oct - 21 nov' },
  { slug: 'sagitario', name: 'Sagitario', symbol: '♐', element: 'Fuego', elementKey: 'fire', dateRange: '22 nov - 21 dic' },
  { slug: 'capricornio', name: 'Capricornio', symbol: '♑', element: 'Tierra', elementKey: 'earth', dateRange: '22 dic - 19 ene' },
  { slug: 'acuario', name: 'Acuario', symbol: '♒', element: 'Aire', elementKey: 'air', dateRange: '20 ene - 18 feb' },
  { slug: 'piscis', name: 'Piscis', symbol: '♓', element: 'Agua', elementKey: 'water', dateRange: '19 feb - 20 mar' },
] as const;

export type SignSlug = (typeof ZODIAC_SIGNS)[number]['slug'];
export type SignElementKey = (typeof ZODIAC_SIGNS)[number]['elementKey'];
export type ZodiacSign = (typeof ZODIAC_SIGNS)[number];

export function getSign(slug: string): ZodiacSign | undefined {
  return ZODIAC_SIGNS.find((sign) => sign.slug === slug);
}
