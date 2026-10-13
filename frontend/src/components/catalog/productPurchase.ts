import type { ProductRead, ProductVariantRead } from '@/types/api';

export function variantLabel(variant: ProductVariantRead): string {
  const attributes = Object.entries(variant.attributes ?? {}).flatMap(([key, value]) => {
    if (value == null || value === '') return [];
    return [`${key.replace(/_/g, ' ')}: ${typeof value === 'object' ? JSON.stringify(value) : String(value)}`];
  });
  return [variant.size, variant.color, ...attributes, variant.sku].filter(Boolean).join(' · ');
}

export function purchaseState(product: ProductRead, variants: ProductVariantRead[] | undefined, selectedId: string, quantity: number, cartQuantity: number, now: number) {
  const variant = variants?.find((item) => item.id === selectedId && item.product_id === product.id && item.is_active) ?? null;
  const complete = variants !== undefined && (product.has_variants ? variant !== null : variants.length === 0 && !selectedId);
  const stock = complete ? (variant?.available_stock ?? product.available_stock) : 0;
  const remaining = Math.max(0, stock - cartQuantity);
  let price = Number(variant?.price_override ?? product.price);
  const saleActive = product.is_flash_deal && !!product.flash_deal_end && Date.parse(product.flash_deal_end) > now;
  // Percentage campaigns also supply a base-product sale price; discount the selected variant instead.
  if (saleActive) {
    if (product.flash_sale_discount) price *= 1 - product.flash_sale_discount / 100;
    else if (product.flash_sale_price != null) price = Number(product.flash_sale_price);
  }
  const priceValid = Number.isFinite(price) && price >= 0;
  return { variant, complete, stock, remaining, price, priceValid,
    canPurchase: complete && priceValid && Number.isInteger(quantity) && quantity > 0 && quantity <= remaining };
}
