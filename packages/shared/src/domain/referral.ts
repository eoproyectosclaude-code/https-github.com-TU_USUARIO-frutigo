/**
 * Programa de referidos FRUTI GO (plan de negocios: $5 de crédito por referido
 * que complete su primer pedido).
 */
export const REFERRAL = {
  /** Crédito en USD para el referente cuando su referido paga su primer pedido. */
  referrerRewardUsd: 5,
  /** Crédito de bienvenida para el referido al registrarse con código. */
  refereeWelcomeUsd: 5,
  /** Longitud del código de referido. */
  codeLength: 8,
} as const;

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin caracteres ambiguos (0/O, 1/I)

/**
 * Genera un código de referido legible y determinista a partir de un id + nombre.
 * Determinista: el mismo usuario siempre obtiene el mismo código.
 */
export function generateReferralCode(seed: string): string {
  let h = 2166136261 >>> 0; // FNV-1a
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  let code = '';
  for (let i = 0; i < REFERRAL.codeLength; i++) {
    code += ALPHABET[h % ALPHABET.length];
    h = Math.imul(h, 16777619) >>> 0;
    h = (h + i * 7 + 1) >>> 0;
  }
  return code;
}

/** Normaliza un código ingresado por el usuario (mayúsculas, sin espacios). */
export function normalizeReferralCode(input: string): string {
  return (input || '').toUpperCase().replace(/\s+/g, '').trim();
}

/**
 * ¿Puede aplicarse este código de referido al usuario?
 * No se permite auto-referirse ni aplicar si ya tiene un referente.
 */
export function canApplyReferral(opts: {
  newUserCode: string;
  referrerCode: string;
  alreadyReferred: boolean;
}): boolean {
  const code = normalizeReferralCode(opts.referrerCode);
  if (!code) return false;
  if (opts.alreadyReferred) return false;
  if (normalizeReferralCode(opts.newUserCode) === code) return false; // no auto-referido
  return true;
}
