import { pointsForOrder, tierForPoints, pointsToNextTier } from './loyalty';

describe('FrutiGo Points', () => {
  it('otorga 1 punto por USD entero', () => {
    expect(pointsForOrder(41.84)).toBe(41);
    expect(pointsForOrder(100)).toBe(100);
  });

  it('ignora montos inválidos', () => {
    expect(pointsForOrder(0)).toBe(0);
    expect(pointsForOrder(-5)).toBe(0);
    expect(pointsForOrder(NaN)).toBe(0);
  });

  it('asigna el nivel correcto por puntos', () => {
    expect(tierForPoints(0).tier).toBe('BRONCE');
    expect(tierForPoints(499).tier).toBe('BRONCE');
    expect(tierForPoints(500).tier).toBe('PLATA');
    expect(tierForPoints(2000).tier).toBe('ORO');
    expect(tierForPoints(10000).tier).toBe('PLATINO');
  });

  it('calcula puntos al siguiente nivel', () => {
    expect(pointsToNextTier(0)).toEqual({ next: 'PLATA', remaining: 500 });
    expect(pointsToNextTier(1500)).toEqual({ next: 'ORO', remaining: 500 });
    expect(pointsToNextTier(9000)).toBeNull();
  });
});
