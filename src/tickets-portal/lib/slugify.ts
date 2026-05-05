/**
 * Match ticketsethng event slug: `^[a-z0-9]+(?:-[a-z0-9]+)*$`
 * Collapses runs of invalid chars to a single hyphen; trims edges.
 */
export function slugifyFromTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}
