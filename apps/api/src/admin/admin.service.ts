import { Injectable } from '@nestjs/common';
import { PRICING_CONFIG } from '@frutigo/shared';
import { PrismaService } from '../prisma/prisma.service';

/** Comisión al proveedor sobre el subtotal (plan de negocios: 4%). */
const SUPPLIER_FEE_RATE = 0.04;

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard() {
    const [suppliers, verifiedSuppliers, products, orders, paidOrders] = await Promise.all([
      this.prisma.supplier.count(),
      this.prisma.supplier.count({ where: { verified: true } }),
      this.prisma.product.count(),
      this.prisma.order.count(),
      this.prisma.order.findMany({ where: { status: 'PAGADO' } }),
    ]);

    // GMV = valor bruto de mercancía de pedidos pagados.
    const gmvUsd = round2(paidOrders.reduce((s, o) => s + o.totalUsd, 0));
    // Ingresos de la plataforma = comisión comprador (2%) + comisión proveedor (4%).
    const buyerFees = paidOrders.reduce((s, o) => s + o.buyerFeeUsd, 0);
    const supplierFees = paidOrders.reduce((s, o) => s + o.subtotalUsd * SUPPLIER_FEE_RATE, 0);
    const platformRevenueUsd = round2(buyerFees + supplierFees);

    return {
      suppliers,
      verifiedSuppliers,
      pendingSuppliers: suppliers - verifiedSuppliers,
      products,
      totalOrders: orders,
      paidOrders: paidOrders.length,
      gmvUsd,
      platformRevenueUsd,
      buyerFeeRate: PRICING_CONFIG.buyerFeeRate,
      supplierFeeRate: SUPPLIER_FEE_RATE,
    };
  }

  async listSuppliers() {
    const suppliers = await this.prisma.supplier.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: [{ verified: 'asc' }, { name: 'asc' }],
    });
    return suppliers.map((s) => ({
      id: s.id,
      name: s.name,
      type: s.type,
      province: s.province,
      verified: s.verified,
      ruc: s.ruc,
      products: s._count.products,
    }));
  }

  setVerified(id: string, verified: boolean) {
    return this.prisma.supplier.update({ where: { id }, data: { verified } });
  }

  async listPayments() {
    const payments = await this.prisma.payment.findMany({
      include: { order: { select: { reference: true, totalUsd: true, status: true, segment: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return payments.map((p) => ({
      id: p.id,
      method: p.method,
      status: p.status,
      amountUsd: p.amountUsd,
      reference: p.order.reference,
      orderStatus: p.order.status,
      segment: p.order.segment,
      createdAt: p.createdAt,
    }));
  }
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
