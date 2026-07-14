import { test, expect, type Page } from '@playwright/test';

/**
 * E2E del dashboard admin en MODO DEMO (sin backend).
 * Al fallar el login contra el API, el dashboard entra a datos demo automáticamente.
 */
async function enterDemo(page: Page) {
  await page.goto('/');
  await expect(page.locator('#login')).toBeVisible();
  await page.fill('#email', 'admin@frutigo.pa');
  await page.fill('#password', 'demo-pass');
  // Sin API la promesa de login falla → enter(true) (modo demo).
  await page.click('#login .btn');
  await expect(page.locator('#app')).toBeVisible();
}

/** ¿Cargó la librería Leaflet (CDN)? En CI sin red a CDNs, se salta el test del mapa. */
async function leafletReady(page: Page): Promise<boolean> {
  return page.evaluate(() => typeof (window as any).L !== 'undefined');
}

test.describe('Dashboard admin FRUTI GO', () => {
  test('entra en modo demo y muestra los KPIs', async ({ page }) => {
    await enterDemo(page);
    // 6 tarjetas de KPI con datos demo.
    const cards = page.locator('#kpis .card');
    await expect(cards).toHaveCount(6);
    await expect(page.locator('#kpis')).toContainText('GMV');
    await expect(page.locator('#srcPill')).toContainText('demo');
  });

  test('la lista de entregas demo se muestra', async ({ page }) => {
    await enterDemo(page);
    await expect(page.locator('#dcount')).toContainText('en curso');
    await expect(page.locator('#dlist')).toContainText('FG-1042');
  });

  test('renderiza el mapa Leaflet (si el CDN está disponible)', async ({ page }) => {
    await enterDemo(page);
    test.skip(!(await leafletReady(page)), 'Leaflet (CDN) no disponible en este entorno');
    await expect(page.locator('#map .leaflet-container')).toBeVisible({ timeout: 15_000 });
  });

  test('el toggle de heatmap histórico funciona (si el CDN está disponible)', async ({ page }) => {
    await enterDemo(page);
    test.skip(!(await leafletReady(page)), 'Leaflet (CDN) no disponible en este entorno');
    const btn = page.locator('#heatBtn');
    await expect(btn).toContainText('Heatmap');
    await btn.click();
    // El texto del botón lo controla nuestro propio JS → señal determinista.
    await expect(btn).toContainText('Ocultar', { timeout: 15_000 });
    await btn.click();
    await expect(btn).toContainText('Heatmap');
  });

  test('muestra los botones de exportación CSV', async ({ page }) => {
    await enterDemo(page);
    await expect(page.getByRole('button', { name: /Pedidos CSV/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Pagos CSV/ })).toBeVisible();
  });

  test('lista proveedores y pagos demo', async ({ page }) => {
    await enterDemo(page);
    await expect(page.locator('#supBody tr')).toHaveCount(4);
    await expect(page.locator('#payBody tr')).toHaveCount(4);
    await expect(page.locator('#supBody')).toContainText('Finca Cerro Punta');
  });
});
