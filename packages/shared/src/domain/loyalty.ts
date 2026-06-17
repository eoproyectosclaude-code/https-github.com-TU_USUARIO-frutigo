/**
 * FrutiGo Points — programa de fidelización.
 * Reglas: 1 punto por cada USD pagado (redondeado hacia abajo).
 * Niveles por puntos acumulados, con beneficios crecientes.
 */
export type LoyaltyTier = 'BRONCE' | 'PLATA' | 'ORO' | 'PLATINO';

export interface TierDefinition {
  tier: LoyaltyTier;
  /** Puntos mínimos para alcanzar el nivel. */
  minPoints: number;
  /** Descuento de beneficio asociado (fracción). */
  perkDiscount: number;
  labelEs: string;
  labelEn: string;
}

export const TIERS: TierDefinition[] = [
  { tier: 'BRONCE', minPoints: 0, perkDiscount: 0, labelEs: 'Bronce', labelEn: 'Bronze' },
  { tier: 'PLATA', minPoints: 500, perkDiscount: 0.02, labelEs: 'Plata', labelEn: 'Silver' },
  { tier: 'ORO', minPoints: 2000, perkDiscount: 0.05, labelEs: 'Oro', labelEn: 'Gold' },
  { tier: 'PLATINO', minPoints: 8000, perkDiscount: 0.08, labelEs: 'Platino', labelEn: 'Platinum' },
];

/** Puntos ganados por un pedido pagado (1 punto por USD entero). */
export function pointsForOrder(totalUsd: number): number {
  if (!Number.isFinite(totalUsd) || totalUsd <= 0) return 0;
  return Math.floor(totalUsd);
}

/** Nivel correspondiente a un total de puntos acumulados. */
export function tierForPoints(points: number): TierDefinition {
  let current = TIERS[0]!;
  for (const t of TIERS) {
    if (points >= t.minPoints) current = t;
  }
  return current;
}

/** Puntos que faltan para el siguiente nivel (null si ya es el máximo). */
export function pointsToNextTier(points: number): { next: LoyaltyTier; remaining: number } | null {
  const next = TIERS.find((t) => t.minPoints > points);
  if (!next) return null;
  return { next: next.tier, remaining: next.minPoints - points };
}

/** Configuración de canje de FrutiGo Points por crédito. */
export const REDEMPTION = {
  /** Valor en USD de 1 punto al canjear. 100 pts = $1. */
  usdPerPoint: 0.01,
  /** Los puntos solo se canjean en múltiplos de este valor. */
  step: 100,
  /** El crédito por puntos no puede superar esta fracción del subtotal. */
  maxFractionOfSubtotal: 0.3,
} as const;

export interface RedemptionResult {
  /** Puntos efectivamente usados (múltiplo de step). */
  pointsUsed: number;
  /** Crédito en USD aplicado. */
  creditUsd: number;
}

/** Crédito en USD que generan N puntos (sin topes). */
export function creditFromPoints(points: number): number {
  if (!Number.isFinite(points) || points <= 0) return 0;
  const usable = Math.floor(points / REDEMPTION.step) * REDEMPTION.step;
  return round2(usable * REDEMPTION.usdPerPoint);
}

/**
 * Calcula el canje óptimo: cuántos puntos usar y cuánto crédito aplicar,
 * respetando el saldo disponible, el múltiplo (step) y el tope sobre el subtotal.
 */
export function calcRedemption(
  requestedPoints: number,
  availablePoints: number,
  subtotalUsd: number,
): RedemptionResult {
  const req = Math.max(0, Math.floor(requestedPoints || 0));
  const avail = Math.max(0, Math.floor(availablePoints || 0));
  const sub = Math.max(0, subtotalUsd || 0);

  let points = Math.min(req, avail);
  points = Math.floor(points / REDEMPTION.step) * REDEMPTION.step;

  const maxCredit = round2(sub * REDEMPTION.maxFractionOfSubtotal);
  let creditUsd = round2(points * REDEMPTION.usdPerPoint);
  if (creditUsd > maxCredit) {
    points = Math.floor(maxCredit / REDEMPTION.usdPerPoint / REDEMPTION.step) * REDEMPTION.step;
    creditUsd = round2(points * REDEMPTION.usdPerPoint);
  }

  return { pointsUsed: points, creditUsd };
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
