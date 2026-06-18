# FRUTI GO · Pruebas E2E (Playwright)

Pruebas end-to-end del **dashboard de administración**. Corren en *modo demo*
(sin backend): el dashboard cae a datos demo cuando el login contra el API falla,
así que no se necesita Postgres ni el servidor NestJS levantado.

## Ejecutar localmente

```bash
cd e2e
npm install
npx playwright install --with-deps chromium
npm test            # corre las specs
npm run report      # abre el reporte HTML
```

Playwright levanta automáticamente un servidor estático (`http-server`) que sirve
`apps/admin/` en el puerto 4173 (configurable con `E2E_PORT`).

## Qué se valida

- Entrada en modo demo y render de los 6 KPIs.
- Mapa Leaflet de entregas activas con marcadores.
- Toggle del **heatmap histórico** (añade/quita la capa de calor).
- Botones de exportación CSV (pedidos y pagos).
- Tablas de proveedores y pagos con datos demo.

## CI

El workflow `.github/workflows/ci.yml` incluye el job **e2e** que instala el
navegador, corre las specs y sube `playwright-report` como artefacto.
