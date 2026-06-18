/**
 * Agregación de puntos geográficos en una rejilla para mapas de calor (heatmap).
 * Mantiene el dominio puro y testeable: el backend solo le pasa coordenadas crudas.
 */
export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface HeatPoint {
  lat: number;
  lng: number;
  /** Peso = cantidad de eventos agregados en esa celda. */
  weight: number;
}

/** Precisión por defecto de la rejilla (~111 m con 3 decimales en latitudes de Panamá). */
export const HEATMAP_PRECISION = 3;

/**
 * Agrupa puntos por celda de rejilla (redondeo a `precision` decimales) y devuelve
 * el centro de cada celda con su peso. El resultado se ordena por peso descendente.
 */
export function aggregateHeatmap(points: GeoPoint[], precision = HEATMAP_PRECISION): HeatPoint[] {
  const factor = Math.pow(10, precision);
  const cells = new Map<string, HeatPoint>();
  for (const p of points) {
    if (!isFiniteCoord(p?.lat) || !isFiniteCoord(p?.lng)) continue;
    const lat = Math.round(p.lat * factor) / factor;
    const lng = Math.round(p.lng * factor) / factor;
    const key = `${lat},${lng}`;
    const existing = cells.get(key);
    if (existing) existing.weight += 1;
    else cells.set(key, { lat, lng, weight: 1 });
  }
  return Array.from(cells.values()).sort((a, b) => b.weight - a.weight);
}

/** Peso máximo de un conjunto de puntos de calor (para normalizar la intensidad). */
export function maxWeight(points: HeatPoint[]): number {
  return points.reduce((m, p) => (p.weight > m ? p.weight : m), 0);
}

function isFiniteCoord(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n);
}
