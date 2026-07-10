'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { usePMS } from '../../../context/PMSContext';
import { format, parseISO, startOfDay, isSameDay, addDays, getDaysInMonth, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { FileDown, Calendar, Sparkles, CheckCircle, Users, ArrowRightLeft, DoorOpen, Play, Printer, User, LayoutGrid, CalendarDays, List } from 'lucide-react';
import Link from 'next/link';

type HSKStatus = 'Llegada' | 'Salida' | 'Salida / Llegada' | 'Pernocte' | 'Vacante';

interface HSKRow {
  unitId: string;
  unitName: string;
  unitTypeName: string;
  pax: number;
  status: HSKStatus;
  guestName: string;
  housekeepingStatus: string;
  notes: string;
  dateStr: string;
}

type ViewMode = 'daily' | 'weekly' | 'monthly';

export default function HousekeepingReport() {
  const { units, unitTypes, bookings, teamMembers, housekeepingTasks, updateHousekeepingTask } = usePMS();
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [printTrigger, setPrintTrigger] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('daily');

  useEffect(() => {
    if (printTrigger) {
      const timer = setTimeout(() => {
        window.print();
        setPrintTrigger(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [printTrigger]);

  const cleaners = useMemo(() => {
    return teamMembers.filter(tm => true); // In a real app, filter by role (e.g., Housekeeping)
  }, [teamMembers]);

  // Helper to generate status for a specific date and unit
  const getUnitStatusForDate = (unitId: string, dateObj: Date) => {
    const touchingBookings = bookings.filter(b => {
      if (b.booking_status === 'cancelled') return false;
      if (b.room_id !== unitId) return false;
      
      const checkIn = startOfDay(parseISO(b.check_in));
      const checkOut = startOfDay(parseISO(b.check_out));
      
      return checkIn <= dateObj && checkOut >= dateObj;
    });

    let status: HSKStatus = 'Vacante';
    let guestName = '';
    let pax = 0;

    const isDeparture = touchingBookings.some(b => isSameDay(startOfDay(parseISO(b.check_out)), dateObj));
    const isArrival = touchingBookings.some(b => isSameDay(startOfDay(parseISO(b.check_in)), dateObj));
    const isStayover = touchingBookings.some(b => {
      const ci = startOfDay(parseISO(b.check_in));
      const co = startOfDay(parseISO(b.check_out));
      return ci < dateObj && co > dateObj;
    });

    if (isDeparture && isArrival) {
      status = 'Salida / Llegada';
      const arrivingBooking = touchingBookings.find(b => isSameDay(startOfDay(parseISO(b.check_in)), dateObj));
      const departingBooking = touchingBookings.find(b => isSameDay(startOfDay(parseISO(b.check_out)), dateObj));
      guestName = `Sale: ${departingBooking?.first_name} | Entra: ${arrivingBooking?.first_name}`;
      pax = arrivingBooking?.pax || 2;
    } else if (isDeparture) {
      status = 'Salida';
      const b = touchingBookings.find(b => isSameDay(startOfDay(parseISO(b.check_out)), dateObj));
      guestName = `${b?.first_name} ${b?.last_name}`;
      pax = b?.pax || 2;
    } else if (isArrival) {
      status = 'Llegada';
      const b = touchingBookings.find(b => isSameDay(startOfDay(parseISO(b.check_in)), dateObj));
      guestName = `${b?.first_name} ${b?.last_name}`;
      pax = b?.pax || 2;
    } else if (isStayover) {
      status = 'Pernocte';
      const b = touchingBookings[0];
      guestName = `${b?.first_name} ${b?.last_name}`;
      pax = b?.pax || 2;
    }

    return { status, guestName, pax };
  };

  const dailyData = useMemo(() => {
    const targetDate = startOfDay(parseISO(selectedDate));
    
    let kpiLlegadas = 0;
    let kpiSalidas = 0;
    let kpiPernoctes = 0;
    let kpiVacantes = 0;

    const rows: HSKRow[] = units.map(unit => {
      const unitType = unitTypes.find(ut => ut.id === unit.unit_type_id);
      const { status, guestName, pax } = getUnitStatusForDate(unit.id, targetDate);

      if (status === 'Salida / Llegada') { kpiSalidas++; kpiLlegadas++; }
      else if (status === 'Salida') kpiSalidas++;
      else if (status === 'Llegada') kpiLlegadas++;
      else if (status === 'Pernocte') kpiPernoctes++;
      else kpiVacantes++;

      return {
        unitId: unit.id,
        unitName: unit.name,
        unitTypeName: unitType?.name || 'Desconocida',
        pax,
        status,
        guestName,
        housekeepingStatus: unit.housekeeping_status || 'dirty',
        notes: unit.notes || '',
        dateStr: selectedDate
      };
    });

    const statusOrder: Record<HSKStatus, number> = {
      'Salida / Llegada': 1, 'Salida': 2, 'Pernocte': 3, 'Llegada': 4, 'Vacante': 5
    };

    rows.sort((a, b) => {
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      return a.unitName.localeCompare(b.unitName);
    });

    return {
      rows,
      kpis: {
        llegadas: kpiLlegadas, salidas: kpiSalidas, pernoctes: kpiPernoctes, vacantes: kpiVacantes,
        totalLimpieza: kpiSalidas + kpiPernoctes
      }
    };
  }, [units, unitTypes, bookings, selectedDate]);

  const weeklyDates = useMemo(() => {
    const dates = [];
    const start = parseISO(selectedDate);
    for (let i = 0; i < 7; i++) {
      dates.push(addDays(start, i));
    }
    return dates;
  }, [selectedDate]);

  const monthlyDates = useMemo(() => {
    const start = startOfMonth(parseISO(selectedDate));
    const days = getDaysInMonth(start);
    const dates = [];
    for (let i = 0; i < days; i++) {
      dates.push(addDays(start, i));
    }
    return dates;
  }, [selectedDate]);

  const handleAssignTask = (unitId: string, date: string, teamMemberId: string) => {
    const taskType = 'check_out'; // Ideally determine dynamically based on status
    updateHousekeepingTask({
      id: `task_${unitId}_${date}`,
      unit_id: unitId,
      date,
      team_member_id: teamMemberId || null,
      task_type: taskType,
      status: 'pending'
    });
  };

  const getAssignee = (unitId: string, date: string) => {
    const task = housekeepingTasks?.find(t => t.unit_id === unitId && t.date === date);
    return task?.team_member_id || '';
  };

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans print:bg-white print:h-auto overflow-y-auto">
      <div className="p-8 max-w-7xl mx-auto w-full space-y-6 print:hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-indigo-600" /> Planilla Housekeeping
            </h1>
            <p className="text-slate-500 mt-2 font-medium">Asignación y ruta para el equipo de limpieza.</p>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-200/50 p-1.5 rounded-xl shadow-inner border border-slate-200">
             <button 
                onClick={() => setViewMode('daily')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'daily' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
             >
                <List className="w-4 h-4"/> Diario
             </button>
             <button 
                onClick={() => setViewMode('weekly')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'weekly' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
             >
                <LayoutGrid className="w-4 h-4"/> Semanal
             </button>
             <button 
                onClick={() => setViewMode('monthly')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'monthly' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
             >
                <CalendarDays className="w-4 h-4"/> Mensual
             </button>
          </div>

          <div className="flex items-center gap-4 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 px-4">
              <Calendar className="w-5 h-5 text-indigo-500" />
              <input 
                type={viewMode === 'monthly' ? 'month' : 'date'} 
                value={viewMode === 'monthly' ? selectedDate.slice(0, 7) : selectedDate}
                onChange={e => {
                  if (viewMode === 'monthly') {
                    setSelectedDate(`${e.target.value}-01`);
                  } else {
                    setSelectedDate(e.target.value);
                  }
                }}
                className="text-sm font-bold text-slate-700 bg-transparent focus:outline-none cursor-pointer"
              />
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
            <button 
              onClick={() => setPrintTrigger(true)}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </button>
          </div>
        </div>

        {viewMode === 'daily' && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-indigo-600 rounded-2xl p-5 text-white shadow-sm shadow-indigo-200">
              <h3 className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1">Total a Limpiar</h3>
              <p className="text-4xl font-black">{dailyData.kpis.totalLimpieza}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-2"><ArrowRightLeft className="w-3 h-3"/> Salidas</h3>
              <p className="text-3xl font-black text-slate-800">{dailyData.kpis.salidas}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-2"><Play className="w-3 h-3"/> Llegadas</h3>
              <p className="text-3xl font-black text-slate-800">{dailyData.kpis.llegadas}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-2"><Users className="w-3 h-3"/> Pernoctes</h3>
              <p className="text-3xl font-black text-slate-800">{dailyData.kpis.pernoctes}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-2"><DoorOpen className="w-3 h-3"/> Vacantes</h3>
              <p className="text-3xl font-black text-slate-800">{dailyData.kpis.vacantes}</p>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto w-full px-8 pb-12 print:p-0 print:max-w-none">
        
        <div className="hidden print:block mb-8 border-b-2 border-slate-900 pb-4">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-black text-slate-900 uppercase">Hoja de Ruta - {viewMode === 'daily' ? 'Diaria' : viewMode === 'weekly' ? 'Semanal' : 'Mensual'}</h1>
              <p className="text-xl font-bold text-slate-600 mt-1">{format(parseISO(selectedDate), "MMMM yyyy", { locale: es })}</p>
            </div>
            {viewMode === 'daily' && (
              <div className="text-right text-sm font-bold text-slate-500">
                <p>Habitaciones a limpiar: {dailyData.kpis.totalLimpieza}</p>
                <p>Llegadas: {dailyData.kpis.llegadas} | Salidas: {dailyData.kpis.salidas}</p>
              </div>
            )}
          </div>
        </div>

        {viewMode === 'daily' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden print:border-none print:shadow-none print:rounded-none">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b-2 border-slate-200 print:bg-slate-100">
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-24 print:border print:border-slate-300">Habit.</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-40 print:border print:border-slate-300">Estado</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider print:border print:border-slate-300">Huésped (Pax)</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-48 print:border print:border-slate-300">Asignado a</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center w-24 print:border print:border-slate-300">Check</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 print:divide-slate-300">
                {dailyData.rows.map((row) => (
                  <tr key={row.unitId} className={`transition-colors ${row.status === 'Salida / Llegada' ? 'bg-orange-50/50 print:bg-white' : ''} ${row.status === 'Salida' ? 'bg-red-50/30 print:bg-white' : ''} ${row.status === 'Llegada' ? 'bg-indigo-50/30 print:bg-white' : ''} ${row.status === 'Vacante' ? 'opacity-50 print:opacity-100' : ''}`}>
                    <td className="p-4 print:border print:border-slate-300">
                      <div className="font-black text-lg text-slate-900">{row.unitName}</div>
                      <div className="text-xs font-bold text-slate-500">{row.unitTypeName}</div>
                    </td>
                    <td className="p-4 print:border print:border-slate-300">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border print:border-none print:px-0 ${row.status === 'Salida / Llegada' ? 'bg-orange-100 text-orange-800 border-orange-200' : ''} ${row.status === 'Salida' ? 'bg-red-100 text-red-800 border-red-200' : ''} ${row.status === 'Llegada' ? 'bg-indigo-100 text-indigo-800 border-indigo-200' : ''} ${row.status === 'Pernocte' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : ''} ${row.status === 'Vacante' ? 'bg-slate-100 text-slate-600 border-slate-200' : ''}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="p-4 print:border print:border-slate-300">
                      {row.guestName ? (
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{row.guestName}</span>
                          <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full border border-slate-200 flex items-center gap-1"><Users className="w-3 h-3" /> {row.pax}</span>
                        </div>
                      ) : <span className="text-slate-400 italic text-sm">-</span>}
                    </td>
                    <td className="p-4 print:border print:border-slate-300">
                      {row.status !== 'Vacante' ? (
                        <div className="flex items-center gap-2">
                           <User className="w-4 h-4 text-slate-400 print:hidden" />
                           <select 
                             value={getAssignee(row.unitId, row.dateStr)}
                             onChange={(e) => handleAssignTask(row.unitId, row.dateStr, e.target.value)}
                             className="text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-1.5 focus:outline-none focus:border-indigo-500 w-full print:border-none print:bg-transparent print:appearance-none"
                           >
                             <option value="">-- Sin asignar --</option>
                             {cleaners.map(c => (
                               <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                             ))}
                           </select>
                        </div>
                      ) : null}
                    </td>
                    <td className="p-4 text-center align-middle print:border print:border-slate-300">
                      {row.status !== 'Vacante' ? (
                        <div className="mx-auto w-10 h-10 border-2 border-slate-300 rounded-lg flex items-center justify-center bg-white print:border-slate-500 print:w-12 print:h-12 cursor-pointer hover:border-indigo-500 transition-colors">
                          <CheckCircle className="w-6 h-6 text-slate-200 print:hidden" />
                        </div>
                      ) : <span className="text-slate-300">-</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {viewMode === 'weekly' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-x-auto print:border-none print:shadow-none print:rounded-none print:overflow-visible">
            <table className="w-full text-left border-collapse min-w-[1000px] print:min-w-0">
              <thead>
                <tr className="bg-slate-50 border-b-2 border-slate-200 print:bg-slate-100">
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-32 sticky left-0 bg-slate-50 print:static print:border print:border-slate-300">Habit.</th>
                  {weeklyDates.map(date => (
                    <th key={date.toISOString()} className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center print:border print:border-slate-300">
                      <div className="flex flex-col items-center">
                         <span className="text-indigo-600 font-black">{format(date, 'EEE', { locale: es })}</span>
                         <span className="text-slate-900">{format(date, 'd/M')}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 print:divide-slate-300">
                {units.map((unit) => (
                  <tr key={unit.id} className="transition-colors hover:bg-slate-50/50">
                    <td className="p-4 border-r border-slate-100 sticky left-0 bg-white print:static print:border print:border-slate-300">
                      <div className="font-black text-sm text-slate-900">{unit.name}</div>
                    </td>
                    {weeklyDates.map(date => {
                      const dateStr = format(date, 'yyyy-MM-dd');
                      const { status } = getUnitStatusForDate(unit.id, date);
                      const isAction = status !== 'Vacante';
                      return (
                        <td key={dateStr} className="p-2 border-r border-slate-100 last:border-0 print:border print:border-slate-300 text-center">
                          {isAction ? (
                             <div className="flex flex-col gap-1 items-center justify-center">
                                <span className={`text-[10px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded
                                  ${status === 'Salida' ? 'bg-red-100 text-red-800' : ''}
                                  ${status === 'Llegada' ? 'bg-indigo-100 text-indigo-800' : ''}
                                  ${status === 'Pernocte' ? 'bg-emerald-100 text-emerald-800' : ''}
                                  ${status === 'Salida / Llegada' ? 'bg-orange-100 text-orange-800' : ''}
                                `}>
                                  {status.substring(0, 3)}
                                </span>
                                <select 
                                  value={getAssignee(unit.id, dateStr)}
                                  onChange={(e) => handleAssignTask(unit.id, dateStr, e.target.value)}
                                  className="text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded p-1 max-w-[80px] print:border-none print:bg-transparent print:appearance-none"
                                >
                                  <option value="">--</option>
                                  {cleaners.map(c => <option key={c.id} value={c.id}>{c.first_name}</option>)}
                                </select>
                             </div>
                          ) : (
                             <span className="text-slate-300 text-xs">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {viewMode === 'monthly' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden print:border-none print:shadow-none print:rounded-none">
             <div className="p-5 border-b border-slate-200 bg-slate-50 print:hidden">
               <h3 className="font-bold text-slate-800">Resumen de Carga de Limpieza Mensual</h3>
               <p className="text-sm text-slate-500">Ideal para proyectar turnos y contratación de personal eventual.</p>
             </div>
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="bg-slate-50 border-b-2 border-slate-200 print:bg-slate-100">
                   <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider print:border print:border-slate-300">Fecha</th>
                   <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right print:border print:border-slate-300">Pernoctes</th>
                   <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right print:border print:border-slate-300">Salidas (Profunda)</th>
                   <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right print:border print:border-slate-300">Total a Limpiar</th>
                   <th className="p-4 text-xs font-bold text-indigo-600 uppercase tracking-wider text-right print:border print:border-slate-300">Personal Est.</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 print:divide-slate-300">
                  {monthlyDates.map(date => {
                     let stayovers = 0;
                     let checkouts = 0;
                     units.forEach(unit => {
                        const { status } = getUnitStatusForDate(unit.id, date);
                        if (status === 'Pernocte') stayovers++;
                        if (status === 'Salida' || status === 'Salida / Llegada') checkouts++;
                     });
                     
                     const totalCleanings = stayovers + checkouts;
                     // Estimation: 1 staff per 5 checkouts or 10 stayovers roughly. Let's do a simple ratio: 1 per 7 cleanings avg.
                     const staffNeeded = Math.ceil(totalCleanings / 7);

                     return (
                       <tr key={date.toISOString()} className="hover:bg-slate-50/50 transition-colors">
                         <td className="p-4 font-bold text-slate-900 print:border print:border-slate-300 flex items-center gap-2">
                           <span className="w-8 text-slate-400 text-sm">{format(date, 'EEE', { locale: es })}</span>
                           {format(date, 'dd/MM/yyyy')}
                         </td>
                         <td className="p-4 text-right text-slate-600 font-bold print:border print:border-slate-300">{stayovers}</td>
                         <td className="p-4 text-right text-slate-600 font-bold print:border print:border-slate-300">{checkouts}</td>
                         <td className="p-4 text-right font-black text-slate-800 print:border print:border-slate-300">{totalCleanings}</td>
                         <td className="p-4 text-right font-black text-indigo-600 print:border print:border-slate-300">
                           {totalCleanings > 0 ? staffNeeded : 0} <span className="text-xs text-indigo-400 font-normal">personas</span>
                         </td>
                       </tr>
                     );
                  })}
               </tbody>
             </table>
          </div>
        )}
        
        {/* Footer for notes on print */}
        <div className="hidden print:block mt-8 border-t-2 border-slate-900 pt-4">
          <h4 className="font-bold text-slate-800 uppercase tracking-wider text-sm mb-2">Notas del Supervisor:</h4>
          <div className="w-full h-24 border border-slate-300 rounded-xl"></div>
        </div>

      </div>
    </div>
  );
}
