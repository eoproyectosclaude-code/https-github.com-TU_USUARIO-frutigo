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
