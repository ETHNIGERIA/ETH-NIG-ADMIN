import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ticketsApiGet } from '@/tickets-portal/lib/tickets-api.server';
import { normalizeDocumentId } from '@/tickets-portal/lib/mongo-json';
import type { AdminAccount } from '@/tickets-portal/types/admin-accounts';
import { AdminDetailActions } from '@/tickets-portal/components/admins/AdminDetailActions';

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

export default async function AdminDetailPage({
  params,
}: {
  params: Promise<{ adminId: string }>;
}) {
  const { adminId } = await params;

  let raw: AdminAccount;
  try {
    raw = await ticketsApiGet<AdminAccount>(`/admin/admins/${adminId}`);
  } catch {
    notFound();
  }

  const admin = { ...raw, _id: normalizeDocumentId(raw._id) };
  const id = normalizeDocumentId(admin._id);

  return (
    <div className="space-y-8">
      <div>
        <Link href="/tickets-command/admins" className="text-[14px] text-stone-600 hover:text-stone-900">
          ← Admins
        </Link>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <h1 className="text-[28px] font-semibold tracking-tight text-stone-900">{admin.email}</h1>
          <Badge active={admin.isActive} />
        </div>
        <p className="mt-2 text-[15px] text-stone-500">Admin account profile and access controls.</p>
      </div>

      <div className="rounded-lg border border-stone-200/90 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <dl className="grid gap-5 sm:grid-cols-2">
          <div>
            <dt className="text-[12px] font-medium uppercase tracking-wide text-stone-400">Email</dt>
            <dd className="mt-1 text-[15px] text-stone-900">{admin.email}</dd>
          </div>
          <div>
            <dt className="text-[12px] font-medium uppercase tracking-wide text-stone-400">Name</dt>
            <dd className="mt-1 text-[15px] text-stone-900">{admin.name || '—'}</dd>
          </div>
          <div>
            <dt className="text-[12px] font-medium uppercase tracking-wide text-stone-400">Joined</dt>
            <dd className="mt-1 text-[15px] text-stone-900">{fmt(admin.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-[12px] font-medium uppercase tracking-wide text-stone-400">Updated</dt>
            <dd className="mt-1 text-[15px] text-stone-900">{fmt(admin.updatedAt)}</dd>
          </div>
        </dl>

        <div className="mt-8 border-t border-stone-200 pt-6">
          <h2 className="text-[15px] font-semibold text-stone-900">Account actions</h2>
          <p className="mt-1 text-[14px] text-stone-500">
            Toggle whether this admin account can sign in to the tickets app.
          </p>
          <div className="mt-4">
            <AdminDetailActions adminId={id} isActive={admin.isActive} />
          </div>
        </div>
      </div>
    </div>
  );
}
