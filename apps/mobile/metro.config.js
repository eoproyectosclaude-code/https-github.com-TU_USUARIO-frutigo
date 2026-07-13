// Configuración de Metro para monorepo (npm workspaces) — recomendada por Expo.
// Permite resolver y empaquetar los paquetes locales (@frutigo/shared, @frutigo/ui)
// tanto en desarrollo como en las compilaciones de EAS Build (nube).
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Vigila el código de todo el monorepo (agrega, no reemplaza, los defaults de Expo).
config.watchFolders = Array.from(new Set([...(config.watchFolders ?? []), workspaceRoot]));

// 2. Resuelve node_modules desde la app y desde la raíz del monorepo.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = config;
