import { forecastDemand } from './forecast';

describe('forecastDemand', () => {
  it('histórico vacío ⇒ todo 0', () => {
    expect(forecastDemand([])).toEqual({ nextPeriod: 0, movingAverage: 0, trendPerPeriod: 0, confidence: 0 });
  });

  it('serie constante ⇒ proyecta el mismo valor, sin tendencia', () => {
    const f = forecastDemand([10, 10, 10, 10]);
    expect(f.movingAverage).toBe(10);
    expect(f.trendPerPeriod).toBe(0);
    expect(f.nextPeriod).toBe(10);
  });

  it('serie creciente ⇒ tendencia positiva y proyección mayor a la media', () => {
    const f = forecastDemand([2, 4, 6, 8, 10]);
    expect(f.trendPerPeriod).toBeGreaterThan(0);
    expect(f.nextPeriod).toBeGreaterThan(f.movingAverage);
  });

  it('nunca proyecta negativo', () => {
    const f = forecastDemand([10, 6, 2]);
    expect(f.nextPeriod).toBeGreaterThanOrEqual(0);
  });

  it('confianza crece con más datos', () => {
    expect(forecastDemand([1, 2]).confidence).toBeLessThan(forecastDemand([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]).confidence);
  });
});
