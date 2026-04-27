import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProductRead } from '@/types/api';

interface WishlistState {
  items: ProductRead[];
  addItem: (product: ProductRead) => void;
  removeItem: (productId: string) => void;
  toggleItem: (product: ProductRead) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product) => {
        const { items } = get();
        if (!items.find((i) => i.id === product.id)) {
          set({ items: [...items, product] });
        }
      },
      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.id !== productId) });
      },
      toggleItem: (product) => {
        const { items } = get();
        if (items.find((i) => i.id === product.id)) {
          set({ items: items.filter((i) => i.id !== product.id) });
        } else {
          set({ items: [...items, product] });
        }
      },
      isInWishlist: (productId) => {
        return get().items.some((i) => i.id === productId);
      },
      clearWishlist: () => set({ items: [] }),
    }),
    {
      name: 'armorify-wishlist',
    }
  )
);
