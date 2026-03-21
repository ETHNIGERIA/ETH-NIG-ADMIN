'use client';

import AdminLayout from '@/components/AdminLayout';
import Loader from '@/components/Loader';
import { db } from '@/firebase';
import {
  collection,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
  type DocumentData,
  type Query,
  type QuerySnapshot,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { CreditCard, Download, RefreshCw, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type PaymentStatus =
  | 'initializing'
  | 'initialized'
  | 'success'
  | 'failed'
  | 'mismatch'
  | 'initialize_failed';

type PaymentRecord = {
  id: string;
  eventTitle?: string;
  email?: string;
  amount?: number;
  currency?: string;
  status?: PaymentStatus;
  reference?: string;
  channel?: string;
  paidAt?: string;
  createdAt?: { seconds: number } | Date | string;
  updatedAt?: { seconds: number } | Date | string;
  fullName?: string;
  phone?: string;
  organization?: string;
  community?: string;
  eventId?: string;
  idempotencyKey?: string;
};

type PayableEventOption = {
  id: string;
  title: string;
};

const PAGE_SIZE = 100;

const statusClassMap: Record<string, string> = {
  success: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-700',
  mismatch: 'bg-amber-100 text-amber-700',
  initialized: 'bg-blue-100 text-blue-700',
  initializing: 'bg-slate-100 text-slate-700',
  initialize_failed: 'bg-rose-100 text-rose-700',
};

const formatCurrency = (amountInMinorUnit?: number, currency = 'NGN') => {
  const safeAmount = Number(amountInMinorUnit || 0);
  const majorUnit = safeAmount / 100;

  try {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
    }).format(majorUnit);
  } catch {
    return `${currency} ${majorUnit.toFixed(2)}`;
  }
};

const formatTimestamp = (value?: { seconds: number } | Date | string) => {
  if (!value) {
    return '-';
  }

  if (typeof value === 'string') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('en-GB');
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? '-' : value.toLocaleString('en-GB');
  }

  if (typeof value === 'object' && typeof value.seconds === 'number') {
    return new Date(value.seconds * 1000).toLocaleString('en-GB');
  }

  return '-';
};

const parseTimestampToDate = (value?: { seconds: number } | Date | string) => {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'object' && typeof value.seconds === 'number') {
    const date = new Date(value.seconds * 1000);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
};

const csvEscape = (value: string | number | null | undefined) => {
  const normalized = String(value ?? '');
  if (normalized.includes(',') || normalized.includes('"') || normalized.includes('\n')) {
    return `"${normalized.replaceAll('"', '""')}"`;
  }
  return normalized;
};

const Transactions = () => {
  const [transactions, setTransactions] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState<'all' | PaymentStatus>('all');
  const [emailQuery, setEmailQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [payableEvents, setPayableEvents] = useState<PayableEventOption[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<PaymentRecord | null>(null);
  const [exportingAll, setExportingAll] = useState(false);

  const fetchCount = async () => {
    try {
      const snapshot = await getCountFromServer(collection(db, 'payment_attempts'));
      setTotalCount(snapshot.data().count);
    } catch (error) {
      console.error('Failed to fetch transaction count:', error);
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);

    try {
      const transactionsQuery = query(
        collection(db, 'payment_attempts'),
        orderBy('createdAt', 'desc'),
        limit(PAGE_SIZE)
      );

      const snapshot = await getDocs(transactionsQuery);
      const rows = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })) as PaymentRecord[];

      setTransactions(rows);
      setLastDoc(snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null);
      setHasMore(snapshot.docs.length === PAGE_SIZE);
      await fetchCount();
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayableEvents = async () => {
    try {
      const payableEventsQuery = query(collection(db, 'events'), where('isPayable', '==', true));
      const snapshot = await getDocs(payableEventsQuery);

      const rows = snapshot.docs
        .map((docSnap) => ({
          id: docSnap.id,
          title: String((docSnap.data() as { title?: string }).title || 'Untitled Event'),
        }))
        .sort((a, b) => a.title.localeCompare(b.title, 'en', { sensitivity: 'base' }));

      setPayableEvents(rows);

      if (rows.length && !selectedEventId) {
        setSelectedEventId(rows[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch payable events:', error);
    }
  };

  const fetchMoreTransactions = async () => {
    if (!lastDoc || loadingMore) {
      return;
    }

    setLoadingMore(true);

    try {
      const transactionsQuery = query(
        collection(db, 'payment_attempts'),
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(PAGE_SIZE)
      );

      const snapshot = await getDocs(transactionsQuery);
      const rows = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })) as PaymentRecord[];

      setTransactions((prev) => [...prev, ...rows]);
      setLastDoc(snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : lastDoc);
      setHasMore(snapshot.docs.length === PAGE_SIZE);
    } catch (error) {
      console.error('Failed to fetch more transactions:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchPayableEvents();
  }, []);

  const filteredTransactions = useMemo(() => {
    const trimmedEmail = emailQuery.trim().toLowerCase();
    const fromDate = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const toDate = dateTo ? new Date(`${dateTo}T23:59:59.999`) : null;

    return transactions.filter((tx) => {
      if (selectedEventId && tx.eventId !== selectedEventId) {
        return false;
      }

      if (statusFilter !== 'all' && tx.status !== statusFilter) {
        return false;
      }

      if (trimmedEmail && !String(tx.email || '').toLowerCase().includes(trimmedEmail)) {
        return false;
      }

      const createdAtDate = parseTimestampToDate(tx.createdAt);
      if (fromDate && (!createdAtDate || createdAtDate < fromDate)) {
        return false;
      }

      if (toDate && (!createdAtDate || createdAtDate > toDate)) {
        return false;
      }

      return true;
    });
  }, [transactions, selectedEventId, statusFilter, emailQuery, dateFrom, dateTo]);

  const clearFilters = () => {
    setStatusFilter('all');
    setEmailQuery('');
    setDateFrom('');
    setDateTo('');
  };

  const matchesActiveFilters = (tx: PaymentRecord) => {
    const trimmedEmail = emailQuery.trim().toLowerCase();
    const fromDate = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const toDate = dateTo ? new Date(`${dateTo}T23:59:59.999`) : null;

    if (statusFilter !== 'all' && tx.status !== statusFilter) {
      return false;
    }

    if (selectedEventId && tx.eventId !== selectedEventId) {
      return false;
    }

    if (trimmedEmail && !String(tx.email || '').toLowerCase().includes(trimmedEmail)) {
      return false;
    }

    const createdAtDate = parseTimestampToDate(tx.createdAt);
    if (fromDate && (!createdAtDate || createdAtDate < fromDate)) {
      return false;
    }

    if (toDate && (!createdAtDate || createdAtDate > toDate)) {
      return false;
    }

    return true;
  };

  const buildCsv = (rowsToExport: PaymentRecord[]) => {
    const header = [
      'eventTitle',
      'email',
      'fullName',
      'phone',
      'organization',
      'community',
      'amountMajor',
      'currency',
      'status',
      'reference',
      'channel',
      'paidAt',
      'createdAt',
      'updatedAt',
      'eventId',
      'idempotencyKey',
    ];

    const rows = rowsToExport.map((tx) => [
      tx.eventTitle || '',
      tx.email || '',
      tx.fullName || '',
      tx.phone || '',
      tx.organization || '',
      tx.community || '',
      ((Number(tx.amount || 0) || 0) / 100).toFixed(2),
      tx.currency || 'NGN',
      tx.status || 'unknown',
      tx.reference || '',
      tx.channel || '',
      formatTimestamp(tx.paidAt),
      formatTimestamp(tx.createdAt),
      formatTimestamp(tx.updatedAt),
      tx.eventId || '',
      tx.idempotencyKey || '',
    ]);

    return [header, ...rows]
      .map((line) => line.map((value) => csvEscape(value)).join(','))
      .join('\n');
  };

  const downloadCsv = (csvContent: string, filenamePrefix: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    const datePart = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `${filenamePrefix}-${datePart}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const exportCurrentView = () => {
    const csvContent = buildCsv(filteredTransactions);
    downloadCsv(csvContent, 'transactions-current-view');
  };

  const exportAllRecords = async () => {
    setExportingAll(true);

    try {
      const allRows: PaymentRecord[] = [];
      let cursor: QueryDocumentSnapshot<DocumentData> | null = null;
      const chunkSize = 500;

      while (true) {
        const chunkQuery: Query<DocumentData> = cursor
          ? query(
              collection(db, 'payment_attempts'),
              orderBy('createdAt', 'desc'),
              startAfter(cursor),
              limit(chunkSize)
            )
          : query(collection(db, 'payment_attempts'), orderBy('createdAt', 'desc'), limit(chunkSize));

        const chunkSnapshot: QuerySnapshot<DocumentData> = await getDocs(chunkQuery);
        if (!chunkSnapshot.docs.length) {
          break;
        }

        const rows = chunkSnapshot.docs.map((docSnap: QueryDocumentSnapshot<DocumentData>) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as PaymentRecord[];

        allRows.push(...rows);
        cursor = chunkSnapshot.docs[chunkSnapshot.docs.length - 1];

        if (chunkSnapshot.docs.length < chunkSize) {
          break;
        }
      }

      const filteredAllRows = allRows.filter(matchesActiveFilters);
      const csvContent = buildCsv(filteredAllRows);
      downloadCsv(csvContent, 'transactions-all-records');
    } catch (error) {
      console.error('Failed to export all transactions:', error);
    } finally {
      setExportingAll(false);
    }
  };

  const statusOptions: Array<'all' | PaymentStatus> = [
    'all',
    'success',
    'failed',
    'initialized',
    'initializing',
    'mismatch',
    'initialize_failed',
  ];

  const selectedEventLabel =
    payableEvents.find((event) => event.id === selectedEventId)?.title || 'No payable event selected';

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#003D11] flex items-center gap-3">
              <CreditCard className="w-8 h-8" /> Transactions
            </h1>
            <p className="text-gray-500 mt-1">All payment attempts made for payable events.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchTransactions}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-[#3C9B3E] text-white font-semibold hover:bg-[#003D11] transition"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            <button
              onClick={exportCurrentView}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-[#003D11] text-white font-semibold hover:bg-[#2F7B31] transition"
            >
              <Download className="w-4 h-4" /> Export Current View
            </button>
            <button
              onClick={exportAllRecords}
              disabled={exportingAll}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-700 text-white font-semibold hover:bg-slate-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" /> {exportingAll ? 'Exporting All...' : 'Export All Records'}
            </button>
          </div>
        </div>

        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 md:p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Selected Event Scope</p>
          <div className="mt-2 flex flex-col md:flex-row md:items-center gap-3">
            <p className="text-sm text-gray-700 min-w-fit">
              Showing transactions for <span className="font-bold text-gray-900">{selectedEventLabel}</span>
            </p>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full md:max-w-md border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#3C9B3E]"
            >
              {!payableEvents.length && <option value="">No payable events found</option>}
              {payableEvents.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>
          </div>
        </section>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 md:p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="lg:col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email Search</label>
              <div className="mt-1 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={emailQuery}
                  onChange={(e) => setEmailQuery(e.target.value)}
                  placeholder="Search by customer email"
                  className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3C9B3E]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | PaymentStatus)}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#3C9B3E]"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status === 'all' ? 'All statuses' : status.replaceAll('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">From Date</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3C9B3E]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">To Date</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3C9B3E]"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <p className="text-sm text-gray-600">
              Showing <span className="font-bold text-gray-900">{filteredTransactions.length}</span> of{' '}
              <span className="font-bold text-gray-900">{transactions.length}</span> loaded records. Total in database:{' '}
              <span className="font-bold text-gray-900">{totalCount}</span>
            </p>
            <button
              onClick={clearFilters}
              className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition"
            >
              <X className="w-4 h-4" /> Clear Filters
            </button>
          </div>
        </div>

        {loading ? (
          <div className="h-72 flex items-center justify-center bg-white rounded-2xl border border-gray-200">
            <Loader />
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-[#003D11] text-white">
                  <tr>
                    <th className="p-4 text-xs uppercase tracking-wide">Event</th>
                    <th className="p-4 text-xs uppercase tracking-wide">Email</th>
                    <th className="p-4 text-xs uppercase tracking-wide">Amount</th>
                    <th className="p-4 text-xs uppercase tracking-wide">Status</th>
                    <th className="p-4 text-xs uppercase tracking-wide">Reference</th>
                    <th className="p-4 text-xs uppercase tracking-wide">Paid At</th>
                    <th className="p-4 text-xs uppercase tracking-wide">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTransactions.map((tx) => (
                    <tr
                      key={tx.id}
                      onClick={() => setSelectedTransaction(tx)}
                      className="hover:bg-[#3C9B3E]/5 transition-colors cursor-pointer"
                    >
                      <td className="p-4 font-semibold text-gray-900">{tx.eventTitle || 'Untitled Event'}</td>
                      <td className="p-4 text-sm text-gray-700">{tx.email || '-'}</td>
                      <td className="p-4 text-sm text-gray-900 font-medium">
                        {formatCurrency(tx.amount, tx.currency || 'NGN')}
                      </td>
                      <td className="p-4 text-sm">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            statusClassMap[tx.status || ''] || 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {(tx.status || 'unknown').replaceAll('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-gray-600 max-w-[220px] truncate">{tx.reference || '-'}</td>
                      <td className="p-4 text-sm text-gray-600">{formatTimestamp(tx.paidAt)}</td>
                      <td className="p-4 text-sm text-gray-600">{formatTimestamp(tx.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!filteredTransactions.length && (
              <div className="p-16 text-center text-gray-400">No transactions match your filters.</div>
            )}

            {hasMore && (
              <button
                onClick={fetchMoreTransactions}
                className="w-full py-4 text-xs font-bold uppercase tracking-wider text-[#003D11] bg-[#F8FAF8] border-t border-gray-200 hover:bg-[#EDF7EE] transition"
              >
                {loadingMore ? 'Loading 100 more...' : 'Load 100 More Transactions'}
              </button>
            )}
          </div>
        )}

        {selectedTransaction && (
          <>
            <div
              onClick={() => setSelectedTransaction(null)}
              className="fixed inset-0 bg-black/30 backdrop-blur-[1px] z-40"
            />
            <aside className="fixed top-0 right-0 h-screen w-full max-w-md bg-white z-50 shadow-2xl flex flex-col">
              <div className="p-5 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#003D11]">Transaction Details</h2>
                <button
                  onClick={() => setSelectedTransaction(null)}
                  className="p-2 rounded-md hover:bg-gray-100 transition"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <div className="p-5 space-y-4 overflow-y-auto">
                <div className="grid grid-cols-1 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Event</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{selectedTransaction.eventTitle || '-'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Email</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{selectedTransaction.email || '-'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Amount</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      {formatCurrency(selectedTransaction.amount, selectedTransaction.currency || 'NGN')}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Status</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      {(selectedTransaction.status || 'unknown').replaceAll('_', ' ')}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Reference</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1 break-all">
                      {selectedTransaction.reference || '-'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Channel</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{selectedTransaction.channel || '-'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Customer Name</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{selectedTransaction.fullName || '-'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Phone</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{selectedTransaction.phone || '-'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Organization</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{selectedTransaction.organization || '-'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Community</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{selectedTransaction.community || '-'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Paid At</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{formatTimestamp(selectedTransaction.paidAt)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Created</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{formatTimestamp(selectedTransaction.createdAt)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Updated</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{formatTimestamp(selectedTransaction.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </aside>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default Transactions;