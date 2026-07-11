import { Injectable } from '@nestjs/common';
import { aggregateHeatmap, maxWeight, PRICING_CONFIG, toCsv, type GeoPoint } from '@frutigo/shared';
import { PrismaService } from '../prisma/prisma.service';

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
    const gmvUsd = round2(paidOrders.reduce((s, o) => s + o.totalUsd, 0));
    const buyerFees = paidOrders.reduce((s, o) => s + o.buyerFeeUsd, 0);
    const supplierFees = paidOrders.reduce((s, o) => s + o.subtotalUsd * SUPPLIER_FEE_RATE, 0);
    return {
      suppliers, verifiedSuppliers, pendingSuppliers: suppliers - verifiedSuppliers, products,
      totalOrders: orders, paidOrders: paidOrders.length, gmvUsd,
      platformRevenueUsd: round2(buyerFees + supplierFees),
      buyerFeeRate: PRICING_CONFIG.buyerFeeRate, supplierFeeRate: SUPPLIER_FEE_RATE,
    };
  }

  async listSuppliers() {
    const suppliers = await this.prisma.supplier.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: [{ verified: 'asc' }, { name: 'asc' }],
    });
    return suppliers.map((s) => ({ id: s.id, name: s.name, type: s.type, province: s.province, verified: s.verified, ruc: s.ruc, products: s._count.products }));
  }

  setVerified(id: string, verified: boolean) {
    return this.prisma.supplier.update({ where: { id }, data: { verified } });
  }

  async listPayments() {
    const payments = await this.prisma.payment.findMany({
      include: { order: { select: { reference: true, totalUsd: true, status: true, segment: true } } },
      orderBy: { createdAt: 'desc' }, take: 100,
    });
    return payments.map((p) => ({ id: p.id, method: p.method, status: p.status, amountUsd: p.amountUsd, reference: p.order.reference, orderStatus: p.order.status, segment: p.order.segment, createdAt: p.createdAt }));
  }

  async activeDeliveries() {
    const deliveries = await this.prisma.delivery.findMany({
      where: { status: { in: ['ASIGNADO', 'RECOGIDO', 'EN_RUTA'] } },
      include: {
        order: { select: { reference: true, totalUsd: true, segment: true } },
        driver: { select: { name: true, vehicle: true, lat: true, lng: true } },
        locations: { orderBy: { at: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' }, take: 100,
    });
    return deliveries.map((d) => {
      const last = d.locations[0];
      const lat = last?.lat ?? d.driver?.lat ?? null;
      const lng = last?.lng ?? d.driver?.lng ?? null;
      return {
        id: d.id, reference: d.order.reference, status: d.status, segment: d.order.segment, totalUsd: d.order.totalUsd,
        driver: d.driver ? { name: d.driver.name, vehicle: d.driver.vehicle } : null,
        dropoffAddress: d.dropoffAddress,
        location: lat != null && lng != null ? { lat, lng, at: last?.at ?? null } : null,
        dropoff: d.dropoffLat != null && d.dropoffLng != null ? { lat: d.dropoffLat, lng: d.dropoffLng } : null,
      };
    });
  }

  /**
   * Heatmap histórico de entregas: agrega los rastros GPS (DeliveryLocation) y los
   * puntos de entrega (dropoff) de todas las entregas en una rejilla con peso.
   */
  async deliveriesHeatmap(days = 30) {
    const since = new Date(Date.now() - days * 86_400_000);
    const [locations, deliveries] = await Promise.all([
      this.prisma.deliveryLocation.findMany({
        where: { at: { gte: since } },
        select: { lat: true, lng: true },
        take: 20_000,
      }),
      this.prisma.delivery.findMany({
        where: { createdAt: { gte: since }, dropoffLat: { not: null }, dropoffLng: { not: null } },
        select: { dropoffLat: true, dropoffLng: true },
        take: 5_000,
      }),
    ]);

    const points: GeoPoint[] = [
      ...locations.map((l) => ({ lat: l.lat, lng: l.lng })),
      ...deliveries.map((d) => ({ lat: d.dropoffLat as number, lng: d.dropoffLng as number })),
    ];
    const heat = aggregateHeatmap(points);
    return { days, total: points.length, max: maxWeight(heat), points: heat };
  }

  /** Reporte CSV de pedidos. */
  async ordersCsv() {
    const orders = await this.prisma.order.findMany({ include: { payment: true }, orderBy: { createdAt: 'desc' }, take: 1000 });
    return toCsv(orders, [
      { header: 'Referencia', value: (o) => o.reference },
      { header: 'Fecha', value: (o) => o.createdAt.toISOString() },
      { header: 'Segmento', value: (o) => o.segment },
      { header: 'Estado', value: (o) => o.status },
      { header: 'Subtotal', value: (o) => o.subtotalUsd.toFixed(2) },
      { header: 'Descuento', value: (o) => o.loyaltyDiscountUsd.toFixed(2) },
      { header: 'CreditoPuntos', value: (o) => o.loyaltyCreditUsd.toFixed(2) },
      { header: 'CreditoReferido', value: (o) => o.referralCreditUsd.toFixed(2) },
      { header: 'ITBMS', value: (o) => o.taxUsd.toFixed(2) },
      { header: 'Total', value: (o) => o.totalUsd.toFixed(2) },
      { header: 'Pago', value: (o) => o.payment?.method ?? '' },
      { header: 'EstadoPago', value: (o) => o.payment?.status ?? '' },
    ]);
  }

  /** Reporte CSV de pagos. */
  async paymentsCsv() {
    const list = await this.listPayments();
    return toCsv(list, [
      { header: 'Pedido', value: (p) => p.reference },
      { header: 'Metodo', value: (p) => p.method },
      { header: 'Estado', value: (p) => p.status },
      { header: 'Monto', value: (p) => p.amountUsd.toFixed(2) },
      { header: 'Segmento', value: (p) => p.segment },
      { header: 'Fecha', value: (p) => p.createdAt.toISOString() },
    ]);
  }
}

function round2(n: number): number { return Math.round((n + Number.EPSILON) * 100) / 100; }
