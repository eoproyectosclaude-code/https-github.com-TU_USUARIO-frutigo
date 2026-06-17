import type { PaymentMethod, CryptoAsset, PaymentStatus } from '@frutigo/shared';

export interface CreateChargeInput {
  orderId: string;
  /** Referencia legible del pedido (FG-...). */
  reference: string;
  amountUsd: number;
  cryptoAsset?: CryptoAsset;
  /** Email del comprador, útil para recibos del proveedor. */
  customerEmail?: string;
}

export interface ChargeResult {
  /** Estado tras iniciar el cobro con el proveedor. */
  status: PaymentStatus;
  /** Id del cargo/intent en el proveedor. */
  providerRef: string;
  /** Datos que el cliente necesita para completar el pago. */
  providerData: Record<string, string>;
}

export interface WebhookResult {
  /** Verdadero si el evento fue reconocido y procesado. */
  handled: boolean;
  /** Referencia del pedido a conciliar (FG-...). */
  reference?: string;
  /** Nuevo estado del pago derivado del evento. */
  status?: PaymentStatus;
  /** Id del cargo en el proveedor. */
  providerRef?: string;
}

/**
 * Contrato común para toda pasarela de pago.
 * Permite añadir nuevos proveedores sin tocar el resto del sistema (Open/Closed).
 */
export interface PaymentGateway {
  readonly method: PaymentMethod;
  /** Inicia un cobro con el proveedor. */
  createCharge(input: CreateChargeInput): Promise<ChargeResult>;
  /** Verifica la firma del webhook y traduce el evento a un WebhookResult. */
  parseWebhook(rawBody: Buffer | string, signature?: string): Promise<WebhookResult>;
}

export const PAYMENT_GATEWAYS = Symbol('PAYMENT_GATEWAYS');
