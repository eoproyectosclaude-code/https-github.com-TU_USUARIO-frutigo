import { priceForUnit, type Product } from './product';

const product: Product = {
  id: 'p1',
  slug: 'tomate',
  nameEs: 'Tomate',
  nameEn: 'Tomato',
  category: 'VERDURAS',
  descriptionEs: '',
  descriptionEn: '',
  imageUrl: '',
  province: 'Chiriquí',
  supplierId: 's1',
  prices: [
    { unit: 'KG', priceUsd: 1.2, stock: 100 },
    { unit: 'QUINTAL', priceUsd: 48, stock: 5 },
  ],
  certifications: [],
  shipProvisioning: false,
  ratingAvg: 0,
  ratingCount: 0,
};

describe('product', () => {
  it('priceForUnit encuentra el precio de una unidad existente', () => {
    expect(priceForUnit(product, 'KG')?.priceUsd).toBe(1.2);
    expect(priceForUnit(product, 'QUINTAL')?.stock).toBe(5);
  });

  it('priceForUnit devuelve undefined si la unidad no está disponible', () => {
    expect(priceForUnit(product, 'HALF_QUINTAL')).toBeUndefined();
  });

  it('priceForUnit sobre un producto sin precios devuelve undefined', () => {
    expect(priceForUnit({ ...product, prices: [] }, 'KG')).toBeUndefined();
  });
});
