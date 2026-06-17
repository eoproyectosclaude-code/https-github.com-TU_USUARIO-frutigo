import { Injectable, Logger } from '@nestjs/common';
import { pointsForOrder, tierForPoints, pointsToNextTier } from '@frutigo/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LoyaltyService {
  private readonly logger = new Logger(LoyaltyService.name);
  constructor(private readonly prisma: PrismaService) {}

  /** Otorga puntos a un usuario por un pedido pagado. Idempotencia básica por monto. */
  async awardForOrder(userId: string | null | undefined, totalUsd: number) {
    if (!userId) return;
    const points = pointsForOrder(totalUsd);
    if (points <= 0) return;
    await this.prisma.user.update({
      where: { id: userId },
      data: { points: { increment: points } },
    });
    this.logger.log(`+${points} FrutiGo Points → user ${userId}`);
  }

  /** Descuenta los puntos canjeados en un pedido (al confirmarse el pago). */
  async redeemForOrder(userId: string | null | undefined, points: number) {
    if (!userId || !points || points <= 0) return;
    await this.prisma.user.update({
      where: { id: userId },
      data: { points: { decrement: points } },
    });
    this.logger.log(`-${points} FrutiGo Points (canje) ← user ${userId}`);
  }

  async summary(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { points: true } });
    const points = user?.points ?? 0;
    const tier = tierForPoints(points);
    return {
      points,
      tier: tier.tier,
      tierLabelEs: tier.labelEs,
      tierLabelEn: tier.labelEn,
      perkDiscount: tier.perkDiscount,
      next: pointsToNextTier(points),
    };
  }
}
