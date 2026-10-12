import Link from 'next/link';

export function SpeakersTabs({ active }: { active: 'applications' | 'public' }) {
  const tabs = [
    { href: '/tickets-command/speakers', label: 'Applications', key: 'applications' },
    { href: '/tickets-command/speakers/public', label: 'Public speakers', key: 'public' },
  ] as const;

  return (
    <nav aria-label="Speaker management" className="flex gap-6 border-b border-stone-200">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          aria-current={active === tab.key ? 'page' : undefined}
          className={`-mb-px border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
            active === tab.key
              ? 'border-stone-900 text-stone-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
