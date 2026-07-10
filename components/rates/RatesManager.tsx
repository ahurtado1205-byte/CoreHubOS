'use client';

import { useState } from 'react';
import { CalendarDays, LayoutList, ShieldCheck } from 'lucide-react';
import { RateBlocks } from './RateBlocks';
import { DailyRates } from './DailyRates';
import { RatePlansManager } from './RatePlansManager';

export function RatesManager() {
  const [activeTab, setActiveTab] = useState<'plans' | 'blocks' | 'daily'>('plans');

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50/50">
        <button
          onClick={() => setActiveTab('plans')}
          className={`flex items-center gap-2 px-6 py-4 font-semibold text-sm transition-colors relative ${
            activeTab === 'plans' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Planes de Tarifa
          {activeTab === 'plans' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('blocks')}
          className={`flex items-center gap-2 px-6 py-4 font-semibold text-sm transition-colors relative ${
            activeTab === 'blocks' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <LayoutList className="w-4 h-4" />
          Bloques / Temporadas
          {activeTab === 'blocks' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('daily')}
          className={`flex items-center gap-2 px-6 py-4 font-semibold text-sm transition-colors relative ${
            activeTab === 'daily' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          Tarifario Diario (Daily Rates)
          {activeTab === 'daily' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'plans' && <RatePlansManager />}
        {activeTab === 'blocks' && <RateBlocks />}
        {activeTab === 'daily' && <DailyRates />}
      </div>
    </div>
  );
}
