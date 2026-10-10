// src/store/cartStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProductRead, QuoteItem } from '@/types/api';

export interface CartItem {
  product: ProductRead;
  quantity: number;
  variant_id?: string;
  /** Last observed price for display/change notices only; never submitted as authority. */
  unit_price?: number;
}

interface CartState {
  items: CartItem[];
  revision: string;
  priceChanges: Record<string, { previous: number; current: number }>;
  applyQuote: (lines: QuoteItem[]) => void;
  dismissPriceChanges: () => void;
  addItem: (product: ProductRead, quantity?: number, variant_id?: string, unit_price?: number) => void;
  removeItem: (product_id: string, variant_id?: string) => void;
  updateQuantity: (product_id: string, quantity: number, variant_id?: string) => void;
  clearCart: (expectedRevision?: string) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      priceChanges: {},
      revision: crypto.randomUUID(),
      applyQuote: (lines) => set((state) => {
        const priceChanges = { ...state.priceChanges };
        let changed = false;
        const items = state.items.map((item) => {
          const line = lines.find((line) => line.product_id === item.product.id && line.variant_id === (item.variant_id ?? null));
          if (!line || line.unit_price === null) return item;
          const previous = item.unit_price ?? (item.product.flash_sale_price ? Number(item.product.flash_sale_price) : item.product.price);
          const current = Number(line.unit_price);
          if (previous === current) return item;
          changed = true;
          const key = `${item.product.id}:${item.variant_id ?? ''}`;
          priceChanges[key] = { previous: priceChanges[key]?.previous ?? previous, current };
          return { ...item, unit_price: current };
        });
        return changed ? { items, priceChanges } : state;
      }),
      dismissPriceChanges: () => set({ priceChanges: {} }),
      addItem: (product, quantity = 1, variant_id, unit_price) => {
        set((state) => {
          const linePrice = unit_price ?? (product.flash_sale_price ? Number(product.flash_sale_price) : product.price);
          const existingItemIndex = state.items.findIndex(
            (item) => item.product.id === product.id && item.variant_id === variant_id
          );

          if (existingItemIndex > -1) {
            const updatedItems = [...state.items];
            updatedItems[existingItemIndex].quantity += quantity;
            updatedItems[existingItemIndex].unit_price = linePrice;
            return { items: updatedItems, revision: crypto.randomUUID() };
          }
          return { items: [...state.items, { product, quantity, variant_id, unit_price: linePrice }], revision: crypto.randomUUID() };
        });
      },
      removeItem: (product_id, variant_id) => {
        set((state) => {
          const priceChanges = { ...state.priceChanges };
          delete priceChanges[`${product_id}:${variant_id ?? ''}`];
          return {
            items: state.items.filter((item) => !(item.product.id === product_id && item.variant_id === variant_id)),
            priceChanges,
            revision: crypto.randomUUID(),
          };
        });
      },
      updateQuantity: (product_id, quantity, variant_id) => {
        if (!Number.isInteger(quantity) || quantity < 1) return;
        set((state) => ({
          items: state.items.map((item) =>
            item.product.id === product_id && item.variant_id === variant_id
              ? { ...item, quantity }
              : item
          ),
          revision: crypto.randomUUID(),
        }));
      },
      clearCart: (expectedRevision) => {
        if (expectedRevision !== undefined) {
          // ponytail: retain changed carts wholesale; reconcile lines only if automatic cleanup is required.
          if (get().revision !== expectedRevision) return;
          try {
            const saved = JSON.parse(localStorage.getItem('armorify-cart-storage') ?? 'null');
            if (saved?.state?.revision !== expectedRevision) return;
          } catch {
            return;
          }
        }
        set({ items: [], priceChanges: {}, revision: crypto.randomUUID() });
      },
    }),
    {
      name: 'armorify-cart-storage',
      version: 1,
      migrate: (saved) => ({ ...(saved as CartState), revision: crypto.randomUUID() }),
    }
  )
);
