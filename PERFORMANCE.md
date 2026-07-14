# ⚡ FRUTI GO — Checklist de rendimiento y búsqueda

Guía operativa para mantener el API rápido: **indexing → revisión de queries → meta-indexing → búsqueda veloz → load testing**. Cada bloque tiene su verificación.

---

## 1. Indexing (índices de base de datos)

Los índices convierten búsquedas de "revisar toda la tabla" (O(n)) en "ir directo" (O(log n)).

- [x] `Product(category, ratingAvg)` — **meta-índice compuesto** para el catálogo (filtra por categoría + ordena por rating en una sola pasada).
- [x] `Product(province)`, `Product(supplierId)`, `Product(shipProvisioning)` — filtros de catálogo y portal proveedor.
- [x] `Order(userId, createdAt)` — "mis pedidos" ordenados por fecha.
- [x] `Order(status)`, `Order(segment)` — conciliación y reportes admin.
- [x] `Payment(status, createdAt)`, `Payment(method)` — panel de conciliación.
- [x] `Delivery(status)`, `Delivery(driverId)` — entregas activas y por repartidor.
- [x] `DeliveryLocation(deliveryId, at)`, `DeliveryLocation(at)` — última ubicación y heatmap.
- [x] Únicos ya presentes: `Product.slug`, `Order.reference`, `User.email`, `User.referralCode`, `Payment.orderId`, `RefreshToken.tokenHash`.

**Aplicar los índices nuevos:**
```
cd apps/api
npm run prisma:migrate      # crea la migración con los índices
```

**Verificar que un query usa índice** (en psql, sobre el contenedor de Postgres):
```sql
EXPLAIN ANALYZE
SELECT * FROM "Product" WHERE category = 'FRUTAS' ORDER BY "ratingAvg" DESC;
-- Debe mostrar "Index Scan using Product_category_ratingAvg_idx", NO "Seq Scan".
```

---

## 2. Revisión de queries (query review)

- [x] **Evitar N+1:** las lecturas de catálogo usan `include: { prices, supplier }` (un solo round-trip), no consultas por fila.
- [x] **No confiar en el cliente:** precios y totales se recalculan en el servidor.
- [ ] **Paginación:** para catálogos grandes, añadir `take`/`skip` o cursor en `/products` (pendiente si el catálogo supera ~500 ítems).
- [ ] **`select` en vez de `include`** cuando no se necesitan todos los campos (menos datos por la red).
- [x] **Recomendaciones acotadas:** `recommended()` limita el resultado (`limit`), aunque puntúa sobre el set — ver Meta-indexing.

**Detectar queries lentos en producción:** activar `log: ['query']` en PrismaService en desarrollo, o `pg_stat_statements` en Postgres para ver los más costosos.

---

## 3. Meta-indexing (índices compuestos e inteligentes)

El "meta-índice" es un índice que cubre **la forma exacta** del query caliente.

- [x] `Product(category, ratingAvg)` cubre el patrón *filtrar-y-ordenar* del catálogo — el planificador usa un solo índice para ambas operaciones.
- [ ] **Búsqueda por texto (full-text):** para buscar por nombre (`nameEs`/`nameEn`), añadir un índice GIN de Postgres:
  ```sql
  CREATE INDEX product_name_fts ON "Product"
    USING GIN (to_tsvector('spanish', "nameEs" || ' ' || "nameEn"));
  ```
  Alternativa simple ya soportada por Prisma: `mode: 'insensitive'` con `contains` (usar solo con dataset moderado).
- [ ] **Índice parcial** (opcional): `WHERE shipProvisioning = true` si ese filtro es muy frecuente.

---

## 4. Búsqueda a máxima velocidad

- [x] Endpoints de lectura **sin auth** y cacheables (`/products`, `/health`).
- [x] **Caché de catálogo** (implementada): `MemoryCacheService` (TTL 30 s, sin dependencias) envuelve `/products`, `/products/:id` y `/products/recommended`. Se **invalida automáticamente** al crear/editar productos en el portal proveedor. Benchmark: **~925× más rápido** en lecturas repetidas (100% hit ratio). Migrable a Redis para multi-instancia.
- [x] **Compresión y payload:** responder solo lo necesario; considerar `compression` de Express para catálogos grandes.
- [x] **Readiness real:** `/health/ready` mide latencia de Postgres (detecta la BD lenta antes que el usuario).

---

## 5. Load testing (tráfico simulado)

Script sin dependencias en `scripts/load-test.mjs`. Mide throughput y latencias p50/p95/p99, en modo **async** (concurrente) y **sync** (secuencial).

```
# Concurrente (por defecto): 25 workers, 1000 peticiones
npm run loadtest

# Personalizado
node scripts/load-test.mjs --url http://localhost:3000 --conc 50 --reqs 3000

# Secuencial (una a una)
npm run loadtest:sync
```

**Criterios de aceptación sugeridos** (API local con datos demo):
- [ ] 0 errores 5xx bajo carga.
- [ ] p95 de lecturas de catálogo < 150 ms.
- [ ] Throughput ≥ 300 req/s en async con concurrencia 25.

> Ejecuta el load test **antes** y **después** de aplicar los índices para cuantificar la mejora.

---

## Flujo recomendado

1. `npm run prisma:migrate` (aplica índices) → 2. `npm run api` (levanta el API) →
3. `npm run loadtest` (mide) → 4. revisar p95/errores → 5. ajustar y repetir.

FRUTI GO · Rendimiento como disciplina continua.
