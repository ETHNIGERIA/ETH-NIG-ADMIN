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
  updateDoc,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db } from '@/firebase';
import Loader from '@/components/Loader';
import { Eye, Trash2, CheckCircle, Mail, Globe, User, MessageSquare, X, BadgeDollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Sponsorships = () => {
  type SponsorInquiry = {
    id: string;
    fullName: string;
    email: string;
    companyName: string;
    sponsorshipTier: string; // Changed from participationType
    message: string;        // Changed from interests
    website?: string;
    status: 'pending' | 'reviewed' | 'approved';
    createdAt: any;
    [key: string]: any;
  };

  const [inquiries, setInquiries] = useState<SponsorInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState<SponsorInquiry | null>(null);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      // Pointing to the specific sponsorship collection
      const q = query(collection(db, 'sponsorship_inquiries'), orderBy('createdAt', 'desc'), limit(15));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SponsorInquiry[];
      setInquiries(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'sponsorship_inquiries', id), { status: newStatus });
      setInquiries(prev => prev.map(i => i.id === id ? { ...i, status: newStatus as any } : i));
      if (selectedInquiry?.id === id) setSelectedInquiry(prev => prev ? { ...prev, status: newStatus as any } : null);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchInquiries(); }, []);

  return (
    <AdminLayout>
      <div className="relative min-h-screen bg-[#F9F9F9]">
        <div className="p-6 max-w-7xl mx-auto">
          <div className="mb-8 flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold text-[#003D11] flex items-center gap-3">
                <BadgeDollarSign className="w-8 h-8" /> Event Sponsorships
              </h1>
              <p className="text-gray-500 mt-1">Review and manage sponsorship requests for ETH Nigeria events.</p>
            </div>
          </div>

          {loading ? <Loader /> : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#003D11] text-white">
                    <th className="p-5 font-semibold text-sm uppercase tracking-wider">Company</th>
                    <th className="p-5 font-semibold text-sm uppercase tracking-wider">Contact</th>
                    <th className="p-5 font-semibold text-sm uppercase tracking-wider">Tier</th>
                    <th className="p-5 font-semibold text-sm uppercase tracking-wider text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {inquiries.map((inquiry) => (
                    <tr 
                      key={inquiry.id} 
                      onClick={() => setSelectedInquiry(inquiry)}
                      className="group hover:bg-[#3C9B3E]/5 cursor-pointer transition-all"
                    >
                      <td className="p-5">
                        <span className="font-bold text-gray-800 group-hover:text-[#003D11]">{inquiry.companyName}</span>
                      </td>
                      <td className="p-5 text-gray-600">{inquiry.fullName}</td>
                      <td className="p-5">
                        <span className="px-3 py-1 bg-emerald-50 rounded-lg text-xs font-bold text-emerald-700 border border-emerald-100 uppercase">
                          {inquiry.sponsorshipTier || 'General'}
                        </span>
                      </td>
                      <td className="p-5 text-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                          inquiry.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {inquiry.status || 'pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {inquiries.length === 0 && (
                <div className="p-20 text-center text-gray-400">No sponsorship inquiries found.</div>
              )}
            </div>
          )}
        </div>

        {/* SIDE DRAWER FOR DETAILS */}
        <AnimatePresence>
          {selectedInquiry && (
            <>
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setSelectedInquiry(null)}
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[80]"
              />
              
              <motion.div 
                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 h-screen w-full max-w-md bg-white z-[90] shadow-2xl flex flex-col"
              >
                <div className="p-6 border-b flex justify-between items-center bg-[#F4FFF6]">
                  <h2 className="text-xl font-bold text-[#003D11]">Sponsor Details</h2>
                  <button onClick={() => setSelectedInquiry(null)} className="p-2 hover:bg-gray-200 rounded-full transition">
                    <X className="w-6 h-6 text-gray-500" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                  <div className="flex flex-col items-center">
                    <div className="w-20 h-20 rounded-full bg-[#E4FFEA] flex items-center justify-center text-[#3C9B3E] shadow-inner mb-4">
                      <BadgeDollarSign size={40} />
                    </div>
                    <h3 className="text-2xl font-bold text-center text-gray-900">{selectedInquiry.companyName}</h3>
                    <p className="text-[#3C9B3E] font-bold uppercase text-xs tracking-widest mt-1">{selectedInquiry.sponsorshipTier} Sponsor</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                      <User className="w-5 h-5 text-[#3C9B3E] mt-1" />
                      <div>
                        <p className="text-xs text-gray-400 font-bold uppercase">Representative</p>
                        <p className="text-gray-800 font-semibold">{selectedInquiry.fullName}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                      <Mail className="w-5 h-5 text-[#3C9B3E] mt-1" />
                      <div>
                        <p className="text-xs text-gray-400 font-bold uppercase">Contact Email</p>
                        <p className="text-gray-800 font-semibold">{selectedInquiry.email}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                      <Globe className="w-5 h-5 text-[#3C9B3E] mt-1" />
                      <div>
                        <p className="text-xs text-gray-400 font-bold uppercase">Website</p>
                        <p className="text-gray-800 font-semibold break-all">{selectedInquiry.website || 'Not provided'}</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 p-4 bg-[#F9FFF9] rounded-xl border border-[#3C9B3E]/10">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-[#3C9B3E]" />
                        <p className="text-xs text-gray-400 font-bold uppercase">Sponsorship Message</p>
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed italic">"{selectedInquiry.message}"</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t bg-gray-50 flex gap-3">
                  {selectedInquiry.status !== 'approved' && (
                    <button 
                      onClick={() => updateStatus(selectedInquiry.id, 'approved')}
                      className="flex-1 bg-[#3C9B3E] text-white py-4 rounded-xl font-bold hover:bg-[#003D11] transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" /> Confirm Sponsor
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      if(confirm("Permanently delete this sponsor request?")) {
                        deleteDoc(doc(db, 'sponsor_inquiries', selectedInquiry.id));
                        setInquiries(prev => prev.filter(i => i.id !== selectedInquiry.id));
                        setSelectedInquiry(null);
                      }
                    }}
                    className="px-5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
};

export default Sponsorships;