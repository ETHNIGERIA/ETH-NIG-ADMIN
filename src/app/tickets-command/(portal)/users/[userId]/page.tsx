import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ticketsApiGet } from '@/tickets-portal/lib/tickets-api.server';
import { normalizeDocumentId } from '@/tickets-portal/lib/mongo-json';
import type { AdminUser } from '@/tickets-portal/types/admin-users';
import { UserDetailActions } from '@/tickets-portal/components/users/UserDetailActions';

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

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  let raw: AdminUser;
  try {
    raw = await ticketsApiGet<AdminUser>(`/admin/users/${userId}`);
  } catch {
    notFound();
  }

  const user = { ...raw, _id: normalizeDocumentId(raw._id) };
  const id = normalizeDocumentId(user._id);

  return (
    <div className="space-y-8">
      <div>
        <Link href="/tickets-command/users" className="text-[14px] text-stone-600 hover:text-stone-900">
          ← Users
        </Link>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <h1 className="text-[28px] font-semibold tracking-tight text-stone-900">{user.email}</h1>
          <Badge active={user.isActive} />
        </div>
        <p className="mt-2 text-[15px] text-stone-500">Admin user profile and account controls.</p>
      </div>

      <div className="rounded-lg border border-stone-200/90 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <dl className="grid gap-5 sm:grid-cols-2">
          <div>
            <dt className="text-[12px] font-medium uppercase tracking-wide text-stone-400">Email</dt>
            <dd className="mt-1 text-[15px] text-stone-900">{user.email}</dd>
          </div>
          <div>
            <dt className="text-[12px] font-medium uppercase tracking-wide text-stone-400">Name</dt>
            <dd className="mt-1 text-[15px] text-stone-900">{user.name || '—'}</dd>
          </div>
          <div>
            <dt className="text-[12px] font-medium uppercase tracking-wide text-stone-400">Joined</dt>
            <dd className="mt-1 text-[15px] text-stone-900">{fmt(user.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-[12px] font-medium uppercase tracking-wide text-stone-400">Updated</dt>
            <dd className="mt-1 text-[15px] text-stone-900">{fmt(user.updatedAt)}</dd>
          </div>
        </dl>

        <div className="mt-8 border-t border-stone-200 pt-6">
          <h2 className="text-[15px] font-semibold text-stone-900">Account actions</h2>
          <p className="mt-1 text-[14px] text-stone-500">
            Toggle whether this admin account can sign in to the tickets app.
          </p>
          <div className="mt-4">
            <UserDetailActions userId={id} isActive={user.isActive} />
          </div>
        </div>
      </div>
    </div>
  );
}
