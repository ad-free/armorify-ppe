import { useEffect } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { quoteCart } from '@/api/order';
import { useCartStore } from '@/store/cartStore';
import { canSubmitQuote } from '@/components/order/checkoutRecovery';

export function useCartQuote(enabled = true) {
  const cartItems = useCartStore((state) => state.items);
  const applyQuote = useCartStore((state) => state.applyQuote);
  const items = cartItems.map((item) => ({ product_id: item.product.id, variant_id: item.variant_id ?? null, quantity: item.quantity }));
  const query = useQuery({
    queryKey: ['cart-quote', items],
    queryFn: () => quoteCart(items),
    enabled: enabled && items.length > 0,
    retry: false,
    placeholderData: keepPreviousData,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: 'always',
  });
  const { refetch } = query;
  useEffect(() => {
    if (enabled && query.data && !query.isFetching && !query.isError) applyQuote(query.data.items);
  }, [enabled, query.data, query.isFetching, query.isError, applyQuote]);
  // TanStack's focus manager uses visibilitychange; also honor literal window focus.
  useEffect(() => {
    if (!enabled || !items.length) return;
    const onFocus = () => { void refetch(); };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [enabled, items.length, refetch]);
  return { ...query, requestItems: items, canCheckout: enabled && !query.isPlaceholderData && canSubmitQuote(query.data, query.isFetching || query.isPending, query.isError) };
}
