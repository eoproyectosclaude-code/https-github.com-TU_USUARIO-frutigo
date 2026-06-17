#!/usr/bin/env node
/**
 * Escribe expo.extra.apiBaseUrl en apps/mobile/app.json para que el celular
 * alcance la API por la IP LAN del equipo.
 * Uso: node set-api-url.mjs http://192.168.1.5:3000
 */
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, writeFileSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const appJson = join(here, '..', 'apps', 'mobile', 'app.json');

const url = process.argv[2];
if (!url) {
  console.error('Uso: node set-api-url.mjs http://<IP>:3000');
  process.exit(1);
}

const cfg = JSON.parse(readFileSync(appJson, 'utf8'));
cfg.expo = cfg.expo ?? {};
cfg.expo.extra = cfg.expo.extra ?? {};
cfg.expo.extra.apiBaseUrl = url;
writeFileSync(appJson, JSON.stringify(cfg, null, 2) + '\n', 'utf8');
console.log(`apiBaseUrl = ${url}`);
