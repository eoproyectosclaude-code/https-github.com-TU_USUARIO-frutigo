import { BadRequestException, Injectable } from '@nestjs/common';
import {
  calcLineSubtotal,
  calcOrderTotals,
  PRICING_CONFIG,
  tierForPoints,
  type OrderLine,
} from '@frutigo/shared';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateOrderDto } from './dto/create-order.dto';

function deliveryCost(type: string): number {
  if (type === 'PIE_DE_MUELLE') return PRICING_CONFIG.delivery.maritimeUsd;
  if (type === 'RETIRO') return 0;
  return PRICING_CONFIG.delivery.basicUsd;
}

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOrderDto, userId?: string) {
    if (dto.lines.length === 0) throw new BadRequestException('El pedido no tiene líneas');

    // Recalcula precios desde la base (nunca confiar en el precio del cliente).
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

    // Descuento por nivel y saldo de puntos del usuario (server-authoritative).
    let loyaltyDiscountRate = 0;
    let availablePoints = 0;
    if (userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { points: true } });
      if (user) {
        loyaltyDiscountRate = tierForPoints(user.points).perkDiscount;
        availablePoints = user.points;
      }
    }

    const totals = calcOrderTotals({
      lines,
      deliveryUsd: deliveryCost(dto.deliveryType),
      taxExempt: dto.taxExempt,
      loyaltyDiscountRate,
      pointsToRedeem: dto.pointsToRedeem ?? 0,
      availablePoints,
    });

    const reference = `FG-${Date.now()}`;
    return this.prisma.order.create({
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
        totalUsd: totals.totalUsd,
        userId: userId ?? null,
        lines: { create: lines },
      },
      include: { lines: true },
    });
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
}
