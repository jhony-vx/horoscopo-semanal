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

test('el ranking se muestra ordenado del puesto 1 al 12', async ({ page }) => {
  await page.goto('/');

  const positions = await page.locator('.ranking-card .ranking-position').allTextContents();
  expect(positions).toEqual(['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']);
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
  await expect(page.getByRole('tab')).toHaveCount(4);
  await expect(page.getByRole('tab', { name: 'Hoy' })).toHaveAttribute('aria-selected', 'true');

  await page.getByRole('tab', { name: 'Esta semana' }).click();
  await expect(page).toHaveURL(/#esta-semana$/);
  await expect(page.getByRole('heading', { name: 'El tono de tu semana' })).toBeVisible();
  await expect(page.locator('[data-period-panel="week"]').getByText('Suerte general', { exact: true })).toBeVisible();
});

test('el modal cambia de signo y se cierra con Escape', async ({ page }) => {
  await page.goto('/horoscopo/virgo/');

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeHidden();

  await page.getByRole('button', { name: /Cambiar de signo/ }).click();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('link', { name: /Libra/ })).toBeVisible();

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

test('una ruta inválida muestra la página 404', async ({ page }) => {
  const response = await page.goto('/ruta-inexistente/');

  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: /Esta estrella se salió de la órbita/ })).toBeVisible();
});
