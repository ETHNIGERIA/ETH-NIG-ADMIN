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
import { 
  Mail, 
  ExternalLink, 
  Trash2, 
  MapPin, 
  Users, 
  RefreshCw, 
  Plus, 
  Globe 
} from 'lucide-react';

const Community = () => {
  type Community = {
    id: string;
    name?: string;
    location?: string;
    link?: string;
    image?: string;
    description?: string;
    contactEmail?: string;
    communitySize?: string;
    submittedAt?: string;
    [key: string]: any;
  };

  const [communities, setCommunities] = useState<Community[]>([]);
  const [proposals, setProposals] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProposals, setLoadingProposals] = useState(true);
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

  const fetchProposals = async () => {
    setLoadingProposals(true);
    try {
      const q = query(collection(db, 'community_proposals'), orderBy('submittedAt', 'desc'), limit(10));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProposals(data);
    } catch (err) {
      console.error('Error fetching proposals:', err);
    } finally {
      setLoadingProposals(false);
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
        setCommunities(prev => prev.filter(c => c.id !== id));
      } catch (err) {
        console.error('Error deleting community:', err);
      }
    }
  };

  const handleDeleteProposal = async (id: string) => {
    if (confirm('Dismiss this community proposal?')) {
      try {
        await deleteDoc(doc(db, 'community_proposals', id));
        setProposals(prev => prev.filter(p => p.id !== id));
      } catch (err) {
        console.error('Error deleting proposal:', err);
      }
    }
  };

  useEffect(() => {
    fetchCommunities();
    fetchProposals();
  }, []);

  return (
    <AdminLayout>
      <div className="flex flex-col lg:flex-row min-h-screen bg-[#FDFCF9]">
        
        {/* LEFT SIDE: Active Directory (70%) */}
        <div className="flex-[2.5] p-6 lg:p-10">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[#131313] tracking-tight">Communities</h1>
              <p className="text-[#686764] text-sm mt-1">Manage the directory of active Ethereum Nigeria communities.</p>
            </div>
            <button
              onClick={() => {
                setCommunityToEdit(null);
                setShowModal(true);
              }}
              className="bg-[#003D11] hover:bg-[#3C9B3E] text-white px-5 py-3 rounded-xl font-semibold transition-all shadow-sm flex items-center gap-2"
            >
              <Plus size={18} /> Add Community
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader /></div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E5E2DA] overflow-hidden shadow-sm">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="bg-[#F8F7F2] border-b border-[#E5E2DA]">
                    <th className="p-5 text-xs uppercase tracking-widest font-bold text-[#686764]">Name</th>
                    <th className="p-5 text-xs uppercase tracking-widest font-bold text-[#686764]">Location</th>
                    <th className="p-5 text-xs uppercase tracking-widest font-bold text-[#686764]">Web Link</th>
                    <th className="p-5 text-xs uppercase tracking-widest font-bold text-[#686764] text-right">Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E2DA]">
                  {communities.map((community) => (
                    <tr key={community.id} className="hover:bg-[#FEFAF3]/50 transition-colors">
                      <td className="p-5 font-semibold text-[#131313]">{community.name}</td>
                      <td className="p-5 text-[#686764] text-sm">
                        <div className="flex items-center gap-1.5"><MapPin size={14} className="text-[#3C9B3E]"/> {community.location}</div>
                      </td>
                      <td className="p-5">
                        {community.link ? (
                          <a href={community.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#3C9B3E] hover:underline font-medium text-sm">
                            Visit <ExternalLink size={12}/>
                          </a>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="p-5 text-right space-x-4">
                        <button
                          onClick={() => {
                            setCommunityToEdit(community);
                            setShowModal(true);
                          }}
                          className="text-[#003D11] hover:text-[#3C9B3E] text-xs font-bold uppercase"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(community.id)}
                          className="text-red-400 hover:text-red-600 transition-colors inline-block align-middle"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {hasMore && (
                <div className="p-4 bg-[#F8F7F2] text-center border-t border-[#E5E2DA]">
                  <button
                    onClick={fetchMore}
                    disabled={loadingMore}
                    className="text-xs font-black text-[#003D11] hover:text-[#3C9B3E] tracking-tighter disabled:opacity-50"
                  >
                    {loadingMore ? 'LOADING...' : 'SHOW MORE'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT SIDE: Proposals Sidebar (30%) */}
        <div className="flex-1 bg-[#F1EFE9]/50 border-l border-[#E5E2DA] p-6 lg:p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-[#131313] flex items-center gap-3">
              Proposals 
              <span className="bg-[#003D11] text-[#FEFAF3] text-[10px] px-2 py-0.5 rounded-full">{proposals.length}</span>
            </h2>
            <button onClick={fetchProposals} className="p-2 hover:bg-[#E5E2DA] rounded-full transition-colors text-[#686764]">
              <RefreshCw size={16} className={loadingProposals ? "animate-spin" : ""} />
            </button>
          </div>

          <div className="space-y-6">
            {loadingProposals ? (
              <div className="flex justify-center py-10"><Loader /></div>
            ) : proposals.length > 0 ? (
              proposals.map((item) => (
                <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-[#E5E2DA] overflow-hidden flex flex-col group transition-all hover:shadow-md">
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-[#3C9B3E] uppercase tracking-widest flex items-center gap-1 mb-1">
                          <Users size={10} strokeWidth={3} /> {item.communitySize || 'Size TBD'}
                        </span>
                        <h3 className="text-lg font-bold text-[#131313] leading-none tracking-tight">{item.name}</h3>
                      </div>
                      <button 
                        onClick={() => handleDeleteProposal(item.id)}
                        className="p-1.5 text-[#CEC9C0] hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    
                    <p className="text-sm text-[#686764] leading-relaxed line-clamp-3 mb-5">
                      {item.description}
                    </p>

                    <div className="flex items-center gap-3 mb-6">
                       <span className="text-[11px] font-medium text-[#131313] flex items-center gap-1">
                         <MapPin size={12} className="text-[#3C9B3E]"/> {item.location}
                       </span>
                    </div>

                    <div className="flex gap-2">
                      <a 
                        href={`mailto:${item.contactEmail}`}
                        className="flex-1 flex items-center justify-center gap-2 bg-[#F8F7F2] hover:bg-[#E5E2DA] text-[#131313] py-2.5 rounded-xl text-xs font-bold transition-all border border-[#E5E2DA]"
                      >
                        <Mail size={14} /> Email
                      </a>
                      <a 
                        href={item.link}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 bg-[#003D11] hover:bg-[#3C9B3E] text-white py-2.5 rounded-xl text-xs font-bold transition-all"
                      >
                        <Globe size={14} /> Site
                      </a>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 bg-white/30 rounded-3xl border-2 border-dashed border-[#CEC9C0]">
                <p className="text-[#686764] text-xs font-medium uppercase tracking-widest">No New Submissions</p>
              </div>
            )}
          </div>
        </div>
      </div>

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