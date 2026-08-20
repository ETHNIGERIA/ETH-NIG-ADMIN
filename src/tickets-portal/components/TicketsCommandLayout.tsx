'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Calendar,
  LayoutDashboard,
  Megaphone,
  Menu,
  Shield,
  Users,
  UsersRound,
  X,
  BookOpen,
  Globe,
  PlusCircle,
  Ticket,
} from 'lucide-react';
import clsx from 'clsx';
import { ToastProvider } from '@/tickets-portal/components/ui/ToastProvider';

const TICKETS_NAV = [
  { href: '/tickets-command', label: 'Overview', icon: LayoutDashboard },
  { href: '/tickets-command/events', label: 'Events', icon: Calendar },
  { href: '/tickets-command/influencers', label: 'Influencers', icon: Megaphone },
  { href: '/tickets-command/communities', label: 'Communities', icon: UsersRound },
  { href: '/tickets-command/users', label: 'Users', icon: Users },
  { href: '/tickets-command/admins', label: 'Admins', icon: Shield },
] as const;

const BLOG_NAV = [
  { href: '/tickets-command/blogs', label: 'All Articles', icon: BookOpen },
  { href: '/tickets-command/blogs/new', label: 'New Article', icon: PlusCircle },
  { href: '/tickets-command/sites', label: 'Web Sites', icon: Globe },
] as const;

export function TicketsCommandLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Determine active module based on current URL
  const isBlogModule =
    pathname.startsWith('/tickets-command/blogs') ||
    pathname.startsWith('/tickets-command/sites');

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  async function logout() {
    await fetch('/api/tickets-auth/logout', { method: 'POST' });
    window.location.assign('/tickets-command/login');
  }

  return (
    <ToastProvider>
      <div className="flex min-h-dvh flex-col bg-[#fbfbfa] text-stone-900 antialiased">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex h-[52px] shrink-0 items-center gap-3 border-b border-stone-200/80 bg-[#fbfbfa]/90 px-5 backdrop-blur-md lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="-ml-1 rounded-md p-2 text-stone-600 transition-colors hover:bg-black/[0.04]"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5 stroke-[1.5]" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold tracking-tight text-stone-900">
              {isBlogModule ? 'Blog & Sites' : 'Tickets'}
            </p>
            <p className="truncate text-[13px] text-stone-500">Command Center</p>
          </div>
        </header>

        <button
          type="button"
          aria-hidden={!mobileOpen}
          className={clsx(
            'fixed inset-0 z-40 bg-stone-900/10 transition-opacity lg:hidden',
            mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
          )}
          onClick={() => setMobileOpen(false)}
        />

        <div className="flex min-h-0 min-h-[calc(100dvh-52px)] flex-1 flex-row items-stretch lg:min-h-dvh">
          <aside
            className={clsx(
              'fixed inset-y-0 left-0 z-50 flex w-[min(18rem,88vw)] flex-col border-r border-stone-200/90 bg-[#f7f6f3] transition-transform duration-200 ease-out',
              'lg:inset-auto lg:sticky lg:top-0 lg:z-0 lg:h-dvh lg:max-h-dvh lg:w-[240px] lg:shrink-0 lg:translate-x-0 lg:overflow-y-auto',
              mobileOpen ? 'translate-x-0 shadow-[4px_0_24px_rgba(0,0,0,0.06)]' : '-translate-x-full lg:translate-x-0',
            )}
          >
            {/* Brand Header */}
            <div className="flex h-[52px] shrink-0 items-center justify-between px-4 lg:h-auto lg:flex-col lg:items-stretch lg:gap-0 lg:px-3 lg:pb-1 lg:pt-5">
              <div className="min-w-0 py-3 lg:py-0 lg:px-2">
                <p className="text-[13px] font-semibold tracking-tight text-stone-900">Admin Command</p>
                <p className="mt-0.5 text-[12px] text-stone-500">ETH Nigeria Portal</p>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-md p-2 text-stone-500 hover:bg-black/[0.05] lg:hidden"
                aria-label="Close menu"
              >
                <X className="h-5 w-5 stroke-[1.5]" />
              </button>
            </div>

            {/* Module Switcher Tabs */}
            <div className="px-2.5 pt-3 pb-1">
              <div className="flex rounded-lg bg-stone-200/70 p-0.5 text-xs font-medium">
                <Link
                  href="/tickets-command"
                  className={clsx(
                    'flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 text-center transition-all',
                    !isBlogModule
                      ? 'bg-white font-semibold text-stone-900 shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900',
                  )}
                >
                  <Ticket className="h-3.5 w-3.5" />
                  Tickets
                </Link>
                <Link
                  href="/tickets-command/blogs"
                  className={clsx(
                    'flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 text-center transition-all',
                    isBlogModule
                      ? 'bg-white font-semibold text-stone-900 shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900',
                  )}
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  Blog &amp; Sites
                </Link>
              </div>
            </div>

            {/* Module Navigation Items */}
            <nav className="flex flex-1 flex-col gap-0.5 px-2 pt-3">
              <div className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                {isBlogModule ? 'Content Module' : 'Tickets Module'}
              </div>

              {(isBlogModule ? BLOG_NAV : TICKETS_NAV).map(({ href, label, icon: Icon }) => {
                const active =
                  href === '/tickets-command' || href === '/tickets-command/blogs'
                    ? pathname === href
                    : pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={clsx(
                      'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[14px] transition-colors',
                      active
                        ? 'bg-black/[0.06] font-medium text-stone-900'
                        : 'text-stone-600 hover:bg-black/[0.04] hover:text-stone-900',
                    )}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0 text-stone-500 stroke-[1.5]" />
                    {label}
                  </Link>
                );
              })}
            </nav>

            {/* Footer & Logout */}
            <div className="mt-auto border-t border-stone-200/80 px-3 py-4">
              <button
                type="button"
                onClick={() => void logout()}
                className="w-full rounded-md px-2.5 py-1.5 text-left text-[13px] text-stone-500 transition-colors hover:bg-black/[0.04] hover:text-stone-800"
              >
                Log out
              </button>
              <p className="mt-3 px-0.5 text-[11px] leading-relaxed text-stone-400">
                Shared session across tickets and blog modules.
              </p>
            </div>
          </aside>

          <main className="min-w-0 flex-1 px-5 py-8 sm:px-8 sm:py-10 lg:px-14 lg:py-12">
            <div className="mx-auto max-w-5xl">{children}</div>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
