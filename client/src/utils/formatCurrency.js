/**
 * Format a number as Nepali Rupees (Rs.)
 * Usage: formatRs(1234.5) → "Rs. 1,234.50"
 */
export function formatRs(amount) {
  const num = Number(amount) || 0;
  return `Rs. ${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
