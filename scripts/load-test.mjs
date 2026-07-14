#!/usr/bin/env node
/**
 * FRUTI GO · Load testing (tráfico simulado)
 * ------------------------------------------------------------
 * Golpea endpoints del API y mide throughput y latencias (p50/p95/p99).
 * Sin dependencias: usa fetch nativo de Node 20+.
 *
 * Uso:
 *   node scripts/load-test.mjs                         (defaults)
 *   node scripts/load-test.mjs --url http://localhost:3000 --conc 50 --reqs 2000
 *   node scripts/load-test.mjs --mode sync             (secuencial, 1 a 1)
 *   node scripts/load-test.mjs --mode async            (concurrente, por defecto)
 *
 * Flags:
 *   --url    Base URL del API           (def: http://localhost:3000)
 *   --conc   Peticiones concurrentes    (def: 25)   [solo async]
 *   --reqs   Total de peticiones         (def: 1000)
 *   --mode   async | sync                (def: async)
 */

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, cur, i, arr) => {
    if (cur.startsWith('--')) acc.push([cur.slice(2), arr[i + 1]?.startsWith('--') || arr[i + 1] === undefined ? true : arr[i + 1]]);
    return acc;
  }, []),
);

const BASE = args.url || process.env.API_URL || 'http://localhost:3000';
const CONC = Number(args.conc || 25);
const REQS = Number(args.reqs || 1000);
const MODE = (args.mode || 'async').toLowerCase();

// Rutas representativas del catálogo/salud (lecturas públicas, sin auth).
const ROUTES = [
  '/health',
  '/health/ready',
  '/products',
  '/products?category=FRUTAS',
  '/products?category=VERDURAS',
  '/products/recommended?segment=B2C_HOGAR',
];

const pick = () => ROUTES[Math.floor(Math.random() * ROUTES.length)];

async function hit() {
  const path = pick();
  const t0 = performance.now();
  try {
    const res = await fetch(BASE + path, { headers: { accept: 'application/json' } });
    await res.arrayBuffer(); // consume el cuerpo
    return { ms: performance.now() - t0, ok: res.ok, status: res.status };
  } catch (e) {
    return { ms: performance.now() - t0, ok: false, status: 0, err: String(e.message || e) };
  }
}

function pct(sorted, p) {
  if (!sorted.length) return 0;
  const i = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[i];
}

async function runAsync() {
  const results = [];
  let issued = 0;
  async function worker() {
    while (issued < REQS) {
      issued++;
      results.push(await hit());
    }
  }
  await Promise.all(Array.from({ length: CONC }, worker));
  return results;
}

async function runSync() {
  const results = [];
  for (let i = 0; i < REQS; i++) results.push(await hit());
  return results;
}

async function main() {
  console.log('════════════════════════════════════════════════');
  console.log('  FRUTI GO · Load Test');
  console.log('════════════════════════════════════════════════');
  console.log(`  Target : ${BASE}`);
  console.log(`  Modo   : ${MODE}${MODE === 'async' ? `  ·  concurrencia ${CONC}` : '  (secuencial)'}`);
  console.log(`  Reqs   : ${REQS}`);
  console.log('  Corriendo tráfico simulado…\n');

  const t0 = performance.now();
  const results = MODE === 'sync' ? await runSync() : await runAsync();
  const totalS = (performance.now() - t0) / 1000;

  const oks = results.filter((r) => r.ok);
  const errs = results.length - oks.length;
  const lat = results.map((r) => r.ms).sort((a, b) => a - b);
  const avg = lat.reduce((a, v) => a + v, 0) / lat.length;

  console.log('── Resultados ──────────────────────────────────');
  console.log(`  Total peticiones : ${results.length}`);
  console.log(`  Exitosas (2xx)   : ${oks.length}`);
  console.log(`  Errores          : ${errs}`);
  console.log(`  Duración         : ${totalS.toFixed(2)} s`);
  console.log(`  Throughput       : ${(results.length / totalS).toFixed(1)} req/s`);
  console.log('── Latencia (ms) ───────────────────────────────');
  console.log(`  media : ${avg.toFixed(1)}`);
  console.log(`  p50   : ${pct(lat, 50).toFixed(1)}`);
  console.log(`  p95   : ${pct(lat, 95).toFixed(1)}`);
  console.log(`  p99   : ${pct(lat, 99).toFixed(1)}`);
  console.log(`  max   : ${lat[lat.length - 1].toFixed(1)}`);
  console.log('════════════════════════════════════════════════');

  if (errs > 0) {
    const sample = results.find((r) => !r.ok);
    console.log(`  ⚠ Primer error: status ${sample.status} ${sample.err ? '· ' + sample.err : ''}`);
    console.log('  (¿Está el API corriendo en ' + BASE + '?)');
    process.exitCode = 1;
  }
}

main();
