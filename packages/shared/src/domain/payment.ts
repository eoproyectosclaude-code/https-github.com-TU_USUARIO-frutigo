/**
 * Métodos de pago soportados por FRUTI GO.
 *  - STRIPE: tarjetas internacionales Visa/Mastercard vía Stripe.
 *  - YAPPY:  billetera local de Panamá (Banco General) — clave para adopción local.
 *  - VISA:   pasarela directa Visa/MC (procesador local, p. ej. credomatic).
 *  - CRYPTO: BTC, USDT, USDC vía procesador on-chain.
 *  - ACH_SWIFT: transferencia para clientes B2B / navieras.
 *  - CASH:   efectivo contra entrega (B2C).
 */
export type PaymentMethod = 'STRIPE' | 'YAPPY' | 'VISA' | 'CRYPTO' | 'ACH_SWIFT' | 'CASH';

export type CryptoAsset = 'BTC' | 'USDT' | 'USDC';

export type PaymentStatus =
  | 'INICIADO'
  | 'PENDIENTE'
  | 'AUTORIZADO'
  | 'COMPLETADO'
  | 'FALLIDO'
  | 'REEMBOLSADO';

/**
 * Idempotencia: indica si deben aplicarse los efectos de "pago completado"
 * (marcar pedido PAGADO, otorgar puntos, notificar). Solo en la transición
 * hacia COMPLETADO desde un estado no completado — evita dobles por webhooks repetidos.
 */
export function shouldFulfill(previous: PaymentStatus | null | undefined, incoming: PaymentStatus): boolean {
  return incoming === 'COMPLETADO' && previous !== 'COMPLETADO';
}

/** Estado final de pago (no admite reprocesamiento de efectos). */
export function isPaymentFinal(status: PaymentStatus): boolean {
  return status === 'COMPLETADO' || status === 'REEMBOLSADO';
}

export interface PaymentMethodOption {
  method: PaymentMethod;
  labelEs: string;
  labelEn: string;
  /** Segmentos a los que aplica este método. */
  segments: ('B2C_HOGAR' | 'B2B_HORECA' | 'DISTRIBUIDOR' | 'BUQUE_NAVIERA')[];
  enabled: boolean;
}

export interface PaymentIntent {
  id: string;
  orderId: string;
  method: PaymentMethod;
  amountUsd: number;
  status: PaymentStatus;
  /** Datos específicos del proveedor (clientSecret de Stripe, dirección on-chain, etc.). */
  providerData?: Record<string, string>;
  cryptoAsset?: CryptoAsset;
  createdAt: string;
}

export const PAYMENT_METHODS: PaymentMethodOption[] = [
  {
    method: 'YAPPY',
    labelEs: 'Yappy',
    labelEn: 'Yappy',
    segments: ['B2C_HOGAR', 'B2B_HORECA', 'DISTRIBUIDOR'],
    enabled: true,
  },
  {
    method: 'STRIPE',
    labelEs: 'Tarjeta (Stripe)',
    labelEn: 'Card (Stripe)',
    segments: ['B2C_HOGAR', 'B2B_HORECA', 'DISTRIBUIDOR', 'BUQUE_NAVIERA'],
    enabled: true,
  },
  {
    method: 'VISA',
    labelEs: 'Visa / Mastercard',
    labelEn: 'Visa / Mastercard',
    segments: ['B2C_HOGAR', 'B2B_HORECA', 'DISTRIBUIDOR', 'BUQUE_NAVIERA'],
    enabled: true,
  },
  {
    method: 'CRYPTO',
    labelEs: 'Cripto (BTC / USDT / USDC)',
    labelEn: 'Crypto (BTC / USDT / USDC)',
    segments: ['B2B_HORECA', 'DISTRIBUIDOR', 'BUQUE_NAVIERA'],
    enabled: true,
  },
  {
    method: 'ACH_SWIFT',
    labelEs: 'Transferencia ACH / SWIFT',
    labelEn: 'ACH / SWIFT transfer',
    segments: ['B2B_HORECA', 'BUQUE_NAVIERA'],
    enabled: true,
  },
  {
    method: 'CASH',
    labelEs: 'Efectivo contra entrega',
    labelEn: 'Cash on delivery',
    segments: ['B2C_HOGAR'],
    enabled: true,
  },
];
