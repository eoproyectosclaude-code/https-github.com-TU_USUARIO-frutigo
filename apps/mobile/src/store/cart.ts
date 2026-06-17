import { create } from 'zustand';
import {
  calcLineSubtotal,
  calcOrderTotals,
  priceForUnit,
  UNIT_DEFINITIONS,
  type OrderLine,
  type OrderTotals,
  type Product,
  type SaleUnit,
  type CustomerSegment,
  type DeliveryType,
  PRICING_CONFIG,
} from '@frutigo/shared';

export interface CartItem extends OrderLine {
  key: string; // productId + unit
  imageUrl: string;
}

interface CartState {
  items: CartItem[];
  segment: CustomerSegment;
  deliveryType: DeliveryType;
  /** Descuento por nivel FrutiGo Points del usuario (fracción). */
  loyaltyDiscountRate: number;
  setSegment: (s: CustomerSegment) => void;
  setDeliveryType: (d: DeliveryType) => void;
  setLoyaltyDiscount: (rate: number) => void;
  addItem: (product: Product, unit: SaleUnit, quantity?: number) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clear: () => void;
  count: () => number;
  totals: () => OrderTotals;
}

function deliveryCost(type: DeliveryType): number {
  switch (type) {
    case 'PIE_DE_MUELLE':
      return PRICING_CONFIG.delivery.maritimeUsd;
    case 'RETIRO':
      return 0;
    default:
      return PRICING_CONFIG.delivery.basicUsd;
  }
}

export const useCart = create<CartState>((set, get) => ({
  items: [],
  segment: 'B2C_HOGAR',
  deliveryType: 'DOMICILIO',
  loyaltyDiscountRate: 0,
  setSegment: (segment) => set({ segment }),
  setDeliveryType: (deliveryType) => set({ deliveryType }),
  setLoyaltyDiscount: (loyaltyDiscountRate) => set({ loyaltyDiscountRate }),

  addItem: (product, unit, quantity = 1) => {
    const price = priceForUnit(product, unit);
    if (!price) return;
    const key = `${product.id}:${unit}`;
    const existing = get().items.find((i) => i.key === key);
    if (existing) {
      get().updateQuantity(key, existing.quantity + quantity);
      return;
    }
    const line: CartItem = {
      key,
      productId: product.id,
      productNameEs: product.nameEs,
      productNameEn: product.nameEn,
      unit,
      quantity,
      unitPriceUsd: price.priceUsd,
      subtotalUsd: calcLineSubtotal(price.priceUsd, quantity),
      imageUrl: product.imageUrl,
    };
    set({ items: [...get().items, line] });
  },

  updateQuantity: (key, quantity) => {
    if (quantity <= 0) {
      get().removeItem(key);
      return;
    }
    set({
      items: get().items.map((i) =>
        i.key === key
          ? { ...i, quantity, subtotalUsd: calcLineSubtotal(i.unitPriceUsd, quantity) }
          : i,
      ),
    });
  },

  removeItem: (key) => set({ items: get().items.filter((i) => i.key !== key) }),
  clear: () => set({ items: [] }),
  count: () => get().items.reduce((n, i) => n + i.quantity, 0),

  totals: () => {
    const { items, segment, deliveryType, loyaltyDiscountRate } = get();
    return calcOrderTotals({
      lines: items,
      deliveryUsd: deliveryCost(deliveryType),
      taxExempt: segment === 'BUQUE_NAVIERA',
      loyaltyDiscountRate,
    });
  },
}));

export const unitLabel = (unit: SaleUnit, locale: 'es' | 'en') =>
  locale === 'es' ? UNIT_DEFINITIONS[unit].labelEs : UNIT_DEFINITIONS[unit].labelEn;
