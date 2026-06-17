import Constants from 'expo-constants';
import type {
  PaymentIntent,
  Product,
  Order,
  Vessel,
  ProvisioningRequest,
  Driver,
  Delivery,
} from '@frutigo/shared';

export interface DeliveryTracking {
  reference: string;
  status: string;
  driver: { name: string; vehicle: string } | null;
  lastLocation: { lat: number; lng: number; at: string } | null;
  dropoff: { lat: number; lng: number } | null;
  etaMinutes: number | null;
}

export interface LoyaltySummary {
  points: number;
  tier: string;
  tierLabelEs: string;
  tierLabelEn: string;
  perkDiscount: number;
  next: { next: string; remaining: number } | null;
}

export { API_BASE };

export interface CreateIntentRequest {
  orderId: string;
  method: string;
  cryptoAsset?: string;
  customerEmail?: string;
}

const API_BASE =
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ?? 'http://localhost:3000';

let authToken: string | null = null;
let refreshToken: string | null = null;
/** Callback para persistir tokens renovados (lo conecta el AppProvider con SecureStore). */
let onTokens: ((access: string | null, refresh: string | null) => void) | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}
export function getAccessToken(): string | null {
  return authToken;
}
export function setRefreshToken(token: string | null) {
  refreshToken = token;
}
export function setTokens(access: string | null, refresh: string | null) {
  authToken = access;
  refreshToken = refresh;
}
export function onTokensChanged(cb: (access: string | null, refresh: string | null) => void) {
  onTokens = cb;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  auth?: boolean;
  /** Interno: evita bucle de reintento tras refrescar. */
  _retry?: boolean;
}

/** Intenta renovar el access token con el refresh token. Devuelve true si lo logró. */
async function tryRefresh(): Promise<boolean> {
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { accessToken: string; refreshToken: string };
    authToken = data.accessToken;
    refreshToken = data.refreshToken;
    onTokens?.(authToken, refreshToken);
    return true;
  } catch {
    return false;
  }
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts.auth && authToken) headers.Authorization = `Bearer ${authToken}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  // Auto-renovación: si el access token expiró (401), refresca y reintenta una vez.
  if (res.status === 401 && opts.auth && !opts._retry && refreshToken) {
    if (await tryRefresh()) {
      return request<T>(path, { ...opts, _retry: true });
    }
    onTokens?.(null, null); // sesión inválida → limpiar
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(res.status, text || `API ${res.status}`);
  }
  return (await res.json()) as T;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

// --- Auth ---
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    segment: string;
    supplierId?: string | null;
  };
}

export const api = {
  base: API_BASE,

  register: (body: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    segment?: string;
  }) => request<AuthResponse>('/auth/register', { method: 'POST', body }),

  login: (body: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body }),

  // --- Catálogo ---
  products: (category?: string) =>
    request<Product[]>(`/products${category ? `?category=${category}` : ''}`),

  product: (id: string) => request<Product>(`/products/${id}`),

  recommended: (segment?: string) =>
    request<Product[]>(`/products/recommended${segment ? `?segment=${segment}` : ''}`),

  // --- Fidelización ---
  loyalty: () => request<LoyaltySummary>('/loyalty/me', { auth: true }),

  // --- Notificaciones push ---
  registerPushToken: (token: string) =>
    request<{ ok: boolean }>('/notifications/token', { method: 'POST', body: { token }, auth: true }),

  // --- Pedidos ---
  createOrder: (body: {
    segment: string;
    deliveryType: string;
    taxExempt: boolean;
    pointsToRedeem?: number;
    lines: { productId: string; unit: string; quantity: number }[];
  }) => request<Order>('/orders', { method: 'POST', body, auth: true }),

  myOrders: () => request<Order[]>('/orders/mine', { auth: true }),

  emailReceipt: (orderId: string, to?: string) =>
    request<{ sent: boolean; to: string }>(`/orders/${orderId}/receipt/email`, { method: 'POST', body: { to }, auth: true }),

  emailManifest: (requestId: string, to: string) =>
    request<{ sent: boolean; to: string }>(`/provisioning/requests/${requestId}/manifest/email`, { method: 'POST', body: { to }, auth: true }),

  // --- Pagos ---
  createPaymentIntent: (body: CreateIntentRequest) =>
    request<PaymentIntent>('/payments/intents', { method: 'POST', body, auth: true }),

  // --- Portal proveedor ---
  supplier: {
    dashboard: () =>
      request<SupplierDashboard>('/suppliers/me/dashboard', { auth: true }),
    products: () => request<Product[]>('/suppliers/me/products', { auth: true }),
    orders: () => request<Order[]>('/suppliers/me/orders', { auth: true }),
    createProduct: (body: unknown) =>
      request<Product>('/suppliers/me/products', { method: 'POST', body, auth: true }),
    updateProduct: (id: string, body: unknown) =>
      request<Product>(`/suppliers/me/products/${id}`, { method: 'PATCH', body, auth: true }),
    forecast: () => request<ForecastItem[]>('/suppliers/me/forecast', { auth: true }),
  },

  // --- Imágenes (Google Custom Search) ---
  searchImages: (q: string) =>
    request<ImageResult[]>(`/images/search?q=${encodeURIComponent(q)}`, { auth: true }),

  // --- Admin ---
  admin: {
    dashboard: () => request<AdminDashboard>('/admin/dashboard', { auth: true }),
    suppliers: () => request<AdminSupplier[]>('/admin/suppliers', { auth: true }),
    verifySupplier: (id: string, verified: boolean) =>
      request<unknown>(`/admin/suppliers/${id}/verify`, { method: 'PATCH', body: { verified }, auth: true }),
    payments: () => request<AdminPayment[]>('/admin/payments', { auth: true }),
  },

  // --- Repartidor / Entregas ---
  delivery: {
    registerDriver: (body: { name: string; vehicle: string; plate: string }) =>
      request<Driver>('/drivers/me', { method: 'POST', body, auth: true }),
    setDriverStatus: (body: { status: string; lat?: number; lng?: number }) =>
      request<Driver>('/drivers/me/status', { method: 'PATCH', body, auth: true }),
    mine: () => request<Delivery[]>('/deliveries/mine', { auth: true }),
    updateStatus: (id: string, status: string) =>
      request<Delivery>(`/deliveries/${id}/status`, { method: 'PATCH', body: { status }, auth: true }),
    pushLocation: (id: string, lat: number, lng: number) =>
      request<{ ok: boolean }>(`/deliveries/${id}/location`, { method: 'POST', body: { lat, lng }, auth: true }),
    track: (orderId: string) =>
      request<DeliveryTracking>(`/deliveries/track/${orderId}`, { auth: true }),
  },

  // --- Ship Provisioning ---
  provisioning: {
    vessels: () => request<Vessel[]>('/provisioning/vessels', { auth: true }),
    createVessel: (body: { name: string; imo: string; flag: string; agent: string }) =>
      request<Vessel>('/provisioning/vessels', { method: 'POST', body, auth: true }),
    requests: () => request<ProvisioningRequest[]>('/provisioning/requests', { auth: true }),
    createRequest: (body: unknown) =>
      request<ProvisioningRequest>('/provisioning/requests', { method: 'POST', body, auth: true }),
    manifest: (id: string) =>
      request<Manifest>(`/provisioning/requests/${id}/manifest`, { auth: true }),
  },
};

export interface Manifest {
  manifestRef: string;
  reference: string;
  issuedAt: string;
  vessel: { name: string; imo: string; flag: string; agent: string };
  port: string;
  deliveryWindow: { start: string; end: string };
  taxExempt: boolean;
  legalBasis: string;
  items: { product: string; unit: string; quantity: number }[];
  totalItems: number;
}

export interface SupplierDashboard {
  products: number;
  paidOrders: number;
  revenueUsd: number;
  lowStockProducts: number;
}

export interface ForecastItem {
  productId: string;
  nameEs: string;
  nameEn: string;
  history: number[];
  projectedNextPeriod: number;
  trendPerPeriod: number;
  confidence: number;
}

export interface ImageResult {
  url: string;
  thumbnail: string;
  title: string;
  source: 'google' | 'demo';
}

export interface AdminDashboard {
  suppliers: number;
  verifiedSuppliers: number;
  pendingSuppliers: number;
  products: number;
  totalOrders: number;
  paidOrders: number;
  gmvUsd: number;
  platformRevenueUsd: number;
}

export interface AdminSupplier {
  id: string;
  name: string;
  type: string;
  province: string;
  verified: boolean;
  ruc?: string | null;
  products: number;
}

export interface AdminPayment {
  id: string;
  method: string;
  status: string;
  amountUsd: number;
  reference: string;
  orderStatus: string;
  segment: string;
  createdAt: string;
}
