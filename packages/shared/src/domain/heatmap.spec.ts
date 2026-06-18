import { aggregateHeatmap, maxWeight, HEATMAP_PRECISION } from './heatmap';

describe('heatmap', () => {
  it('agrupa puntos cercanos en la misma celda sumando peso', () => {
    const pts = [
      { lat: 8.9824, lng: -79.5199 },
      { lat: 8.98241, lng: -79.51992 }, // misma celda a 3 decimales
      { lat: 9.1, lng: -79.4 },
    ];
    const heat = aggregateHeatmap(pts);
    expect(heat.length).toBe(2);
    expect(heat[0].weight).toBe(2); // ordenado por peso desc
    expect(maxWeight(heat)).toBe(2);
  });

  it('ignora coordenadas inválidas', () => {
    const heat = aggregateHeatmap([
      { lat: 8.98, lng: -79.51 },
      { lat: NaN, lng: -79.5 } as any,
      { lat: 9, lng: undefined } as any,
    ]);
    expect(heat.length).toBe(1);
    expect(heat[0].weight).toBe(1);
  });

  it('lista vacía → sin puntos y maxWeight 0', () => {
    expect(aggregateHeatmap([])).toEqual([]);
    expect(maxWeight([])).toBe(0);
  });

  it('respeta la precisión configurable', () => {
    const pts = [
      { lat: 8.98, lng: -79.51 },
      { lat: 8.984, lng: -79.514 },
    ];
    // a 1 decimal ambos caen en 9.0 / -79.5
    const coarse = aggregateHeatmap(pts, 1);
    expect(coarse.length).toBe(1);
    expect(coarse[0].weight).toBe(2);
    // a 3 decimales (por defecto) son celdas distintas
    expect(aggregateHeatmap(pts, HEATMAP_PRECISION).length).toBe(2);
  });
});
