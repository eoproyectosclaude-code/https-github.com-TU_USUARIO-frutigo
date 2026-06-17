import { PrismaClient } from '@prisma/client';
import { PRODUCTS, SUPPLIERS } from '@frutigo/shared';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Sembrando datos FRUTI GO...');

  for (const s of SUPPLIERS) {
    await prisma.supplier.upsert({
      where: { id: s.id },
      update: {},
      create: {
        id: s.id,
        name: s.name,
        type: s.type as any,
        province: s.province,
        verified: s.verified,
        ruc: s.ruc,
        ratingAvg: s.ratingAvg,
      },
    });
  }

  for (const p of PRODUCTS) {
    await prisma.product.upsert({
      where: { id: p.id },
      update: {},
      create: {
        id: p.id,
        slug: p.slug,
        nameEs: p.nameEs,
        nameEn: p.nameEn,
        category: p.category as any,
        descriptionEs: p.descriptionEs,
        descriptionEn: p.descriptionEn,
        imageUrl: p.imageUrl,
        province: p.province,
        certifications: p.certifications,
        shipProvisioning: p.shipProvisioning,
        ratingAvg: p.ratingAvg,
        ratingCount: p.ratingCount,
        supplierId: p.supplierId,
        prices: {
          create: p.prices.map((pr) => ({
            unit: pr.unit as any,
            priceUsd: pr.priceUsd,
            stock: pr.stock,
          })),
        },
      },
    });
  }

  console.log(`✅ ${SUPPLIERS.length} proveedores y ${PRODUCTS.length} productos sembrados.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
