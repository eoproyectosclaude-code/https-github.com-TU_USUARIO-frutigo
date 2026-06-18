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

test.describe('Dashboard admin FRUTI GO', () => {
  test('entra en modo demo y muestra los KPIs', async ({ page }) => {
    await enterDemo(page);
    // 6 tarjetas de KPI con datos demo.
    const cards = page.locator('#kpis .card');
    await expect(cards).toHaveCount(6);
    await expect(page.locator('#kpis')).toContainText('GMV');
    await expect(page.locator('#srcPill')).toContainText('demo');
  });

  test('renderiza el mapa Leaflet y la lista de entregas', async ({ page }) => {
    await enterDemo(page);
    await expect(page.locator('#map .leaflet-container')).toBeVisible();
    await expect(page.locator('#dcount')).toContainText('en curso');
    // marcadores demo (🛵 / 📍) presentes
    await expect(page.locator('#map .leaflet-marker-icon').first()).toBeVisible();
  });

  test('el toggle de heatmap histórico añade la capa de calor', async ({ page }) => {
    await enterDemo(page);
    const btn = page.locator('#heatBtn');
    await expect(btn).toContainText('Heatmap');
    await btn.click();
    // leaflet.heat dibuja un <canvas> en el panel de overlay del mapa (el tile base usa <img>).
    await expect(page.locator('#map canvas')).toHaveCount(1);
    await expect(btn).toContainText('Ocultar');
    // segundo clic la quita
    await btn.click();
    await expect(page.locator('#map canvas')).toHaveCount(0);
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
