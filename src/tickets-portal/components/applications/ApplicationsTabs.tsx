'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

const tabs = [
  { href: '/tickets-command/applications/volunteers', label: 'Volunteers' },
  { href: '/tickets-command/applications/influencers', label: 'Influencers' },
] as const;

export function ApplicationsTabs() {
  const pathname = usePathname();
  return (
    <div className="flex gap-1 border-b border-stone-200">
      {tabs.map(({ href, label }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={clsx(
              '-mb-px border-b-2 px-3 py-2 text-[14px] font-medium transition-colors',
              active
                ? 'border-stone-900 text-stone-900'
                : 'border-transparent text-stone-500 hover:text-stone-800',
            )}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
