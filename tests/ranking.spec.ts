import { test, expect } from '@playwright/test';

test('la portada muestra el ranking, la editorial y el selector', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/Horóscopo semanal/);
  await expect(page.getByRole('heading', { name: /Tu semana/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Aries/ }).first()).toBeVisible();
  await expect(page.locator('.ranking-card')).toHaveCount(12);
  await expect(page.locator('[data-sign-selector]')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Ranking semanal' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Compartir esta semana/ })).toBeVisible();
});

test('la portada expone identidad y metadatos SEO propios', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('link[rel="icon"][type="image/svg+xml"]')).toHaveAttribute('href', /^\/favicon\.svg(?:\?v=\d+)?$/);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /horóscopo semanal/);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\/social\/ranking-zodiacal\.jpg$/);
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/site.webmanifest');
  await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveCount(1);

  const jsonLd = await page.locator('script[type="application/ld+json"]').textContent();
  expect(jsonLd).toContain('"@type":"WebSite"');
  expect(jsonLd).toContain('"@type":"Organization"');
  const graph = JSON.parse(jsonLd!)['@graph'];
  const ranking = graph.find((node: { '@type': string }) => node['@type'] === 'ItemList');
  expect(ranking.itemListElement).toHaveLength(12);
  expect(ranking.itemListElement[0]).toMatchObject({ position: 1, url: expect.stringMatching(/\/horoscopo\/[a-z]+\/$/) });
});

test('cada signo comparte su propia tarjeta y la lectura de hoy', async ({ page }) => {
  await page.goto('/horoscopo/leo/');

  await expect(page).toHaveTitle('Horóscopo de Leo: hoy, semana y mes | Ranking Zodiacal');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\/social\/leo\.jpg$/);
  const summary = (await page.locator('[data-period-panel="today"] .forecast-summary p').textContent())!;
  const description = await page.locator('meta[name="description"]').getAttribute('content');
  expect(description?.startsWith(summary.slice(0, 40))).toBe(true);
});

test('el sitemap lista los signos y no la página 404', async ({ request }) => {
  const sitemap = await (await request.get('/sitemap-0.xml')).text();

  expect(sitemap.match(/<loc>[^<]+\/horoscopo\/[a-z]+\/<\/loc>/g)).toHaveLength(12);
  expect(sitemap).not.toContain('404');
  expect(sitemap).toContain('<changefreq>daily</changefreq>');
});

test('el ranking se muestra ordenado del puesto 1 al 12', async ({ page }) => {
  await page.goto('/');

  const positions = await page.locator('.ranking-card .ranking-position').allTextContents();
  expect(positions).toEqual(['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']);
});

test('el ranking mantiene una sola columna y un tratamiento unificado en escritorio', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');

  const columnCount = await page.locator('.weekly-ranking').evaluate((element) =>
    getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/).length
  );

  expect(columnCount).toBe(1);
  await expect(page.locator('.weekly-ranking-item')).toHaveCount(12);
  await expect(page.locator('.ranking-card-featured')).toHaveCount(0);

  const cardBackgrounds = await page.locator('.ranking-card').evaluateAll((cards) =>
    cards.map((card) => getComputedStyle(card).backgroundColor)
  );

  expect(new Set(cardBackgrounds).size).toBe(1);
});

test('el selector guarda el signo y navega a su página', async ({ page }) => {
  await page.goto('/');

  const piscis = page.locator('[data-sign-choice][data-sign-slug="piscis"]').first();
  await piscis.click();

  await expect(page).toHaveURL(/\/horoscopo\/piscis\/$/);
  await expect(page.getByRole('heading', { name: 'Piscis', exact: true })).toBeVisible();

  await page.goto('/');
  await expect(page.locator('[data-sign-choice][data-sign-slug="piscis"]').first()).toHaveClass(/is-saved/);
});

test('cada página de signo tiene logo, cuatro periodos y contenido semanal', async ({ page }) => {
  await page.goto('/horoscopo/aries/');

  await expect(page.getByRole('heading', { name: 'Aries', exact: true })).toBeVisible();
  await expect(page.locator('[data-sign-logo]').first()).toBeVisible();
  await expect(page.locator('.sign-logo-glyph').first()).toHaveText('♈');
  await expect(page.locator('html')).toHaveAttribute('data-page-theme', 'aries');
  await expect(page.getByRole('tab')).toHaveCount(4);
  await expect(page.getByRole('tab', { name: 'Hoy' })).toHaveAttribute('aria-selected', 'true');

  await page.getByRole('tab', { name: 'Esta semana' }).click();
  await expect(page).toHaveURL(/#esta-semana$/);
  await expect(page.getByRole('heading', { name: 'El tono de tu semana' })).toBeVisible();
  await expect(page.locator('[data-period-panel="week"]').getByText('Suerte general', { exact: true })).toBeVisible();
});

test('cada periodo muestra su fecha editorial exacta', async ({ page }) => {
  await page.goto('/horoscopo/aries/');

  const dates = await page.locator('[data-period-date]').allTextContents();
  expect(dates).toHaveLength(4);
  expect(dates[0]).toMatch(/^\d{1,2} de .+ de \d{4}$/);
  expect(dates[1]).toMatch(/^\d{1,2} de .+ de \d{4}$/);
  expect(dates[2]).toMatch(/^Del \d{1,2} al \d{1,2} de .+ de \d{4}$/);
  expect(dates[3]).toMatch(/^Del \d{1,2} al \d{1,2} de .+ de \d{4}$/);
});

test('las páginas de signo aplican su color de acento', async ({ page }) => {
  const themes = [
    ['/horoscopo/aries/', '#ff7a5c'],
    ['/horoscopo/virgo/', '#c9b79c'],
    ['/horoscopo/acuario/', '#5fd3e0'],
  ] as const;

  for (const [path, accent] of themes) {
    await page.goto(path);
    const value = await page.locator('html').evaluate((element) => getComputedStyle(element).getPropertyValue('--sign-accent').trim());
    expect(value).toBe(accent);
  }
});

test('el fondo muestra la rueda zodiacal en español', async ({ page }) => {
  await page.goto('/');

  const wheel = page.locator('.sky-wheel');
  await expect(wheel).toBeAttached();
  const labels = await wheel.locator('textPath').allTextContents();
  expect(labels).toHaveLength(12);
  expect(labels).toEqual(expect.arrayContaining(['ARIES', 'GÉMINIS', 'CÁNCER', 'ESCORPIO', 'CAPRICORNIO', 'PISCIS']));
  await expect(page.locator('.sky')).toHaveAttribute('aria-hidden', 'true');
});

test('la rueda resalta el signo de la página', async ({ page }) => {
  await page.goto('/horoscopo/leo/');

  await expect(page.locator('.wheel-label.is-current textPath')).toHaveText('LEO');
});

test('el modal cambia de signo y se cierra con Escape', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ranking-zodiacal-sign', 'virgo'));
  await page.goto('/horoscopo/virgo/');

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeHidden();

  await page.getByRole('button', { name: /Cambiar de signo/ }).click();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('link', { name: /Libra/ })).toBeVisible();

  // The panel and its choices animate in; measure once they settle.
  await page.waitForFunction(() =>
    Array.from(document.querySelectorAll('dialog, dialog *')).every((element) =>
      element.getAnimations().every((animation) => animation.playState !== 'running'),
    ),
  );
  const currentSign = dialog.locator('[data-sign-choice][data-sign-slug="virgo"]');
  const savedBadge = currentSign.locator('.sign-choice-saved');
  await expect(savedBadge).toHaveCSS('position', 'absolute');
  const cardBox = await currentSign.boundingBox();
  const badgeBox = await savedBadge.boundingBox();
  expect(cardBox).not.toBeNull();
  expect(badgeBox).not.toBeNull();
  expect(badgeBox!.y).toBeGreaterThanOrEqual(cardBox!.y);
  expect(badgeBox!.y + badgeBox!.height).toBeLessThanOrEqual(cardBox!.y + cardBox!.height);

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('la navegación por teclado tiene foco visible y respeta movimiento reducido', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');

  const rankingLink = page.getByRole('link', { name: /Ver el ranking/ });
  await rankingLink.focus();
  await expect(rankingLink).toBeFocused();

  const transitionDurations = await rankingLink.evaluate((element) =>
    getComputedStyle(element)
      .transitionDuration
      .split(',')
      .map((duration) => Number.parseFloat(duration))
  );

  expect(transitionDurations.every((duration) => duration <= 0.001)).toBeTruthy();
});

test('el selector se adapta a móvil', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/');

  const columns = await page.locator('.sign-grid').first().evaluate((element) => getComputedStyle(element).gridTemplateColumns);
  expect(columns.split(' ').length).toBe(2);
});

test('el botón dinámico vuelve al inicio después de hacer scroll', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');

  const backToTop = page.getByRole('button', { name: 'Volver al inicio' });
  await expect(backToTop).toBeHidden();

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(backToTop).toBeVisible();
  await backToTop.click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});

test('una ruta inválida muestra la página 404', async ({ page }) => {
  const response = await page.goto('/ruta-inexistente/');

  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: /Esta estrella se salió de la órbita/ })).toBeVisible();
});

test('la portada muestra el cielo de hoy con la fase lunar', async ({ page }) => {
  await page.goto('/');

  const sky = page.locator('[data-sky-today]');
  await expect(sky.getByText('El cielo de hoy')).toBeVisible();
  await expect(sky.getByText(/La Luna transita/)).toBeVisible();
  await expect(sky.locator('.moon-lit')).toHaveAttribute('d', /^M /);
  await expect(sky.getByText(/^Próxima luna (llena|nueva)$/)).toBeVisible();
});

test('la herramienta de compatibilidad responde al cambiar de signo', async ({ page }) => {
  await page.goto('/');

  const tool = page.locator('[data-compatibility-tool]');
  await expect(tool.locator('[data-label]')).toHaveText('Sintonía natural');
  await tool.getByRole('button', { name: /Su signo/ }).click();
  await tool.getByRole('option', { name: /Cáncer/ }).click();
  await expect(tool.locator('[data-label]')).toHaveText('Fricción creativa');
  await expect(tool.locator('[data-score]')).toHaveText('46');
});

test('la compatibilidad parte del signo guardado', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ranking-zodiacal-sign', 'libra'));
  await page.goto('/');

  const tool = page.locator('[data-compatibility-tool]');
  await expect(tool.locator('input[name="a"]')).toHaveValue('libra');
  await expect(tool.getByRole('button', { name: /Tu signo/ })).toContainText('Libra');
});

test('cada signo tiene su perfil, su constelación y su compatibilidad', async ({ page }) => {
  await page.goto('/horoscopo/escorpio/');

  await expect(page.getByRole('heading', { name: 'Así se mueve Escorpio.' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Constelación de Escorpio' })).toBeVisible();
  await expect(page.getByText('Plutón (clásico: Marte)')).toBeVisible();
  await expect(page.getByText('El escorpión', { exact: true })).toBeVisible();

  const compatibility = page.locator('.sign-compatibility');
  await expect(compatibility.getByRole('link', { name: /Cáncer/ })).toBeVisible();
  await expect(compatibility.getByRole('link', { name: /Tauro/ })).toBeVisible();
  await expect(page.locator('.sky-today-note')).toHaveText(/La Luna/);
});

test('la rueda y la barra de lectura avanzan con el scroll', async ({ page }) => {
  await page.goto('/');

  const styles = () => page.evaluate(() => ({
    wheel: getComputedStyle(document.querySelector('.sky-wheel-track')!).rotate,
    progress: getComputedStyle(document.querySelector('.reading-progress-bar')!).animationName,
  }));
  expect((await styles()).progress).toBe('reading-progress');
  await page.evaluate(() => window.scrollTo(0, 600));
  await expect.poll(async () => (await styles()).wheel).not.toBe('none');
});

test('el selector de signo se maneja con el teclado', async ({ page }) => {
  await page.goto('/');

  const tool = page.locator('[data-compatibility-tool]');
  const trigger = tool.getByRole('button', { name: /Su signo/ });
  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(tool.getByRole('listbox').first()).toBeVisible();
  // Leo is selected; two steps down is Libra.
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(trigger).toBeFocused();
  await expect(tool.locator('input[name="b"]')).toHaveValue('libra');
  // Aries and Libra are opposite signs.
  await expect(tool.locator('[data-label]')).toHaveText('Atracción de opuestos');

  await page.keyboard.press('Enter');
  await page.keyboard.press('Escape');
  await expect(tool.getByRole('listbox').first()).toBeHidden();
  await expect(tool.locator('input[name="b"]')).toHaveValue('libra');
});

test('los botones y las tarjetas no usan flechas de texto', async ({ page }) => {
  for (const path of ['/', '/horoscopo/virgo/']) {
    await page.goto(path);
    const text = await page.locator('main').innerText();
    expect(text).not.toMatch(/[←↑→↓↗↩]/);
  }
});

test('el ranking muestra la suerte de la semana y destaca el podio', async ({ page }) => {
  await page.goto('/');

  const first = page.locator('.ranking-card').first();
  await expect(first).toHaveAttribute('data-medal', 'gold');
  await expect(first.locator('.ranking-score-label')).toHaveText(/^Suerte [1-5]\/5$/);
  await expect(page.locator('.ranking-card[data-medal]')).toHaveCount(3);
});
