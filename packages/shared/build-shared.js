/**
 * Compila el paquete compartido a dist/ SOLO si el código fuente está presente.
 * Se usa como script `prepare`, que corre en cada `npm install`. En builds por
 * capas (Docker) la instalación ocurre antes de copiar el código: en ese caso
 * no hay `src/` y salimos limpiamente (exit 0) para no romper la instalación.
 * Cross-platform (Node), sin depender de shell.
 */
const { existsSync } = require('node:fs');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const srcEntry = path.join(__dirname, 'src', 'index.ts');
if (!existsSync(srcEntry)) {
  // Sin fuente todavía: nada que compilar (p. ej. instalación por capas en Docker).
  process.exit(0);
}

try {
  const tsc = require.resolve('typescript/bin/tsc');
  execFileSync(process.execPath, [tsc, '-p', 'tsconfig.json'], {
    stdio: 'inherit',
    cwd: __dirname,
  });
} catch (err) {
  console.error('[shared] Falló la compilación de @frutigo/shared:', err.message);
  process.exit(1);
}
