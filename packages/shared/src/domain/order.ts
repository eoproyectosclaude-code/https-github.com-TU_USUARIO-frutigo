import type { SaleUnit } from './units';
import type { PaymentMethod } from './payment';

export type CustomerSegment = 'B2C_HOGAR' | 'B2B_HORECA' | 'DISTRIBUIDOR' | 'BUQUE_NAVIERA';

export type OrderStatus =
  | 'CARRITO'
  | 'PENDIENTE_PAGO'
  | 'PAGADO'
  | 'EN_PREPARACION'
  | 'EN_RUTA'
  | 'ENTREGADO'
  | 'CANCELADO';

export type DeliveryType = 'DOMICILIO' | 'PIE_DE_MUELLE' | 'RETIRO';

export interface OrderLine {
  productId: string;
  productNameEs: string;
  productNameEn: string;
  unit: SaleUnit;
  quantity: number;
  unitPriceUsd: number;
  /** Subtotal de la línea = quantity * unitPriceUsd. */
  subtotalUsd: number;
}

export interface OrderTotals {
  subtotalUsd: number;
  /** Descuento por nivel FrutiGo Points (0 si no aplica). */
  loyaltyDiscountUsd: number;
  /** Comisión comprador 2% (plan de negocios). */
  buyerFeeUsd: number;
  deliveryUsd: number;
  /** ITBMS 7% — exento para buques en tránsito (Ley 28/1995). */
  taxUsd: number;
  totalUsd: number;
}

export interface Order {
  id: string;
  reference: string;
  segment: CustomerSegment;
  status: OrderStatus;
  deliveryType: DeliveryType;
  lines: OrderLine[];
  totals: OrderTotals;
  paymentMethod?: PaymentMethod;
  /** Verdadero si el pedido es de un buque en tránsito (exento de ITBMS). */
  taxExempt: boolean;
  createdAt: string;
}
