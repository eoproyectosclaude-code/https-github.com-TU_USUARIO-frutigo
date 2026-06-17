/**
 * Predicción de demanda simple para proveedores.
 * Combina una media móvil con una tendencia lineal ligera sobre el histórico
 * de cantidades vendidas por período. Determinista y sin dependencias.
 */
export interface DemandForecast {
  /** Cantidad estimada para el próximo período. */
  nextPeriod: number;
  /** Media móvil de los últimos períodos. */
  movingAverage: number;
  /** Tendencia por período (positiva = creciendo). */
  trendPerPeriod: number;
  /** Confianza heurística 0..1 según cantidad de datos. */
  confidence: number;
}

/**
 * @param history Cantidades por período en orden cronológico (antiguo → reciente).
 * @param window  Tamaño de la ventana de media móvil (por defecto 3).
 */
export function forecastDemand(history: number[], window = 3): DemandForecast {
  const data = history.filter((n) => Number.isFinite(n) && n >= 0);
  if (data.length === 0) {
    return { nextPeriod: 0, movingAverage: 0, trendPerPeriod: 0, confidence: 0 };
  }

  const w = Math.max(1, Math.min(window, data.length));
  const recent = data.slice(-w);
  const movingAverage = round2(recent.reduce((s, n) => s + n, 0) / w);

  // Tendencia: pendiente por mínimos cuadrados sobre todo el histórico.
  const trendPerPeriod = round2(slope(data));

  // Proyección: media móvil + media tendencia, nunca negativa.
  const nextPeriod = Math.max(0, Math.round(movingAverage + trendPerPeriod));

  // Confianza crece con el número de períodos (satura ~12).
  const confidence = round2(Math.min(1, data.length / 12));

  return { nextPeriod, movingAverage, trendPerPeriod, confidence };
}

/** Pendiente de regresión lineal simple (x = índice del período). */
function slope(ys: number[]): number {
  const n = ys.length;
  if (n < 2) return 0;
  const xs = ys.map((_, i) => i);
  const sx = xs.reduce((a, b) => a + b, 0);
  const sy = ys.reduce((a, b) => a + b, 0);
  const sxy = xs.reduce((a, x, i) => a + x * ys[i]!, 0);
  const sxx = xs.reduce((a, x) => a + x * x, 0);
  const denom = n * sxx - sx * sx;
  if (denom === 0) return 0;
  return (n * sxy - sx * sy) / denom;
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
