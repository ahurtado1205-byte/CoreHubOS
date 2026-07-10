'use client';

import React, { useState, useMemo } from 'react';
import { usePMS } from '../../../context/PMSContext';
import { format, parseISO, startOfDay, differenceInDays, addDays, subDays, startOfMonth, endOfMonth, startOfYear } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, BedDouble, Target, Download } from 'lucide-react';

export default function OccupancyReport() {
  const { bookings, units, unitTypes } = usePMS();
  
  const [startDate, setStartDate] = useState<string>(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  const setQuickDate = (preset: 'hoy' | 'semana' | 'mes' | 'mes_pasado' | 'proximos30') => {
    const today = new Date();
    if (preset === 'hoy') {
      setStartDate(format(today, 'yyyy-MM-dd'));
      setEndDate(format(today, 'yyyy-MM-dd'));
    } else if (preset === 'semana') {
      setStartDate(format(subDays(today, 7), 'yyyy-MM-dd'));
      setEndDate(format(today, 'yyyy-MM-dd'));
    } else if (preset === 'mes') {
      setStartDate(format(startOfMonth(today), 'yyyy-MM-dd'));
      setEndDate(format(endOfMonth(today), 'yyyy-MM-dd'));
    } else if (preset === 'mes_pasado') {
      const lastMonth = subDays(startOfMonth(today), 1);
      setStartDate(format(startOfMonth(lastMonth), 'yyyy-MM-dd'));
      setEndDate(format(endOfMonth(lastMonth), 'yyyy-MM-dd'));
    } else if (preset === 'proximos30') {
      setStartDate(format(today, 'yyyy-MM-dd'));
      setEndDate(format(addDays(today, 30), 'yyyy-MM-dd'));
    }
  };

  const occData = useMemo(() => {
    const start = startOfDay(parseISO(startDate));
    const end = startOfDay(parseISO(endDate));
    const periodDays = Math.max(1, differenceInDays(end, start) + 1);
    
    let totalNightsSold = 0;
    const totalAvailableNights = units.length * periodDays;

    const byType: Record<string, { name: string; available: number; sold: number }> = {};
    unitTypes.forEach(ut => {
      const utUnits = units.filter(u => u.unit_type_id === ut.id).length;
      byType[ut.id] = { name: ut.name, available: utUnits * periodDays, sold: 0 };
    });

    const dailyOcc: { date: string; sold: number; available: number; occ: number }[] = [];

    for (let i = 0; i < periodDays; i++) {
      const currentDay = addDays(start, i);
      let daySold = 0;
      
      bookings.forEach(b => {
        if (b.booking_status === 'cancelled') return;
        const checkIn = startOfDay(parseISO(b.check_in));
        const checkOut = startOfDay(parseISO(b.check_out));
        
        if (checkIn <= currentDay && checkOut > currentDay) {
          daySold++;
          totalNightsSold++;
          
          const unit = units.find(u => u.id === b.room_id);
          if (unit && byType[unit.unit_type_id]) {
            byType[unit.unit_type_id].sold++;
          }
        }
      });

      dailyOcc.push({
        date: format(currentDay, 'dd/MM/yy'),
        sold: daySold,
        available: units.length,
        occ: units.length > 0 ? Math.round((daySold / units.length) * 100) : 0
      });
    }

    const typeBreakdown = Object.values(byType).map(t => ({
      ...t,
      occ: t.available > 0 ? Math.round((t.sold / t.available) * 100) : 0
    })).sort((a, b) => b.occ - a.occ);

    return {
      overall: totalAvailableNights > 0 ? Math.round((totalNightsSold / totalAvailableNights) * 100) : 0,
      totalSold: totalNightsSold,
      totalAvailable: totalAvailableNights,
      byType: typeBreakdown,
      dailyOcc
    };
  }, [startDate, endDate, bookings, units, unitTypes]);

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <main className="flex-1 overflow-y-auto p-8 print:overflow-visible print:p-0">
        <div className="max-w-7xl mx-auto w-full">
          
          <div className="mb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6 print:hidden">
            <div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                <BedDouble className="w-8 h-8 text-indigo-600" /> Reporte de Ocupación
              </h2>
              <p className="text-slate-500 text-sm mt-1">Análisis detallado de ocupación por fecha y tipo de habitación.</p>
            </div>
            
            <div className="flex flex-col items-end gap-3">
              <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1 rounded-lg">
                <button onClick={() => setQuickDate('hoy')} className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-white hover:shadow-sm rounded-md transition-all">Hoy</button>
                <button onClick={() => setQuickDate('semana')} className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-white hover:shadow-sm rounded-md transition-all">Últimos 7 días</button>
                <button onClick={() => setQuickDate('mes')} className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-white hover:shadow-sm rounded-md transition-all">Este Mes</button>
                <button onClick={() => setQuickDate('proximos30')} className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-white hover:shadow-sm rounded-md transition-all">Próximos 30 días</button>
              </div>
              
              <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
                <CalendarIcon className="w-4 h-4 text-indigo-500 ml-2" />
                <input 
                  type="date" 
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="text-sm font-semibold text-slate-700 bg-transparent focus:outline-none cursor-pointer"
                />
                <span className="text-slate-400">-</span>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="text-sm font-semibold text-slate-700 bg-transparent focus:outline-none cursor-pointer mr-2"
                />
                <div className="h-6 w-px bg-slate-200 mx-2"></div>
                <button onClick={() => window.print()} className="p-2 text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-lg transition-colors">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg flex flex-col justify-center print:bg-white print:border print:text-slate-800">
              <p className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-2 print:text-slate-500">Ocupación General</p>
              <div className="flex items-baseline gap-1">
                <p className="text-6xl font-black">{occData.overall}</p>
                <span className="text-2xl font-bold opacity-80">%</span>
              </div>
              <p className="text-sm mt-4 font-medium opacity-80 print:text-slate-500">{occData.totalSold} de {occData.totalAvailable} noches vendidas</p>
            </div>

            <div className="md:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-slate-800 font-bold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-500" /> Ocupación por Categoría
              </h3>
              <div className="space-y-4">
                {occData.byType.map(t => (
                  <div key={t.name}>
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-sm font-bold text-slate-700">{t.name}</span>
                      <span className="text-sm font-black text-indigo-600">{t.occ}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-indigo-500 h-full rounded-full transition-all duration-1000" style={{ width: `${t.occ}%` }}></div>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 text-right">{t.sold} / {t.available} noches</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[500px] print:h-auto print:border-none print:shadow-none">
            <div className="p-6 border-b border-slate-200 shrink-0">
              <h3 className="font-bold text-slate-800 text-lg">Evolución Diaria</h3>
            </div>
            <div className="overflow-auto flex-1 p-6">
              {/* Very simple visual bar chart */}
              <div className="flex h-full items-end gap-2 min-w-max">
                {occData.dailyOcc.map((d, i) => (
                  <div key={i} className="flex flex-col items-center justify-end h-full gap-2 group w-8">
                    <div className="text-[10px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-slate-800 text-white px-2 py-1 rounded absolute -top-8 z-10 pointer-events-none">
                      {d.occ}% ({d.sold} habs)
                    </div>
                    <div className="w-full bg-slate-100 rounded-t-sm h-[200px] relative">
                      <div 
                        className={`absolute bottom-0 w-full rounded-t-sm transition-all duration-500 ${d.occ >= 80 ? 'bg-emerald-500' : d.occ > 40 ? 'bg-indigo-500' : 'bg-slate-300'}`}
                        style={{ height: `${d.occ}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 rotate-[-45deg] origin-top-left mt-2">{d.date.slice(0,5)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
