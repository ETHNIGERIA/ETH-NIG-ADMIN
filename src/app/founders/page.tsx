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
} from 'firebase/firestore';
import { db } from '@/firebase';
import CreateCommunity from '@/components/Modals/CreateCommunity';
import Loader from '@/components/Loader';
import * as XLSX from 'xlsx';
import {
  Mail,
  ExternalLink,
  Trash2,
  MapPin,
  Users,
  RefreshCw,
  Plus,
  Globe,
  Download,
} from 'lucide-react';

interface Founders {
 id: string;
 email: string;
 name: string;
 startup: string;
 status: string;
 why: string;


}

const Founders = () => {
  const [founders, setFounders] = useState<Founders[]>([]);
  const [loading, setLoading] = useState(true);

  const PAGE_LIMIT = 100;

  const fetchFounders = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'hackhouseApplications'),
        orderBy('fullName'),
        limit(PAGE_LIMIT)
      );
      const querySnapshot = await getDocs(q);
      const data: Founders[] = querySnapshot.docs.map((snapshot) => ({
          id: snapshot.id,
          ...snapshot.data(),
      })) as unknown as Founders[];
      setFounders(data);
    } catch (err) {
      console.error('Error fetching hackhouseApplications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this community?')) {
      try {
        await deleteDoc(doc(db, 'hackhouseApplications', id));
        setFounders((prev) => prev.filter((c) => c.id !== id));
      } catch (err) {
        console.error('Error deleting community:', err);
      }
    }
  };

  

  useEffect(() => {
    fetchFounders();
  }, []);

  return (
    <AdminLayout>
      <div className="flex flex-col lg:flex-row min-h-screen bg-[#FDFCF9]">
        {/* LEFT SIDE: Active Directory */}
        <div className="flex-[2.5] p-6 lg:p-10">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[#131313] tracking-tight">
                Communities
              </h1>
              <p className="text-[#686764] text-sm mt-1">
                Manage the directory of active Ethereum Nigeria communities.
              </p>
            </div>

           
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader />
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E5E2DA] overflow-hidden shadow-sm overflow-x-auto">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="bg-[#F8F7F2] border-b border-[#E5E2DA]">
                    <th className="p-5 text-xs uppercase tracking-widest font-bold text-[#686764]">
                      Name
                    </th>
                    <th className="p-5 text-xs uppercase tracking-widest font-bold text-[#686764]">
                      University
                    </th>
                    <th className="p-5 text-xs uppercase tracking-widest font-bold text-[#686764]">
                      Department
                    </th>
                    <th className="p-5 text-xs uppercase tracking-widest font-bold text-[#686764]">
                      Email
                    </th>
                    <th className="p-5 text-xs uppercase tracking-widest font-bold text-[#686764]">
                      Familiarity
                    </th>
                    <th className="p-5 text-xs uppercase tracking-widest font-bold text-[#686764]">
                      Consent
                    </th>
                    <th className="p-5 text-xs uppercase tracking-widest font-bold text-[#686764] text-right">
                      Control
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E2DA]">
                  {founders.map((founder) => (
                    <tr
                      key={founder.id}
                      className="hover:bg-[#FEFAF3]/50 transition-colors"
                    >
                      <td className="p-5 text-[#686764] text-sm">
                        {founder.name}
                      </td>
                      <td className="p-5 text-[#686764] text-sm">
                        {founder.startup}
                      </td>
                      <td className="p-5 text-[#686764] text-sm">
                        {founder.email}
                      </td>
                      <td className="p-5 text-[#686764] text-sm">
                        {founder.status}
                      </td>
                      
                      <td className="p-5 text-right space-x-4">
                        <button
                          onClick={() => handleDelete(founder.id)}
                          className="text-red-400 hover:text-red-600 transition-colors inline-block align-middle"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Founders;