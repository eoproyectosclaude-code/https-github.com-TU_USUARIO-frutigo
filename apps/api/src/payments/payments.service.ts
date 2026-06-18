import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { REFERRAL, shouldFulfill, type PaymentIntent, type PaymentMethod, type PaymentStatus } from '@frutigo/shared';
import { PrismaService } from '../prisma/prisma.service';
import { PAYMENT_GATEWAYS, type PaymentGateway } from './gateway.interface';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AdminGateway } from '../admin/admin.gateway';
import type { CreateIntentDto } from './dto/create-intent.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly registry = new Map<PaymentMethod, PaymentGateway>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly loyalty: LoyaltyService,
    private readonly notifications: NotificationsService,
    private readonly adminGateway: AdminGateway,
    @Inject(PAYMENT_GATEWAYS) gateways: PaymentGateway[],
  ) {
    for (const g of gateways) this.registry.set(g.method, g);
  }

  async createIntent(dto: CreateIntentDto): Promise<PaymentIntent> {
    const order = await this.prisma.order.findUnique({ where: { id: dto.orderId } });
    if (!order) throw new NotFoundException('Pedido no encontrado');

    const gateway = this.registry.get(dto.method);
    let status: PaymentStatus = 'PENDIENTE';
    let providerData: Record<string, string> = {};
    let providerRef: string | undefined;

    if (gateway) {
      const result = await gateway.createCharge({
        orderId: order.id, reference: order.reference, amountUsd: order.totalUsd,
        cryptoAsset: dto.cryptoAsset, customerEmail: dto.customerEmail,
      });
      status = result.status; providerData = result.providerData; providerRef = result.providerRef;
    } else if (dto.method !== 'CASH' && dto.method !== 'ACH_SWIFT') {
      throw new BadRequestException(`Método de pago no soportado: ${dto.method}`);
    }

    const payment = await this.prisma.payment.upsert({
      where: { orderId: order.id },
      update: { method: dto.method as any, amountUsd: order.totalUsd, status: status as any, cryptoAsset: dto.cryptoAsset, providerData: { ...providerData, providerRef } },
      create: { orderId: order.id, method: dto.method as any, amountUsd: order.totalUsd, status: status as any, cryptoAsset: dto.cryptoAsset, providerData: { ...providerData, providerRef } },
    });

    this.logger.log(`Intención ${order.reference} · ${dto.method} · ${status}`);
    return {
      id: payment.id, orderId: order.id, method: dto.method, amountUsd: order.totalUsd,
      status, providerData, cryptoAsset: dto.cryptoAsset, createdAt: payment.createdAt.toISOString(),
    };
  }

  /** Procesa un webhook de proveedor: valida firma y concilia pago + pedido (idempotente). */
  async handleWebhook(method: PaymentMethod, rawBody: Buffer | string, signature?: string) {
    const gateway = this.registry.get(method);
    if (!gateway) throw new BadRequestException('Pasarela desconocida');

    const result = await gateway.parseWebhook(rawBody, signature);
    if (!result.handled || !result.reference || !result.status) {
      return { received: true, reconciled: false };
    }

    const order = await this.prisma.order.findUnique({ where: { reference: result.reference }, include: { payment: true } });
    if (!order) {
      this.logger.warn(`Webhook sin pedido: ${result.reference}`);
      return { received: true, reconciled: false };
    }

    const fulfill = shouldFulfill(order.payment?.status as PaymentStatus | undefined, result.status);
    await this.prisma.payment.update({ where: { orderId: order.id }, data: { status: result.status as any } });

    if (fulfill) {
      await this.prisma.order.update({ where: { id: order.id }, data: { status: 'PAGADO' } });
      await this.loyalty.redeemForOrder(order.userId, order.pointsRedeemed);
      await this.loyalty.awardForOrder(order.userId, order.totalUsd);
      void this.notifications.notifyUser(order.userId, `Pago confirmado · ${order.reference}`, '¡Gracias! Tu pedido está en preparación y ganaste FrutiGo Points.', { orderId: order.id });
      await this.rewardReferrerOnFirstOrder(order.userId);
      void this.adminGateway.broadcastMetrics();
      if (order.totalUsd >= 500) {
        this.adminGateway.emitAlert('success', `💰 Pedido grande pagado: ${order.reference} · $${order.totalUsd.toFixed(2)}`);
      }
      this.logger.log(`✅ Pedido ${order.reference} PAGADO vía ${method}`);
    } else if (result.status === 'COMPLETADO') {
      this.logger.log(`↩️  Webhook repetido para ${order.reference} — ignorado (idempotente)`);
    } else if (result.status === 'FALLIDO') {
      this.logger.warn(`❌ Pago fallido ${order.reference} vía ${method}`);
    }

    return { received: true, reconciled: true, status: result.status, fulfilled: fulfill };
  }

  /**
   * Recompensa al referente con $5 de crédito cuando su referido paga su PRIMER pedido.
   * Idempotente: marca firstOrderPaid y solo premia una vez.
   */
  private async rewardReferrerOnFirstOrder(userId: string | null | undefined): Promise<void> {
    if (!userId) return;
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, firstOrderPaid: true, referredById: true },
    });
    if (!user || user.firstOrderPaid) return;

    await this.prisma.user.update({ where: { id: user.id }, data: { firstOrderPaid: true } });

    if (!user.referredById) return;
    const referrer = await this.prisma.user.update({
      where: { id: user.referredById },
      data: { referralCreditUsd: { increment: REFERRAL.referrerRewardUsd } },
      select: { id: true, referralCreditUsd: true },
    });
    void this.notifications.notifyUser(
      referrer.id,
      '🎉 ¡Ganaste crédito por referido!',
      `Tu referido completó su primer pedido. Sumaste $${REFERRAL.referrerRewardUsd.toFixed(2)} de crédito FRUTI GO.`,
      {},
    );
    this.adminGateway.emitAlert('success', `🤝 Referido completado: +$${REFERRAL.referrerRewardUsd.toFixed(2)} de crédito`);
    this.logger.log(`🤝 Recompensa de referido a ${referrer.id} (saldo $${referrer.referralCreditUsd.toFixed(2)})`);
  }
}
