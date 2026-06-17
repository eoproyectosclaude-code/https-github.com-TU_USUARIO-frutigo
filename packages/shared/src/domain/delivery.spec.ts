import { haversineKm, etaMinutes, canAdvance, nextStatuses, isTerminal } from './delivery';

describe('geo', () => {
  it('mismo punto = 0 km', () => {
    expect(haversineKm({ lat: 8.98, lng: -79.52 }, { lat: 8.98, lng: -79.52 })).toBe(0);
  });

  it('1° de latitud ≈ 111 km', () => {
    expect(haversineKm({ lat: 0, lng: 0 }, { lat: 1, lng: 0 })).toBeCloseTo(111.19, 0);
  });

  it('ETA ~60 min para ~25 km a 25 km/h', () => {
    const eta = etaMinutes({ lat: 0, lng: 0 }, { lat: 0.2249, lng: 0 }, 25);
    expect(Math.abs(eta - 60)).toBeLessThanOrEqual(3);
  });

  it('ETA = Infinity con velocidad 0', () => {
    expect(etaMinutes({ lat: 0, lng: 0 }, { lat: 1, lng: 0 }, 0)).toBe(Infinity);
  });
});

describe('máquina de estados de entrega', () => {
  it('flujo feliz completo', () => {
    expect(canAdvance('ASIGNADO', 'RECOGIDO')).toBe(true);
    expect(canAdvance('RECOGIDO', 'EN_RUTA')).toBe(true);
    expect(canAdvance('EN_RUTA', 'ENTREGADO')).toBe(true);
  });

  it('rechaza saltos y retrocesos', () => {
    expect(canAdvance('ASIGNADO', 'ENTREGADO')).toBe(false);
    expect(canAdvance('EN_RUTA', 'RECOGIDO')).toBe(false);
  });

  it('permite FALLIDO desde estados activos', () => {
    expect(canAdvance('ASIGNADO', 'FALLIDO')).toBe(true);
    expect(canAdvance('EN_RUTA', 'FALLIDO')).toBe(true);
  });

  it('ENTREGADO es terminal', () => {
    expect(isTerminal('ENTREGADO')).toBe(true);
    expect(nextStatuses('ENTREGADO')).toHaveLength(0);
    expect(canAdvance('ENTREGADO', 'EN_RUTA')).toBe(false);
  });
});
