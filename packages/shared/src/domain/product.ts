import type { SaleUnit } from './units';

export type ProductCategory =
  | 'FRUTAS'
  | 'VERDURAS'
  | 'LEGUMBRES'
  | 'TUBERCULOS'
  | 'HIERBAS';

/** Provincias de Panamá usadas para trazabilidad de origen. */
export type Province =
  | 'Bocas del Toro'
  | 'Coclé'
  | 'Colón'
  | 'Chiriquí'
  | 'Darién'
  | 'Herrera'
  | 'Los Santos'
  | 'Panamá'
  | 'Panamá Oeste'
  | 'Veraguas';

export interface PricePerUnit {
  unit: SaleUnit;
  /** Precio en USD (moneda de curso legal en Panamá junto al balboa). */
  priceUsd: number;
  /** Stock disponible en esa unidad. */
  stock: number;
}

export interface Product {
  id: string;
  slug: string;
  nameEs: string;
  nameEn: string;
  category: ProductCategory;
  descriptionEs: string;
  descriptionEn: string;
  imageUrl: string;
  /** Origen para trazabilidad. */
  province: Province;
  supplierId: string;
  /** Precios por cada unidad de venta disponible. */
  prices: PricePerUnit[];
  /** Certificaciones (orgánico, GAP, etc.). */
  certifications: string[];
  /** Apto para Ship Provisioning (manifiesto digital + ventana de entrega). */
  shipProvisioning: boolean;
  ratingAvg: number;
  ratingCount: number;
}

/** Obtiene el precio de un producto para una unidad concreta. */
export function priceForUnit(product: Product, unit: SaleUnit): PricePerUnit | undefined {
  return product.prices.find((p) => p.unit === unit);
}
