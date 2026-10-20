import { unstable_rethrow } from 'next/navigation';
import { AdminInviteForm } from '@/tickets-portal/components/admins/AdminManagementForms';
import Link from 'next/link';
import { ticketsApiGet } from '@/tickets-portal/lib/tickets-api.server';
import { normalizeDocumentId } from '@/tickets-portal/lib/mongo-json';
import type { Paginated } from '@/tickets-portal/types/admin-events';
import type { AdminAccount } from '@/tickets-portal/types/admin-accounts';

function fmt(iso?: string) {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('en-NG', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function Badge({ active }: { active: boolean }) {
  return (
    <span
      className={`rounded-md px-2 py-0.5 text-[12px] font-medium ${
        active ? 'bg-emerald-50 text-emerald-800' : 'bg-stone-100 text-stone-700'
      }`}
    >
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

const tableWrap =
  'overflow-hidden rounded-lg border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]';
const th = 'px-4 py-3 text-left text-[12px] font-medium text-stone-400';
const td = 'px-4 py-3 text-[14px] text-stone-700';
const rowHover = 'transition-colors hover:bg-stone-50/90';

export default async function AdminsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const limit = 20;

  let result: Paginated<AdminAccount>;
  try {
    const me = await ticketsApiGet<AdminAccount>('/admin/admins/me');
    if (!me.canManageAdmins) return <div className="rounded-lg border border-stone-200 bg-white p-6"><h1 className="text-xl font-semibold text-stone-900">Administrator accounts</h1><p className="mt-2 text-stone-600">Your account does not have permission to manage administrators. Ask an account manager for access.</p></div>;
    result = await ticketsApiGet<Paginated<AdminAccount>>(`/admin/admins?page=${page}&limit=${limit}`);
  } catch (e) {
    unstable_rethrow(e);
    const message = e instanceof Error ? e.message : 'Failed to load admins';
    return (
      <div className="rounded-lg border border-red-200 bg-red-50/90 px-6 py-5 text-red-900">
        <p className="font-semibold">Could not load admin accounts</p>
        <p className="mt-2 text-[14px]">{message}</p>
      </div>
    );
  }

  const { data: admins, pages, total } = result;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <header className="space-y-1">
          <h1 className="text-[28px] font-semibold tracking-tight text-stone-900">Admins</h1>
          <p className="text-[15px] text-stone-500">
            {total === 0 ? 'No admin accounts yet.' : `${total} admin${total === 1 ? '' : 's'}`}
          </p>
        </header>
      </div>

      <AdminInviteForm />
      <Link href="/tickets-command/admins/audit" className="inline-block text-sm text-stone-700 underline">View account audit log</Link>
      <div className={tableWrap}>
        <table className="w-full min-w-[420px]">
          <thead>
            <tr className="border-b border-stone-100">
              <th className={th}>Email</th>
              <th className={th}>Name</th>
              <th className={th}>Status</th>
              <th className={`${th} hidden md:table-cell`}>Joined</th>
            </tr>
          </thead>
          <tbody>
            {admins.length === 0 ? (
              <tr>
                <td colSpan={4} className={`${td} py-16 text-center text-stone-400`}>
                  No admin accounts available.
                </td>
              </tr>
            ) : (
              admins.map((admin) => {
                const id = normalizeDocumentId(admin._id);
                return (
                  <tr key={id} className={`border-b border-stone-100 last:border-0 ${rowHover}`}>
                    <td className={`${td} font-medium text-stone-900`}>
                      <Link href={`/tickets-command/admins/${id}`} className="hover:underline">
                        {admin.email}
                      </Link>
                    </td>
                    <td className={td}>{admin.name || '—'}</td>
                    <td className={td}>
                      {admin.status === 'pending' ? <span className="rounded bg-amber-50 px-2 py-1 text-xs text-amber-800">{admin.expiresAt && new Date(admin.expiresAt) < new Date() ? 'Invitation expired' : 'Invitation pending'}</span> : <><Badge active={admin.isActive} />{admin.canManageAdmins ? <span className="ml-2 text-xs text-stone-500">Account manager</span> : null}</>}
                    </td>
                    <td className={`${td} hidden text-[13px] text-stone-500 md:table-cell`}>
                      {fmt(admin.createdAt)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 ? (
        <div className="flex items-center justify-between gap-4 text-[14px] text-stone-600">
          <span>
            Page {page} of {pages}
          </span>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link
                href={`/tickets-command/admins?page=${page - 1}`}
                className="rounded-md border border-stone-200 px-3 py-1.5 hover:bg-stone-50"
              >
                Previous
              </Link>
            ) : (
              <span className="rounded-md px-3 py-1.5 text-stone-300">Previous</span>
            )}
            {page < pages ? (
              <Link
                href={`/tickets-command/admins?page=${page + 1}`}
                className="rounded-md border border-stone-200 px-3 py-1.5 hover:bg-stone-50"
              >
                Next
              </Link>
            ) : (
              <span className="rounded-md px-3 py-1.5 text-stone-300">Next</span>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
