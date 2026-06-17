import type { Product } from './product';
import type { CustomerSegment } from './order';

export interface RecommendationContext {
  /** Segmento del comprador (afecta el peso de ciertos factores). */
  segment?: CustomerSegment;
  /** Mes actual 1–12 (para estacionalidad). Por defecto el mes del sistema. */
  month?: number;
}

/** Productos de temporada por mes (cosechas típicas de Panamá), por slug. */
const SEASONAL: Record<number, string[]> = {
  1: ['pina', 'tomate'],
  2: ['pina', 'cebolla'],
  3: ['cebolla', 'platano'],
  4: ['platano', 'name'],
  5: ['name', 'frijol'],
  6: ['frijol', 'platano'],
  7: ['platano', 'tomate'],
  8: ['tomate', 'cebolla'],
  9: ['cebolla', 'pina'],
  10: ['pina', 'name'],
  11: ['name', 'frijol'],
  12: ['frijol', 'pina'],
};

export interface ScoredProduct {
  product: Product;
  score: number;
}

/**
 * Puntúa un producto para recomendación. Función pura y determinista.
 * Factores (0..~1 cada uno, ponderados):
 *  - Calidad: rating promedio (peso alto).
 *  - Confianza: cantidad de reseñas (saturada).
 *  - Disponibilidad: hay stock.
 *  - Estacionalidad: en temporada este mes.
 *  - Ship Provisioning: bonus si el segmento es BUQUE_NAVIERA.
 */
export function scoreProduct(product: Product, ctx: RecommendationContext = {}): number {
  const month = ctx.month ?? new Date().getMonth() + 1;

  const quality = clamp01(product.ratingAvg / 5) * 0.4;
  const trust = clamp01(product.ratingCount / 200) * 0.15;

  const hasStock = product.prices.some((p) => p.stock > 0);
  const availability = (hasStock ? 1 : 0) * 0.15;

  const inSeason = (SEASONAL[month] ?? []).includes(product.slug);
  const seasonal = (inSeason ? 1 : 0) * 0.2;

  const shipBonus =
    ctx.segment === 'BUQUE_NAVIERA' && product.shipProvisioning ? 0.1 : 0;

  return round4(quality + trust + availability + seasonal + shipBonus);
}

/** Devuelve los N productos mejor puntuados (orden estable por score, luego rating, luego id). */
export function recommend(
  products: Product[],
  ctx: RecommendationContext = {},
  limit = 6,
): ScoredProduct[] {
  return products
    .map((product) => ({ product, score: scoreProduct(product, ctx) }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.product.ratingAvg - a.product.ratingAvg ||
        a.product.id.localeCompare(b.product.id),
    )
    .slice(0, limit);
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}
function round4(n: number): number {
  return Math.round((n + Number.EPSILON) * 10000) / 10000;
}
