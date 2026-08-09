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

  await expect(page.locator('link[rel="icon"][type="image/svg+xml"]')).toHaveAttribute('href', '/favicon.svg');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /horóscopo semanal/);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /social-card\.svg/);

  const jsonLd = await page.locator('script[type="application/ld+json"]').textContent();
  expect(jsonLd).toContain('"@type":"WebSite"');
  expect(jsonLd).toContain('"@type":"Organization"');
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
  await expect(page.getByRole('heading', { name: 'Piscis' })).toBeVisible();

  await page.goto('/');
  await expect(page.locator('[data-sign-choice][data-sign-slug="piscis"]').first()).toHaveClass(/is-saved/);
});

test('cada página de signo tiene logo, cuatro periodos y contenido semanal', async ({ page }) => {
  await page.goto('/horoscopo/aries/');

  await expect(page.getByRole('heading', { name: 'Aries' })).toBeVisible();
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

test('las páginas de signo aplican paletas propias', async ({ page }) => {
  const themes = [
    ['/horoscopo/aries/', '#c85c48', '#762d24'],
    ['/horoscopo/virgo/', '#9b7a65', '#5a4b42'],
    ['/horoscopo/acuario/', '#2d9ca6', '#155b64'],
  ] as const;

  for (const [path, accent, deep] of themes) {
    await page.goto(path);
    const colors = await page.locator('html').evaluate((element) => {
      const styles = getComputedStyle(element);
      return {
        accent: styles.getPropertyValue('--green-400').trim(),
        deep: styles.getPropertyValue('--green-900').trim(),
      };
    });

    expect(colors).toEqual({ accent, deep });
  }
});

test('el modal cambia de signo y se cierra con Escape', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ranking-zodiacal-sign', 'virgo'));
  await page.goto('/horoscopo/virgo/');

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeHidden();

  await page.getByRole('button', { name: /Cambiar de signo/ }).click();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('link', { name: /Libra/ })).toBeVisible();

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
