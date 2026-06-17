/**
 * Unidades de venta estandarizadas de FRUTI GO.
 * El negocio comercializa en kilogramos y quintales (medida tradicional agrícola de Panamá).
 *
 * Referencia del plan de negocios:
 *  - 1 kg           → consumidor individual (B2C)
 *  - ½ quintal 23 kg → PYME / hogar ampliado
 *  - 1 quintal 46 kg → empresas, HoReCa, ship provisioning
 */

export type SaleUnit = 'KG' | 'HALF_QUINTAL' | 'QUINTAL';

export interface UnitDefinition {
  /** Identificador de unidad. */
  unit: SaleUnit;
  /** Peso equivalente en kilogramos. */
  kilograms: number;
  /** Etiqueta corta para UI. */
  labelEs: string;
  labelEn: string;
  /** Segmento objetivo principal. */
  segment: 'B2C' | 'PYME' | 'B2B';
}

export const UNIT_DEFINITIONS: Record<SaleUnit, UnitDefinition> = {
  KG: { unit: 'KG', kilograms: 1, labelEs: '1 kg', labelEn: '1 kg', segment: 'B2C' },
  HALF_QUINTAL: {
    unit: 'HALF_QUINTAL',
    kilograms: 23,
    labelEs: '½ quintal (23 kg)',
    labelEn: '½ quintal (23 kg)',
    segment: 'PYME',
  },
  QUINTAL: {
    unit: 'QUINTAL',
    kilograms: 46,
    labelEs: '1 quintal (46 kg)',
    labelEn: '1 quintal (46 kg)',
    segment: 'B2B',
  },
};

/** Devuelve el peso en kg de una unidad dada. */
export function unitToKilograms(unit: SaleUnit): number {
  return UNIT_DEFINITIONS[unit].kilograms;
}
