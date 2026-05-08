/**
 * Format price in Ethiopian Birr (ETB).
 *
 * @param price - Amount in ETB (number)
 * @returns Locale-formatted currency string (e.g. "Br 1,234,567")
 */
export function formatPrice(price: number): string {
  const n = typeof price === 'number' && Number.isFinite(price) ? Math.round(price) : 0;
  try {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(n);
  } catch {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETB',
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(n);
  }
}
