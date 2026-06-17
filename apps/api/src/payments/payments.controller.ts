import { Body, Controller, Headers, Param, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import type { PaymentMethod } from '@frutigo/shared';
import { PaymentsService } from './payments.service';
import { CreateIntentDto } from './dto/create-intent.dto';

/** Cabecera de firma usada por cada proveedor de webhooks. */
const SIGNATURE_HEADER: Record<string, string> = {
  STRIPE: 'stripe-signature',
  CRYPTO: 'x-cc-webhook-signature',
  YAPPY: 'x-signature',
  VISA: 'x-signature',
};

@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  /** Crea una intención de pago y devuelve los datos del proveedor. */
  @Post('intents')
  createIntent(@Body() dto: CreateIntentDto) {
    return this.payments.createIntent(dto);
  }

  /** Webhook por proveedor (stripe, yappy, visa, crypto). Usa el cuerpo crudo para validar la firma. */
  @Post('webhooks/:method')
  webhook(
    @Param('method') method: string,
    @Req() req: Request & { rawBody?: Buffer },
    @Headers() headers: Record<string, string>,
  ) {
    const upper = method.toUpperCase() as PaymentMethod;
    const sigHeader = SIGNATURE_HEADER[upper];
    const signature = sigHeader ? headers[sigHeader] : undefined;
    const raw = req.rawBody ?? Buffer.from(JSON.stringify(req.body ?? {}));
    return this.payments.handleWebhook(upper, raw, signature);
  }
}
