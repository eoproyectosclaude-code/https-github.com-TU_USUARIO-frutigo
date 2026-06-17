import type { SaleUnit } from './units';

/** Puertos del Canal de Panamá donde FRUTI GO entrega a buques. */
export type Port = 'BALBOA' | 'CRISTOBAL' | 'COLON';

export const PORTS: { id: Port; name: string; side: 'Pacífico' | 'Atlántico' }[] = [
  { id: 'BALBOA', name: 'Puerto de Balboa', side: 'Pacífico' },
  { id: 'CRISTOBAL', name: 'Puerto de Cristóbal', side: 'Atlántico' },
  { id: 'COLON', name: 'Colón Container Terminal', side: 'Atlántico' },
];

/** Buque registrado por una naviera o agente marítimo. */
export interface Vessel {
  id: string;
  name: string;
  /** Número IMO (identificador internacional del buque). */
  imo: string;
  flag: string;
  /** Agente marítimo / naviera responsable. */
  agent: string;
  createdAt: string;
}

export type ProvisioningStatus =
  | 'SOLICITADO'
  | 'CONFIRMADO'
  | 'EN_PREPARACION'
  | 'ENTREGADO'
  | 'CANCELADO';

export interface ProvisioningLine {
  productId: string;
  productName: string;
  unit: SaleUnit;
  quantity: number;
}

/**
 * Solicitud de aprovisionamiento (ship provisioning) para un buque en tránsito.
 * Incluye una ventana de entrega certificada en puerto y un manifiesto digital.
 * Exenta de ITBMS por la Ley 28/1995 (buque en tránsito internacional).
 */
export interface ProvisioningRequest {
  id: string;
  reference: string;
  vesselId: string;
  port: Port;
  /** Ventana de entrega en puerto (ISO). */
  windowStart: string;
  windowEnd: string;
  status: ProvisioningStatus;
  lines: ProvisioningLine[];
  /** Referencia del manifiesto digital. */
  manifestRef: string;
  taxExempt: true;
  createdAt: string;
}

/** Genera la referencia de manifiesto: MF-<PUERTO>-<timestamp>. */
export function generateManifestRef(port: Port, at: Date = new Date()): string {
  const stamp = at.toISOString().slice(0, 10).replace(/-/g, '');
  return `MF-${port}-${stamp}-${Math.floor(at.getTime() % 100000)
    .toString()
    .padStart(5, '0')}`;
}

/** Valida que la ventana de entrega sea coherente (fin después del inicio). */
export function isValidWindow(startIso: string, endIso: string): boolean {
  const s = Date.parse(startIso);
  const e = Date.parse(endIso);
  return Number.isFinite(s) && Number.isFinite(e) && e > s;
}
