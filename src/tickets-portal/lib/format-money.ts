const NGN = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** Amounts from the API are in minor units (e.g. kobo). */
export function formatMinorToNgn(minor: number): string {
  return NGN.format(minor / 100);
}
