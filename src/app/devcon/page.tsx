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

interface CampusApplication {
  id: string;
  fullName: string;
  email: string;
  institution: string; 
  phone:string;
  telegram:string
  submittedAt?: { seconds: number } | null;
}

const Devcon = () => {
  const [communities, setCommunities] = useState<CampusApplication[]>([]);
  const [loading, setLoading] = useState(true);

  const PAGE_LIMIT = 100;

  const fetchCommunities = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'devcons'),
        limit(PAGE_LIMIT)
      );
      const querySnapshot = await getDocs(q);
      const data: CampusApplication[] = querySnapshot.docs.map((snapshot) => ({
        id: snapshot.id,
        ...snapshot.data(),
      })) as CampusApplication[];
      setCommunities(data);
    } catch (err) {
      console.error('Error fetching communities:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this community?')) {
      try {
        await deleteDoc(doc(db, 'devcons', id));
        setCommunities((prev) => prev.filter((c) => c.id !== id));
      } catch (err) {
        console.error('Error deleting community:', err);
      }
    }
  };

  // Download the full dataset as an .xlsx file
  const handleDownloadExcel = (rows: CampusApplication[] = communities) => {
    if (!rows.length) return;

    const exportRows = rows.map((c) => ({
      'Full Name': c.fullName,
      'Institution': c.institution,
      Email: c.email,
      'Submitted At': c.submittedAt
        ? new Date(c.submittedAt.seconds * 1000).toLocaleString()
        : '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);

    // Reasonable column widths so the sheet isn't unreadable on open
    worksheet['!cols'] = Object.keys(exportRows[0]).map((key) => ({
      wch: Math.min(Math.max(key.length, 15), 40),
    }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Applications');

    const timestamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `campus-applications-${timestamp}.xlsx`);
  };

  useEffect(() => {
    fetchCommunities();
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

            <button
              onClick={() => handleDownloadExcel()}
              disabled={!communities.length}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#003D11] text-white text-sm font-bold hover:bg-[#3C9B3E] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download size={16} />
              Download as Excel
            </button>
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
                      Email
                    </th>

                    <th className="p-5 text-xs uppercase tracking-widest font-bold text-[#686764]">
                      University/Institution
                    </th>
                    <th className="p-5 text-xs uppercase tracking-widest font-bold text-[#686764]">
                      Phone
                    </th>
                    <th className="p-5 text-xs uppercase tracking-widest font-bold text-[#686764]">
                      Telegram
                    </th>
                   
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E2DA]">
                  {communities.map((community) => (
                    <tr
                      key={community.id}
                      className="hover:bg-[#FEFAF3]/50 transition-colors"
                    >
                      <td className="p-5 font-semibold text-[#131313]">
                        <div className="flex items-center gap-1.5">
                          <MapPin size={14} className="text-[#3C9B3E]" />
                          {community.fullName}
                        </div>
                      </td>
                     
                      <td className="p-5 text-[#686764] text-sm">
                        {community.email}
                      </td>
                      <td className="p-5 text-[#686764] text-sm">
                        {community.institution}
                      </td>
                      <td className="p-5 text-[#686764] text-sm">
                        {community.phone}
                      </td>
                      <td className="p-5 text-[#686764] text-sm">
                        {community.telegram}
                      </td>
                     
                      <td className="p-5 text-right space-x-4">
                       
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
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Devcon;