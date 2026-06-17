import { recommend, scoreProduct } from './recommendations';
import type { Product } from './product';

const make = (over: Partial<Product>): Product => ({
  id: 'p',
  slug: 'tomate',
  nameEs: 'Tomate',
  nameEn: 'Tomato',
  category: 'VERDURAS',
  descriptionEs: '',
  descriptionEn: '',
  imageUrl: '',
  province: 'Chiriquí',
  supplierId: 's',
  prices: [{ unit: 'KG', priceUsd: 1, stock: 10 }],
  certifications: [],
  shipProvisioning: false,
  ratingAvg: 4,
  ratingCount: 50,
  ...over,
});

describe('recomendaciones', () => {
  it('mayor rating ⇒ mayor score', () => {
    const hi = scoreProduct(make({ ratingAvg: 5 }), { month: 6 });
    const lo = scoreProduct(make({ ratingAvg: 2 }), { month: 6 });
    expect(hi).toBeGreaterThan(lo);
  });

  it('sin stock penaliza', () => {
    const withStock = scoreProduct(make({ prices: [{ unit: 'KG', priceUsd: 1, stock: 5 }] }), { month: 1 });
    const noStock = scoreProduct(make({ prices: [{ unit: 'KG', priceUsd: 1, stock: 0 }] }), { month: 1 });
    expect(withStock).toBeGreaterThan(noStock);
  });

  it('estacionalidad suma (tomate en enero)', () => {
    const inSeason = scoreProduct(make({ slug: 'tomate' }), { month: 1 });
    const offSeason = scoreProduct(make({ slug: 'tomate' }), { month: 5 });
    expect(inSeason).toBeGreaterThan(offSeason);
  });

  it('bonus ship-provisioning para buques', () => {
    const ship = scoreProduct(make({ shipProvisioning: true }), { segment: 'BUQUE_NAVIERA', month: 5 });
    const noShip = scoreProduct(make({ shipProvisioning: false }), { segment: 'BUQUE_NAVIERA', month: 5 });
    expect(ship).toBeGreaterThan(noShip);
  });

  it('recommend respeta el límite y ordena por score', () => {
    const products = [make({ id: 'a', ratingAvg: 2 }), make({ id: 'b', ratingAvg: 5 }), make({ id: 'c', ratingAvg: 4 })];
    const top = recommend(products, { month: 6 }, 2);
    expect(top).toHaveLength(2);
    expect(top[0]!.product.id).toBe('b');
    expect(top[0]!.score).toBeGreaterThanOrEqual(top[1]!.score);
  });
});
