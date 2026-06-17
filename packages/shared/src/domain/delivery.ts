/** Coordenada geográfica. */
export interface LatLng {
  lat: number;
  lng: number;
}

export type DriverStatus = 'DISPONIBLE' | 'EN_RUTA' | 'INACTIVO';

export type VehicleType = 'MOTO' | 'AUTO' | 'VAN' | 'CAMION';

export interface Driver {
  id: string;
  userId: string;
  name: string;
  vehicle: VehicleType;
  plate: string;
  status: DriverStatus;
  location?: LatLng;
  lastSeenAt?: string;
}

/**
 * Estados de una entrega. Máquina de estados:
 *   ASIGNADO → RECOGIDO → EN_RUTA → ENTREGADO
 *   cualquiera (menos ENTREGADO) → FALLIDO
 */
export type DeliveryStatus =
  | 'ASIGNADO'
  | 'RECOGIDO'
  | 'EN_RUTA'
  | 'ENTREGADO'
  | 'FALLIDO';

const TRANSITIONS: Record<DeliveryStatus, DeliveryStatus[]> = {
  ASIGNADO: ['RECOGIDO', 'FALLIDO'],
  RECOGIDO: ['EN_RUTA', 'FALLIDO'],
  EN_RUTA: ['ENTREGADO', 'FALLIDO'],
  ENTREGADO: [],
  FALLIDO: [],
};

/** Estados a los que se puede avanzar desde el actual. */
export function nextStatuses(current: DeliveryStatus): DeliveryStatus[] {
  return TRANSITIONS[current];
}

/** ¿Es válida la transición current → next? */
export function canAdvance(current: DeliveryStatus, next: DeliveryStatus): boolean {
  return TRANSITIONS[current].includes(next);
}

/** Estado terminal (no admite más cambios). */
export function isTerminal(status: DeliveryStatus): boolean {
  return TRANSITIONS[status].length === 0;
}

export interface DeliveryLocationPing {
  lat: number;
  lng: number;
  at: string;
}

export interface Delivery {
  id: string;
  orderId: string;
  orderReference: string;
  driverId?: string;
  status: DeliveryStatus;
  pickupAddress: string;
  dropoffAddress: string;
  dropoff?: LatLng;
  lastLocation?: DeliveryLocationPing;
  createdAt: string;
}

const EARTH_RADIUS_KM = 6371;
const toRad = (deg: number): number => (deg * Math.PI) / 180;

/**
 * Distancia en kilómetros entre dos coordenadas (fórmula de Haversine).
 * Precisa para distancias urbanas de reparto.
 */
export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * ETA en minutos según distancia y velocidad promedio (km/h).
 * Por defecto 25 km/h (tráfico urbano de Ciudad de Panamá).
 */
export function etaMinutes(from: LatLng, to: LatLng, avgSpeedKmh = 25): number {
  if (avgSpeedKmh <= 0) return Infinity;
  const km = haversineKm(from, to);
  return Math.round((km / avgSpeedKmh) * 60);
}
