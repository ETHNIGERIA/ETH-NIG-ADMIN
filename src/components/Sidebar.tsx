'use client';

import { useRouter, usePathname } from 'next/navigation';
import { auth } from '../firebase';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Newspaper,
  Briefcase,
  LogOut,
  Handshake,
  BadgeDollarSign, // Added icon for Sponsorships
} from 'lucide-react';
import clsx from 'clsx';

const navLinks = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Events', icon: Calendar, path: '/events' },
  { label: 'Community', icon: Users, path: '/community' },
  { label: 'Partnerships', icon: Handshake, path: '/partnership' }, 
  { label: 'Sponsorships', icon: BadgeDollarSign, path: '/sponsorships' },
  { label: 'Blogs', icon: Newspaper, path: '/blogs' },
  { label: 'Career', icon: Briefcase, path: '/career' },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white shadow-md p-4 min-h-screen">
      <img src="/images/logo.png" className='mx-auto w-16' alt="Ethereum Nigeria Logo" />
      <h2 className="text-xl font-bold mb-8 text-center">Ethereum Nigeria</h2>
      <nav className="space-y-2">
        {navLinks.map(({ label, icon: Icon, path }) => (
          <button
            key={path}
            onClick={() => router.push(path)}
            className={clsx(
              'flex items-center w-full px-4 py-2 text-sm font-medium rounded-lg hover:bg-gray-100 transition',
              pathname === path ? 'bg-[#3C9B3E] text-white' : 'text-gray-700'
            )}
          >
            <Icon className="w-5 h-5 mr-3" />
            {label}
          </button>
        ))}

        <div className="pt-4 mt-4 border-t border-gray-100">
          <button
            onClick={() => {
              auth.signOut();
              router.push('/');
            }}
            className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Log Out
          </button>
        </div>
      </nav>
    </aside>
  );
}