import { Test, type TestingModule } from '@nestjs/testing';
import { PaymentsService } from '../src/payments/payments.service';
import { PAYMENT_GATEWAYS } from '../src/payments/gateway.interface';
import { PrismaService } from '../src/prisma/prisma.service';
import { LoyaltyService } from '../src/loyalty/loyalty.service';
import { NotificationsService } from '../src/notifications/notifications.service';
import { AdminGateway } from '../src/admin/admin.gateway';

/**
 * Integración del webhook de pago (camino del dinero):
 *  - concilia y cumple el pedido de forma idempotente,
 *  - otorga fidelización, y
 *  - recompensa al referente en el PRIMER pedido pagado.
 * Todo con Prisma/servicios simulados (sin BD ni red).
 */
describe('PaymentsService.handleWebhook (integración)', () => {
  const fakeGateway = {
    method: 'STRIPE' as const,
    createCharge: jest.fn(),
    parseWebhook: jest.fn(() =>
      Promise.resolve({ handled: true, reference: 'FG-1', status: 'COMPLETADO' as const }),
    ),
  };

  const loyalty = { redeemForOrder: jest.fn(), awardForOrder: jest.fn() };
  const notifications = { notifyUser: jest.fn() };
  const adminGateway = { broadcastMetrics: jest.fn(), emitAlert: jest.fn() };

  function buildPrisma(opts: { paymentStatus?: string; firstOrderPaid: boolean; referredById: string | null }) {
    return {
      order: {
        findUnique: jest.fn(() =>
          Promise.resolve({
            id: 'o1',
            reference: 'FG-1',
            userId: 'buyer-1',
            totalUsd: 42,
            pointsRedeemed: 0,
            payment: opts.paymentStatus ? { status: opts.paymentStatus } : null,
          }),
        ),
        update: jest.fn(() => Promise.resolve({})),
      },
      payment: { update: jest.fn(() => Promise.resolve({})) },
      user: {
        findUnique: jest.fn(() =>
          Promise.resolve({ id: 'buyer-1', firstOrderPaid: opts.firstOrderPaid, referredById: opts.referredById }),
        ),
        update: jest.fn(() => Promise.resolve({ id: 'ref-1', referralCreditUsd: 5 })),
      },
    };
  }

  async function build(prisma: any) {
    [loyalty, notifications, adminGateway].forEach((m) =>
      Object.values(m).forEach((f: any) => f.mockClear()),
    );
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: LoyaltyService, useValue: loyalty },
        { provide: NotificationsService, useValue: notifications },
        { provide: AdminGateway, useValue: adminGateway },
        { provide: PAYMENT_GATEWAYS, useValue: [fakeGateway] },
      ],
    }).compile();
    return moduleRef.get(PaymentsService);
  }

  it('primer pago COMPLETADO: cumple el pedido, otorga puntos y recompensa al referente', async () => {
    const prisma = buildPrisma({ paymentStatus: 'PENDIENTE', firstOrderPaid: false, referredById: 'ref-1' });
    const service = await build(prisma);

    const res = await service.handleWebhook('STRIPE', Buffer.from('{}'), 'sig');

    expect(res.fulfilled).toBe(true);
    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'PAGADO' }) }),
    );
    expect(loyalty.awardForOrder).toHaveBeenCalledWith('buyer-1', 42);
    // recompensa de referido: user.update con incremento de crédito
    const incremented = prisma.user.update.mock.calls.some(
      (c: any) => c[0]?.data?.referralCreditUsd?.increment === 5,
    );
    expect(incremented).toBe(true);
  });

  it('idempotente: webhook COMPLETADO repetido no vuelve a cumplir el pedido', async () => {
    const prisma = buildPrisma({ paymentStatus: 'COMPLETADO', firstOrderPaid: true, referredById: 'ref-1' });
    const service = await build(prisma);

    const res = await service.handleWebhook('STRIPE', Buffer.from('{}'), 'sig');

    expect(res.fulfilled).toBe(false);
    expect(prisma.order.update).not.toHaveBeenCalled();
    expect(loyalty.awardForOrder).not.toHaveBeenCalled();
  });

  it('no recompensa dos veces: si ya pagó su primer pedido, no hay crédito al referente', async () => {
    const prisma = buildPrisma({ paymentStatus: 'PENDIENTE', firstOrderPaid: true, referredById: 'ref-1' });
    const service = await build(prisma);

    await service.handleWebhook('STRIPE', Buffer.from('{}'), 'sig');

    const incremented = prisma.user.update.mock.calls.some(
      (c: any) => c[0]?.data?.referralCreditUsd?.increment,
    );
    expect(incremented).toBe(false);
  });
});
