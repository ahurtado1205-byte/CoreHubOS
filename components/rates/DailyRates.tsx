'use client';

import React, { useState } from 'react';
import { usePMS } from '../../context/PMSContext';
import { format, addDays, parseISO, startOfDay } from 'date-fns';
import { ChevronLeft, ChevronRight, GitMerge, ShieldCheck, Tag, ChevronDown, ChevronRight as ChevronRightIcon, BedDouble } from 'lucide-react';
import { RatePlan } from '../../types/inventory';

import { usePricing } from '../../hooks/usePricing';

export function DailyRates() {
  const { dailyRates, ratePlans, rateRules, unitTypes, setDailyRate, bookings, units } = usePMS();
  const { getPriceForPlanAndDate } = usePricing();
  
  const [selectedUnitType, setSelectedUnitType] = useState('all');
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});
  
  // Date range for grid
  const [startDate, setStartDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const daysToShow = 14;

  const dates = Array.from({ length: daysToShow }).map((_, i) => {
    return format(addDays(parseISO(startDate), i), 'yyyy-MM-dd');
  });

  const shiftDates = (days: number) => {
    setStartDate(prev => format(addDays(parseISO(prev), days), 'yyyy-MM-dd'));
  };

  const handlePriceChange = (date: string, planId: string, categoryId: string, val: string) => {
    if (val === '') return;
    const numericVal = Number(val);
    if (numericVal < 0) return; // Prevent negative prices (blindaje)
    
    setDailyRate({
      id: `dr_${Date.now()}`,
      rate_plan_id: planId,
      unit_type_id: categoryId,
      date: date,
      price: numericVal
    });
  };

  const toggleCategory = (catId: string) => {
    setExpandedCats(prev => ({...prev, [catId]: !prev[catId]}));
  };

  // Group plans for rendering: Master -> [Derived, Derived]
  const renderGroups: { plan: RatePlan, isDerived: boolean }[] = [];
  const masterPlans = ratePlans.filter(p => !p.parent_plan_id);
  masterPlans.forEach(master => {
    renderGroups.push({ plan: master, isDerived: false });
    const derived = ratePlans.filter(p => p.parent_plan_id === master.id);
    derived.forEach(d => {
      renderGroups.push({ plan: d, isDerived: true });
    });
  });

  const categoriesToRender = selectedUnitType === 'all' 
    ? unitTypes 
    : unitTypes.filter(u => u.id === selectedUnitType);

  return (
    <div className="h-full flex flex-col p-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6 shrink-0">
        <div>
          <h3 className="font-bold text-slate-800 text-lg">Tarifario Horizontal</h3>
          <p className="text-sm text-slate-500">Visualiza y edita los precios en cascada y camas extra día por día.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
            <button 
              onClick={() => shiftDates(-7)}
              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2 text-sm font-medium text-slate-700 bg-transparent focus:outline-none border-x border-slate-100"
            />
            <button 
              onClick={() => shiftDates(7)}
              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-slate-400" />
            <select 
              value={selectedUnitType} 
              onChange={(e) => {
                setSelectedUnitType(e.target.value);
                if (e.target.value !== 'all') {
                  setExpandedCats(prev => ({...prev, [e.target.value]: true}));
                }
              }}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 font-bold shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="all">Todas las Categorías</option>
              {unitTypes.map(ut => <option key={ut.id} value={ut.id}>{ut.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-white rounded-xl border border-slate-200 shadow-sm">
        <table className="w-full text-left border-collapse min-w-max">
          <thead className="bg-slate-50 sticky top-0 z-20 border-b border-slate-200 shadow-sm">
            <tr>
              <th className="p-3 font-semibold text-slate-600 text-sm border-r border-slate-200 sticky left-0 bg-slate-50 z-30 min-w-[220px]">
                Categoría / Plan
              </th>
              {dates.map(date => {
                const dateObj = parseISO(date);
                const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
                const totalUnits = units.length;
                const dailyBookings = bookings.filter(b => b.booking_status !== 'cancelled' && startOfDay(parseISO(b.check_in)) <= dateObj && startOfDay(parseISO(b.check_out)) > dateObj);
                const isFull = dailyBookings.length >= totalUnits && totalUnits > 0;
                
                return (
                  <th key={date} className={`p-2 text-center border-r border-slate-200 min-w-[80px] ${isWeekend ? 'bg-slate-100' : ''}`}>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{format(dateObj, 'EEE')}</div>
                    <div className="text-sm font-bold text-slate-700 mb-1">{format(dateObj, 'dd/MM')}</div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-sm ${isFull ? 'bg-rose-600 text-white border-rose-700' : dailyBookings.length > 0 ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-slate-800 text-white border-slate-900'}`}>
                      {dailyBookings.length}/{totalUnits}
                      {totalUnits > 0 && (
                        <span className="ml-1 opacity-70 text-[8px] font-normal">
                          {Math.round((dailyBookings.length / totalUnits) * 100)}%
                        </span>
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {categoriesToRender.map(category => {
              const isExpanded = expandedCats[category.id];
              return (
                <React.Fragment key={category.id}>
                  {/* Category Header Row */}
                  <tr 
                    className="border-y border-slate-200 bg-slate-100 hover:bg-slate-200 cursor-pointer transition-colors"
                    onClick={() => toggleCategory(category.id)}
                  >
                    <td className="p-3 sticky left-0 bg-slate-100 z-10 border-r border-slate-200 shadow-sm">
                      <div className="flex items-center gap-2 font-black text-slate-800 text-sm">
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRightIcon className="w-4 h-4 text-slate-500" />}
                        {category.name}
                      </div>
                    </td>
                    {dates.map(dateStr => {
                      const date = parseISO(dateStr);
                      const catUnits = units.filter(u => u.unit_type_id === category.id);
                      const catBookings = bookings.filter(b => b.unit_type_id === category.id && b.booking_status !== 'cancelled' && startOfDay(parseISO(b.check_in)) <= date && startOfDay(parseISO(b.check_out)) > date);
                      const isFull = catBookings.length >= catUnits.length && catUnits.length > 0;
                      return (
                        <td key={`occ-${dateStr}`} className="p-1.5 border-r border-slate-200 bg-slate-100 text-center">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isFull ? 'bg-rose-100 text-rose-700' : catBookings.length > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'}`}>
                            {catBookings.length} / {catUnits.length}
                          </span>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Expanded Content (Rate Plans + Extra Bed) */}
                  {isExpanded && (
                    <>
                      {renderGroups.map(({ plan, isDerived }) => (
                        <tr key={`${category.id}-${plan.id}`} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                          <td className="p-3 border-r border-slate-200 sticky left-0 bg-white z-10">
                            <div className={`flex items-center gap-2 ${isDerived ? 'pl-8' : 'pl-4'}`}>
                              {isDerived ? (
                                <GitMerge className="w-4 h-4 text-slate-400 shrink-0" />
                              ) : (
                                <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                              )}
                              <div>
                                <div className="font-semibold text-slate-800 text-sm leading-tight">{plan.name}</div>
                                {isDerived && plan.discount_value && (
                                  <div className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded inline-block mt-0.5">
                                    -{plan.discount_value}{plan.discount_type === 'percent' ? '%' : '$'}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          {dates.map(date => {
                            const result = getPriceForPlanAndDate(date, plan, category.id);
                            return (
                              <td key={`${plan.id}-${date}`} className="p-1.5 border-r border-slate-100 text-center relative group">
                                <div className="relative w-full max-w-[70px] mx-auto">
                                  <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={result.price || ''}
                                    onChange={(e) => handlePriceChange(date, plan.id, category.id, e.target.value)}
                                    className={`w-full pl-4 pr-1 py-1.5 text-sm font-medium border rounded text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all
                                      ${result.isOverridden 
                                        ? 'border-indigo-300 bg-indigo-50 text-indigo-700 font-bold shadow-inner' 
                                        : 'border-transparent bg-transparent text-slate-700 hover:border-slate-200 hover:bg-white'}
                                    `}
                                  />
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}

                      {/* Extra Bed Row */}
                      <tr className="border-b-2 border-slate-200 hover:bg-slate-50/50 transition-colors bg-orange-50/30">
                        <td className="p-3 border-r border-slate-200 sticky left-0 bg-orange-50/80 z-10">
                          <div className="flex items-center gap-2 pl-4">
                            <BedDouble className="w-4 h-4 text-orange-600 shrink-0" />
                            <div className="font-semibold text-slate-800 text-sm leading-tight">Cama Adicional</div>
                          </div>
                        </td>
                        {dates.map(date => {
                          const { price } = getPriceForPlanAndDate(date, { id: 'extra_bed', parent_plan_id: undefined } as any, category.id);
                          const isOverridden = dailyRates.some(r => r.date === date && r.unit_type_id === category.id && r.rate_plan_id === 'extra_bed');
                          
                          return (
                            <td key={`extra_bed-${date}`} className="p-1.5 border-r border-slate-100 text-center relative group">
                              <div className="relative w-full max-w-[70px] mx-auto">
                                <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-orange-400 text-xs">$</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={price || ''}
                                  placeholder="0"
                                  onChange={(e) => handlePriceChange(date, 'extra_bed', category.id, e.target.value)}
                                  className={`w-full pl-4 pr-1 py-1.5 text-sm font-medium border rounded text-center focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all
                                    ${isOverridden 
                                      ? 'border-orange-300 bg-orange-50 text-orange-700 font-bold shadow-inner' 
                                      : 'border-transparent bg-transparent text-slate-700 hover:border-slate-200 hover:bg-white'}
                                  `}
                                />
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    </>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
