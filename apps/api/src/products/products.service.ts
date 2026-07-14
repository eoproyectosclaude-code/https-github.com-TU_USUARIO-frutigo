import { Injectable } from '@nestjs/common';
import { recommend, type CustomerSegment, type Product as DomainProduct } from '@frutigo/shared';
import { PrismaService } from '../prisma/prisma.service';
import { MemoryCacheService } from '../cache/memory-cache.service';

// El catálogo cambia poco y se lee mucho → caché corta con invalidación al editar.
const TTL = 30_000; // 30 s

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: MemoryCacheService,
  ) {}

  findAll(category?: string) {
    return this.cache.wrap(`products:list:${category ?? 'all'}`, TTL, () =>
      this.prisma.product.findMany({
        where: category ? { category: category as any } : undefined,
        include: { prices: true, supplier: true },
        orderBy: { ratingAvg: 'desc' },
      }),
    );
  }

  findOne(id: string) {
    return this.cache.wrap(`products:one:${id}`, TTL, () =>
      this.prisma.product.findUnique({
        where: { id },
        include: { prices: true, supplier: true },
      }),
    );
  }

  /** Recomendaciones inteligentes (calidad, temporada, disponibilidad, segmento). */
  async recommended(segment?: string, limit = 6) {
    return this.cache.wrap(`products:reco:${segment ?? 'none'}:${limit}`, TTL, async () => {
      const products = await this.prisma.product.findMany({ include: { prices: true, supplier: true } });
      const scored = recommend(
        products as unknown as DomainProduct[],
        { segment: segment as CustomerSegment | undefined },
        limit,
      );
      return scored.map((s) => ({ ...s.product, score: s.score }));
    });
  }

  /** Invalida el catálogo cacheado (llamar tras crear/editar productos). */
  invalidateCatalog() {
    this.cache.invalidate('products:');
  }
}
