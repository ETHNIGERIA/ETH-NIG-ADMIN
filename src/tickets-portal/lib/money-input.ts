/** NGN form input (major) ↔ API minor units (kobo). */
export function nairaInputToMinor(value: string): number {
  const n = parseFloat(value.replace(/,/g, ''));
  if (Number.isNaN(n) || n < 0) return 0;
  return Math.round(n * 100);
}

export function minorToNairaInput(minor: number): string {
  if (minor === 0) return '0';
  return (minor / 100).toFixed(2);
}
