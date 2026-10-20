import Link from 'next/link';
import { ticketsApiGet } from '@/tickets-portal/lib/tickets-api.server';
import type { Paginated } from '@/tickets-portal/types/admin-events';
type Entry = { _id: string; actorId: string; targetId: string; action: string; changes?: Record<string, unknown>; createdAt: string };
export default async function AdminAuditPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: raw } = await searchParams;
  const page = Math.max(1, parseInt(raw ?? '1', 10) || 1);
  const result = await ticketsApiGet<Paginated<Entry>>(`/admin/admins/audit?page=${page}&limit=30`);
  return <div className="space-y-5"><Link href="/tickets-command/admins" className="text-sm underline">Back to administrators</Link><h1 className="text-2xl font-semibold text-stone-900">Account audit log</h1><div className="space-y-3">{result.data.map((entry) => <article key={entry._id} className="rounded-lg border border-stone-200 bg-white p-4 text-sm text-stone-700"><p className="font-semibold">{entry.action}</p><p>{new Date(entry.createdAt).toLocaleString('en-NG')}</p><p className="break-all">Actor: {entry.actorId} · Target: {entry.targetId}</p>{entry.changes ? <pre className="mt-2 overflow-auto whitespace-pre-wrap">{JSON.stringify(entry.changes, null, 2)}</pre> : null}</article>)}{!result.total ? <p>No account changes recorded.</p> : null}</div><div className="flex gap-4">{page > 1 ? <Link href={`?page=${page - 1}`}>Previous</Link> : null}<span>Page {page} of {Math.max(1, result.pages)}</span>{page < result.pages ? <Link href={`?page=${page + 1}`}>Next</Link> : null}</div></div>;
}
