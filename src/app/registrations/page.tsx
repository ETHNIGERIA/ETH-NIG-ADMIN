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
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { ClipboardList, RefreshCw, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type RegistrationRecord = {
  id: string;
  eventId?: string;
  eventTitle?: string;
  email?: string;
  fullName?: string;
  phone?: string;
  organization?: string;
  community?: string;
  expectations?: string;
  paymentStatus?: string;
  source?: string;
  confirmationEmailSent?: boolean;
  createdAt?: { seconds: number } | Date | string;
  updatedAt?: { seconds: number } | Date | string;
};

type EventOption = {
  id: string;
  title: string;
};

const PAGE_SIZE = 100;

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

const Registrations = () => {
  const [registrations, setRegistrations] = useState<RegistrationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [emailQuery, setEmailQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedRegistration, setSelectedRegistration] = useState<RegistrationRecord | null>(null);

  const fetchCount = async () => {
    try {
      const snapshot = await getCountFromServer(collection(db, 'event_registrations'));
      setTotalCount(snapshot.data().count);
    } catch (error) {
      console.error('Failed to fetch registrations count:', error);
    }
  };

  const fetchEvents = async () => {
    try {
      const snapshot = await getDocs(query(collection(db, 'events')));
      const rows = snapshot.docs
        .map((docSnap) => ({
          id: docSnap.id,
          title: String((docSnap.data() as { title?: string }).title || 'Untitled Event'),
        }))
        .sort((a, b) => a.title.localeCompare(b.title, 'en', { sensitivity: 'base' }));

      setEvents(rows);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    }
  };

  const fetchRegistrations = async () => {
    setLoading(true);

    try {
      const registrationsQuery = query(
        collection(db, 'event_registrations'),
        orderBy('createdAt', 'desc'),
        limit(PAGE_SIZE)
      );

      const snapshot = await getDocs(registrationsQuery);
      const rows = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })) as RegistrationRecord[];

      setRegistrations(rows);
      setLastDoc(snapshot.docs.length ? snapshot.docs[snapshot.docs.length - 1] : null);
      setHasMore(snapshot.docs.length === PAGE_SIZE);
      await fetchCount();
    } catch (error) {
      console.error('Failed to fetch registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMoreRegistrations = async () => {
    if (!lastDoc || loadingMore) {
      return;
    }

    setLoadingMore(true);

    try {
      const registrationsQuery = query(
        collection(db, 'event_registrations'),
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(PAGE_SIZE)
      );

      const snapshot = await getDocs(registrationsQuery);
      const rows = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })) as RegistrationRecord[];

      setRegistrations((prev) => [...prev, ...rows]);
      setLastDoc(snapshot.docs.length ? snapshot.docs[snapshot.docs.length - 1] : lastDoc);
      setHasMore(snapshot.docs.length === PAGE_SIZE);
    } catch (error) {
      console.error('Failed to fetch more registrations:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
    fetchEvents();
  }, []);

  const filteredRegistrations = useMemo(() => {
    const trimmedEmail = emailQuery.trim().toLowerCase();
    const fromDate = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const toDate = dateTo ? new Date(`${dateTo}T23:59:59.999`) : null;

    return registrations.filter((registration) => {
      if (registration.paymentStatus !== 'free') {
        return false;
      }

      if (selectedEventId && registration.eventId !== selectedEventId) {
        return false;
      }

      if (trimmedEmail && !String(registration.email || '').toLowerCase().includes(trimmedEmail)) {
        return false;
      }

      const createdAtDate = parseTimestampToDate(registration.createdAt);
      if (fromDate && (!createdAtDate || createdAtDate < fromDate)) {
        return false;
      }

      if (toDate && (!createdAtDate || createdAtDate > toDate)) {
        return false;
      }

      return true;
    });
  }, [registrations, selectedEventId, emailQuery, dateFrom, dateTo]);

  const clearFilters = () => {
    setSelectedEventId('');
    setEmailQuery('');
    setDateFrom('');
    setDateTo('');
  };

  const selectedEventLabel =
    events.find((event) => event.id === selectedEventId)?.title || 'All events';

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#003D11] flex items-center gap-3">
              <ClipboardList className="w-8 h-8" /> Free Registrations
            </h1>
            <p className="text-gray-500 mt-1">Registrations saved in event_registrations where paymentStatus is free.</p>
          </div>

          <button
            onClick={fetchRegistrations}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-[#3C9B3E] text-white font-semibold hover:bg-[#003D11] transition"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 md:p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Event Scope</p>
          <div className="mt-2 flex flex-col md:flex-row md:items-center gap-3">
            <p className="text-sm text-gray-700 min-w-fit">
              Showing registrations for <span className="font-bold text-gray-900">{selectedEventLabel}</span>
            </p>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full md:max-w-md border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#3C9B3E]"
            >
              <option value="">All events</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>
          </div>
        </section>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 md:p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="lg:col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email Search</label>
              <div className="mt-1 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={emailQuery}
                  onChange={(e) => setEmailQuery(e.target.value)}
                  placeholder="Search by registrant email"
                  className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3C9B3E]"
                />
              </div>
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
              Showing <span className="font-bold text-gray-900">{filteredRegistrations.length}</span> of{' '}
              <span className="font-bold text-gray-900">{registrations.length}</span> loaded records. Total in database:{' '}
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
                    <th className="p-4 text-xs uppercase tracking-wide">Name</th>
                    <th className="p-4 text-xs uppercase tracking-wide">Source</th>
                    <th className="p-4 text-xs uppercase tracking-wide">Email Sent</th>
                    <th className="p-4 text-xs uppercase tracking-wide">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRegistrations.map((registration) => (
                    <tr
                      key={registration.id}
                      onClick={() => setSelectedRegistration(registration)}
                      className="hover:bg-[#3C9B3E]/5 transition-colors cursor-pointer"
                    >
                      <td className="p-4 font-semibold text-gray-900">{registration.eventTitle || 'Untitled Event'}</td>
                      <td className="p-4 text-sm text-gray-700">{registration.email || '-'}</td>
                      <td className="p-4 text-sm text-gray-700">{registration.fullName || '-'}</td>
                      <td className="p-4 text-sm text-gray-700">{registration.source || '-'}</td>
                      <td className="p-4 text-sm text-gray-700">{registration.confirmationEmailSent ? 'Yes' : 'No'}</td>
                      <td className="p-4 text-sm text-gray-600">{formatTimestamp(registration.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!filteredRegistrations.length && (
              <div className="p-16 text-center text-gray-400">No free registrations match your filters.</div>
            )}

            {hasMore && (
              <button
                onClick={fetchMoreRegistrations}
                className="w-full py-4 text-xs font-bold uppercase tracking-wider text-[#003D11] bg-[#F8FAF8] border-t border-gray-200 hover:bg-[#EDF7EE] transition"
              >
                {loadingMore ? 'Loading 100 more...' : 'Load 100 More Registrations'}
              </button>
            )}
          </div>
        )}

        {selectedRegistration && (
          <>
            <div
              onClick={() => setSelectedRegistration(null)}
              className="fixed inset-0 bg-black/30 backdrop-blur-[1px] z-40"
            />
            <aside className="fixed top-0 right-0 h-screen w-full max-w-md bg-white z-50 shadow-2xl flex flex-col">
              <div className="p-5 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#003D11]">Registration Details</h2>
                <button
                  onClick={() => setSelectedRegistration(null)}
                  className="p-2 rounded-md hover:bg-gray-100 transition"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <div className="p-5 space-y-4 overflow-y-auto">
                <div className="grid grid-cols-1 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Event</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{selectedRegistration.eventTitle || '-'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Email</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{selectedRegistration.email || '-'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Full Name</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{selectedRegistration.fullName || '-'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Phone</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{selectedRegistration.phone || '-'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Organization</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{selectedRegistration.organization || '-'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Community</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{selectedRegistration.community || '-'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Expectations</p>
                    <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">
                      {selectedRegistration.expectations || '-'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Email Confirmation Sent</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      {selectedRegistration.confirmationEmailSent ? 'Yes' : 'No'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Source</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{selectedRegistration.source || '-'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Created</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{formatTimestamp(selectedRegistration.createdAt)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Updated</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{formatTimestamp(selectedRegistration.updatedAt)}</p>
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

export default Registrations;
