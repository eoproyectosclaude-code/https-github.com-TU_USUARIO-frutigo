#!/usr/bin/env node
/**
 * Imprime la IP LAN IPv4 del equipo (la que el celular usa para alcanzar la API).
 * Prefiere rangos privados típicos de WiFi/hogar.
 */
import { networkInterfaces } from 'node:os';

const nets = networkInterfaces();
const candidates = [];
for (const name of Object.keys(nets)) {
  for (const net of nets[name] ?? []) {
    if (net.family === 'IPv4' && !net.internal) candidates.push(net.address);
  }
}

function rank(ip) {
  if (ip.startsWith('192.168.')) return 0;
  if (ip.startsWith('10.')) return 1;
  if (ip.startsWith('172.')) return 2;
  return 3;
}
candidates.sort((a, b) => rank(a) - rank(b));

process.stdout.write(candidates[0] ?? '127.0.0.1');
