# 🍃 FRUTI GO — Guía de pruebas (app + plataforma)

Pasos para arrancar y probar todo de punta a punta en Windows.
Orden recomendado: **Base de datos → API → Dashboard admin → App móvil**.

---

## 0) Requisitos (una sola vez)

- **Docker Desktop** instalado y **abierto** (ícono de ballena "running").
- **Node.js 20+** instalado.
- **Expo Go** instalado en tu teléfono (Play Store / App Store).
- Teléfono y PC en la **misma red WiFi**.
- Dependencias instaladas (una vez):
  ```
  cd /d "C:\Users\Taylor\Documents\CLAUDE\Projects\FRUTI GO"
  npm install
  ```

---

## 1) Base de datos (PostgreSQL con Docker)

```
cd /d "C:\Users\Taylor\Documents\CLAUDE\Projects\FRUTI GO"
docker compose up -d db
docker ps
```
Debe aparecer `frutigo-db-1` como **healthy**.

La primera vez, crea las tablas y carga datos demo:
```
cd apps\api
npm run prisma:generate
npm run prisma:migrate        (nombre: init)
npm run seed
```

---

## 2) API (backend)

```
cd /d "C:\Users\Taylor\Documents\CLAUDE\Projects\FRUTI GO"
npm run api
```
Cuando diga **"Nest application successfully started"**, pruébalo en el navegador:

- http://localhost:3000/health/ready → `{"status":"ready","db":{"status":"up"...}}`
- http://localhost:3000/products → catálogo (6 productos demo)
- http://localhost:3000/docs → documentación Swagger (todos los endpoints)

> Deja esta ventana abierta mientras pruebas.

---

## 3) Crear un usuario ADMIN (para el dashboard)

En **otra ventana** de CMD:
```
cd /d "C:\Users\Taylor\Documents\CLAUDE\Projects\FRUTI GO\apps\api"
npm run make-admin -- tu-correo@ejemplo.com
```
(Primero regístrate con ese correo desde la app o Swagger para que exista.)

---

## 4) Dashboard de administración (web)

Abre con doble clic:
```
apps\admin\index.html
```
- En "API base" deja `http://localhost:3000`.
- Entra con tu cuenta **ADMIN**.
- Verás KPIs en vivo, mapa, heatmap (botón 🔥) y conciliación de pagos.

> Sin API o sin login, muestra **datos demo** para previsualizar el diseño.

---

## 5) App móvil (en tu celular)

La forma más fácil — script automático que arma todo y muestra el QR:
```
cd /d "C:\Users\Taylor\Documents\CLAUDE\Projects\FRUTI GO"
scripts\probar-celular.bat
```
- Cuando pregunte, elige **LAN** (misma WiFi).
- Escanea el **QR**:
  - Android: abre **Expo Go** → "Scan QR code".
  - iPhone: abre la **cámara** → apunta al QR → toca la notificación.

La app abre en tu teléfono conectada al API real.

### Alternativa: modo demo (sin backend, solo para mostrar)
```
cd /d "C:\Users\Taylor\Documents\CLAUDE\Projects\FRUTI GO\apps\mobile"
npm run start
```
Escanea el QR igual; la app usa datos demo.

---

## 6) Qué probar (recorrido sugerido)

1. **Registro / login** en la app (crea tu cuenta).
2. **Catálogo** → abre un producto → elige unidad (kg / ½ quintal / quintal) → agrega al carrito.
3. **Checkout** → elige segmento y método de pago → completa (modo demo si no hay llaves reales).
4. **Referidos** → en Perfil, copia tu código y compártelo; el crédito se aplica en el checkout.
5. **FrutiGo Points** → gana puntos al pagar y canjéalos en el próximo pedido.
6. **Dashboard admin** → verifica un proveedor, mira el heatmap y la conciliación de pagos.
7. **Roles** → asigna PROVEEDOR o REPARTIDOR (con make-admin cambiando el rol) para ver esos portales.

---

## Solución de problemas

| Síntoma | Causa | Arreglo |
|---|---|---|
| `Can't reach database server` | Docker/DB apagado | Abre Docker Desktop → `docker compose up -d db` |
| `pipe...dockerDesktopLinuxEngine` | Docker no está corriendo | Abre Docker Desktop y espera "running" |
| El teléfono no carga la app | PC y teléfono en redes distintas | Ponlos en la **misma WiFi**; en el script elige **Tunnel** si falla LAN |
| `Everything up-to-date` al hacer push | Faltó `git commit` | `git add -A && git commit -m "..." && git push` |

---

FRUTI GO · Del campo a tu puerta, siempre fresco · Panamá 2026
