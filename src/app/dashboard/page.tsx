'use client';

import AdminLayout from '@/components/AdminLayout';
import React, { useEffect, useState } from 'react';
import { 
  Calendar, 
  Users, 
  Newspaper, 
  Briefcase, 
  Handshake,
  GlobeIcon, 
  TrendingUp, 
  ShieldCheck, 
  Database, 
  HardDrive,
  BadgeDollarSign // Added for Sponsors
} from 'lucide-react';
import { collection, getCountFromServer } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { db, auth } from '@/firebase';
import Loader from '@/components/Loader';
import { label } from 'framer-motion/client';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [counts, setCounts] = useState({
    events: 0,
    communities: 0,
    blogPosts: 0,
    careers: 0,
    partnerships: 0,
    sponsorships: 0, // Added sponsorship count
    community_proposals: 0,
  });

  const getAdminName = () => {
    if (adminUser?.displayName) return adminUser.displayName;
    if (adminUser?.email) return adminUser.email.split('@')[0];
    return 'Admin';
  };

  const fetchCounts = async () => {
    try {
      // Added 'sponsor_inquiries' to the collection list
      const collections = [
        'events', 
        'communities', 
        'blogs', 
        'careers', 
        'partnership_inquiries',
        'sponsor_inquiries',
        'community_proposals' 
      ];
      
      const [ev, comm, blog, car, part, spon, comm_prop] = await Promise.all(
        collections.map(col => getCountFromServer(collection(db, col)))
      );

      setCounts({
        events: ev.data().count,
        communities: comm.data().count,
        blogPosts: blog.data().count,
        careers: car.data().count,
        partnerships: part.data().count,
        sponsorships: spon.data().count,
        community_proposals: comm_prop.data().count,
      });
    } catch (err) {
      console.error('Stats Error:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAdminUser(user);
      fetchCounts().finally(() => setLoading(false));
    });
    return () => unsubscribe();
  }, []);

  // Updated stats array to include Sponsorships
  const stats = [
    { label: 'Partnership Inquiries', value: counts.partnerships, icon: Handshake, color: 'bg-blue-600' },
    { label: 'Community Proposals', value: counts.community_proposals, icon: GlobeIcon, color: 'bg-yellow-600' },
    { label: 'Sponsor Inquiries', value: counts.sponsorships, icon: BadgeDollarSign, color: 'bg-emerald-600' }, // New Stat Card
    { label: 'Total Events', value: counts.events, icon: Calendar, color: 'bg-green-600' },
    { label: 'Total Communities', value: counts.communities, icon: Users, color: 'bg-purple-600' },
    { label: 'Total Blog Posts', value: counts.blogPosts, icon: Newspaper, color: 'bg-orange-600' },
    { label: 'Total Careers', value: counts.careers, icon: Briefcase, color: 'bg-red-600' },
  ];

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-8 pb-10">
        {/* Welcome Hero */}
        <div className="bg-[#3C9B3E] rounded-3xl p-8 md:p-12 text-white shadow-xl flex justify-between items-center relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-4xl font-extrabold capitalize leading-tight">
              Welcome back, <br />{getAdminName()}!
            </h1>
            <p className="mt-4 opacity-90 text-lg max-w-md">
              The Ethereum Nigeria ecosystem activities overview.
            </p>
          </div>
          <TrendingUp className="w-48 h-48 absolute -right-8 -bottom-8 opacity-10 rotate-12" />
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center"><Loader /></div>
        ) : (
          <div className="space-y-8">
            {/* Stats Grid - Now shows 6 items (3 per row on LG screens) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stats.map(({ label, value, icon: Icon, color }, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex items-center justify-between group hover:border-[#3C9B3E] transition-all"
                >
                  <div className="space-y-1">
                    <p className="text-gray-500 font-medium">{label}</p>
                    <h2 className="text-4xl font-bold text-gray-900">{value}</h2>
                  </div>
                  <div className={`p-4 ${color} rounded-2xl text-white shadow-lg transform group-hover:scale-110 transition-transform`}>
                    <Icon className="w-8 h-8" />
                  </div>
                </div>
              ))}
            </div>

            {/* System Status & Recent Activity Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Submission Previews */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 min-h-[300px]">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">Recent Sponsorship & Partnerships</h3>
                    <button className="text-sm font-semibold text-[#3C9B3E] hover:underline">View All</button>
                  </div>
                  <div className="flex flex-col items-center justify-center h-48 text-gray-400 border-2 border-dashed border-gray-50 rounded-2xl">
                    <BadgeDollarSign className="w-16 h-16 mb-4 opacity-10" />
                    <p className="text-center px-6 text-sm">Latest inquiries will appear here after database integration.</p>
                  </div>
                </div>
              </div>
              
              {/* System Health / Storage Section */}
              <div className="space-y-6">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <ShieldCheck className="w-6 h-6 text-[#3C9B3E]" />
                    System Overview
                  </h3>
                  
                  <div className="space-y-5">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-green-50 rounded-lg text-green-600">
                        <Database className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1 text-sm font-medium">
                          <span>Database Usage</span>
                          <span className="text-green-600 font-bold italic text-xs">Healthy</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className="bg-[#3C9B3E] h-2 rounded-full w-[12%]"></div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                        <HardDrive className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1 text-sm font-medium">
                          <span>Media Storage</span>
                          <span className="text-blue-600 font-normal text-xs italic">9% used</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full w-[9%]"></div>
                        </div>
                      </div>
                    </div>

                    <hr className="border-gray-50" />
                    
                    <div className="pt-2">
                      <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-3">Logged in as</p>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="w-8 h-8 rounded-full bg-[#3C9B3E] flex items-center justify-center text-white text-xs font-bold">
                          {getAdminName().charAt(0).toUpperCase()}
                        </div>
                        <p className="text-sm font-medium text-gray-700 truncate">{adminUser?.email}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Dashboard;