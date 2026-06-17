#!/usr/bin/env node
/**
 * Upsert de variables en apps/api/.env (lo crea desde .env.example si falta).
 * Uso: node set-env.mjs CLAVE VALOR
 */
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const apiDir = join(here, '..', 'apps', 'api');
const envFile = join(apiDir, '.env');
const exampleFile = join(apiDir, '.env.example');

const [key, ...rest] = process.argv.slice(2);
const value = rest.join(' ');
if (!key) {
  console.error('Uso: node set-env.mjs CLAVE VALOR');
  process.exit(1);
}

if (!existsSync(envFile) && existsSync(exampleFile)) {
  copyFileSync(exampleFile, envFile);
}

let content = existsSync(envFile) ? readFileSync(envFile, 'utf8') : '';
const line = `${key}="${value}"`;
const re = new RegExp(`^${key}=.*$`, 'm');

if (re.test(content)) {
  content = content.replace(re, line);
} else {
  content += (content.endsWith('\n') || content === '' ? '' : '\n') + line + '\n';
}

writeFileSync(envFile, content, 'utf8');
console.log(`✅ ${key} actualizado en apps/api/.env`);
