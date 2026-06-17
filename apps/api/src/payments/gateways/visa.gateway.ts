import { Injectable, Logger } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { PaymentMethod, PaymentStatus } from '@frutigo/shared';
import type {
  ChargeResult,
  CreateChargeInput,
  PaymentGateway,
  WebhookResult,
} from '../gateway.interface';

/**
 * Pasarela Visa / Mastercard vía procesador local (Credomatic / BAC).
 * La tarjeta se tokeniza del lado del procesador (formulario hospedado),
 * el backend nunca almacena el PAN → cumplimiento PCI-DSS.
 */
@Injectable()
export class VisaGateway implements PaymentGateway {
  readonly method: PaymentMethod = 'VISA';
  private readonly logger = new Logger(VisaGateway.name);

  private get configured(): boolean {
    return Boolean(process.env.VISA_MERCHANT_ID && process.env.VISA_API_KEY);
  }

  async createCharge(input: CreateChargeInput): Promise<ChargeResult> {
    // El procesador local genera la URL del formulario hospedado.
    const hostedFormUrl = `${process.env.VISA_BASE_URL ?? 'https://pay.credomatic.example'}/checkout/${input.reference}`;
    if (!this.configured) {
      this.logger.warn('Visa no configurada — modo simulado.');
    }
    return {
      status: 'PENDIENTE',
      providerRef: `visa_${input.reference}`,
      providerData: {
        provider: 'visa',
        hostedFormUrl,
        merchantId: process.env.VISA_MERCHANT_ID ?? 'demo',
      },
    };
  }

  async parseWebhook(rawBody: Buffer | string, signature?: string): Promise<WebhookResult> {
    const key = process.env.VISA_API_KEY;
    if (!key || !signature) return { handled: false };
    const raw = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
    const expected = createHmac('sha256', key).update(raw).digest('hex');
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return { handled: false };

    const payload = JSON.parse(raw || '{}') as Record<string, string>;
    const map: Record<string, PaymentStatus> = {
      approved: 'COMPLETADO',
      declined: 'FALLIDO',
      voided: 'REEMBOLSADO',
    };
    return {
      handled: true,
      reference: payload.orderId,
      providerRef: payload.transactionId,
      status: map[payload.status] ?? 'PENDIENTE',
    };
  }
}
