import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { forecastDemand } from '@frutigo/shared';
import { PrismaService } from '../prisma/prisma.service';
import { MemoryCacheService } from '../cache/memory-cache.service';
import type { CreateProductDto, UpdateProductDto } from './dto/supplier-product.dto';

/**
 * Lógica del portal de proveedor: cada proveedor solo gestiona SUS productos
 * y ve los pedidos que incluyen sus productos.
 */
@Injectable()
export class SuppliersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: MemoryCacheService,
  ) {}

  private assertSupplier(supplierId?: string | null): asserts supplierId is string {
    if (!supplierId) {
      throw new ForbiddenException('La cuenta no está asociada a un proveedor');
    }
  }

  listProducts(supplierId?: string | null) {
    this.assertSupplier(supplierId);
    return this.prisma.product.findMany({
      where: { supplierId },
      include: { prices: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createProduct(supplierId: string | null | undefined, dto: CreateProductDto) {
    this.assertSupplier(supplierId);
    this.cache.invalidate('products:'); // el catálogo cambió
    return this.prisma.product.create({
      data: {
        slug: dto.slug,
        nameEs: dto.nameEs,
        nameEn: dto.nameEn,
        category: dto.category as any,
        descriptionEs: dto.descriptionEs,
        descriptionEn: dto.descriptionEn,
        imageUrl: dto.imageUrl,
        province: dto.province,
        certifications: dto.certifications ?? [],
        shipProvisioning: dto.shipProvisioning ?? false,
        supplierId,
        prices: { create: dto.prices.map((p) => ({ unit: p.unit as any, priceUsd: p.priceUsd, stock: p.stock })) },
      },
      include: { prices: true },
    });
  }

  async updateProduct(supplierId: string | null | undefined, productId: string, dto: UpdateProductDto) {
    this.assertSupplier(supplierId);
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Producto no encontrado');
    if (product.supplierId !== supplierId) {
      throw new ForbiddenException('Este producto no pertenece a tu cuenta');
    }
    this.cache.invalidate('products:'); // el catálogo cambió

    // Reemplaza precios si vienen en el payload (upsert por unidad).
    if (dto.prices) {
      for (const p of dto.prices) {
        await this.prisma.productPrice.upsert({
          where: { productId_unit: { productId, unit: p.unit as any } },
          update: { priceUsd: p.priceUsd, stock: p.stock },
          create: { productId, unit: p.unit as any, priceUsd: p.priceUsd, stock: p.stock },
        });
      }
    }

    return this.prisma.product.update({
      where: { id: productId },
      data: {
        nameEs: dto.nameEs,
        nameEn: dto.nameEn,
        descriptionEs: dto.descriptionEs,
        descriptionEn: dto.descriptionEn,
        imageUrl: dto.imageUrl,
        shipProvisioning: dto.shipProvisioning,
      },
      include: { prices: true },
    });
  }

  async listOrders(supplierId?: string | null) {
    this.assertSupplier(supplierId);
    const productIds = (
      await this.prisma.product.findMany({ where: { supplierId }, select: { id: true } })
    ).map((p) => p.id);

    return this.prisma.order.findMany({
      where: { lines: { some: { productId: { in: productIds } } } },
      include: { lines: true, payment: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async dashboard(supplierId?: string | null) {
    this.assertSupplier(supplierId);
    const products = await this.prisma.product.findMany({
      where: { supplierId },
      include: { prices: true },
    });
    const productIds = products.map((p) => p.id);

    const orders = await this.prisma.order.findMany({
      where: { lines: { some: { productId: { in: productIds } } }, status: 'PAGADO' },
      include: { lines: true },
    });

    // Ingresos del proveedor = suma de líneas de SUS productos en pedidos pagados.
    let revenueUsd = 0;
    for (const o of orders) {
      for (const l of o.lines) {
        if (productIds.includes(l.productId)) revenueUsd += l.subtotalUsd;
      }
    }

    const lowStock = products.filter((p) => p.prices.some((pr) => pr.stock <= 5)).length;

    return {
      products: products.length,
      paidOrders: orders.length,
      revenueUsd: Math.round((revenueUsd + Number.EPSILON) * 100) / 100,
      lowStockProducts: lowStock,
    };
  }

  /** Predicción de demanda por producto a partir del histórico de pedidos pagados. */
  async forecast(supplierId?: string | null) {
    this.assertSupplier(supplierId);
    const products = await this.prisma.product.findMany({ where: { supplierId } });
    const productIds = products.map((p) => p.id);

    const lines = await this.prisma.orderLine.findMany({
      where: { productId: { in: productIds }, order: { status: 'PAGADO' } },
      include: { order: { select: { createdAt: true } } },
      orderBy: { order: { createdAt: 'asc' } },
    });

    // Agrupa cantidades por producto y por día (serie cronológica).
    const byProduct = new Map<string, Map<string, number>>();
    for (const l of lines) {
      const day = l.order.createdAt.toISOString().slice(0, 10);
      const series = byProduct.get(l.productId) ?? new Map<string, number>();
      series.set(day, (series.get(day) ?? 0) + l.quantity);
      byProduct.set(l.productId, series);
    }

    const result = products.map((p) => {
      const series = byProduct.get(p.id);
      const history = series ? [...series.values()] : [];
      const f = forecastDemand(history);
      return {
        productId: p.id,
        nameEs: p.nameEs,
        nameEn: p.nameEn,
        history,
        projectedNextPeriod: f.nextPeriod,
        trendPerPeriod: f.trendPerPeriod,
        confidence: f.confidence,
      };
    });

    // Ordena por demanda proyectada descendente.
    result.sort((a, b) => b.projectedNextPeriod - a.projectedNextPeriod);
    return result;
  }
}
