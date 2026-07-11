# 🍃 FRUTI GO

> Plataforma agro-comercial B2B2C de Panamá. Conecta fincas y distribuidoras con hogares, HoReCa, distribuidores y buques en tránsito por el Canal de Panamá.
> _Del campo a tu puerta, siempre fresco._

Versión 0.1.0 · Plataforma completa — comprador, proveedor, admin, repartidor, Ship
Provisioning, pagos reales, recomendaciones y endurecimiento de seguridad.

## Calidad, seguridad e innovación

**Seguridad informática**
- `helmet` + rate limiting (global 120/min, `/auth` 8/min anti fuerza bruta) + CORS por entorno.
- Validación estricta de entrada y filtro global de errores sin filtrar stack traces.
- bcrypt (12 rounds); access token corto + **refresh token hasheado y rotado**; sesión
  cifrada en el cliente con `expo-secure-store` y auto-renovación ante 401.
- Webhooks de pago con firma verificada; PCI-DSS (PAN tokenizado, monto server-side).
- RBAC por rol con aislamiento de datos. Política completa en [`SECURITY.md`](./SECURITY.md).

**Calidad técnica y proceso**
- Dominio puro con **suite de pruebas Jest** (precios, geo, máquinas de estado, recomendaciones,
  fidelización, forecast e **idempotencia de pagos**).
- **CI en GitHub Actions**: lint · typecheck · tests · build. Clean Architecture + SOLID.
- **Idempotencia de webhooks de pago**: los efectos (pedido PAGADO, puntos, push) se aplican
  solo en la transición a COMPLETADO — un webhook repetido no duplica nada.
- **Documentación OpenAPI/Swagger** interactiva en `/docs`.
- **Dockerización**: `docker compose up` levanta Postgres + API (migraciones automáticas).

**Innovación**
- **Motor de recomendaciones** (calidad, estacionalidad por cosecha panameña, disponibilidad y
  segmento) en el inicio. Ship Provisioning para el Canal como diferenciador único.
- **FrutiGo Points**: fidelización con niveles (Bronce/Plata/Oro/Platino), puntos al pagar y
  **descuento por nivel aplicado en el checkout** (server-authoritative).
- **Predicción de demanda** para proveedores (media móvil + tendencia por mínimos cuadrados)
  con proyección del próximo período, tendencia y confianza.

**Tiempo real y plataforma**
- **Seguimiento en vivo por WebSockets** (Socket.IO): la ubicación del repartidor y los
  cambios de estado llegan al comprador al instante (con polling de respaldo).
- **Notificaciones push** (Expo) en cada cambio de estado del pedido/entrega.
- **Observabilidad**: interceptor de logging (método/ruta/estado/ms) y health *liveness*
  (`/health`) + *readiness* con ping a Postgres (`/health/ready`).

---

## Panel de administración web

Dashboard web autónomo de nivel profesional en **`apps/admin/index.html`** — ábrelo en el
navegador (doble clic o sírvelo). Login con cuenta **ADMIN**, KPIs en vivo (GMV, ingreso de
plataforma, pedidos, proveedores), **fondo 3D animado** (three.js), **gráficas** (Chart.js),
verificación de proveedores y conciliación de pagos. Si el API no está disponible, muestra
datos demo para previsualizar el diseño. Configura el "API base" en la pantalla de login.

## Arquitectura (monorepo)

```
FRUTI GO/
├── apps/
│   ├── mobile/        App comprador — React Native + Expo Router (iOS · Android · Web)
│   └── api/           Backend — NestJS + Prisma + PostgreSQL
├── packages/
│   ├── shared/        Dominio, i18n ES/EN, lógica de precios (sin dependencias de UI)
│   └── ui/            Design system de marca (tokens, tema claro/oscuro, componentes)
└── package.json       Workspaces npm
```

**Principio clave:** la lógica de negocio (unidades quintal/kg, comisión 2%, ITBMS 7%,
exención de buques) vive en `@frutigo/shared` y es **reutilizada idénticamente** por la app
móvil y el backend. Una sola fuente de verdad.

---

## Stack

| Capa | Tecnología | Estándar del plan |
|------|-----------|-------------------|
| Móvil | React Native + Expo Router, TypeScript, Zustand | iOS + Android + Web, un solo código |
| Backend | NestJS, Prisma ORM, PostgreSQL | Clean Architecture, SOLID |
| Pagos | Stripe · Yappy · Visa/MC · Cripto (BTC/USDT/USDC) · ACH/SWIFT · Efectivo | PCI-DSS, patrón Strategy |
| i18n | Español 🇵🇦 / Inglés 🇺🇸 | Mercado local + navieras internacionales |
| Marca | Poppins + Inter, paleta verde/naranja/amarillo, dark mode | Manual de marca FRUTI GO |

---

## Cómo correr

### Opción rápida con Docker (recomendada para el backend)

```bash
docker compose up --build      # Postgres + API en http://localhost:3000 · docs en /docs
```

El servicio `api` incluye un `healthcheck` contra `/health/ready`, y `db` usa
`pg_isready`, de modo que el arranque queda orquestado (el API espera a la BD sana).

### Local (Node)

Requisitos: Node 20+, la app **Expo Go** en tu teléfono (o un emulador) y una
base PostgreSQL. La forma más simple de tener la base es levantar **solo** el
contenedor de Postgres con Docker:

```bash
# 0. Base de datos (solo Postgres, en segundo plano)
docker compose up -d db        # expone localhost:5432 (usuario/clave/DB: frutigo)

# 1. Instalar dependencias (raíz del monorepo)
npm install                    # compila también @frutigo/shared (script "prepare")

# 2. Backend
cd apps/api
cp .env.example .env           # DATABASE_URL=postgresql://frutigo:frutigo@localhost:5432/frutigo?schema=public
npm run prisma:generate
npm run prisma:migrate          # crea las tablas (nombre sugerido: init)
npm run seed                    # carga productos panameños demo
npm run start:dev               # API en http://localhost:3000

# 3. App móvil (en otra terminal)
cd apps/mobile
npm run start                   # escanea el QR con Expo Go
```

> **Monorepo:** el paquete `@frutigo/shared` se consume **compilado** (`dist/`).
> `npm install` lo construye vía su script `prepare`; si editas código en
> `packages/shared`, recompílalo con `npm run build:shared` antes de arrancar el API.

### Pruebas

```bash
# Dominio (lógica pura, 68 tests Jest)
cd packages/shared && npm test

# E2E del dashboard admin (Playwright, modo demo sin backend)
cd e2e && npm install && npx playwright install --with-deps chromium && npm test
```

> La app funciona **sin backend** para demo: el servicio de pagos cae a un modo
> offline simulado si la API no está levantada.

### Script de actualización y publicación (`scripts/`)

Menú interactivo para revisar, actualizar y publicar el proyecto sin repetir todo.

```
scripts\frutigo.bat        (Windows / CMD)
bash scripts/frutigo.sh    (macOS / Linux)
```

| Opción | Qué hace |
|--------|----------|
| **1** | Revisión total (deps + typecheck + lint), commit y **push a GitHub** configurando tu token |
| **2** | Revisión y actualización **local** en CMD (commit opcional, sin push) |
| **3** | **Reanuda desde el último checkpoint** — si el push falló, solo reintenta el push, etc. |
| 4 | Configura `GOOGLE_CSE_API_KEY` y `GOOGLE_CSE_CX` en `.env` (imágenes reales de Google) |
| 5 | Asigna rol **ADMIN** a un usuario (`npm run make-admin`) |
| 6 | Muestra el estado (JSON) |

El avance se guarda en `scripts/.state/frutigo-state.json` y el token en
`scripts/.secrets.json` (ambos **gitignored**). Ver `scripts/GOOGLE_SETUP.md` para
obtener las claves de Google y crear el usuario admin.

### Probar en el celular y exportar a GitHub (scripts dedicados)

```
scripts\probar-celular.bat      (Windows)   ·   bash scripts/probar-celular.sh   (macOS/Linux)
scripts\exportar-github.bat     (Windows)   ·   bash scripts/exportar-github.sh  (macOS/Linux)
```

- **probar-celular**: detecta tu **IP LAN**, configura `apiBaseUrl` para que el teléfono
  alcance la API, instala dependencias, levanta la **API** y **Expo** y muestra el **QR**
  para escanear con **Expo Go**. Pregunta LAN (misma WiFi) o Tunnel (por internet).
  Requisitos: teléfono y PC en la misma WiFi, y la app **Expo Go** instalada.
- **exportar-github**: en un comando hace `commit` + `push` a tu repo usando tu token
  (guardado de forma segura). Acepta un mensaje opcional: `exportar-github.bat "mi mensaje"`.

---

## Novedades recientes

- **Programa de referidos ($5).** Cada usuario recibe un código propio determinista
  (sin caracteres ambiguos). Al registrarse con el código de otro se vincula al
  referente; cuando el referido paga su **primer** pedido, el referente gana $5 de
  crédito (idempotente). El crédito se aplica como descuento en el checkout y se
  refleja en el recibo. Dominio puro con tests (`referral.ts`).
- **Crédito de referido en el checkout.** `calcOrderTotals` aplica el saldo tras el
  canje de puntos, capado al total restante (nunca deja total negativo), y el backend
  descuenta el saldo del comprador de forma atómica al crear el pedido.
- **Heatmap histórico de entregas.** Endpoint admin `GET /admin/deliveries/heatmap`
  que agrega rastros GPS + puntos de entrega en una rejilla ponderada (`heatmap.ts`,
  con tests), visualizado como capa de calor Leaflet conmutable en el dashboard.
- **Readiness de producción.** `GET /health/ready` mide la latencia de PostgreSQL y
  responde **503** si la BD no está disponible (apto para balanceadores/Kubernetes);
  `GET /health` reporta versión y uptime.
- **Pruebas E2E (Playwright).** Suite del dashboard admin en modo demo (sin backend)
  en `e2e/`, integrada al CI junto a `npm audit` (alto/crítico).
- **Cobertura de dominio:** 68 tests Jest en 12 suites cubren precios, fidelización,
  referidos, geo/entregas, heatmap, forecast, recomendaciones, CSV y unidades.

---

## Funcionalidad de esta entrega

**App Comprador**
- Inicio con destacados, categorías y banner Ship Provisioning
- Catálogo con búsqueda y filtros por categoría
- Detalle de producto con selector de unidad (1 kg · ½ quintal · 1 quintal) y trazabilidad por provincia
- Carrito con cantidades y resumen de totales en vivo
- Checkout: segmento (Hogar / HoReCa / Distribuidor / Buque), tipo de entrega
  (domicilio · pie de muelle · retiro) y **selección de método de pago**
- Cambio de idioma ES/EN y soporte de modo oscuro
- Exención automática de ITBMS para buques en tránsito (Ley 28/1995)

**Portal de Proveedor** (rol `PROVEEDOR`, sección role-gated en la app)
- Dashboard con métricas: productos, pedidos pagados, ingresos, alertas de stock bajo
- Gestión de catálogo propio: crear y editar productos, precios y stock por unidad
- **Imágenes vía Google**: buscador integrado (Google Custom Search) — el proveedor busca por
  nombre y elige una imagen de un grid de resultados; también admite pegar una URL
- Pedidos recibidos que incluyen sus productos, con estado de pago
- Aislamiento: cada proveedor solo ve y modifica **sus** productos (verificado en el backend)

**Panel de Administración** (rol `ADMIN`, sección role-gated en la app)
- Dashboard de plataforma: GMV, ingreso de plataforma (comisión 2% comprador + 4% proveedor),
  pedidos totales/pagados, proveedores y pendientes por verificar
- Verificación de proveedores con toggle (badge verde) — conciliación de confianza
- Conciliación de pagos: lista de pagos con método, estado y referencia de pedido

**App de Repartidores con GPS** (rol `REPARTIDOR`, role-gated)
- Toggle de disponibilidad (envía ubicación inicial), lista de entregas activas e historial
- Detalle con **avance de estado validado por máquina de estados** (Asignado → Recogido →
  En ruta → Entregado, o Fallido) — transiciones inválidas rechazadas en el servidor
- **Compartir ubicación GPS** en vivo (`expo-location`, watchPositionAsync) durante la ruta
- Despacho: el ADMIN asigna pedidos PAGADOS a un repartidor (`POST /deliveries`)

**Seguimiento en vivo para el comprador**
- Pantalla de tracking con línea de progreso, última ubicación del repartidor y **ETA**
  (calculado con Haversine + velocidad urbana promedio); auto-refresca cada 15 s
- Accesible desde la pestaña Pedidos

**Ship Provisioning** (Canal de Panamá — diferenciador clave)
- Registro de buques (nombre, IMO, bandera, agente marítimo)
- Solicitudes de abastecimiento con **puerto** (Balboa / Cristóbal / Colón) y **ventana de
  entrega certificada** (validada: fin posterior al inicio)
- Selección de productos habilitados para ship-provisioning, en quintales
- **Manifiesto digital** con referencia `MF-…`, datos del buque, ventana de entrega y
  exención de ITBMS (Ley 28/1995); accesible desde el banner del inicio

**Pago con tarjeta nativo (Stripe Payment Sheet)**
- `@stripe/stripe-react-native` con `StripeProvider` en la raíz
- El checkout presenta el Payment Sheet con el `clientSecret` del PaymentIntent; el carrito
  solo se vacía si el pago se confirma (cancelar no pierde el pedido)

**API**
- `POST /auth/register` · `POST /auth/login` · `GET /auth/me` — autenticación JWT
- `POST /auth/refresh` · `POST /auth/logout` — rotación y revocación de refresh tokens
- `GET /products/recommended?segment=` — recomendaciones inteligentes
- `GET /products` · `GET /products/:id` — catálogo con precios por unidad
- `POST /orders` — crea pedido recalculando precios desde la base (nunca confía en el cliente); liga al usuario si hay sesión
- `GET /orders/mine` — pedidos del usuario autenticado
- `POST /payments/intents` — crea intención de pago, enruta a la pasarela y **persiste el pago**
- `POST /payments/webhooks/:method` — recibe el webhook, **valida la firma** y concilia pago + pedido
- `GET /suppliers/me/dashboard` · `/products` · `/orders` — portal proveedor (rol PROVEEDOR)
- `POST /suppliers/me/products` · `PATCH /suppliers/me/products/:id` — gestión de catálogo
- `GET /suppliers/me/forecast` — predicción de demanda por producto
- `GET /images/search?q=` — búsqueda de imágenes en Google (Custom Search), autenticado
- `GET /admin/dashboard` · `/admin/suppliers` · `/admin/payments` — panel admin (rol ADMIN)
- `PATCH /admin/suppliers/:id/verify` — verificar/desverificar proveedor
- `POST /provisioning/vessels` · `GET /provisioning/vessels` — registro de buques
- `POST /provisioning/requests` · `GET /provisioning/requests` — solicitudes de abastecimiento
- `GET /provisioning/requests/:id/manifest` — manifiesto digital (exento ITBMS)
- `POST /drivers/me` · `PATCH /drivers/me/status` — perfil y disponibilidad del repartidor
- `GET /deliveries/mine` · `PATCH /deliveries/:id/status` — entregas y avance de estado
- `POST /deliveries/:id/location` — ping GPS · `POST /deliveries` — asignar (ADMIN)
- `GET /deliveries/track/:orderId` — seguimiento (estado + ubicación + ETA)
- WebSocket `/tracking` — eventos `location` y `status` en tiempo real por pedido
- `GET /loyalty/me` — FrutiGo Points y nivel · `POST /notifications/token` — registro push
- `GET /health` (liveness) · `GET /health/ready` (readiness con ping a Postgres)
- `GET /docs` — documentación OpenAPI/Swagger interactiva

---

## Integración de pagos (real, extensible)

Cada pasarela implementa `PaymentGateway` (`createCharge` + `parseWebhook`). El
`PaymentsService` enruta al proveedor, **persiste el pago** ligado al pedido, y el webhook
**valida la firma** y avanza el pedido a `PAGADO` cuando el cobro se completa. Agregar un
proveedor nuevo es registrar una clase más en `PaymentsModule` (Open/Closed Principle).

| Método | Integración implementada | Credencial en `.env` |
|--------|--------------------------|----------------------|
| `STRIPE` | SDK `stripe` · PaymentIntent + `constructEvent` (firma) | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| `YAPPY` | Botón de Pago BG · token de comercio + IPN con HMAC-SHA256 | `YAPPY_MERCHANT_ID`, `YAPPY_SECRET_KEY` |
| `CRYPTO` | Coinbase Commerce · charge + webhook HMAC (BTC/USDT/USDC) | `COINBASE_COMMERCE_API_KEY`, `..._WEBHOOK_SECRET` |
| `VISA` | Formulario hospedado (Credomatic/BAC) + webhook firmado | `VISA_MERCHANT_ID`, `VISA_API_KEY` |
| `ACH_SWIFT` | Conciliación bancaria manual (B2B / navieras) | — |
| `CASH` | Efectivo contra entrega (B2C) | — |

**Seguridad incorporada:** los precios se recalculan en el servidor; el monto del pago se
toma del pedido en base (nunca del cliente); todas las firmas de webhook se verifican
(HMAC con comparación de tiempo constante / `constructEvent` de Stripe); PAN nunca toca el
backend (tokenización del lado del procesador → PCI-DSS).

> ⚠️ Sin credenciales reales, cada pasarela cae a un **modo simulado** que devuelve datos
> demo. Para cobrar dinero real: crea las cuentas (Stripe, Yappy Comercios, Coinbase
> Commerce), copia las llaves a `.env`, y registra las URLs de webhook
> `…/payments/webhooks/{stripe|yappy|crypto|visa}` en cada panel.

### Flujo end-to-end del checkout

```
App: runCheckout()
  → POST /orders            (crea pedido, precios server-side)
  → POST /payments/intents  (pasarela devuelve clientSecret / deep-link / dirección cripto)
  → acción del proveedor    (Stripe Sheet · abrir Yappy · mostrar dirección cripto)
Proveedor → POST /payments/webhooks/:method  (firma verificada → pedido PAGADO)
```

---

## Próximos pasos (siguientes fases)

1. Mapa visual en vivo (react-native-maps) sobre el stream GPS en tiempo real
2. Exportar manifiesto Ship Provisioning a PDF + email a la naviera
3. Tests E2E (Playwright) y `npm audit` en CI
4. Canjear FrutiGo Points por crédito (además del descuento por nivel)

> Hecho recientemente: ✅ Endurecimiento de seguridad (Helmet, rate-limit, refresh tokens,
> sesión cifrada, CORS, filtro de errores) · ✅ Suite de pruebas Jest + CI GitHub Actions ·
> ✅ Motor de recomendaciones · ✅ App de Repartidores con GPS y seguimiento + ETA ·
> ✅ Módulo Ship Provisioning · ✅ Script de actualización con checkpoint · ✅ Panel Admin ·
> ✅ Imágenes vía Google · ✅ Portal de Proveedor · ✅ Stripe Payment Sheet · ✅ Pasarelas
> reales con webhooks firmados · ✅ Auth JWT con roles (COMPRADOR · PROVEEDOR · REPARTIDOR · ADMIN).

---

_FRUTI GO · frutigo.pa · Panamá 2026 · Confidencial_
