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
import CreateCommunity from '@/components/Modals/CreateCommunity';
import Loader from '@/components/Loader';

const Community = () => {
  type Community = {
    id: string;
    name?: string;
    location?: string;
    link?: string;
    image?: string;
    description?: string;
    [key: string]: any;
  };

  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [communityToEdit, setCommunityToEdit] = useState<Community | null>(null);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);

  const PAGE_LIMIT = 10;

  const fetchCommunities = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'communities'), orderBy('name'), limit(PAGE_LIMIT));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCommunities(data);
      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setHasMore(querySnapshot.docs.length === PAGE_LIMIT);
    } catch (err) {
      console.error('Error fetching communities:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMore = async () => {
    if (!lastVisible || loadingMore || !hasMore) return;
    setLoadingMore(true);

    try {
      const q = query(
        collection(db, 'communities'),
        orderBy('name'),
        startAfter(lastVisible),
        limit(PAGE_LIMIT)
      );
      const querySnapshot = await getDocs(q);
      const moreData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      setCommunities(prev => [...prev, ...moreData]);
      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setHasMore(querySnapshot.docs.length === PAGE_LIMIT);
    } catch (err) {
      console.error('Error fetching more communities:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this community?')) {
      try {
        await deleteDoc(doc(db, 'communities', id));
        setCommunities(prev => prev.filter(c => c.id !== id)); // Remove from local list
      } catch (err) {
        console.error('Error deleting community:', err);
      }
    }
  };

  useEffect(() => {
    fetchCommunities();
  }, []);

  return (
    <AdminLayout>
      <div className="p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Communities</h1>
          <button
            onClick={() => {
              setCommunityToEdit(null);
              setShowModal(true);
            }}
            className="bg-[#003D11] hover:bg-[#3C9B3E] text-white px-4 py-2 rounded"
          >
            + Add Community
          </button>
        </div>

        {loading ? (
          <Loader />
        ) : (
          <div className="overflow-x-auto bg-white shadow rounded-lg">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-[#003D11] text-white">
                <tr>
                  <th className="p-4">Name</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Link</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {communities.map((community) => (
                  <tr key={community.id} className="border-t">
                    <td className="p-4">{community.name}</td>
                    <td className="p-4">{community.location}</td>
                    <td className="p-4">
                      {community.link ? (
                        <a href={community.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                          Visit
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setCommunityToEdit(community);
                          setShowModal(true);
                        }}
                        className="bg-[#003D11] hover:bg-[#3C9B3E] text-white px-3 py-1 rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(community.id)}
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

      {/* Create/Edit Modal */}
      {showModal && (
        <CreateCommunity
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          communityToEdit={communityToEdit}
          onSaved={fetchCommunities}
        />
      )}
    </AdminLayout>
  );
};

export default Community;
