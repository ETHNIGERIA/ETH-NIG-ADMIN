'use client';

import Link from 'next/link';
import { useActionState, useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  createCommunityAction,
  deleteCommunityAction,
  updateCommunityAction,
  type CommunityActionState,
} from '@/tickets-portal/actions/communities';
import type { AdminCommunity } from '@/tickets-portal/types/admin-communities';

const fieldClass =
  'w-full rounded-md border border-stone-200 bg-white px-3 py-2.5 text-[15px] text-stone-900 outline-none focus:border-stone-300 focus:ring-2 focus:ring-stone-900/10';
const labelClass = 'mb-1.5 block text-[13px] font-medium text-stone-700';

function ActionError({ state }: { state: CommunityActionState }) {
  if (!state?.error) return null;
  return (
    <p className="rounded-md border border-red-200 bg-red-50/90 px-3 py-2 text-[13px] text-red-900">
      {state.error}
    </p>
  );
}

export function CommunitiesManager({ communities }: { communities: AdminCommunity[] }) {
  const router = useRouter();
  const [pendingDel, startDel] = useTransition();
  const [editId, setEditId] = useState<string | null>(null);
  const [createKey, setCreateKey] = useState(0);

  const [cState, cAction] = useActionState(createCommunityAction, undefined);
  const [uState, uAction] = useActionState(updateCommunityAction, undefined);

  useEffect(() => {
    if (cState?.ok) {
      setCreateKey((k) => k + 1);
      router.refresh();
    }
  }, [cState?.ok, router]);

  useEffect(() => {
    if (uState?.ok) {
      setEditId(null);
      router.refresh();
    }
  }, [uState?.ok, router]);

  const editing = editId ? communities.find((x) => x._id === editId) : undefined;
  const th = 'px-4 py-3 text-left text-[12px] font-medium text-stone-400';
  const td = 'px-4 py-3 text-[14px] text-stone-700';
  const wrap =
    'overflow-x-auto overflow-hidden rounded-lg border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]';

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h2 className="text-[15px] font-semibold text-stone-900">Add community</h2>
        <ActionError state={cState} />
        <form key={createKey} action={cAction} className="grid gap-4 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <div>
            <label className={labelClass} htmlFor="com-name">
              Name
            </label>
            <input id="com-name" name="name" required className={fieldClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="com-desc">
              Description (optional)
            </label>
            <textarea id="com-desc" name="description" rows={2} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="com-region">
              Region (optional)
            </label>
            <input id="com-region" name="region" className={fieldClass} />
          </div>
          <button
            type="submit"
            className="w-fit rounded-md bg-stone-900 px-4 py-2.5 text-[14px] font-medium text-white hover:bg-stone-800"
          >
            Create
          </button>
        </form>
      </section>

      {editing ? (
        <section className="space-y-4 rounded-lg border border-stone-300 bg-stone-50/80 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[15px] font-semibold text-stone-900">Edit {editing.name}</h2>
            <button
              type="button"
              onClick={() => setEditId(null)}
              className="text-[13px] font-medium text-stone-600 hover:text-stone-900"
            >
              Cancel
            </button>
          </div>
          <ActionError state={uState} />
          <form action={uAction} className="grid gap-4">
            <input type="hidden" name="communityId" value={editing._id} />
            <div>
              <label className={labelClass}>Name</label>
              <input name="name" required defaultValue={editing.name} className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}>Description</label>
              <textarea name="description" rows={2} defaultValue={editing.description ?? ''} className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}>Region</label>
              <input name="region" defaultValue={editing.region ?? ''} className={fieldClass} />
            </div>
            <button
              type="submit"
              className="w-fit rounded-md bg-stone-900 px-4 py-2.5 text-[14px] font-medium text-white hover:bg-stone-800"
            >
              Save
            </button>
          </form>
        </section>
      ) : null}

      <section className={wrap}>
        <table className="w-full min-w-[560px]">
          <thead>
            <tr className="border-b border-stone-100">
              <th className={th}>Name</th>
              <th className={`${th} hidden sm:table-cell`}>Region</th>
              <th className={`${th} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {communities.length === 0 ? (
              <tr>
                <td colSpan={3} className={`${td} py-14 text-center text-stone-400`}>
                  No communities yet.
                </td>
              </tr>
            ) : (
              communities.map((c) => (
                <tr key={c._id} className="border-b border-stone-100 last:border-0">
                  <td className={`${td} font-medium text-stone-900`}>{c.name}</td>
                  <td className={`${td} hidden text-[13px] text-stone-600 sm:table-cell`}>{c.region ?? '—'}</td>
                  <td className={`${td} whitespace-nowrap text-right`}>
                    <Link
                      href={`/tickets-command/communities/${c._id}/promo-codes`}
                      className="mr-3 text-[13px] font-medium text-stone-800 underline-offset-4 hover:underline"
                    >
                      Promo codes
                    </Link>
                    <button
                      type="button"
                      onClick={() => setEditId(c._id)}
                      className="mr-3 text-[13px] font-medium text-stone-800 underline-offset-4 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={pendingDel}
                      className="text-[13px] font-medium text-red-800 underline-offset-4 hover:underline disabled:opacity-50"
                      onClick={() => {
                        if (!window.confirm(`Delete community “${c.name}”?`)) return;
                        const fd = new FormData();
                        fd.set('communityId', c._id);
                        startDel(async () => {
                          const r = await deleteCommunityAction(undefined, fd);
                          if (r?.error) window.alert(r.error);
                          else router.refresh();
                        });
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
