import { UNIT_DEFINITIONS, unitToKilograms, type SaleUnit } from './units';

describe('units', () => {
  it('define las tres unidades de venta con su peso en kg', () => {
    expect(UNIT_DEFINITIONS.KG.kilograms).toBe(1);
    expect(UNIT_DEFINITIONS.HALF_QUINTAL.kilograms).toBe(23);
    expect(UNIT_DEFINITIONS.QUINTAL.kilograms).toBe(46);
  });

  it('cada definición se corresponde con su clave', () => {
    (Object.keys(UNIT_DEFINITIONS) as SaleUnit[]).forEach((u) => {
      expect(UNIT_DEFINITIONS[u].unit).toBe(u);
    });
  });

  it('asigna el segmento objetivo correcto', () => {
    expect(UNIT_DEFINITIONS.KG.segment).toBe('B2C');
    expect(UNIT_DEFINITIONS.HALF_QUINTAL.segment).toBe('PYME');
    expect(UNIT_DEFINITIONS.QUINTAL.segment).toBe('B2B');
  });

  it('unitToKilograms devuelve el peso equivalente', () => {
    expect(unitToKilograms('KG')).toBe(1);
    expect(unitToKilograms('HALF_QUINTAL')).toBe(23);
    expect(unitToKilograms('QUINTAL')).toBe(46);
  });
});
