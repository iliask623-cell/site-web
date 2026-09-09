export function formatDzd(amount: number, lang: string): string {
  const rounded = Math.round(amount)
  const numeral = new Intl.NumberFormat(lang === 'ar' ? 'ar-DZ' : 'fr-DZ').format(rounded)
  return lang === 'ar' ? `${numeral} دج` : `${numeral} DA`
}

export function discountPercent(original: number, discounted: number): number {
  if (original <= 0) return 0
  return Math.round((1 - discounted / original) * 100)
}
