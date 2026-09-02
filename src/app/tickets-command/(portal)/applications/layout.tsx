import type { ReactNode } from 'react';
import { ApplicationsTabs } from '@/tickets-portal/components/applications/ApplicationsTabs';

export default function ApplicationsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[28px] font-semibold tracking-tight text-stone-900">Applications</h1>
        <p className="mt-2 text-[15px] text-stone-600">Review volunteer and influencer submissions.</p>
      </header>
      <ApplicationsTabs />
      {children}
    </div>
  );
}
