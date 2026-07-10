'use client';

import React, { useEffect, useState } from 'react';
import { Plus, ArrowRight, LayoutTemplate } from 'lucide-react';
import Link from 'next/link';
import { LandingConfig, defaultLandingConfig } from '../../lib/funnelConfig';

export default function LandingsDashboard() {
  const [landings, setLandings] = useState<Record<string, LandingConfig>>({});

  useEffect(() => {
    const saved = localStorage.getItem('hotelFlow_landings');
    if (saved) {
      try {
        setLandings(JSON.parse(saved));
      } catch (e) {}
    } else {
      setLandings({ [defaultLandingConfig.slug]: defaultLandingConfig });
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-8">
      <div className="max-w-6xl mx-auto w-full">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl font-black text-slate-900 mb-2">Landing Pages</h1>
            <p className="text-slate-500">Páginas de captación pre-quiz para enamorar a tus prospectos.</p>
          </div>
          <Link 
            href="/landings/nueva/edit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> Nueva Landing
          </Link>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(landings).map(([slug, config]) => (
            <div key={slug} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col h-full group hover:border-indigo-300 transition-colors">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-6">
                <LayoutTemplate className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">{config.hero.title}</h3>
              <p className="text-slate-500 text-sm mb-6 flex-1 line-clamp-2">{config.hero.subtitle}</p>
              
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase">/{slug}</span>
                <Link 
                  href={`/landings/${slug}/edit`}
                  className="text-indigo-600 font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all"
                >
                  Editar <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
