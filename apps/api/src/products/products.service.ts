import { Injectable } from '@nestjs/common';
import { recommend, type CustomerSegment, type Product as DomainProduct } from '@frutigo/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(category?: string) {
    return this.prisma.product.findMany({
      where: category ? { category: category as any } : undefined,
      include: { prices: true, supplier: true },
      orderBy: { ratingAvg: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
      include: { prices: true, supplier: true },
    });
  }

  /** Recomendaciones inteligentes (calidad, temporada, disponibilidad, segmento). */
  async recommended(segment?: string, limit = 6) {
    const products = await this.prisma.product.findMany({ include: { prices: true, supplier: true } });
    const scored = recommend(
      products as unknown as DomainProduct[],
      { segment: segment as CustomerSegment | undefined },
      limit,
    );
    return scored.map((s) => ({ ...s.product, score: s.score }));
  }
}
