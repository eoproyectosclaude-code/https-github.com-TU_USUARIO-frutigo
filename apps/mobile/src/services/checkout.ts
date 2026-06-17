import { Linking } from 'react-native';
import type { CustomerSegment, DeliveryType, PaymentMethod } from '@frutigo/shared';
import { api, ApiError } from './api';
import type { CartItem } from '../store/cart';

export interface CheckoutInput {
  items: CartItem[];
  segment: CustomerSegment;
  deliveryType: DeliveryType;
  method: PaymentMethod;
  customerEmail?: string;
}

export interface CheckoutResult {
  reference: string;
  method: PaymentMethod;
  status: string;
  /** Acción siguiente para el usuario según el proveedor. */
  nextAction:
    | { type: 'STRIPE_SHEET'; clientSecret: string; publishableKey: string }
    | { type: 'REDIRECT'; url: string }
    | { type: 'CRYPTO'; address?: string; hostedUrl?: string; asset?: string }
    | { type: 'NONE' };
  offline: boolean;
}

/**
 * Orquesta el checkout real:
 *  1. Crea el pedido en el API (precios recalculados en el servidor).
 *  2. Crea la intención de pago → la pasarela devuelve qué hacer.
 *  3. Resuelve la acción del proveedor (Payment Sheet, redirect, dirección cripto).
 *
 * Si el backend no está disponible, devuelve un resultado offline simulado
 * para no romper la demo.
 */
export async function runCheckout(input: CheckoutInput): Promise<CheckoutResult> {
  try {
    const order = await api.createOrder({
      segment: input.segment,
      deliveryType: input.deliveryType,
      taxExempt: input.segment === 'BUQUE_NAVIERA',
      lines: input.items.map((i) => ({
        productId: i.productId,
        unit: i.unit,
        quantity: i.quantity,
      })),
    });

    const intent = await api.createPaymentIntent({
      orderId: order.id,
      method: input.method,
      customerEmail: input.customerEmail,
    });

    const pd = intent.providerData ?? {};
    let nextAction: CheckoutResult['nextAction'] = { type: 'NONE' };

    switch (input.method) {
      case 'STRIPE':
        if (pd.clientSecret) {
          nextAction = {
            type: 'STRIPE_SHEET',
            clientSecret: pd.clientSecret,
            publishableKey: pd.publishableKey ?? '',
          };
        }
        break;
      case 'YAPPY':
      case 'VISA':
        if (pd.deepLink || pd.paymentUrl || pd.hostedFormUrl) {
          const url = pd.deepLink || pd.paymentUrl || pd.hostedFormUrl!;
          nextAction = { type: 'REDIRECT', url };
          await Linking.openURL(url).catch(() => undefined);
        }
        break;
      case 'CRYPTO':
        nextAction = {
          type: 'CRYPTO',
          address: pd.address,
          hostedUrl: pd.hostedUrl,
          asset: pd.asset,
        };
        if (pd.hostedUrl) await Linking.openURL(pd.hostedUrl).catch(() => undefined);
        break;
      default:
        nextAction = { type: 'NONE' };
    }

    return {
      reference: order.reference,
      method: input.method,
      status: intent.status,
      nextAction,
      offline: false,
    };
  } catch (err) {
    // Sin backend (demo): confirmar de forma simulada.
    if (err instanceof ApiError && err.status >= 500) throw err;
    return {
      reference: `FG-${Date.now()}`,
      method: input.method,
      status: input.method === 'CASH' ? 'PENDIENTE' : 'AUTORIZADO',
      nextAction: { type: 'NONE' },
      offline: true,
    };
  }
}
