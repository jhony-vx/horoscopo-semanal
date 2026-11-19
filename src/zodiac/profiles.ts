import type { SignSlug } from './signs.ts';

/** A stylised star map in a 100 × 60 box: [x, y, radius]. */
export type Star = readonly [number, number, number];

export interface Constellation {
  stars: readonly Star[];
  /** Pairs of star indexes joined by a line. */
  lines: readonly (readonly [number, number])[];
}

export interface SignProfile {
  /** What the symbol represents. */
  emblem: string;
  ruler: string;
  /** Classical ruler, when the modern one differs. */
  classicalRuler?: string;
  modality: 'Cardinal' | 'Fija' | 'Mutable';
  polarity: 'Activa' | 'Receptiva';
  keywords: readonly [string, string, string];
  strengths: readonly [string, string, string];
  challenges: readonly [string, string];
  luckyDay: string;
  color: string;
  stone: string;
  myth: string;
  constellation: Constellation;
}

/** Traditional astrological associations, offered as entertainment. */
export const SIGN_PROFILES: Record<SignSlug, SignProfile> = {
  aries: {
    emblem: 'El carnero',
    ruler: 'Marte',
    modality: 'Cardinal',
    polarity: 'Activa',
    keywords: ['Iniciativa', 'Coraje', 'Impulso'],
    strengths: ['Arranca proyectos sin esperar permiso', 'Contagia entusiasmo', 'Defiende lo que considera justo'],
    challenges: ['La impaciencia', 'Decidir antes de escuchar'],
    luckyDay: 'Martes',
    color: 'Rojo',
    stone: 'Rubí',
    myth: 'El carnero de vellón dorado que rescató a Frixo y Hele; su lana fue el vellocino que buscaron los argonautas.',
    constellation: {
      stars: [[14, 42, 1.6], [48, 28, 3], [62, 31, 2.2], [72, 40, 1.4]],
      lines: [[0, 1], [1, 2], [2, 3]],
    },
  },
  tauro: {
    emblem: 'El toro',
    ruler: 'Venus',
    modality: 'Fija',
    polarity: 'Receptiva',
    keywords: ['Constancia', 'Calma', 'Disfrute'],
    strengths: ['Sostiene el esfuerzo en el tiempo', 'Aporta estabilidad', 'Sabe disfrutar lo simple'],
    challenges: ['La terquedad', 'Resistirse a los cambios'],
    luckyDay: 'Viernes',
    color: 'Verde',
    stone: 'Esmeralda',
    myth: 'Zeus tomó la forma de un toro blanco para llevarse a la princesa Europa a través del mar.',
    constellation: {
      stars: [[30, 36, 1.8], [36, 30, 1.6], [44, 22, 1.8], [42, 40, 3.2], [86, 8, 2.6], [84, 48, 2.2], [12, 14, 1.4], [16, 18, 1.1], [10, 19, 1]],
      lines: [[0, 1], [1, 2], [2, 4], [0, 3], [3, 5]],
    },
  },
  geminis: {
    emblem: 'Los gemelos',
    ruler: 'Mercurio',
    modality: 'Mutable',
    polarity: 'Activa',
    keywords: ['Curiosidad', 'Ingenio', 'Conversación'],
    strengths: ['Aprende rápido', 'Conecta ideas y personas', 'Se adapta con humor'],
    challenges: ['La dispersión', 'Cambiar de rumbo a mitad de camino'],
    luckyDay: 'Miércoles',
    color: 'Amarillo',
    stone: 'Ágata',
    myth: 'Cástor y Pólux, hermanos inseparables que decidieron compartir la inmortalidad para no separarse nunca.',
    constellation: {
      stars: [[26, 8, 2.8], [23, 26, 1.6], [19, 42, 1.6], [14, 56, 1.8], [46, 10, 3.2], [49, 28, 1.6], [53, 44, 1.6], [58, 56, 1.8]],
      lines: [[0, 1], [1, 2], [2, 3], [4, 5], [5, 6], [6, 7], [1, 5]],
    },
  },
  cancer: {
    emblem: 'El cangrejo',
    ruler: 'la Luna',
    modality: 'Cardinal',
    polarity: 'Receptiva',
    keywords: ['Cuidado', 'Memoria', 'Intuición'],
    strengths: ['Protege a los suyos', 'Lee el ánimo de los demás', 'Crea hogar donde llega'],
    challenges: ['Encerrarse en su caparazón', 'Guardar lo que le dolió'],
    luckyDay: 'Lunes',
    color: 'Plateado',
    stone: 'Piedra de luna',
    myth: 'El cangrejo que Hera envió contra Heracles mientras luchaba con la Hidra; la diosa lo honró con un lugar en el cielo.',
    constellation: {
      stars: [[50, 32, 1.8], [48, 8, 1.6], [30, 54, 2], [72, 54, 1.8], [52, 22, 1.2]],
      lines: [[1, 4], [4, 0], [0, 2], [0, 3]],
    },
  },
  leo: {
    emblem: 'El león',
    ruler: 'el Sol',
    modality: 'Fija',
    polarity: 'Activa',
    keywords: ['Brillo', 'Generosidad', 'Orgullo'],
    strengths: ['Lidera con calidez', 'Celebra a los demás', 'Se entrega con el corazón'],
    challenges: ['Necesitar aplausos', 'Tomarse todo como algo personal'],
    luckyDay: 'Domingo',
    color: 'Dorado',
    stone: 'Ojo de tigre',
    myth: 'El león de Nemea, de piel invulnerable, al que Heracles venció en el primero de sus doce trabajos.',
    constellation: {
      stars: [[30, 48, 3], [28, 36, 1.8], [34, 24, 2.4], [42, 16, 1.6], [36, 9, 1.4], [26, 13, 1.8], [62, 38, 1.8], [66, 27, 2.2], [88, 33, 2.6]],
      lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [2, 7], [7, 8], [8, 6], [6, 0]],
    },
  },
  virgo: {
    emblem: 'La doncella',
    ruler: 'Mercurio',
    modality: 'Mutable',
    polarity: 'Receptiva',
    keywords: ['Precisión', 'Servicio', 'Análisis'],
    strengths: ['Ve los detalles que otros pasan por alto', 'Ordena el caos', 'Ayuda sin hacer ruido'],
    challenges: ['El perfeccionismo', 'Exigirse de más'],
    luckyDay: 'Miércoles',
    color: 'Marrón tierra',
    stone: 'Zafiro',
    myth: 'Astrea, diosa de la justicia, fue la última inmortal en dejar la Tierra y se convirtió en estrellas.',
    constellation: {
      stars: [[60, 54, 3], [46, 31, 1.8], [30, 33, 1.4], [12, 28, 1.8], [54, 20, 1.6], [62, 8, 2], [72, 38, 1.6]],
      lines: [[3, 2], [2, 1], [1, 4], [4, 5], [1, 6], [6, 0]],
    },
  },
  libra: {
    emblem: 'La balanza',
    ruler: 'Venus',
    modality: 'Cardinal',
    polarity: 'Activa',
    keywords: ['Armonía', 'Diálogo', 'Belleza'],
    strengths: ['Busca acuerdos justos', 'Cuida las formas', 'Escucha todos los puntos de vista'],
    challenges: ['La indecisión', 'Evitar el conflicto a cualquier costo'],
    luckyDay: 'Viernes',
    color: 'Rosa',
    stone: 'Ópalo',
    myth: 'La balanza de Astrea, con la que la diosa pesaba los actos de los mortales con equidad.',
    constellation: {
      stars: [[24, 40, 2.4], [48, 12, 2.6], [70, 38, 1.8], [80, 54, 1.4], [30, 56, 1.4]],
      lines: [[0, 1], [1, 2], [2, 0], [2, 3], [0, 4]],
    },
  },
  escorpio: {
    emblem: 'El escorpión',
    ruler: 'Plutón',
    classicalRuler: 'Marte',
    modality: 'Fija',
    polarity: 'Receptiva',
    keywords: ['Intensidad', 'Profundidad', 'Transformación'],
    strengths: ['Llega al fondo de las cosas', 'Es leal hasta el final', 'Se reinventa después de cada crisis'],
    challenges: ['Los celos', 'Desconfiar de entrada'],
    luckyDay: 'Martes',
    color: 'Granate',
    stone: 'Topacio',
    myth: 'El escorpión que Gea envió contra el cazador Orión; por eso nunca comparten el cielo al mismo tiempo.',
    constellation: {
      stars: [[14, 8, 2], [12, 22, 2], [12, 34, 1.4], [32, 24, 3.2], [40, 32, 1.6], [46, 41, 1.6], [52, 49, 1.6], [62, 55, 1.8], [76, 55, 1.8], [85, 47, 2.2], [81, 39, 1.8]],
      lines: [[0, 1], [1, 2], [1, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10]],
    },
  },
  sagitario: {
    emblem: 'El arquero',
    ruler: 'Júpiter',
    modality: 'Mutable',
    polarity: 'Activa',
    keywords: ['Aventura', 'Optimismo', 'Sentido'],
    strengths: ['Contagia esperanza', 'Se anima a lo desconocido', 'Dice la verdad con franqueza'],
    challenges: ['Prometer más de lo que puede', 'Aburrirse de la rutina'],
    luckyDay: 'Jueves',
    color: 'Púrpura',
    stone: 'Turquesa',
    myth: 'El centauro Quirón, sabio maestro de héroes, que renunció a su inmortalidad para liberar a Prometeo.',
    constellation: {
      stars: [[20, 40, 2.2], [30, 26, 2], [42, 20, 1.8], [54, 30, 2.4], [54, 44, 2.6], [36, 48, 2], [66, 24, 1.6], [72, 38, 1.6], [8, 30, 1.4]],
      lines: [[0, 1], [1, 2], [2, 3], [1, 3], [3, 4], [4, 5], [5, 0], [3, 6], [6, 7], [7, 4], [0, 8]],
    },
  },
  capricornio: {
    emblem: 'La cabra marina',
    ruler: 'Saturno',
    modality: 'Cardinal',
    polarity: 'Receptiva',
    keywords: ['Disciplina', 'Ambición', 'Paciencia'],
    strengths: ['Construye paso a paso', 'Asume responsabilidades', 'No se rinde ante la cuesta'],
    challenges: ['Cargar con todo solo', 'Postergar el descanso'],
    luckyDay: 'Sábado',
    color: 'Gris pizarra',
    stone: 'Granate',
    myth: 'El dios Pan, que al huir del monstruo Tifón se lanzó al río y quedó mitad cabra y mitad pez.',
    constellation: {
      stars: [[10, 18, 2.2], [20, 28, 1.6], [34, 48, 1.8], [50, 52, 1.6], [70, 44, 1.6], [88, 22, 2.4], [76, 20, 1.6], [58, 28, 1.4], [40, 32, 1.4]],
      lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 1]],
    },
  },
  acuario: {
    emblem: 'El aguador',
    ruler: 'Urano',
    classicalRuler: 'Saturno',
    modality: 'Fija',
    polarity: 'Activa',
    keywords: ['Originalidad', 'Libertad', 'Comunidad'],
    strengths: ['Imagina lo que todavía no existe', 'Piensa en el bien común', 'Respeta la diferencia'],
    challenges: ['La distancia emocional', 'Llevar la contraria por costumbre'],
    luckyDay: 'Sábado',
    color: 'Turquesa',
    stone: 'Amatista',
    myth: 'Ganimedes, el joven que Zeus llevó al Olimpo para servir el agua y el néctar de los dioses.',
    constellation: {
      stars: [[10, 18, 2], [26, 24, 2.4], [40, 15, 2.2], [52, 25, 1.6], [62, 20, 1.6], [68, 12, 1.4], [74, 21, 1.4], [46, 38, 1.6], [38, 50, 1.6], [56, 56, 1.4]],
      lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 4], [3, 7], [7, 8], [7, 9]],
    },
  },
  piscis: {
    emblem: 'Los dos peces',
    ruler: 'Neptuno',
    classicalRuler: 'Júpiter',
    modality: 'Mutable',
    polarity: 'Receptiva',
    keywords: ['Sensibilidad', 'Imaginación', 'Compasión'],
    strengths: ['Siente lo que otros callan', 'Crea mundos con su imaginación', 'Perdona con facilidad'],
    challenges: ['Evadirse de lo difícil', 'Absorber el ánimo ajeno'],
    luckyDay: 'Jueves',
    color: 'Verde mar',
    stone: 'Aguamarina',
    myth: 'Afrodita y su hijo Eros se ataron con una cuerda y se lanzaron al río convertidos en peces para escapar de Tifón.',
    constellation: {
      stars: [[50, 56, 2.2], [38, 44, 1.4], [26, 34, 1.4], [14, 26, 1.8], [8, 16, 1.4], [16, 8, 1.6], [26, 14, 1.4], [62, 38, 1.4], [72, 22, 1.6], [82, 8, 2]],
      lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3], [0, 7], [7, 8], [8, 9]],
    },
  },
};
