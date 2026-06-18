import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  calcLineSubtotal,
  calcOrderTotals,
  PRICING_CONFIG,
  tierForPoints,
  type OrderLine,
} from '@frutigo/shared';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { buildOrderReceiptPdf } from './order-pdf';
import type { CreateOrderDto } from './dto/create-order.dto';

function deliveryCost(type: string): number {
  if (type === 'PIE_DE_MUELLE') return PRICING_CONFIG.delivery.maritimeUsd;
  if (type === 'RETIRO') return 0;
  return PRICING_CONFIG.delivery.basicUsd;
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  async create(dto: CreateOrderDto, userId?: string) {
    if (dto.lines.length === 0) throw new BadRequestException('El pedido no tiene líneas');

    const lines: OrderLine[] = [];
    for (const l of dto.lines) {
      const price = await this.prisma.productPrice.findUnique({
        where: { productId_unit: { productId: l.productId, unit: l.unit as any } },
        include: { product: true },
      });
      if (!price) throw new BadRequestException(`Precio no encontrado: ${l.productId}/${l.unit}`);
      lines.push({
        productId: l.productId,
        productNameEs: price.product.nameEs,
        productNameEn: price.product.nameEn,
        unit: l.unit,
        quantity: l.quantity,
        unitPriceUsd: price.priceUsd,
        subtotalUsd: calcLineSubtotal(price.priceUsd, l.quantity),
      });
    }

    let loyaltyDiscountRate = 0;
    let availablePoints = 0;
    let referralCreditAvailableUsd = 0;
    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { points: true, referralCreditUsd: true },
      });
      if (user) {
        loyaltyDiscountRate = tierForPoints(user.points).perkDiscount;
        availablePoints = user.points;
        referralCreditAvailableUsd = user.referralCreditUsd;
      }
    }

    const totals = calcOrderTotals({
      lines,
      deliveryUsd: deliveryCost(dto.deliveryType),
      taxExempt: dto.taxExempt,
      loyaltyDiscountRate,
      pointsToRedeem: dto.pointsToRedeem ?? 0,
      availablePoints,
      referralCreditAvailableUsd,
    });

    const reference = `FG-${Date.now()}`;
    const order = await this.prisma.order.create({
      data: {
        reference,
        segment: dto.segment as any,
        status: 'PENDIENTE_PAGO',
        deliveryType: dto.deliveryType,
        taxExempt: dto.taxExempt,
        subtotalUsd: totals.subtotalUsd,
        loyaltyDiscountUsd: totals.loyaltyDiscountUsd,
        buyerFeeUsd: totals.buyerFeeUsd,
        deliveryUsd: totals.deliveryUsd,
        taxUsd: totals.taxUsd,
        pointsRedeemed: totals.pointsRedeemed,
        loyaltyCreditUsd: totals.loyaltyCreditUsd,
        referralCreditUsd: totals.referralCreditUsd,
        totalUsd: totals.totalUsd,
        userId: userId ?? null,
        lines: { create: lines },
      },
      include: { lines: true },
    });

    // Descuenta el crédito de referido aplicado del saldo del comprador (atómico, sin bajar de 0).
    if (userId && totals.referralCreditUsd > 0) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { referralCreditUsd: { decrement: totals.referralCreditUsd } },
      });
    }

    return order;
  }

  findOne(id: string) {
    return this.prisma.order.findUnique({ where: { id }, include: { lines: true, payment: true } });
  }

  findByUser(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: { lines: true, payment: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async loadAuthorized(id: string, requester: { id: string; role: string }) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { lines: true, payment: true, user: true },
    });
    if (!order) throw new NotFoundException('Pedido no encontrado');
    if (order.userId && order.userId !== requester.id && requester.role !== 'ADMIN') {
      throw new ForbiddenException('Este pedido no te pertenece');
    }
    return order;
  }

  private toReceipt(order: any) {
    return {
      reference: order.reference,
      createdAt: order.createdAt,
      segment: order.segment,
      status: order.status,
      deliveryType: order.deliveryType,
      paymentMethod: order.payment?.method ?? null,
      paymentStatus: order.payment?.status ?? null,
      lines: order.lines.map((l: any) => ({
        name: l.productNameEs,
        unit: l.unit,
        quantity: l.quantity,
        unitPriceUsd: l.unitPriceUsd,
        subtotalUsd: l.subtotalUsd,
      })),
      subtotalUsd: order.subtotalUsd,
      loyaltyDiscountUsd: order.loyaltyDiscountUsd,
      buyerFeeUsd: order.buyerFeeUsd,
      deliveryUsd: order.deliveryUsd,
      taxUsd: order.taxUsd,
      pointsRedeemed: order.pointsRedeemed,
      loyaltyCreditUsd: order.loyaltyCreditUsd,
      referralCreditUsd: order.referralCreditUsd,
      totalUsd: order.totalUsd,
    };
  }

  /** Recibo del pedido en PDF. Solo el dueño o un ADMIN. */
  async receiptPdf(id: string, requester: { id: string; role: string }) {
    const order = await this.loadAuthorized(id, requester);
    const buffer = await buildOrderReceiptPdf(this.toReceipt(order));
    return { buffer, filename: `${order.reference}.pdf` };
  }

  /** Envía el recibo por correo al dueño del pedido (o al indicado). */
  async emailReceipt(id: string, requester: { id: string; role: string }, to?: string) {
    const order = await this.loadAuthorized(id, requester);
    const target = to ?? order.user?.email;
    if (!target) throw new BadRequestException('No hay correo destino para este pedido');
    const buffer = await buildOrderReceiptPdf(this.toReceipt(order));
    const res = await this.mail.send({
      to: target,
      subject: `Tu recibo FRUTI GO · ${order.reference}`,
      text: `Adjuntamos el recibo de tu pedido ${order.reference}. ¡Gracias por comprar en FRUTI GO!`,
      attachments: [{ filename: `${order.reference}.pdf`, content: buffer, contentType: 'application/pdf' }],
    });
    return { ...res, to: target };
  }
}
