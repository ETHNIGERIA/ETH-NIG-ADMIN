'use client';

import AdminLayout from '@/components/AdminLayout';
import React, { useEffect, useState } from 'react';
import { Calendar, Users, Newspaper, Briefcase } from 'lucide-react';
import { collection, getCountFromServer } from 'firebase/firestore';
import { db } from '@/firebase';
import Loader from '@/components/Loader';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({
    events: 0,
    communities: 0,
    blogPosts: 0,
    careers: 0,
  });

  const fetchCounts = async () => {
    setLoading(true);
    try {
      const [eventsSnap, communitiesSnap, blogsSnap, careersSnap] = await Promise.all([
        getCountFromServer(collection(db, 'events')),
        getCountFromServer(collection(db, 'communities')),
        getCountFromServer(collection(db, 'blogs')),
        getCountFromServer(collection(db, 'careers')),
      ]);

      setCounts({
        events: eventsSnap.data().count,
        communities: communitiesSnap.data().count,
        blogPosts: blogsSnap.data().count,
        careers: careersSnap.data().count,
      });
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  const stats = [
    { label: 'Total Events', value: counts.events, icon: Calendar },
    { label: 'Total Communities', value: counts.communities, icon: Users },
    { label: 'Total Blog Posts', value: counts.blogPosts, icon: Newspaper },
    { label: 'Total Careers', value: counts.careers, icon: Briefcase },
  ];

  return (
    <AdminLayout>
      <div>
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

        {loading ? (
          <Loader />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map(({ label, value, icon: Icon }, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow p-6 flex items-center space-x-4"
              >
                <div className="p-3 bg-[#3C9B3E] rounded-lg">
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">{label}</p>
                  <h2 className="text-3xl font-semibold mt-2">{value}</h2>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
