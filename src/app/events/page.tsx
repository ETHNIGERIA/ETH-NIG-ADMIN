'use client';

import AdminLayout from '@/components/AdminLayout';
import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, startAfter, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebase'; // Adjust path to your firebase.js
import { useRouter } from 'next/navigation';
import Loader from '@/components/Loader';
import CreateEventModal from '@/components/Modals/CreateEvent';

const EVENTS_PER_PAGE = 5;

type EventType = {
  id: string;
  title?: string;
  location: string;
  image?: string;
  description?: string;
  link?: string;
  date?: { seconds: number; nanoseconds?: number } | any;
  // Add other event fields as needed
};

const Events = () => {
  const router = useRouter();
  const [isModalOpen, setModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<EventType | null>(null);
  const [events, setEvents] = useState<EventType[]>([]);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [moreAvailable, setMoreAvailable] = useState(true);

  // Fetch first page of events
  const fetchEvents = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'events'),
        orderBy('date', 'desc'),
        limit(EVENTS_PER_PAGE)
      );

      const snapshot = await getDocs(q);
      const eventsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          location: data.location ?? '',
          title: data.title,
          image: data.image,
          description: data.description,
          link: data.link,
          date: data.date,
        };
      });
      setEvents(eventsData);
      console.log('Fetched events:', eventsData);
      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      setLastDoc(lastVisible);

      setMoreAvailable(snapshot.docs.length === EVENTS_PER_PAGE);
    } catch (err) {
      console.error('Error fetching events:', err);
    }
    setLoading(false);
  };

  const openCreateModal = () => {
    setEventToEdit(null);
    setModalOpen(true);
  };

  const openEditModal = (event: EventType) => {
    setEventToEdit(event);
    setModalOpen(true);
  };
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      await deleteDoc(doc(db, 'events', id));
      setEvents(events.filter(e => e.id !== id));
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  };

  // Fetch next page
  const fetchMoreEvents = async () => {
    if (!lastDoc) return;

    setLoading(true);
    try {
      const q = query(
        collection(db, 'events'),
        orderBy('date', 'desc'),
        startAfter(lastDoc),
        limit(EVENTS_PER_PAGE)
      );

      const snapshot = await getDocs(q);
      const moreEvents = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          location: data.location ?? '',
          title: data.title,
          image: data.image,
          description: data.description,
          link: data.link,
          date: data.date,
        };
      });

      setEvents(prev => [...prev, ...moreEvents]);

      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      setLastDoc(lastVisible);

      setMoreAvailable(snapshot.docs.length === EVENTS_PER_PAGE);
    } catch (err) {
      console.error('Error fetching more events:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <AdminLayout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Events</h1>
          <button
            onClick={() => openCreateModal()}
            className="bg-[#003D11] text-white px-4 py-2 rounded hover:bg-[#3C9B3E] transition"
          >
            Create Event
          </button>
        </div>

        {loading && events.length === 0 && (
          <Loader text='loading events...' />
        )}

        {events.length === 0 && !loading ? (
          <p className="text-gray-600">No events found.</p>
        ) : (<table className="min-w-full bg-white shadow rounded overflow-hidden">
          <thead className="bg-[#003D11] text-white">
            <tr>
              <th className="py-3 px-6 text-left">Title</th>
              <th className="py-3 px-6 text-left">Location</th>
              <th className="py-3 px-6 text-left">Date</th>
              <th className="py-3 px-6 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => {
              const { id, title, location, date } = event;
              return (
                <tr
                  key={id}
                  className="border-b last:border-none"
                >
                  <td className="py-4 px-6">{title || 'No Title'}</td>
                  <td className="py-4 px-6">{location}</td>
                  <td className="py-4 px-6">
                    {date
                      ? new Date(date.seconds * 1000).toLocaleDateString()
                      : 'No Date'}
                  </td>
                  <td className="py-4 px-6 text-center space-x-3">
                    <button
                      onClick={() => openEditModal(event)}
                      className="bg-[#003D11] hover:bg-[#3C9B3E] text-white px-3 py-1 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        )}

        <CreateEventModal
          isOpen={isModalOpen}
          onClose={() => setModalOpen(false)}
          onSaved={fetchEvents}
          eventToEdit={eventToEdit}
        />

        {moreAvailable && !loading && (
          <div className="mt-6 text-center">
            <button
              onClick={fetchMoreEvents}
              className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 transition"
            >
              Load More
            </button>
          </div>
        )}

        {loading && events.length > 0 && (
          <p className="mt-4 text-center text-gray-600">Loading more...</p>
        )}
      </div>
    </AdminLayout>
  );
};

export default Events;
