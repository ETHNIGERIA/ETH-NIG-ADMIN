'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CreditCard, LayoutDashboard, Settings2, UsersRound, Workflow, Mic } from 'lucide-react';

const groups = [
  { label: 'Overview', first: '', sections: [''], icon: LayoutDashboard },
  { label: 'Setup', first: 'settings', sections: ['settings', 'tickets', 'fields'], icon: Settings2 },
  { label: 'Attendees', first: 'registrations', sections: ['registrations', 'communications', 'check-in'], icon: UsersRound },
  { label: 'Finance', first: 'payments', sections: ['payments', 'promotions'], icon: CreditCard },
  { label: 'Program', first: 'programs', sections: ['programs', 'side-events'], icon: Workflow },
  { label: 'People', first: 'speakers', sections: ['speakers', 'sponsors', 'applications'], icon: Mic },
] as const;

const sectionLabels: Record<string, string> = {
  settings: 'Event settings', tickets: 'Tickets & pricing', fields: 'Registration form',
  registrations: 'Registrations', communications: 'Communications', 'check-in': 'Check-in', payments: 'Payments', promotions: 'Promo codes',
  programs: 'Program access', 'side-events': 'Side events', speakers: 'Speakers', sponsors: 'Sponsors',
};

const peopleTabs = [
  { key: 'speakers', label: 'Speakers', path: 'speakers' },
  { key: 'speaker-applications', label: 'Speaker applications', path: 'applications/speakers' },
  { key: 'sponsors', label: 'Sponsors', path: 'sponsors' },
  { key: 'sponsor-applications', label: 'Sponsor applications', path: 'applications/sponsors' },
] as const;

export function EventConsoleNav({ eventId }: { eventId: string }) {
  const pathname = usePathname();
  const base = `/tickets-command/events-v2/${eventId}`;
  const section = pathname.slice(base.length).split('/').filter(Boolean)[0] || '';
  const activeGroup = groups.find((group) => (group.sections as readonly string[]).includes(section)) ?? groups[0];
  const applicationKind = pathname.slice(base.length).split('/').filter(Boolean)[1];
  const activeTab = section === 'applications'
    ? applicationKind === 'sponsors' ? 'sponsor-applications' : 'speaker-applications'
    : section;
  const tabs = activeGroup.label === 'People'
    ? peopleTabs
    : activeGroup.sections.map((item) => ({ key: item, label: sectionLabels[item], path: item }));

  return <nav aria-label="Event sections" className="bg-white">
    <div className="border-b border-slate-200 px-2 sm:px-4"><div className="flex flex-wrap gap-x-1">
      {groups.map(({ label, first, icon: Icon }) => {
        const active = activeGroup.label === label;
        return <Link key={label} href={`${base}${first ? `/${first}` : ''}`} prefetch={false} aria-current={active && section === first ? 'page' : undefined} className={`inline-flex shrink-0 items-center gap-2 whitespace-nowrap border-b-[3px] px-4 py-3 text-sm font-bold transition-colors ${active ? 'border-blue-600 text-blue-800' : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-900'}`}><Icon className="h-4 w-4" />{label}</Link>;
      })}
    </div></div>
    {tabs.length > 1 ? <div className="bg-slate-50 px-3 py-2 sm:px-5"><div className="flex flex-wrap items-center gap-1">
      {tabs.map((item) => <Link key={item.key} href={`${base}/${item.path}`} prefetch={false} aria-current={activeTab === item.key ? 'page' : undefined} className={`shrink-0 whitespace-nowrap rounded-sm border px-3 py-2 text-xs font-bold transition-colors ${activeTab === item.key ? 'border-blue-300 bg-blue-100 text-blue-800' : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-white hover:text-blue-800'}`}>{item.label}</Link>)}
    </div></div> : null}
  </nav>;
}
