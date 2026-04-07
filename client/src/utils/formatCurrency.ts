export function formatRs(amount: number | string | undefined | null): string {
  const num = Number(amount) || 0;
  return `Rs. ${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
