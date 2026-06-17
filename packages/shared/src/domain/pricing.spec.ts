import { calcOrderTotals, calcLineSubtotal, formatUsd } from './pricing';
import type { OrderLine } from './order';

const line = (subtotalUsd: number): OrderLine => ({
  productId: 'p',
  productNameEs: 'x',
  productNameEn: 'x',
  unit: 'KG',
  quantity: 1,
  unitPriceUsd: subtotalUsd,
  subtotalUsd,
});

describe('pricing', () => {
  it('calcula subtotal de línea', () => {
    expect(calcLineSubtotal(1.2, 3)).toBe(3.6);
  });

  it('hogar pequeño: comisión 2% + envío + ITBMS 7%', () => {
    const t = calcOrderTotals({ lines: [line(30)], deliveryUsd: 8.5, taxExempt: false });
    expect(t.subtotalUsd).toBe(30);
    expect(t.buyerFeeUsd).toBe(0.6);
    expect(t.deliveryUsd).toBe(8.5);
    expect(t.taxUsd).toBe(2.74);
    expect(t.totalUsd).toBe(41.84);
  });

  it('envío gratis cuando subtotal >= 80', () => {
    const t = calcOrderTotals({ lines: [line(96)], deliveryUsd: 8.5, taxExempt: false });
    expect(t.deliveryUsd).toBe(0);
  });

  it('buque en tránsito: exento de ITBMS (Ley 28/1995)', () => {
    const t = calcOrderTotals({ lines: [line(500)], deliveryUsd: 60, taxExempt: true });
    expect(t.taxUsd).toBe(0);
    expect(t.deliveryUsd).toBe(0); // >= 80 → gratis
    expect(t.loyaltyDiscountUsd).toBe(0);
    expect(t.totalUsd).toBe(510); // 500 + 2% fee
  });

  it('descuento de nivel FrutiGo Points (5%) reduce subtotal, comisión e ITBMS', () => {
    const t = calcOrderTotals({ lines: [line(100)], deliveryUsd: 8.5, taxExempt: false, loyaltyDiscountRate: 0.05 });
    expect(t.subtotalUsd).toBe(100);
    expect(t.loyaltyDiscountUsd).toBe(5); // 5% de 100
    expect(t.buyerFeeUsd).toBe(1.9); // 2% de 95
    expect(t.deliveryUsd).toBe(0); // subtotal original >= 80
    expect(t.taxUsd).toBe(6.78); // 7% de (95 + 1.9)
    expect(t.totalUsd).toBe(103.68); // 95 + 1.9 + 6.78
  });

  it('clampa tasas inválidas a 0', () => {
    const t = calcOrderTotals({ lines: [line(30)], deliveryUsd: 8.5, taxExempt: false, loyaltyDiscountRate: -1 });
    expect(t.loyaltyDiscountUsd).toBe(0);
  });

  it('formatUsd produce moneda', () => {
    expect(formatUsd(41.84, 'en')).toContain('41.84');
  });
});
