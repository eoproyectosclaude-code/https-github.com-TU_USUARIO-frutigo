import {
  pointsForOrder,
  tierForPoints,
  pointsToNextTier,
  creditFromPoints,
  calcRedemption,
} from './loyalty';

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

  it('creditFromPoints: 100 pts = $1, redondea al múltiplo', () => {
    expect(creditFromPoints(100)).toBe(1);
    expect(creditFromPoints(250)).toBe(2); // solo 200 pts canjeables
    expect(creditFromPoints(50)).toBe(0); // menos de un múltiplo
    expect(creditFromPoints(-10)).toBe(0);
  });

  it('calcRedemption: canjea bajo el tope', () => {
    // 500 pts = $5; tope 30% de $100 = $30 → no recorta
    expect(calcRedemption(500, 500, 100)).toEqual({ pointsUsed: 500, creditUsd: 5 });
  });

  it('calcRedemption: aplica el tope del 30% del subtotal', () => {
    // 5000 pts = $50, pero tope = $30 → recorta a 3000 pts
    expect(calcRedemption(5000, 5000, 100)).toEqual({ pointsUsed: 3000, creditUsd: 30 });
  });

  it('calcRedemption: respeta saldo disponible', () => {
    expect(calcRedemption(1000, 250, 1000)).toEqual({ pointsUsed: 200, creditUsd: 2 });
  });

  it('calcRedemption: sin puntos no canjea', () => {
    expect(calcRedemption(100, 0, 100)).toEqual({ pointsUsed: 0, creditUsd: 0 });
  });

  it('calcRedemption: baja al múltiplo de 100', () => {
    expect(calcRedemption(150, 150, 1000)).toEqual({ pointsUsed: 100, creditUsd: 1 });
  });
});
