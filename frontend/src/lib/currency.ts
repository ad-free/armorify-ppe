/**
 * Utility for formatting currency across the Armorify application.
 * Supports multiple currencies and locales.
 */

export type CurrencyCode = 'VND' | 'USD' | 'EUR';

interface FormatOptions {
  currency?: CurrencyCode;
  locale?: string;
  showSymbol?: boolean;
}

export const formatCurrency = (
  amount: number | string | null | undefined,
  options: FormatOptions = {}
): string => {
  if (amount === null || amount === undefined || amount === '') return '0';
  
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numericAmount)) return '0';

  const {
    currency = 'VND',
    locale = currency === 'VND' ? 'vi-VN' : 'en-US',
    showSymbol = true
  } = options;

  try {
    const formatter = new Intl.NumberFormat(locale, {
      style: showSymbol ? 'currency' : 'decimal',
      currency: currency,
      maximumFractionDigits: currency === 'VND' ? 0 : 2,
    });

    return formatter.format(numericAmount);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return numericAmount.toString();
  }
};

/**
 * Clean a formatted string back to a numeric value.
 */
export const parseCurrency = (value: string): number => {
  const cleanedValue = value.replace(/[^0-9.-]+/g, '');
  const num = parseFloat(cleanedValue);
  return isNaN(num) ? 0 : num;
};
