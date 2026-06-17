import type { OrderLine, OrderTotals } from './order';
import { calcRedemption } from './loyalty';

/** Parámetros comerciales de FRUTI GO (plan de negocios). */
export const PRICING_CONFIG = {
  /** Comisión al comprador sobre el subtotal. */
  buyerFeeRate: 0.02,
  /** ITBMS Panamá. */
  taxRate: 0.07,
  /** Umbral de envío gratis en Ciudad de Panamá (USD). */
  freeDeliveryThresholdUsd: 80,
  delivery: {
    basicUsd: 8.5,
    urgentUsd: 25,
    maritimeUsd: 60,
  },
} as const;

export function calcLineSubtotal(unitPriceUsd: number, quantity: number): number {
  return round2(unitPriceUsd * quantity);
}

export interface CalcTotalsInput {
  lines: OrderLine[];
  deliveryUsd: number;
  /** Buques en tránsito están exentos de ITBMS (Ley 28/1995). */
  taxExempt: boolean;
  /** Descuento por nivel FrutiGo Points (fracción 0..1). */
  loyaltyDiscountRate?: number;
  /** Puntos que el comprador quiere canjear por crédito. */
  pointsToRedeem?: number;
  /** Saldo de puntos disponible del comprador. */
  availablePoints?: number;
}

/** Calcula los totales: descuento de nivel, comisión, envío, ITBMS y canje de puntos. */
export function calcOrderTotals(input: CalcTotalsInput): OrderTotals {
  const subtotalUsd = round2(input.lines.reduce((sum, l) => sum + l.subtotalUsd, 0));
  const rate = clampRate(input.loyaltyDiscountRate ?? 0);
  const loyaltyDiscountUsd = round2(subtotalUsd * rate);
  const netSubtotal = round2(subtotalUsd - loyaltyDiscountUsd);

  const buyerFeeUsd = round2(netSubtotal * PRICING_CONFIG.buyerFeeRate);
  // El umbral de envío gratis usa el subtotal original (beneficio para el cliente).
  const deliveryUsd =
    subtotalUsd >= PRICING_CONFIG.freeDeliveryThresholdUsd ? 0 : round2(input.deliveryUsd);
  const taxableBase = netSubtotal + buyerFeeUsd + deliveryUsd;
  const taxUsd = input.taxExempt ? 0 : round2(taxableBase * PRICING_CONFIG.taxRate);
  const grossTotal = round2(netSubtotal + buyerFeeUsd + deliveryUsd + taxUsd);

  // Canje de FrutiGo Points: el crédito se aplica al total a pagar (tope 30% del subtotal).
  const redemption = calcRedemption(input.pointsToRedeem ?? 0, input.availablePoints ?? 0, subtotalUsd);
  const loyaltyCreditUsd = round2(Math.min(redemption.creditUsd, grossTotal));
  const pointsRedeemed = loyaltyCreditUsd === redemption.creditUsd ? redemption.pointsUsed : 0;

  const totalUsd = round2(grossTotal - loyaltyCreditUsd);
  return {
    subtotalUsd,
    loyaltyDiscountUsd,
    buyerFeeUsd,
    deliveryUsd,
    taxUsd,
    pointsRedeemed,
    loyaltyCreditUsd,
    totalUsd,
  };
}

function clampRate(r: number): number {
  if (!Number.isFinite(r) || r <= 0) return 0;
  return Math.min(r, 0.5);
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function formatUsd(n: number, locale: 'es' | 'en' = 'es'): string {
  return new Intl.NumberFormat(locale === 'es' ? 'es-PA' : 'en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(n);
}
