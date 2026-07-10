'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { TopBar } from '../../components/layout/TopBar';
import { BarChart3, BedDouble, Sparkles, XCircle } from 'lucide-react';

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const links = [
    { href: '/reports', icon: BarChart3, label: 'Resumen Financiero', exact: true },
    { href: '/reports/occupancy', icon: BedDouble, label: 'Ocupación', exact: false },
    { href: '/reports/hsk', icon: Sparkles, label: 'Housekeeping (HSK)', exact: false },
    { href: '/reports/cancellations', icon: XCircle, label: 'Cancelaciones', exact: false },
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden print:h-auto print:overflow-visible print:bg-white">
      {/* Top Navigation */}
      <TopBar />

      <div className="flex flex-1 overflow-hidden print:block print:overflow-visible">
        {/* Sidebar Nav (Hidden on Print) */}
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col print:hidden">
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Centro de Analytics</h2>
          </div>
          <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
            {links.map(link => {
              const Icon = link.icon;
              const isActive = link.exact ? pathname === link.href : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                    isActive 
                      ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Page Content */}
        <div className="flex-1 overflow-hidden relative print:overflow-visible">
          {children}
        </div>
      </div>
    </div>
  );
}
