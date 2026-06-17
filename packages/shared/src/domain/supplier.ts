import type { Province } from './product';

export type SupplierType = 'FINCA' | 'COOPERATIVA' | 'DISTRIBUIDORA';

export interface Supplier {
  id: string;
  name: string;
  type: SupplierType;
  province: Province;
  /** Proveedor verificado por FRUTI GO (badge verde). */
  verified: boolean;
  ruc?: string;
  ratingAvg: number;
  logoUrl?: string;
}
