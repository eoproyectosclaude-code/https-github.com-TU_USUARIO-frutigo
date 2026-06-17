#!/usr/bin/env node
/**
 * Helper de estado/checkpoint de FRUTI GO.
 *
 * Guarda el avance del proceso de revisión/actualización en un JSON dentro del
 * proyecto, para poder REANUDAR desde el último punto sin rehacer todo.
 *
 * Estado:   scripts/.state/frutigo-state.json   (qué paso se completó)
 * Secretos: scripts/.secrets.json               (token GitHub — gitignored)
 *
 * Uso:
 *   node state.mjs init
 *   node state.mjs get <clave>
 *   node state.mjs set <clave> <valor>
 *   node state.mjs secret-set <clave> <valor>
 *   node state.mjs auth-url                # imprime URL de push con user:token
 *   node state.mjs dump                    # muestra el estado (sin secretos)
 */
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const stateDir = join(here, '.state');
const stateFile = join(stateDir, 'frutigo-state.json');
const secretsFile = join(here, '.secrets.json');

const DEFAULT_STATE = {
  version: 1,
  lastStep: '', // '' | 'review' | 'commit' | 'push'
  lastCommit: '',
  lastRunAt: '',
  repo: '',
  branch: 'main',
  history: [],
};

function readJson(file, fallback) {
  try {
    if (!existsSync(file)) return { ...fallback };
    return { ...fallback, ...JSON.parse(readFileSync(file, 'utf8')) };
  } catch {
    return { ...fallback };
  }
}

function writeJson(file, data) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

const [cmd, key, ...rest] = process.argv.slice(2);
const value = rest.join(' ');

switch (cmd) {
  case 'init': {
    if (!existsSync(stateFile)) writeJson(stateFile, DEFAULT_STATE);
    console.log(stateFile);
    break;
  }
  case 'get': {
    const state = readJson(stateFile, DEFAULT_STATE);
    const v = state[key];
    process.stdout.write(v === undefined || v === null ? '' : String(v));
    break;
  }
  case 'set': {
    const state = readJson(stateFile, DEFAULT_STATE);
    state[key] = value;
    state.lastRunAt = new Date().toISOString();
    if (key === 'lastStep') {
      state.history = [...(state.history ?? []), { step: value, at: state.lastRunAt }].slice(-20);
    }
    writeJson(stateFile, state);
    break;
  }
  case 'secret-set': {
    const secrets = readJson(secretsFile, {});
    secrets[key] = value;
    writeJson(secretsFile, secrets);
    console.log('ok');
    break;
  }
  case 'auth-url': {
    const state = readJson(stateFile, DEFAULT_STATE);
    const secrets = readJson(secretsFile, {});
    const repo = state.repo || '';
    const user = secrets.githubUser || '';
    const token = secrets.githubToken || '';
    if (!repo || !token) {
      process.stderr.write('Falta repo o token. Configura la opción 1 primero.\n');
      process.exit(2);
    }
    // Inserta user:token@ tras https:// sin dejar el token en .git/config.
    const authed = repo.replace(/^https:\/\//, `https://${encodeURIComponent(user)}:${encodeURIComponent(token)}@`);
    process.stdout.write(authed);
    break;
  }
  case 'dump': {
    const state = readJson(stateFile, DEFAULT_STATE);
    console.log(JSON.stringify(state, null, 2));
    break;
  }
  default:
    console.error('Comando no reconocido. Ver encabezado de state.mjs.');
    process.exit(1);
}
