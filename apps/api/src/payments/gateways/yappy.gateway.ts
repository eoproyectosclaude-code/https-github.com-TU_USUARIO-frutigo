import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { createHmac } from 'node:crypto';
import type { PaymentMethod, PaymentStatus } from '@frutigo/shared';
import type {
  ChargeResult,
  CreateChargeInput,
  PaymentGateway,
  WebhookResult,
} from '../gateway.interface';

/**
 * Pasarela Yappy — Botón de Pago (Banco General, Panamá).
 * Flujo oficial:
 *   1. Validar comercio → token de sesión.
 *   2. Crear orden de pago → transactionId + URL/deep-link de aprobación.
 *   3. IPN (webhook): Yappy notifica el resultado firmado con HMAC-SHA256.
 *
 * El hash de la notificación se valida como
 *   HMAC_SHA256( orderId + status + domain , SECRET )  (hex).
 */
@Injectable()
export class YappyGateway implements PaymentGateway {
  readonly method: PaymentMethod = 'YAPPY';
  private readonly logger = new Logger(YappyGateway.name);

  private get configured(): boolean {
    return Boolean(process.env.YAPPY_MERCHANT_ID && process.env.YAPPY_SECRET_KEY);
  }

  private async getSessionToken(): Promise<string | null> {
    if (!this.configured) return null;
    try {
      const { data } = await axios.post(
        `${process.env.YAPPY_BASE_URL}/payments/validate/merchant`,
        {
          merchantId: process.env.YAPPY_MERCHANT_ID,
          urlDomain: process.env.PUBLIC_URL,
        },
        { timeout: 10_000 },
      );
      return data?.body?.token ?? null;
    } catch (err) {
      this.logger.error(`Yappy validate/merchant falló: ${(err as Error).message}`);
      return null;
    }
  }

  async createCharge(input: CreateChargeInput): Promise<ChargeResult> {
    const token = await this.getSessionToken();

    if (!token) {
      // Modo simulado cuando no hay credenciales.
      return {
        status: 'PENDIENTE',
        providerRef: `yappy_demo_${input.reference}`,
        providerData: {
          provider: 'yappy',
          paymentUrl: `https://yappy.com.pa/pay/${input.reference}`,
          deepLink: `yappy://pay?order=${input.reference}&amount=${input.amountUsd}`,
        },
      };
    }

    try {
      const { data } = await axios.post(
        `${process.env.YAPPY_BASE_URL}/payments/payment-wc`,
        {
          merchantId: process.env.YAPPY_MERCHANT_ID,
          orderId: input.reference,
          domain: process.env.PUBLIC_URL,
          paymentDate: Date.now(),
          aliasYappy: '',
          ipnUrl: `${process.env.PUBLIC_URL}/payments/webhooks/yappy`,
          discount: '0.00',
          taxes: '0.00',
          subtotal: input.amountUsd.toFixed(2),
          total: input.amountUsd.toFixed(2),
        },
        { headers: { Authorization: token }, timeout: 10_000 },
      );

      const transactionId: string = data?.body?.transactionId ?? input.reference;
      return {
        status: 'PENDIENTE',
        providerRef: transactionId,
        providerData: {
          provider: 'yappy',
          transactionId,
          paymentUrl: data?.body?.documentName ?? '',
          deepLink: `yappy://transaction/${transactionId}`,
        },
      };
    } catch (err) {
      this.logger.error(`Yappy payment-wc falló: ${(err as Error).message}`);
      throw err;
    }
  }

  async parseWebhook(rawBody: Buffer | string): Promise<WebhookResult> {
    const payload =
      typeof rawBody === 'string'
        ? JSON.parse(rawBody || '{}')
        : JSON.parse(rawBody.toString('utf8') || '{}');

    const { orderId, status, domain, hash } = payload as Record<string, string>;
    if (!orderId || !status || !hash) return { handled: false };

    const expected = createHmac('sha256', process.env.YAPPY_SECRET_KEY ?? '')
      .update(`${orderId}${status}${domain ?? process.env.PUBLIC_URL ?? ''}`)
      .digest('hex');

    if (expected !== hash) {
      this.logger.error('Hash de IPN Yappy inválido — posible suplantación.');
      return { handled: false };
    }

    const map: Record<string, PaymentStatus> = {
      E: 'COMPLETADO', // Ejecutado
      R: 'FALLIDO', // Rechazado
      C: 'FALLIDO', // Cancelado
      X: 'FALLIDO', // Expirado
    };
    return { handled: true, reference: orderId, status: map[status] ?? 'PENDIENTE' };
  }
}
