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
  communityName: string;
  consent: boolean;
  department: string;
  email: string;
  faculty: string;
  familiarity: string;
  fullName: string;
  hackathonList: string;
  hasCommunity: string;
  hasResearchContent: string;
  hasStartupIdea: string;
  interestedAmbassador: string;
  level: string;
  linkedin: string;
  participatedHackathon: string;
  phone: string;
  programInterest: string;
  researchLinks: string[] | null;
  startupDescription: string[] | null;
  submittedAt: string; // or Date, depending on how it's parsed
  telegram: string;
  twitter: string;
  university: string;
  whyJoin: string;
  willingToCoordinate: string;
}

const Campus = () => {
  const [communities, setCommunities] = useState<CampusApplication[]>([]);
  const [loading, setLoading] = useState(true);

  const PAGE_LIMIT = 100;

  const fetchCommunities = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'campus-tour-applications'),
        orderBy('fullName'),
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
        await deleteDoc(doc(db, 'campus-tour-applications', id));
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
      'Community Name': c.communityName,
      University: c.university,
      Faculty: c.faculty,
      Department: c.department,
      Level: c.level,
      Email: c.email,
      Phone: c.phone,
      Telegram: c.telegram,
      Twitter: c.twitter,
      LinkedIn: c.linkedin,
      'Program Interest': c.programInterest,
      Familiarity: c.familiarity,
      'Has Community': c.hasCommunity,
      'Willing To Coordinate': c.willingToCoordinate,
      'Interested Ambassador': c.interestedAmbassador,
      'Participated Hackathon': c.participatedHackathon,
      'Hackathon List': c.hackathonList,
      'Has Research Content': c.hasResearchContent,
      'Research Links': c.researchLinks ? c.researchLinks.join(', ') : '',
      'Has Startup Idea': c.hasStartupIdea,
      'Startup Description': c.startupDescription
        ? c.startupDescription.join(', ')
        : '',
      'Why Join': c.whyJoin,
      Consent: c.consent,
      'Submitted At': c.submittedAt,
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
                        {community.university}
                      </td>
                      <td className="p-5 text-[#686764] text-sm">
                        {community.department}
                      </td>
                      <td className="p-5 text-[#686764] text-sm">
                        {community.email}
                      </td>
                      <td className="p-5 text-[#686764] text-sm">
                        {community.familiarity}
                      </td>
                      <td className="p-5 text-[#686764] text-sm">
                        {community.consent ? 'Yes' : 'No'}
                      </td>
                      <td className="p-5 text-right space-x-4">
                        <button
                          onClick={() => handleDownloadExcel([community])}
                          className="text-[#003D11] hover:text-[#3C9B3E] text-xs font-bold uppercase"
                        >
                          Download as Excel
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
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Campus;