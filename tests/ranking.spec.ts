import { test, expect } from '@playwright/test';

test('la portada muestra el ranking completo y el selector', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/Horóscopo semanal/);
  await expect(page.getByRole('heading', { name: /Tu semana/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Aries/ }).first()).toBeVisible();
  await expect(page.locator('.ranking-card')).toHaveCount(12);
  await expect(page.locator('[data-sign-selector]')).toBeVisible();
  await expect(page.getByRole('button', { name: /Compartir esta semana/ })).toBeVisible();
});

test('el ranking se muestra ordenado del puesto 1 al 12', async ({ page }) => {
  await page.goto('/');

  const positions = await page.locator('.ranking-card .ranking-position').allTextContents();
  expect(positions).toEqual(['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']);
});

test('el selector guarda el signo y navega a su página', async ({ page }) => {
  await page.goto('/');

  const selector = page.locator('[data-sign-selector] select');
  await selector.selectOption('piscis');
  await expect(page.locator('[data-sign-link]')).toHaveAttribute('href', '/horoscopo/piscis/');
  await page.locator('[data-sign-link]').click();

  await expect(page).toHaveURL(/\/horoscopo\/piscis\/$/);
  await expect(page.getByRole('heading', { name: 'Piscis' })).toBeVisible();

  await page.goto('/');
  await expect(page.locator('[data-sign-selector] select')).toHaveValue('piscis');
});

test('cada página de signo tiene contenido y navegación de regreso', async ({ page }) => {
  await page.goto('/horoscopo/aries/');

  await expect(page.getByRole('heading', { name: 'Aries' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'El tono de tu semana' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Volver al ranking/ })).toBeVisible();
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

test('una ruta inválida muestra la página 404', async ({ page }) => {
  const response = await page.goto('/ruta-inexistente/');

  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: /Esta estrella se salió de la órbita/ })).toBeVisible();
});
