import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import type { PaymentMethod, PaymentStatus } from '@frutigo/shared';
import type {
  ChargeResult,
  CreateChargeInput,
  PaymentGateway,
  WebhookResult,
} from '../gateway.interface';

/**
 * Pasarela Stripe (tarjetas internacionales Visa/Mastercard).
 * Crea un PaymentIntent y devuelve el clientSecret para que el cliente
 * confirme con el Payment Sheet del SDK móvil.
 */
@Injectable()
export class StripeGateway implements PaymentGateway {
  readonly method: PaymentMethod = 'STRIPE';
  private readonly logger = new Logger(StripeGateway.name);
  private readonly stripe?: Stripe;

  constructor() {
    const key = process.env.STRIPE_SECRET_KEY;
    if (key && key.startsWith('sk_')) {
      this.stripe = new Stripe(key, { apiVersion: '2024-06-20' });
    } else {
      this.logger.warn('STRIPE_SECRET_KEY no configurada — Stripe en modo simulado.');
    }
  }

  async createCharge(input: CreateChargeInput): Promise<ChargeResult> {
    const amountCents = Math.round(input.amountUsd * 100);

    if (!this.stripe) {
      return {
        status: 'AUTORIZADO',
        providerRef: `pi_demo_${input.reference}`,
        providerData: { provider: 'stripe', clientSecret: `pi_demo_${input.reference}_secret` },
      };
    }

    const intent = await this.stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      metadata: { reference: input.reference, orderId: input.orderId },
      receipt_email: input.customerEmail,
      automatic_payment_methods: { enabled: true },
    });

    return {
      status: 'PENDIENTE',
      providerRef: intent.id,
      providerData: {
        provider: 'stripe',
        clientSecret: intent.client_secret ?? '',
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY ?? '',
      },
    };
  }

  async parseWebhook(rawBody: Buffer | string, signature?: string): Promise<WebhookResult> {
    if (!this.stripe || !signature || !process.env.STRIPE_WEBHOOK_SECRET) {
      return { handled: false };
    }
    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (err) {
      this.logger.error(`Firma de webhook Stripe inválida: ${(err as Error).message}`);
      return { handled: false };
    }

    const map: Record<string, PaymentStatus> = {
      'payment_intent.succeeded': 'COMPLETADO',
      'payment_intent.payment_failed': 'FALLIDO',
      'payment_intent.processing': 'PENDIENTE',
    };
    const status = map[event.type];
    if (!status) return { handled: false };

    const intent = event.data.object as Stripe.PaymentIntent;
    return {
      handled: true,
      reference: intent.metadata?.reference,
      providerRef: intent.id,
      status,
    };
  }
}
