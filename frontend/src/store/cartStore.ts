// src/store/cartStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ProductRead } from '@/types/api';

export interface CartItem {
  product: ProductRead;
  quantity: number;
  variant_id?: string;
}

interface CartState {
  items: CartItem[];
  addItem: (product: ProductRead, quantity?: number, variant_id?: string) => void;
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
      addItem: (product, quantity = 1, variant_id) => {
        set((state) => {
          const existingItemIndex = state.items.findIndex(
            (item) => item.product.id === product.id && item.variant_id === variant_id
          );

          if (existingItemIndex > -1) {
            const updatedItems = [...state.items];
            updatedItems[existingItemIndex].quantity += quantity;
            return { items: updatedItems };
          }
          return { items: [...state.items, { product, quantity, variant_id }] };
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
        return get().items.reduce(
          (total, item) => total + item.product.price * item.quantity,
          0
        );
      },
    }),
    {
      name: 'armorify-cart-storage',
    }
  )
);
