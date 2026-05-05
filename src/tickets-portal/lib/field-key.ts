/**
 * API field keys: lowercase, stable, unique per event. Derived from the human label
 * so admins do not have to name keys by hand.
 */
export function fieldKeyFromLabel(label: string): string {
  const s = label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');
  return s || 'field';
}
