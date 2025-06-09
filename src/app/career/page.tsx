'use client';

import AdminLayout from '@/components/AdminLayout';
import { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db } from '@/firebase';
import Loader from '@/components/Loader';
import CreateCareer from '@/components/Modals/CreateCareer';

type Career = {
  id: string;
  title?: string;
  location?: string;
  type?: string; // Full-time, Part-time, Remote, etc.
  description?: string;
  link?: string;
  [key: string]: any;
};

const CareerPage = () => {
  const [careers, setCareers] = useState<Career[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [careerToEdit, setCareerToEdit] = useState<Career | null>(null);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const PAGE_LIMIT = 10;

  const fetchCareers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'careers'), orderBy('title'), limit(PAGE_LIMIT));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCareers(data);
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === PAGE_LIMIT);
    } catch (err) {
      console.error('Error fetching careers:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMore = async () => {
    if (!lastVisible || loadingMore || !hasMore) return;
    setLoadingMore(true);

    try {
      const q = query(
        collection(db, 'careers'),
        orderBy('title'),
        startAfter(lastVisible),
        limit(PAGE_LIMIT)
      );
      const snapshot = await getDocs(q);
      const moreData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCareers(prev => [...prev, ...moreData]);
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === PAGE_LIMIT);
    } catch (err) {
      console.error('Error fetching more careers:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this career?')) {
      try {
        await deleteDoc(doc(db, 'careers', id));
        setCareers(prev => prev.filter(c => c.id !== id));
      } catch (err) {
        console.error('Error deleting career:', err);
      }
    }
  };

  useEffect(() => {
    fetchCareers();
  }, []);

  return (
    <AdminLayout>
      <div className="p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Careers</h1>
          <button
            onClick={() => {
              setCareerToEdit(null);
              setShowModal(true);
            }}
            className="bg-[#003D11] hover:bg-[#3C9B3E] text-white px-4 py-2 rounded"
          >
            + Add Career
          </button>
        </div>

        {loading ? (
          <Loader />
        ) : (
          <div className="overflow-x-auto bg-white shadow rounded-lg">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-[#003D11] text-white">
                <tr>
                  <th className="p-4">Title</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Link</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {careers.map(career => (
                  <tr key={career.id} className="border-t">
                    <td className="p-4">{career.title}</td>
                    <td className="p-4">{career.location}</td>
                    <td className="p-4">{career.type}</td>
                    <td className="p-4">
                      {career.link ? (
                        <a href={career.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                          Apply
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setCareerToEdit(career);
                          setShowModal(true);
                        }}
                        className="bg-[#003D11] hover:bg-[#3C9B3E] text-white px-3 py-1 rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(career.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Load More */}
            {hasMore && (
              <div className="p-4 text-center">
                <button
                  onClick={fetchMore}
                  disabled={loadingMore}
                  className="text-sm text-blue-600 hover:underline disabled:opacity-50"
                >
                  {loadingMore ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <CreateCareer
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          careerToEdit={careerToEdit}
          onSaved={fetchCareers}
        />
      )}
    </AdminLayout>
  );
};

export default CareerPage;
