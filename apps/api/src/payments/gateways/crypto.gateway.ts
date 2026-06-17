import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { PaymentMethod, PaymentStatus } from '@frutigo/shared';
import type {
  ChargeResult,
  CreateChargeInput,
  PaymentGateway,
  WebhookResult,
} from '../gateway.interface';

/**
 * Pasarela Cripto vía Coinbase Commerce (BTC, USDT, USDC y más).
 * Crea un "charge" y devuelve la URL de pago hospedada. El webhook se firma
 * con HMAC-SHA256 (cabecera X-CC-Webhook-Signature) usando el shared secret.
 */
@Injectable()
export class CryptoGateway implements PaymentGateway {
  readonly method: PaymentMethod = 'CRYPTO';
  private readonly logger = new Logger(CryptoGateway.name);
  private readonly api = 'https://api.commerce.coinbase.com';

  private get apiKey(): string | undefined {
    return process.env.COINBASE_COMMERCE_API_KEY;
  }

  async createCharge(input: CreateChargeInput): Promise<ChargeResult> {
    const asset = input.cryptoAsset ?? 'USDT';

    if (!this.apiKey) {
      return {
        status: 'PENDIENTE',
        providerRef: `cb_demo_${input.reference}`,
        providerData: {
          provider: 'coinbase-commerce',
          asset,
          hostedUrl: `https://commerce.coinbase.com/charges/demo_${input.reference}`,
          address:
            asset === 'BTC'
              ? 'bc1qdemofrutigowalletxxxxxxxxxxxxxxxxxxxx'
              : '0xDEMOfrutigoUSDTwallet0000000000000000',
        },
      };
    }

    try {
      const { data } = await axios.post(
        `${this.api}/charges`,
        {
          name: 'FRUTI GO',
          description: `Pedido ${input.reference}`,
          pricing_type: 'fixed_price',
          local_price: { amount: input.amountUsd.toFixed(2), currency: 'USD' },
          metadata: { reference: input.reference, orderId: input.orderId, asset },
          redirect_url: `${process.env.PUBLIC_URL}/payments/return`,
        },
        { headers: { 'X-CC-Api-Key': this.apiKey, 'X-CC-Version': '2018-03-22' }, timeout: 10_000 },
      );

      return {
        status: 'PENDIENTE',
        providerRef: data?.data?.id ?? `cb_${input.reference}`,
        providerData: {
          provider: 'coinbase-commerce',
          asset,
          hostedUrl: data?.data?.hosted_url ?? '',
          code: data?.data?.code ?? '',
        },
      };
    } catch (err) {
      this.logger.error(`Coinbase Commerce falló: ${(err as Error).message}`);
      throw err;
    }
  }

  async parseWebhook(rawBody: Buffer | string, signature?: string): Promise<WebhookResult> {
    const secret = process.env.COINBASE_COMMERCE_WEBHOOK_SECRET;
    if (!secret || !signature) return { handled: false };

    const raw = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
    const expected = createHmac('sha256', secret).update(raw).digest('hex');
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      this.logger.error('Firma de webhook Coinbase inválida.');
      return { handled: false };
    }

    const event = JSON.parse(raw)?.event;
    const map: Record<string, PaymentStatus> = {
      'charge:confirmed': 'COMPLETADO',
      'charge:pending': 'PENDIENTE',
      'charge:failed': 'FALLIDO',
      'charge:resolved': 'COMPLETADO',
    };
    const status = map[event?.type];
    if (!status) return { handled: false };

    return {
      handled: true,
      reference: event?.data?.metadata?.reference,
      providerRef: event?.data?.id,
      status,
    };
  }
}
