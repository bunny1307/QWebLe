export function calculateTotals(subtotal: number, taxPercentage: number) {
  const tax = Math.round(subtotal * taxPercentage) / 100;
  const total = Number((subtotal + tax).toFixed(2));
  return { tax, total };
}
