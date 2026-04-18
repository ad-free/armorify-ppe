// src/store/cartStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ProductRead } from '@/types/api';

export interface CartItem {
  product: ProductRead;
  quantity: number;
  variant_id?: string;
  /** Line unit price (variant override or negotiated); falls back to `product.price` if omitted. */
  unit_price?: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: ProductRead, quantity?: number, variant_id?: string, unit_price?: number) => void;
  removeItem: (product_id: string, variant_id?: string) => void;
  updateQuantity: (product_id: string, quantity: number, variant_id?: string) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, quantity = 1, variant_id, unit_price) => {
        set((state) => {
          const linePrice = unit_price ?? product.price;
          const existingItemIndex = state.items.findIndex(
            (item) => item.product.id === product.id && item.variant_id === variant_id
          );

          if (existingItemIndex > -1) {
            const updatedItems = [...state.items];
            updatedItems[existingItemIndex].quantity += quantity;
            updatedItems[existingItemIndex].unit_price = linePrice;
            return { items: updatedItems };
          }
          return { items: [...state.items, { product, quantity, variant_id, unit_price: linePrice }] };
        });
      },
      removeItem: (product_id, variant_id) => {
        set((state) => ({
          items: state.items.filter(
            (item) => !(item.product.id === product_id && item.variant_id === variant_id)
          ),
        }));
      },
      updateQuantity: (product_id, quantity, variant_id) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.product.id === product_id && item.variant_id === variant_id
              ? { ...item, quantity: Math.max(1, quantity) }
              : item
          ),
        }));
      },
      clearCart: () => set({ items: [] }),
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
      getTotalPrice: () => {
        return get().items.reduce((total, item) => {
          const unit = item.unit_price ?? item.product.price;
          return total + unit * item.quantity;
        }, 0);
      },
    }),
    {
      name: 'armorify-cart-storage',
    }
  )
);
