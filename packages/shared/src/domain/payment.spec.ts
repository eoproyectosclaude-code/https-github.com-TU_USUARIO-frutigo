import { shouldFulfill, isPaymentFinal } from './payment';

describe('idempotencia de pagos', () => {
  it('cumple en la primera transición a COMPLETADO', () => {
    expect(shouldFulfill('PENDIENTE', 'COMPLETADO')).toBe(true);
    expect(shouldFulfill(null, 'COMPLETADO')).toBe(true);
    expect(shouldFulfill('AUTORIZADO', 'COMPLETADO')).toBe(true);
  });

  it('NO vuelve a cumplir si ya estaba COMPLETADO (webhook repetido)', () => {
    expect(shouldFulfill('COMPLETADO', 'COMPLETADO')).toBe(false);
  });

  it('no cumple para estados que no son COMPLETADO', () => {
    expect(shouldFulfill('PENDIENTE', 'FALLIDO')).toBe(false);
    expect(shouldFulfill('PENDIENTE', 'PENDIENTE')).toBe(false);
  });

  it('isPaymentFinal', () => {
    expect(isPaymentFinal('COMPLETADO')).toBe(true);
    expect(isPaymentFinal('REEMBOLSADO')).toBe(true);
    expect(isPaymentFinal('PENDIENTE')).toBe(false);
  });
});
