/** Normalize Mongo-style `_id` from JSON (string or `{ $oid }`). */
export function normalizeDocumentId(raw: unknown): string {
  if (typeof raw === 'string') return raw;
  if (raw && typeof raw === 'object' && '$oid' in raw && typeof (raw as { $oid: string }).$oid === 'string') {
    return (raw as { $oid: string }).$oid;
  }
  return String(raw);
}
