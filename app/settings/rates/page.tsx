'use client';

import { useState } from 'react';
import { Hexagon, CalendarRange, Users, BookOpen, LayoutDashboard, Target, CircleDollarSign, BarChart3, Search, Settings, Bell, Plus, Save, ArrowLeft, Tag } from 'lucide-react';
import Link from 'next/link';
import { RatesManager } from '@/components/rates/RatesManager';
import { PromotionsManager } from '@/components/rates/PromotionsManager';

import { TopBar } from '../../../components/layout/TopBar';
export default function RatesPage() {
  const [activeTab, setActiveTab] = useState<'rates' | 'promotions'>('rates');

  return (
    <div className="flex flex-col h-screen bg-slate-100 overflow-hidden">
      {/* Top Navigation */}
      <TopBar />

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col p-6">
        <div className="mb-6 shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/settings" className="w-12 h-12 rounded-xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center hover:bg-slate-100 hover:text-slate-700 transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Estrategia de Precios</h2>
              <p className="text-slate-500 text-sm mt-1">Configura planes tarifarios y códigos de promoción para el motor de reservas.</p>
            </div>
          </div>

          <div className="flex p-1 bg-slate-200/70 rounded-xl">
            <button
              onClick={() => setActiveTab('rates')}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'rates'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              Planes Tarifarios
            </button>
            <button
              onClick={() => setActiveTab('promotions')}
              className={`px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                activeTab === 'promotions'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Tag className="w-4 h-4" />
              Promociones
            </button>
          </div>
        </div>

        {/* Dynamic Container */}
        <div className="flex-1 overflow-hidden relative">
          {activeTab === 'rates' ? <RatesManager /> : <PromotionsManager />}
        </div>
      </main>
    </div>
  );
}
