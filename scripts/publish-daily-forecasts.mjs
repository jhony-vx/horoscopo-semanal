import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const forecastsDir = join(root, 'src', 'content', 'forecasts');
const signs = [
  { slug: 'aries', name: 'Aries', focus: 'canalizar tu iniciativa con intención', general: 'Tu impulso encuentra mejor dirección cuando eliges una sola prioridad y le das un avance concreto.', love: 'Una conversación directa, dicha con calidez, puede despejar una duda y acercarte a alguien importante.', work: 'Tu rapidez suma si antes confirmas el objetivo y coordinas los detalles con tu equipo.', money: 'Revisa un gasto pequeño antes de decidir; ordenar lo cotidiano te dará mayor tranquilidad.', wellbeing: 'Alternar movimiento con pausas breves ayudará a sostener tu energía sin exigirte de más.' },
  { slug: 'tauro', name: 'Tauro', focus: 'fortalecer lo que ya funciona', general: 'La constancia será tu aliada para cerrar un pendiente y recuperar espacio mental durante el día.', love: 'Un gesto sencillo de atención puede aportar más cercanía que una explicación demasiado larga.', work: 'Tu método rinde cuando aceptas un ajuste práctico sin perder de vista la calidad del resultado.', money: 'Prioriza lo necesario y deja las compras impulsivas para otro momento con más perspectiva.', wellbeing: 'Una rutina cómoda, agua suficiente y descanso oportuno pueden ayudarte a mantener buen ritmo.' },
  { slug: 'geminis', name: 'Géminis', focus: 'ordenar tus ideas antes de compartirlas', general: 'Tu curiosidad abre opciones interesantes si separas lo urgente de lo que todavía puede madurar.', love: 'Escuchar hasta el final te permitirá responder con empatía y evitar conclusiones apresuradas.', work: 'Una idea ágil gana fuerza cuando la presentas con ejemplos claros y un siguiente paso posible.', money: 'Comparar alternativas con calma puede ayudarte a cuidar tu presupuesto sin dejar de disfrutar.', wellbeing: 'Reducir estímulos por un rato favorecerá una pausa mental más reparadora y enfocada.' },
  { slug: 'cancer', name: 'Cáncer', focus: 'cuidar tus límites con serenidad', general: 'Tu sensibilidad funciona como brújula cuando la acompañas con límites claros y decisiones simples.', love: 'Expresar lo que necesitas con serenidad puede abrir un intercambio más honesto y afectuoso.', work: 'Tu intuición sobre el ambiente será útil si la contrastas con datos antes de actuar.', money: 'Organizar pagos cercanos te dará claridad y evitará cargar con preocupaciones innecesarias.', wellbeing: 'Un espacio tranquilo y una pausa sin pantallas pueden ayudarte a recuperar equilibrio.' },
  { slug: 'leo', name: 'Leo', focus: 'mostrar tu talento sin forzar el ritmo', general: 'Tu presencia destaca de manera natural cuando compartes el mérito y mantienes una actitud abierta.', love: 'La generosidad emocional acercará posiciones, siempre que también escuches lo que la otra persona espera.', work: 'Puedes liderar una tarea con claridad si delegas bien y reconoces los aportes del grupo.', money: 'Date un gusto razonable sin convertirlo en una competencia ni comprometer otros planes.', wellbeing: 'Mover el cuerpo de forma agradable puede renovar tu ánimo y liberar tensión acumulada.' },
  { slug: 'virgo', name: 'Virgo', focus: 'resolver lo esencial con flexibilidad', general: 'Tu mirada práctica encuentra una salida cuando aceptas que una solución suficiente también puede ser valiosa.', love: 'Una observación cuidadosa se sentirá como apoyo si la expresas con ternura y sin corregir de más.', work: 'Priorizar dos tareas importantes será más productivo que intentar controlar cada detalle a la vez.', money: 'Una revisión breve de tus gastos te permitirá ajustar sin caer en restricciones poco realistas.', wellbeing: 'Aflojar la exigencia y respetar tus pausas puede darte una sensación más estable de bienestar.' },
  { slug: 'libra', name: 'Libra', focus: 'decidir con equilibrio y confianza', general: 'El equilibrio llega cuando consideras las opciones y luego confías en una decisión razonable.', love: 'Un acuerdo será más fácil si nombras tus preferencias sin esperar que la otra persona las adivine.', work: 'Tu capacidad para mediar ayudará a ordenar una coordinación que parecía más complicada.', money: 'Busca un punto medio entre disfrutar el presente y reservar margen para próximos compromisos.', wellbeing: 'Un entorno ordenado y una actividad placentera pueden ayudarte a recuperar ligereza.' },
  { slug: 'escorpio', name: 'Escorpio', focus: 'transformar tensión en claridad', general: 'Una emoción intensa puede convertirse en información útil si te das tiempo antes de responder.', love: 'La confianza crece cuando compartes algo verdadero sin poner a prueba el afecto de los demás.', work: 'Tu concentración favorece una tarea compleja, pero conviene comunicar avances para evitar malentendidos.', money: 'Investiga condiciones y costos con cuidado antes de asumir cualquier compromiso importante.', wellbeing: 'Una pausa privada para procesar el día puede ayudarte a soltar tensión y descansar mejor.' },
  { slug: 'sagitario', name: 'Sagitario', focus: 'darle estructura a una idea nueva', general: 'Tu visión se amplía cuando conviertes el entusiasmo en un plan flexible con pasos alcanzables.', love: 'Compartir una experiencia puede acercarte a alguien, siempre que dejes espacio para su propio ritmo.', work: 'Aprender algo nuevo tendrá valor si lo conectas de inmediato con una tarea concreta.', money: 'Cuida tu libertad evitando comprometer recursos que necesitarás para objetivos más cercanos.', wellbeing: 'Cambiar de escenario te renovará, mientras una rutina mínima evitará que disperses tu energía.' },
  { slug: 'capricornio', name: 'Capricornio', focus: 'avanzar con disciplina y perspectiva', general: 'Un progreso discreto pero constante te recordará que no todo resultado necesita ser inmediato.', love: 'Mostrar una parte más espontánea puede suavizar una conversación y fortalecer la confianza.', work: 'Tu responsabilidad será valorada si también aclaras plazos y pides apoyo cuando corresponde.', money: 'Mantener un margen para imprevistos te permitirá decidir con más calma y menos presión.', wellbeing: 'Separar el descanso de las obligaciones será clave para recuperar energía de forma gradual.' },
  { slug: 'acuario', name: 'Acuario', focus: 'convertir una idea original en acción', general: 'Una perspectiva distinta puede resolver algo estancado si la traduces en una propuesta fácil de entender.', love: 'La cercanía se fortalece cuando equilibras independencia con señales claras de presencia y cuidado.', work: 'Tu creatividad aportará una mejora útil si consideras las necesidades prácticas de quienes participan.', money: 'Antes de probar una novedad, revisa si encaja con tus prioridades y tu presupuesto actual.', wellbeing: 'Variar tu rutina de manera moderada puede devolver motivación sin desordenar tu descanso.' },
  { slug: 'piscis', name: 'Piscis', focus: 'combinar intuición con pasos concretos', general: 'Tu intuición será una guía amable cuando la acompañes con una decisión pequeña y verificable.', love: 'Una escucha sensible puede crear un momento de conexión, sin que tengas que resolverlo todo.', work: 'Tu imaginación aporta valor si anotas las ideas y eliges una para desarrollar con orden.', money: 'Pon límites claros a gastos por impulso emocional y conserva margen para tus necesidades reales.', wellbeing: 'La música, el silencio o una caminata tranquila pueden ayudarte a recuperar claridad emocional.' },
];
const scoreKeys = ['generalScore', 'loveScore', 'professionalScore', 'financialScore', 'wellbeingScore'];

function dateInLima() {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' })
      .formatToParts(new Date())
      .filter(({ type }) => type !== 'literal')
      .map(({ type, value }) => [type, value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function addDays(isoDate, days) {
  const date = new Date(`${isoDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function frontmatterValue(source, key) {
  return source.match(new RegExp(`^${key}:\\s*['"]?([^\\r\\n'"]+)['"]?\\s*$`, 'm'))?.[1]?.trim();
}

function renderForecast(sign, period, date, index) {
  const lead = period === 'today' ? 'Hoy' : 'Mañana';
  const scores = [
    3 + ((index + (period === 'tomorrow' ? 1 : 0)) % 3 === 0 ? 1 : 0),
    3 + ((index + 1 + (period === 'tomorrow' ? 1 : 0)) % 3 === 0 ? 1 : 0),
    3 + ((index + 2 + (period === 'tomorrow' ? 1 : 0)) % 3 === 0 ? 1 : 0),
    3 + ((index + (period === 'tomorrow' ? 1 : 0)) % 4 === 0 ? 1 : 0),
    3 + ((index + 2 + (period === 'tomorrow' ? 1 : 0)) % 4 === 0 ? 1 : 0),
  ];
  return `---
sign: ${sign.slug}
period: ${period}
periodStart: '${date}'
periodEnd: '${date}'
status: draft
generalScore: ${scores[0]}
loveScore: ${scores[1]}
professionalScore: ${scores[2]}
financialScore: ${scores[3]}
wellbeingScore: ${scores[4]}
summary: '${lead}: una lectura de entretenimiento para ${sign.name} enfocada en ${sign.focus}.'
---
## Suerte general

${lead}, ${sign.general}

## Suerte amorosa

${lead}, ${sign.love}

## Suerte profesional

${lead}, ${sign.work}

## Suerte económica

${lead}, ${sign.money}

## Energía y bienestar

${lead}, ${sign.wellbeing}
`;
}

function groupFiles(period, date) {
  return signs.map((sign) => join(forecastsDir, `${sign.slug}-${period}-${date}.md`));
}

function assertGroup(period, date, expectedStatus = null) {
  const files = groupFiles(period, date);
  if (files.some((file) => !existsSync(file))) {
    throw new Error(`Grupo incompleto: ${period} ${date}`);
  }
  const statuses = new Set();
  files.forEach((file, index) => {
    const source = readFileSync(file, 'utf8');
    const status = frontmatterValue(source, 'status');
    statuses.add(status);
    if (frontmatterValue(source, 'sign') !== signs[index].slug) {
      throw new Error(`Signo inválido o duplicado: ${file}`);
    }
    const scores = scoreKeys.map((key) => Number(frontmatterValue(source, key)));
    if (frontmatterValue(source, 'period') !== period || frontmatterValue(source, 'periodStart') !== date || frontmatterValue(source, 'periodEnd') !== date) {
      throw new Error(`Fecha o periodo inválido: ${file}`);
    }
    if (scores.some((score) => !Number.isInteger(score) || score < 1 || score > 5)) {
      throw new Error(`Puntuación inválida: ${file}`);
    }
    if (!frontmatterValue(source, 'summary') || !source.split('---').slice(2).join('---').trim()) {
      throw new Error(`Contenido vacío: ${file}`);
    }
  });
  if (statuses.size !== 1 || (expectedStatus && !statuses.has(expectedStatus))) {
    throw new Error(`Estados inconsistentes en el grupo ${period} ${date}: ${[...statuses].join(', ')}`);
  }
  return [...statuses][0];
}

function prepare(today, tomorrow) {
  mkdirSync(forecastsDir, { recursive: true });
  for (const [period, date] of [['today', today], ['tomorrow', tomorrow]]) {
    groupFiles(period, date).forEach((file, index) => {
      if (!existsSync(file)) writeFileSync(file, renderForecast(signs[index], period, date, index), 'utf8');
    });
    assertGroup(period, date);
  }
}

function publish(today, tomorrow) {
  for (const [period, date] of [['today', today], ['tomorrow', tomorrow]]) {
    const status = assertGroup(period, date);
    if (status === 'draft') {
      for (const file of groupFiles(period, date)) {
        const source = readFileSync(file, 'utf8');
        writeFileSync(file, source.replace(/^status: draft$/m, 'status: published'), 'utf8');
      }
    }
    assertGroup(period, date, 'published');
  }
}

const [mode = 'prepare'] = process.argv.slice(2);
const today = dateInLima();
const tomorrow = addDays(today, 1);
if (mode === 'prepare') prepare(today, tomorrow);
else if (mode === 'publish') publish(today, tomorrow);
else throw new Error(`Modo desconocido: ${mode}`);
console.log(`Forecasts ${mode} validados para ${today} y ${tomorrow} (America/Lima)`);
