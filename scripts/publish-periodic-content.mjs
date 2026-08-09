import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const weeksDir = join(root, 'src', 'content', 'weeks');
const horoscopesDir = join(root, 'src', 'content', 'horoscopes');
const forecastsDir = join(root, 'src', 'content', 'forecasts');
const signs = [
  ['aries', 'Aries', 'ordenar tu iniciativa'],
  ['tauro', 'Tauro', 'fortalecer lo que ya funciona'],
  ['geminis', 'Géminis', 'dar espacio a tus ideas'],
  ['cancer', 'Cáncer', 'cuidar tus límites'],
  ['leo', 'Leo', 'mostrar tu talento con generosidad'],
  ['virgo', 'Virgo', 'resolver lo esencial con flexibilidad'],
  ['libra', 'Libra', 'decidir con equilibrio'],
  ['escorpio', 'Escorpio', 'transformar la intensidad en claridad'],
  ['sagitario', 'Sagitario', 'dar estructura a una idea nueva'],
  ['capricornio', 'Capricornio', 'avanzar con disciplina y perspectiva'],
  ['acuario', 'Acuario', 'convertir una idea original en acción'],
  ['piscis', 'Piscis', 'combinar intuición con pasos concretos'],
].map(([slug, name, focus]) => ({ slug, name, focus }));
const rankOrder = ['aries', 'leo', 'tauro', 'libra', 'sagitario', 'virgo', 'acuario', 'geminis', 'escorpio', 'cancer', 'capricornio', 'piscis'];
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

function monthStart(isoDate) {
  return `${isoDate.slice(0, 7)}-01`;
}

function monthEnd(start) {
  const date = new Date(`${start.slice(0, 7)}-01T12:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + 1);
  date.setUTCDate(0);
  return date.toISOString().slice(0, 10);
}

function weekStart(isoDate) {
  const date = new Date(`${isoDate}T12:00:00Z`);
  const mondayOffset = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - mondayOffset);
  return date.toISOString().slice(0, 10);
}

function monthName(isoDate) {
  return new Intl.DateTimeFormat('es-PE', { month: 'long', timeZone: 'UTC' })
    .format(new Date(`${isoDate}T12:00:00Z`));
}

function formatDay(isoDate) {
  return new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'long', timeZone: 'UTC' })
    .format(new Date(`${isoDate}T12:00:00Z`));
}

function frontmatterValue(source, key) {
  return source.match(new RegExp(`^${key}:\\s*['"]?([^\\r\\n'"]+)['"]?\\s*$`, 'm'))?.[1]?.trim();
}

function scores(index, offset = 0) {
  return [
    3 + ((index + offset) % 4 === 0 ? 1 : 0),
    3 + ((index + 1 + offset) % 4 === 0 ? 1 : 0),
    3 + ((index + 2 + offset) % 3 === 0 ? 1 : 0),
    3 + ((index + 3 + offset) % 4 === 0 ? 1 : 0),
    3 + ((index + offset) % 3 === 0 ? 1 : 0),
  ];
}

function weeklyMeta(start, end) {
  return {
    title: 'Avanzar con intención',
    theme: 'La claridad crece cuando el entusiasmo encuentra una forma concreta de avanzar.',
    intro: `Del ${formatDay(start)} al ${formatDay(end)}, una lectura general y de entretenimiento invita a combinar iniciativa con criterio. Elige lo que te ayude a observar tus decisiones con más claridad y menos presión; no es un destino fijo.`,
  };
}

function renderWeek(start, end) {
  const meta = weeklyMeta(start, end);
  return `---
weekStart: '${start}'
weekEnd: '${end}'
status: draft
title: '${meta.title}'
theme: '${meta.theme}'
intro: '${meta.intro}'
---

Esta semana puedes avanzar con más calma cuando conviertes una intención en un paso pequeño y verificable. La lectura es de entretenimiento: quédate con lo que te sirva para conversar contigo mismo y cuidar tus prioridades.
`;
}

function renderHoroscope(sign, start, end, index) {
  const rank = rankOrder.indexOf(sign.slug) + 1;
  const [generalScore, loveScore, professionalScore, financialScore, wellbeingScore] = scores(index, rank);
  return `---
weekStart: '${start}'
weekEnd: '${end}'
status: draft
sign: ${sign.slug}
rank: ${rank}
summary: '${sign.name}: esta semana, ${sign.focus} puede ayudarte a avanzar con una expectativa flexible.'
generalScore: ${generalScore}
loveScore: ${loveScore}
professionalScore: ${professionalScore}
financialScore: ${financialScore}
wellbeingScore: ${wellbeingScore}
---

## El tono de tu semana

Esta semana, ${sign.focus} te permite ordenar la energía y elegir un avance concreto. No necesitas resolverlo todo de una vez: una decisión razonable también cuenta como progreso.

## Amor y vínculos

En tus vínculos, hablar con claridad y escuchar el ritmo de la otra persona puede abrir una conversación más cercana. Deja espacio para acuerdos sencillos y para cambiar de opinión sin presión.

## Trabajo y bienestar

En el trabajo, priorizar una tarea importante y revisar los detalles antes de cerrar favorece un resultado sostenible. Alterna concentración con pausas reales para cuidar tu energía.
`;
}

function renderMonth(sign, start, end, index) {
  const [generalScore, loveScore, professionalScore, financialScore, wellbeingScore] = scores(index, 2);
  const month = monthName(start);
  return `---
sign: ${sign.slug}
period: month
periodStart: '${start}'
periodEnd: '${end}'
status: draft
generalScore: ${generalScore}
loveScore: ${loveScore}
professionalScore: ${professionalScore}
financialScore: ${financialScore}
wellbeingScore: ${wellbeingScore}
summary: 'Este mes: una lectura de entretenimiento para ${sign.name} que invita a ${sign.focus}.'
---
## Suerte general

Durante ${month}, ${sign.focus} puede darte una referencia útil para ordenar prioridades y sostener lo que sí funciona.

## Suerte amorosa

Durante ${month}, en los vínculos, una conversación honesta y amable abre espacio para acuerdos más realistas.

## Suerte profesional

Durante ${month}, en lo profesional, elegir un objetivo concreto ayuda a avanzar sin cargar con tareas que pueden esperar.

## Suerte económica

Durante ${month}, en lo económico, revisar tus prioridades y dejar margen para imprevistos favorece decisiones serenas.

## Energía y bienestar

Durante ${month}, una rutina flexible con pausas suficientes puede ayudarte a conservar un ritmo agradable.
`;
}

function assertStatus(statuses, label) {
  if (statuses.size !== 1) throw new Error(`Estados inconsistentes en ${label}: ${[...statuses].join(', ')}`);
  return [...statuses][0];
}

function assertWeek(start, end) {
  const weekFile = join(weeksDir, `${start}.md`);
  const horoscopeFiles = signs.map((sign) => join(horoscopesDir, `${sign.slug}-${start}.md`));
  if (!existsSync(weekFile) || horoscopeFiles.some((file) => !existsSync(file))) throw new Error(`Semana incompleta: ${start}`);
  const week = readFileSync(weekFile, 'utf8');
  const statuses = new Set([frontmatterValue(week, 'status')]);
  const ranks = new Set();
  if (frontmatterValue(week, 'weekStart') !== start || frontmatterValue(week, 'weekEnd') !== end || !frontmatterValue(week, 'title') || !frontmatterValue(week, 'theme') || (frontmatterValue(week, 'intro')?.length ?? 0) < 40 || !week.split('---').slice(2).join('---').trim()) {
    throw new Error(`Metadatos o contenido inválido: ${weekFile}`);
  }
  horoscopeFiles.forEach((file, index) => {
    const source = readFileSync(file, 'utf8');
    statuses.add(frontmatterValue(source, 'status'));
    const rank = Number(frontmatterValue(source, 'rank'));
    ranks.add(rank);
    if (frontmatterValue(source, 'sign') !== signs[index].slug || frontmatterValue(source, 'weekStart') !== start || frontmatterValue(source, 'weekEnd') !== end || !Number.isInteger(rank) || rank < 1 || rank > 12) {
      throw new Error(`Signo, puesto o fecha inválidos: ${file}`);
    }
    if (scoreKeys.some((key) => !Number.isInteger(Number(frontmatterValue(source, key))) || Number(frontmatterValue(source, key)) < 1 || Number(frontmatterValue(source, key)) > 5) || (frontmatterValue(source, 'summary')?.length ?? 0) < 30 || !source.split('---').slice(2).join('---').trim()) {
      throw new Error(`Contenido o puntuación inválida: ${file}`);
    }
  });
  if (ranks.size !== 12) throw new Error(`Puestos duplicados en la semana ${start}`);
  return assertStatus(statuses, `semana ${start}`);
}

function assertMonth(start, end) {
  const files = signs.map((sign) => join(forecastsDir, `${sign.slug}-month-${start}.md`));
  if (files.some((file) => !existsSync(file))) throw new Error(`Mes incompleto: ${start}`);
  const statuses = new Set();
  files.forEach((file, index) => {
    const source = readFileSync(file, 'utf8');
    statuses.add(frontmatterValue(source, 'status'));
    if (frontmatterValue(source, 'sign') !== signs[index].slug || frontmatterValue(source, 'period') !== 'month' || frontmatterValue(source, 'periodStart') !== start || frontmatterValue(source, 'periodEnd') !== end) {
      throw new Error(`Signo, periodo o fecha inválidos: ${file}`);
    }
    if (scoreKeys.some((key) => !Number.isInteger(Number(frontmatterValue(source, key))) || Number(frontmatterValue(source, key)) < 1 || Number(frontmatterValue(source, key)) > 5) || (frontmatterValue(source, 'summary')?.length ?? 0) < 30 || !source.split('---').slice(2).join('---').trim()) {
      throw new Error(`Contenido o puntuación inválida: ${file}`);
    }
  });
  return assertStatus(statuses, `mes ${start}`);
}

function prepareWeek(start, end) {
  mkdirSync(weeksDir, { recursive: true });
  mkdirSync(horoscopesDir, { recursive: true });
  const weekFile = join(weeksDir, `${start}.md`);
  if (!existsSync(weekFile)) writeFileSync(weekFile, renderWeek(start, end), 'utf8');
  signs.forEach((sign, index) => {
    const file = join(horoscopesDir, `${sign.slug}-${start}.md`);
    if (!existsSync(file)) writeFileSync(file, renderHoroscope(sign, start, end, index), 'utf8');
  });
  assertWeek(start, end);
}

function prepareMonth(start, end) {
  mkdirSync(forecastsDir, { recursive: true });
  signs.forEach((sign, index) => {
    const file = join(forecastsDir, `${sign.slug}-month-${start}.md`);
    if (!existsSync(file)) writeFileSync(file, renderMonth(sign, start, end, index), 'utf8');
  });
  assertMonth(start, end);
}

function publishWeek(start, end) {
  if (assertWeek(start, end) === 'draft') {
    const files = [join(weeksDir, `${start}.md`), ...signs.map((sign) => join(horoscopesDir, `${sign.slug}-${start}.md`))];
    files.forEach((file) => writeFileSync(file, readFileSync(file, 'utf8').replace(/^status: draft$/m, 'status: published'), 'utf8'));
  }
  assertWeek(start, end);
  if (assertWeek(start, end) !== 'published') throw new Error(`La semana ${start} no quedó publicada`);
}

function publishMonth(start, end) {
  if (assertMonth(start, end) === 'draft') {
    signs.forEach((sign) => {
      const file = join(forecastsDir, `${sign.slug}-month-${start}.md`);
      writeFileSync(file, readFileSync(file, 'utf8').replace(/^status: draft$/m, 'status: published'), 'utf8');
    });
  }
  if (assertMonth(start, end) !== 'published') throw new Error(`El mes ${start} no quedó publicado`);
}

const mode = process.argv[2];
const today = dateInLima();
if (mode === 'prepare-week' || mode === 'publish-week') {
  const start = weekStart(today);
  const end = addDays(start, 6);
  if (mode === 'prepare-week') prepareWeek(start, end);
  else publishWeek(start, end);
  console.log(`Semana ${mode} validada: ${start} a ${end} (America/Lima)`);
} else if (mode === 'prepare-month' || mode === 'publish-month') {
  const start = monthStart(today);
  const end = monthEnd(start);
  if (mode === 'prepare-month') prepareMonth(start, end);
  else publishMonth(start, end);
  console.log(`Mes ${mode} validado: ${start} a ${end} (America/Lima)`);
} else {
  throw new Error('Usa prepare-week, publish-week, prepare-month o publish-month');
}
