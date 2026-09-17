import Link from 'next/link';
import { toQuery } from '@/tickets-portal/lib/list-params';

const linkClass = 'rounded-md border border-stone-200 px-3 py-1.5 hover:bg-stone-50';
const disabledClass = 'rounded-md px-3 py-1.5 text-stone-300';

/** URL-driven Previous/Next pagination. Preserves the other query params (e.g. status). */
export function Pagination({
  basePath,
  page,
  limit,
  total,
  params = {},
}: {
  basePath: string;
  page: number;
  limit: number;
  total: number;
  params?: Record<string, string | undefined>;
}) {
  const pages = Math.max(1, Math.ceil(total / limit));
  if (pages <= 1 && page <= 1) return null;
  const href = (p: number) => `${basePath}${toQuery({ ...params, page: p > 1 ? p : undefined })}`;

  return (
    <div className="flex items-center justify-between gap-4 text-[14px] text-stone-600">
      <span>
        Page {page} of {pages}
      </span>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link href={href(Math.min(page - 1, pages))} className={linkClass}>
            Previous
          </Link>
        ) : (
          <span className={disabledClass}>Previous</span>
        )}
        {page < pages ? (
          <Link href={href(page + 1)} className={linkClass}>
            Next
          </Link>
        ) : (
          <span className={disabledClass}>Next</span>
        )}
      </div>
    </div>
  );
}
