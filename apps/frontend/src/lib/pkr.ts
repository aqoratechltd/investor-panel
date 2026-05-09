// PKR amount utilities

/** Format a raw number string into comma-separated display value */
export function addCommas(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, '')
  if (!digits) return ''
  return parseInt(digits, 10).toLocaleString('en-PK')
}

/** Strip commas to get raw numeric string */
export function stripCommas(formatted: string): string {
  return formatted.replace(/,/g, '')
}

/** Convert a number to PKR words (lakh/crore system) */
export function pkrWords(n: number): string {
  if (!n || n <= 0) return ''
  if (n < 1_000)        return `${n.toLocaleString('en-PK')} rupees`
  if (n < 1_00_000)     return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 2).replace(/\.?0+$/, '')} thousand`
  if (n < 1_00_00_000)  return `${(n / 1_00_000).toFixed(n % 1_00_000 === 0 ? 0 : 2).replace(/\.?0+$/, '')} lakh`
  return `${(n / 1_00_00_000).toFixed(n % 1_00_00_000 === 0 ? 0 : 2).replace(/\.?0+$/, '')} crore`
}
