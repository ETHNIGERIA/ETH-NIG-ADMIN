// 'use client';

// import AdminLayout from '@/components/AdminLayout';
// import React, { useEffect, useState } from 'react';
// import { collection, query, orderBy, limit, startAfter, getDocs, doc, deleteDoc, getCountFromServer } from 'firebase/firestore';
// import { db } from '@/firebase';
// import Loader from '@/components/Loader';
// import CreateEventModal from '@/components/Modals/CreateEvent';
// import { 
//   Calendar, 
//   MapPin, 
//   Trash2, 
//   Edit3, 
//   Plus, 
//   ExternalLink, 
//   Clock 
// } from 'lucide-react';

// const EVENTS_PER_PAGE = 8;

// type EventType = {
//   id: string;
//   title?: string;
//   location: string;
//   image?: string;
//   description?: string;
//   link?: string;
//   date?: { seconds: number; nanoseconds?: number } | any;
// };

// const Events = () => {
//   const [isModalOpen, setModalOpen] = useState(false);
//   const [eventToEdit, setEventToEdit] = useState<EventType | null>(null);
//   const [events, setEvents] = useState<EventType[]>([]);
//   const [totalCount, setTotalCount] = useState<number>(0); // State for total count
//   const [lastDoc, setLastDoc] = useState<any>(null);
//   const [loading, setLoading] = useState(false);
//   const [moreAvailable, setMoreAvailable] = useState(true);

//   // Optimized way to get total count without downloading all documents
//   const fetchTotalCount = async () => {
//     try {
//       const coll = collection(db, 'events');
//       const snapshot = await getCountFromServer(coll);
//       setTotalCount(snapshot.data().count);
//     } catch (err) {
//       console.error('Error getting count:', err);
//     }
//   };

//   const fetchEvents = async () => {
//     setLoading(true);
//     try {
//       const q = query(
//         collection(db, 'events'),
//         orderBy('date', 'desc'),
//         limit(EVENTS_PER_PAGE)
//       );

//       const snapshot = await getDocs(q);
//       const eventsData = snapshot.docs.map(doc => ({
//         id: doc.id,
//         ...doc.data()
//       })) as EventType[];
      
//       setEvents(eventsData);
//       setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
//       setMoreAvailable(snapshot.docs.length === EVENTS_PER_PAGE);
      
//       // Also update the total count when we fetch the initial list
//       fetchTotalCount();
//     } catch (err) {
//       console.error('Error fetching events:', err);
//     }
//     setLoading(false);
//   };

//   const openCreateModal = () => {
//     setEventToEdit(null);
//     setModalOpen(true);
//   };

//   const openEditModal = (event: EventType) => {
//     setEventToEdit(event);
//     setModalOpen(true);
//   };

//   const handleDelete = async (id: string) => {
//     if (!confirm('Are you sure you want to delete this event?')) return;
//     try {
//       await deleteDoc(doc(db, 'events', id));
//       setEvents(events.filter(e => e.id !== id));
//       setTotalCount(prev => prev - 1); // Locally decrement count
//     } catch (error) {
//       console.error('Failed to delete event:', error);
//     }
//   };

//   const fetchMoreEvents = async () => {
//     if (!lastDoc || loading) return;
//     setLoading(true);
//     try {
//       const q = query(
//         collection(db, 'events'),
//         orderBy('date', 'desc'),
//         startAfter(lastDoc),
//         limit(EVENTS_PER_PAGE)
//       );
//       const snapshot = await getDocs(q);
//       if (snapshot.empty) {
//         setMoreAvailable(false);
//       } else {
//         const moreEvents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as EventType[];
//         setEvents(prev => [...prev, ...moreEvents]);
//         setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
//         setMoreAvailable(snapshot.docs.length === EVENTS_PER_PAGE);
//       }
//     } catch (err) {
//       console.error('Error fetching more events:', err);
//     }
//     setLoading(false);
//   };

//   useEffect(() => {
//     fetchEvents();
//   }, []);

//   return (
//     <AdminLayout>
//       <div className="flex flex-col lg:flex-row min-h-screen bg-[#FDFCF9]">
        
//         {/* LEFT SIDE: Events Inventory (70%) */}
//         <div className="flex-[2.5] p-6 lg:p-10">
//           <div className="flex justify-between items-end mb-8">
//             <div>
//               <h1 className="text-3xl font-bold text-[#131313] tracking-tight">Events Management</h1>
//               <p className="text-[#686764] text-sm mt-1">Organize and schedule Ethereum Nigeria gatherings.</p>
//             </div>
//             <button
//               onClick={openCreateModal}
//               className="bg-[#003D11] hover:bg-[#3C9B3E] text-white px-5 py-3 rounded-xl font-semibold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
//             >
//               <Plus size={18} /> Create Event
//             </button>
//           </div>

//           {loading && events.length === 0 ? (
//             <div className="flex justify-center py-20"><Loader text="Loading events..." /></div>
//           ) : events.length === 0 ? (
//             <div className="bg-white rounded-2xl border border-[#E5E2DA] p-20 text-center">
//                <Calendar size={48} className="mx-auto text-[#CEC9C0] mb-4" />
//                <p className="text-[#686764]">No events found in the database.</p>
//             </div>
//           ) : (
//             <div className="bg-white rounded-2xl border border-[#E5E2DA] overflow-hidden shadow-sm">
//               <table className="min-w-full text-left">
//                 <thead>
//                   <tr className="bg-[#F8F7F2] border-b border-[#E5E2DA]">
//                     <th className="p-5 text-xs uppercase tracking-widest font-bold text-[#686764]">Event Title</th>
//                     <th className="p-5 text-xs uppercase tracking-widest font-bold text-[#686764]">Location</th>
//                     <th className="p-5 text-xs uppercase tracking-widest font-bold text-[#686764]">Date</th>
//                     <th className="p-5 text-xs uppercase tracking-widest font-bold text-[#686764] text-right">Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-[#E5E2DA]">
//                   {events.map((event) => (
//                     <tr key={event.id} className="hover:bg-[#FEFAF3]/50 transition-colors group">
//                       <td className="p-5">
//                         <div className="font-semibold text-[#131313]">{event.title || 'Untitled Event'}</div>
//                         {event.link && (
//                           <a href={event.link} target="_blank" className="text-[10px] text-[#3C9B3E] flex items-center gap-1 mt-0.5 uppercase font-bold tracking-tighter">
//                             Official Link <ExternalLink size={10} />
//                           </a>
//                         )}
//                       </td>
//                       <td className="p-5 text-[#686764] text-sm">
//                         <div className="flex items-center gap-1.5"><MapPin size={14} className="text-[#3C9B3E]"/> {event.location}</div>
//                       </td>
//                       <td className="p-5 text-[#686764] text-sm font-medium">
//                         {event.date?.seconds 
//                           ? new Date(event.date.seconds * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric'})
//                           : 'TBA'}
//                       </td>
//                       <td className="p-5 text-right space-x-4">
//                         <button
//                           onClick={() => openEditModal(event)}
//                           className="text-[#003D11] hover:text-[#3C9B3E] transition-colors inline-block"
//                         >
//                           <Edit3 size={18} />
//                         </button>
//                         <button
//                           onClick={() => handleDelete(event.id)}
//                           className="text-red-400 hover:text-red-600 transition-colors inline-block"
//                         >
//                           <Trash2 size={18} />
//                         </button>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>

//               {moreAvailable && (
//                 <div className="p-4 bg-[#F8F7F2] text-center border-t border-[#E5E2DA]">
//                   <button
//                     onClick={fetchMoreEvents}
//                     disabled={loading}
//                     className="text-xs font-black text-[#003D11] hover:text-[#3C9B3E] tracking-tighter disabled:opacity-50 uppercase"
//                   >
//                     {loading ? 'Fetching...' : 'Show More Events'}
//                   </button>
//                 </div>
//               )}
//             </div>
//           )}
//         </div>

//         {/* RIGHT SIDE: Summary Panel (30%) */}
//         <div className="flex-1 bg-[#F1EFE9]/50 border-l border-[#E5E2DA] p-6 lg:p-8">
//           <h2 className="text-xl font-bold text-[#131313] mb-6">Upcoming Insights</h2>
          
//           <div className="space-y-4">
//             {/* Quick Stats Card */}
//             <div className="bg-[#003D11] text-white p-5 rounded-2xl shadow-sm">
//               <p className="text-xs text-[#3C9B3E] font-bold uppercase tracking-widest mb-1">Total Events</p>
//               <h3 className="text-3xl font-bold">{totalCount}</h3>
//               <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-white/60">
//                 <span>Updated just now</span>
//                 <Clock size={12} />
//               </div>
//             </div>

//             {/* Latest Entry Card */}
//             {events.length > 0 && (
//               <div className="bg-[#FEFAF3] p-5 rounded-2xl border border-[#3C9B3E]/20 shadow-sm relative overflow-hidden group">
//                 <div className="relative z-10">
//                   <p className="text-[10px] font-black text-[#3C9B3E] uppercase tracking-widest mb-2">Latest Entry</p>
//                   <h4 className="font-bold text-[#131313] truncate">{events[0].title}</h4>
//                   <p className="text-[11px] text-[#686764] mt-1 flex items-center gap-1">
//                     <MapPin size={10} /> {events[0].location}
//                   </p>
//                 </div>
//                 <div className="absolute right-[-10px] bottom-[-10px] text-[#3C9B3E]/5 group-hover:text-[#3C9B3E]/10 transition-colors">
//                   <Calendar size={80} />
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       <CreateEventModal
//         isOpen={isModalOpen}
//         onClose={() => setModalOpen(false)}
//         onSaved={fetchEvents}
//         eventToEdit={eventToEdit}
//       />
//     </AdminLayout>
//   );
// };

// export default Events;

'use client';

import AdminLayout from '@/components/AdminLayout';
import React, { useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  startAfter, 
  getDocs, 
  doc, 
  deleteDoc, 
  getCountFromServer, 
  where,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/firebase';
import Loader from '@/components/Loader';
import CreateEventModal from '@/components/Modals/CreateEvent';
import { 
  Calendar, 
  MapPin, 
  Trash2, 
  Edit3, 
  Plus, 
  ExternalLink, 
  Clock,
  ChevronRight
} from 'lucide-react';

const EVENTS_PER_PAGE = 8;
const UPCOMING_LIMIT = 5;

type EventType = {
  id: string;
  title?: string;
  location: string;
  image?: string;
  description?: string;
  link?: string;
  date?: { seconds: number; nanoseconds?: number } | any;
};

const Events = () => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<EventType | null>(null);
  const [events, setEvents] = useState<EventType[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<EventType[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [lastUpcomingDoc, setLastUpcomingDoc] = useState<any>(null);
  
  const [loading, setLoading] = useState(false);
  const [loadingUpcoming, setLoadingUpcoming] = useState(false);
  const [moreAvailable, setMoreAvailable] = useState(true);
  const [moreUpcomingAvailable, setMoreUpcomingAvailable] = useState(false);

  const fetchTotalCount = async () => {
    try {
      const coll = collection(db, 'events');
      const snapshot = await getCountFromServer(coll);
      setTotalCount(snapshot.data().count);
    } catch (err) {
      console.error('Error getting count:', err);
    }
  };

  // Fetch the main inventory (All events, desc)
  const fetchEvents = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'events'),
        orderBy('date', 'desc'),
        limit(EVENTS_PER_PAGE)
      );
      const snapshot = await getDocs(q);
      const eventsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as EventType[];
      setEvents(eventsData);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setMoreAvailable(snapshot.docs.length === EVENTS_PER_PAGE);
      fetchTotalCount();
    } catch (err) {
      console.error('Error fetching events:', err);
    }
    setLoading(false);
  };

  // NEW: Fetch only events from current date onwards
  const fetchUpcomingEvents = async (isLoadMore = false) => {
    setLoadingUpcoming(true);
    try {
      const now = Timestamp.now();
      let q = query(
        collection(db, 'events'),
        where('date', '>=', now),
        orderBy('date', 'asc'),
        limit(UPCOMING_LIMIT)
      );

      if (isLoadMore && lastUpcomingDoc) {
        q = query(q, startAfter(lastUpcomingDoc));
      }

      const snapshot = await getDocs(q);
      const upcomingData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as EventType[];
      
      if (isLoadMore) {
        setUpcomingEvents(prev => [...prev, ...upcomingData]);
      } else {
        setUpcomingEvents(upcomingData);
      }

      setLastUpcomingDoc(snapshot.docs[snapshot.docs.length - 1]);
      setMoreUpcomingAvailable(snapshot.docs.length === UPCOMING_LIMIT);
    } catch (err) {
      console.error('Error fetching upcoming events:', err);
    }
    setLoadingUpcoming(false);
  };

  const fetchMoreEvents = async () => {
    if (!lastDoc || loading) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'events'),
        orderBy('date', 'desc'),
        startAfter(lastDoc),
        limit(EVENTS_PER_PAGE)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const moreEvents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as EventType[];
        setEvents(prev => [...prev, ...moreEvents]);
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
        setMoreAvailable(snapshot.docs.length === EVENTS_PER_PAGE);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await deleteDoc(doc(db, 'events', id));
      setEvents(events.filter(e => e.id !== id));
      setUpcomingEvents(upcomingEvents.filter(e => e.id !== id));
      setTotalCount(prev => prev - 1);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchEvents();
    fetchUpcomingEvents();
  }, []);

  return (
    <AdminLayout>
      <div className="flex flex-col lg:flex-row min-h-screen bg-[#FDFCF9]">
        
        {/* LEFT SIDE: Inventory */}
        <div className="flex-[2.5] p-6 lg:p-10">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[#131313]">Events</h1>
              <p className="text-[#686764] text-sm mt-1">Full database of all scheduled and past events.</p>
            </div>
            <button onClick={() => { setEventToEdit(null); setModalOpen(true); }} className="bg-[#003D11] hover:bg-[#3C9B3E] text-white px-5 py-3 rounded-xl font-semibold flex items-center gap-2">
              <Plus size={18} /> Create Event
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5E2DA] overflow-hidden shadow-sm">
            <table className="min-w-full text-left">
              <thead className="bg-[#F8F7F2] border-b border-[#E5E2DA]">
                <tr>
                  <th className="p-5 text-xs uppercase font-bold text-[#686764]">Title</th>
                  <th className="p-5 text-xs uppercase font-bold text-[#686764]">Location</th>
                  <th className="p-5 text-xs uppercase font-bold text-[#686764]">Date</th>
                  <th className="p-5 text-xs uppercase font-bold text-[#686764] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E2DA]">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-[#FEFAF3]/50 transition-colors">
                    <td className="p-5 font-semibold text-[#131313]">{event.title}</td>
                    <td className="p-5 text-[#686764] text-sm">{event.location}</td>
                    <td className="p-5 text-[#686764] text-sm">
                      {event.date?.seconds ? new Date(event.date.seconds * 1000).toLocaleDateString('en-GB') : 'TBA'}
                    </td>
                    <td className="p-5 text-right space-x-4">
                      <button onClick={() => { setEventToEdit(event); setModalOpen(true); }} className="text-[#003D11] hover:text-[#3C9B3E]"><Edit3 size={18} /></button>
                      <button onClick={() => handleDelete(event.id)} className="text-red-400 hover:text-red-600"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {moreAvailable && (
              <button onClick={fetchMoreEvents} className="w-full p-4 bg-[#F8F7F2] text-xs font-black text-[#003D11] uppercase tracking-tighter">
                {loading ? 'Loading...' : 'Show More History'}
              </button>
            )}
          </div>
        </div>

        {/* RIGHT SIDE: Upcoming Feed */}
        <div className="flex-1 bg-[#F1EFE9]/50 border-l border-[#E5E2DA] p-6 lg:p-8">
          <div className="bg-[#003D11] text-white p-5 rounded-2xl shadow-sm mb-8">
            <p className="text-xs text-[#3C9B3E] font-bold uppercase tracking-widest mb-1">Total Events</p>
            <h3 className="text-3xl font-bold">{totalCount} </h3>
          </div>

          <h2 className="text-xl font-bold text-[#131313] mb-6 flex items-center gap-2">
            Upcoming <Clock size={18} className="text-[#3C9B3E]" />
          </h2>

          <div className="space-y-4">
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((event) => (
                <div key={event.id} className="bg-white p-4 rounded-2xl border border-[#E5E2DA] shadow-sm group hover:border-[#3C9B3E] transition-all">
                  <div className="flex justify-between items-start">
                    <div className="bg-[#FEFAF3] text-[#3C9B3E] p-2 rounded-lg mb-3">
                      <Calendar size={16} />
                    </div>
                    <span className="text-[10px] font-bold text-[#686764] bg-gray-100 px-2 py-1 rounded">
                      {event.date?.seconds ? new Date(event.date.seconds * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'TBA'}
                    </span>
                  </div>
                  <h4 className="font-bold text-[#131313] leading-tight mb-1">{event.title}</h4>
                  <div className="flex items-center gap-1 text-[11px] text-[#686764]">
                    <MapPin size={10} /> {event.location}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-10 text-center text-[#686764] text-sm italic bg-white/50 rounded-2xl border-2 border-dashed border-[#E5E2DA]">
                No upcoming events found.
              </div>
            )}

            {moreUpcomingAvailable && (
              <button 
                onClick={() => fetchUpcomingEvents(true)}
                className="w-full py-3 text-xs font-bold text-[#003D11] bg-white border border-[#E5E2DA] rounded-xl hover:bg-[#FEFAF3] transition-colors flex items-center justify-center gap-1"
              >
                {loadingUpcoming ? 'Loading...' : 'View More Upcoming'} <ChevronRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      <CreateEventModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} onSaved={() => { fetchEvents(); fetchUpcomingEvents(); }} eventToEdit={eventToEdit} />
    </AdminLayout>
  );
};

export default Events;