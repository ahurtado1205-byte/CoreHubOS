'use client';

import { useMemo, useState, useEffect } from 'react';
import { usePMS } from '../../context/PMSContext';
import { Hexagon, Search, Settings, CalendarRange, Users, LayoutDashboard, CircleDollarSign, Bell, BookOpen, BarChart3, TrendingUp, TrendingDown, Clock, MapPin, Share2, Calendar as CalendarIcon, Filter, FileDown, Target } from 'lucide-react';
import Link from 'next/link';
import { format, addDays, subDays, startOfMonth, endOfMonth, startOfYear, parseISO, startOfDay, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ReportsPage() {
  const { bookings, units } = usePMS();
  
  // Filtros de fecha por defecto: hoy
  const [startDate, setStartDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  
  const [selectedNationality, setSelectedNationality] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  
  const [printOnlyTable, setPrintOnlyTable] = useState(false);

  // Efecto para imprimir solo la tabla
  useEffect(() => {
    if (printOnlyTable) {
      // Pequeño timeout para asegurar que el DOM se actualizó con las clases print:hidden
      const timer = setTimeout(() => {
        window.print();
        setPrintOnlyTable(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [printOnlyTable]);

  // Obtener listas únicas para los selectores
  const nationalities = useMemo(() => Array.from(new Set(bookings.map(b => b.nationality).filter(Boolean))), [bookings]);
  const sources = useMemo(() => Array.from(new Set(bookings.map(b => b.source).filter(Boolean))), [bookings]);

  const reportData = useMemo(() => {
    const start = startOfDay(parseISO(startDate));
    const end = startOfDay(parseISO(endDate));
    const periodDays = Math.max(1, differenceInDays(end, start) + 1); // +1 para incluir ambos extremos
    const totalAvailableRooms = units.length;
    const totalAvailableRoomNights = totalAvailableRooms * periodDays;

    let periodRevenue = 0;
    let periodNightsSold = 0;
    
    let totalBookingWindowDays = 0;
    let windowBookingsCount = 0;

    const nationalityCount: Record<string, number> = {};
    const sourceCount: Record<string, number> = {};

    bookings.forEach(b => {
      // Aplicar filtros de texto
      if (selectedNationality !== 'all' && b.nationality !== selectedNationality) return;
      if (selectedSource !== 'all' && b.source !== selectedSource) return;

      const checkIn = startOfDay(parseISO(b.check_in));
      const checkOut = startOfDay(parseISO(b.check_out));
      
      // Calcular solapamiento (días de la reserva que caen dentro del período seleccionado)
      const overlapStart = checkIn > start ? checkIn : start;
      const overlapEnd = checkOut < end ? checkOut : end;
      
      const overlapDays = differenceInDays(overlapEnd, overlapStart);

      if (overlapDays > 0) {
        // Asumiendo que el nightly_rate es representativo
        const rate = b.nightly_rate || (b.total_amount || 0) / (b.total_nights || 1);
        periodRevenue += (overlapDays * rate);
        periodNightsSold += overlapDays;

        // Contadores para breakdowns (solo contamos 1 vez por reserva que toca el período)
        if (b.nationality) {
          nationalityCount[b.nationality] = (nationalityCount[b.nationality] || 0) + (overlapDays * rate);
        }
        if (b.source) {
          sourceCount[b.source] = (sourceCount[b.source] || 0) + (overlapDays * rate);
        }

        // Booking window
        if (b.created_at) {
          const createdAt = startOfDay(parseISO(b.created_at));
          const diff = differenceInDays(checkIn, createdAt);
          if (diff >= 0) {
            totalBookingWindowDays += diff;
            windowBookingsCount++;
          }
        }
      }
    });

    const adr = periodNightsSold > 0 ? Math.round(periodRevenue / periodNightsSold) : 0;
    const revpar = totalAvailableRoomNights > 0 ? Math.round(periodRevenue / totalAvailableRoomNights) : 0;
    const occupancy = totalAvailableRoomNights > 0 ? Math.round((periodNightsSold / totalAvailableRoomNights) * 100) : 0;
    
    const averageBookingWindow = windowBookingsCount > 0 
      ? Math.round(totalBookingWindowDays / windowBookingsCount) 
      : 0;

    // Ordenar breakdowns para gráficos
    const sortedNationalities = Object.entries(nationalityCount)
      .sort((a, b) => b[1] - a[1])
      .map(([name, rev]) => ({ name, revenue: rev, percentage: Math.round((rev / periodRevenue) * 100) || 0 }));
      
    const sortedSources = Object.entries(sourceCount)
      .sort((a, b) => b[1] - a[1])
      .map(([name, rev]) => ({ name, revenue: rev, percentage: Math.round((rev / periodRevenue) * 100) || 0 }));

    // Daily breakdown calculation
    const dailyData: {
      date: string;
      revenue: number;
      nightsSold: number;
      adr: number;
      revpar: number;
      occupancy: number;
      pax: number;
      arrivals: number;
      departures: number;
      bookingWindow: number;
    }[] = [];

    let totalPaxNights = 0;
    let totalArrivals = 0;
    let totalDepartures = 0;

    for (let i = 0; i < periodDays; i++) {
      const currentDay = addDays(start, i);
      const dateStr = format(currentDay, 'dd/MM/yyyy');

      let dayRevenue = 0;
      let dayNights = 0;
      let dayPax = 0;
      let dayArrivals = 0;
      let dayDepartures = 0;
      let dayBwSum = 0;
      let dayBwCount = 0;

      bookings.forEach(b => {
        if (selectedNationality !== 'all' && b.nationality !== selectedNationality) return;
        if (selectedSource !== 'all' && b.source !== selectedSource) return;

        const checkIn = startOfDay(parseISO(b.check_in));
        const checkOut = startOfDay(parseISO(b.check_out));
        
        if (checkIn.getTime() === currentDay.getTime()) {
          dayArrivals++;
        }
        if (checkOut.getTime() === currentDay.getTime()) {
          dayDepartures++;
        }

        if (checkIn <= currentDay && checkOut > currentDay) {
          dayNights++;
          const rate = b.nightly_rate || (b.total_amount || 0) / (b.total_nights || 1);
          dayRevenue += rate;
          dayPax += b.pax || 2;
          
          if (b.created_at) {
            const createdAt = startOfDay(parseISO(b.created_at));
            const diff = differenceInDays(checkIn, createdAt);
            if (diff >= 0) {
              dayBwSum += diff;
              dayBwCount++;
            }
          }
        }
      });

      const dayAdr = dayNights > 0 ? Math.round(dayRevenue / dayNights) : 0;
      const dayRevpar = totalAvailableRooms > 0 ? Math.round(dayRevenue / totalAvailableRooms) : 0;
      const dayOcc = totalAvailableRooms > 0 ? Math.round((dayNights / totalAvailableRooms) * 100) : 0;
      const dayBw = dayBwCount > 0 ? Math.round(dayBwSum / dayBwCount) : 0;

      totalPaxNights += dayPax;
      totalArrivals += dayArrivals;
      totalDepartures += dayDepartures;

      dailyData.push({
        date: dateStr,
        revenue: dayRevenue,
        nightsSold: dayNights,
        adr: dayAdr,
        revpar: dayRevpar,
        occupancy: dayOcc,
        pax: dayPax,
        arrivals: dayArrivals,
        departures: dayDepartures,
        bookingWindow: dayBw
      });
    }

    return {
      revenue: periodRevenue,
      nights: periodNightsSold,
      adr,
      revpar,
      occupancy,
      bookingWindow: averageBookingWindow,
      nationalities: sortedNationalities,
      sources: sortedSources,
      dailyData,
      totalPaxNights,
      totalArrivals,
      totalDepartures
    };
  }, [bookings, units, startDate, endDate, selectedNationality, selectedSource]);

  const setQuickDate = (preset: 'hoy' | 'semana' | 'mes' | 'mes_pasado' | 'ano') => {
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
    } else if (preset === 'ano') {
      setStartDate(format(startOfYear(today), 'yyyy-MM-dd'));
      setEndDate(format(today, 'yyyy-MM-dd'));
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8 print:overflow-visible print:p-0">
        <div className="max-w-7xl mx-auto w-full">
          <div className={`mb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6 ${printOnlyTable ? 'print:hidden' : ''}`}>
            <div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">Resumen Financiero</h2>
              <p className="text-slate-500 text-sm mt-1">Ingresos y KPIs principales de tu propiedad.</p>
            </div>
            
            <div className="flex flex-col md:flex-row items-end gap-4 print-hidden">
              <button 
                onClick={() => window.print()} 
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors"
              >
                <FileDown className="w-4 h-4" />
                Descargar PDF
              </button>

              {/* Filtros */}
              <div className="flex flex-col items-end gap-3">
                <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1 rounded-lg">
                  <button onClick={() => setQuickDate('hoy')} className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-white hover:shadow-sm rounded-md transition-all">Hoy</button>
                  <button onClick={() => setQuickDate('semana')} className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-white hover:shadow-sm rounded-md transition-all">Últimos 7 días</button>
                  <button onClick={() => setQuickDate('mes')} className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-white hover:shadow-sm rounded-md transition-all">Este Mes</button>
                  <button onClick={() => setQuickDate('mes_pasado')} className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-white hover:shadow-sm rounded-md transition-all">Mes Pasado</button>
                  <button onClick={() => setQuickDate('ano')} className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-white hover:shadow-sm rounded-md transition-all">Este Año</button>
                </div>
                <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
                  <div className="flex items-center gap-2 px-3 border-r border-slate-100">
                  <CalendarIcon className="w-4 h-4 text-indigo-500" />
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
                    className="text-sm font-semibold text-slate-700 bg-transparent focus:outline-none cursor-pointer"
                  />
                </div>

              <div className="flex items-center gap-2 px-2 border-r border-slate-100">
                <Filter className="w-4 h-4 text-slate-400" />
                <select 
                  value={selectedNationality} 
                  onChange={e => setSelectedNationality(e.target.value)}
                  className="text-sm text-slate-700 bg-transparent focus:outline-none w-28 cursor-pointer"
                >
                  <option value="all">Todas Nac.</option>
                  {nationalities.map(n => <option key={n as string} value={n as string}>{n}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-2 px-2">
                <select 
                  value={selectedSource} 
                  onChange={e => setSelectedSource(e.target.value)}
                  className="text-sm text-slate-700 bg-transparent focus:outline-none w-28 cursor-pointer"
                >
                  <option value="all">Todo Origen</option>
                  {sources.map(s => <option key={s as string} value={s as string}>{s}</option>)}
                </select>
              </div>
            </div>
            </div>
            </div>
          </div>

          {/* KPIs Grid */}
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 ${printOnlyTable ? 'print:hidden' : ''}`}>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col relative overflow-hidden group hover:border-indigo-300 transition-colors">
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-indigo-50 rounded-full group-hover:scale-150 transition-transform"></div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 relative z-10">Ingresos Totales</p>
              <p className="text-3xl font-black text-slate-800 relative z-10">${reportData.revenue.toLocaleString()}</p>
            </div>
            
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 relative overflow-hidden group hover:border-emerald-300 transition-colors">
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-50 rounded-full group-hover:scale-150 transition-transform"></div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 relative z-10" title="Average Daily Rate">ADR</p>
              <p className="text-3xl font-black text-slate-800 relative z-10">${reportData.adr.toLocaleString()}</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 relative overflow-hidden group hover:border-blue-300 transition-colors">
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-50 rounded-full group-hover:scale-150 transition-transform"></div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 relative z-10" title="Revenue Per Available Room">RevPAR</p>
              <p className="text-3xl font-black text-slate-800 relative z-10">${reportData.revpar.toLocaleString()}</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 relative overflow-hidden group hover:border-purple-300 transition-colors">
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-purple-50 rounded-full group-hover:scale-150 transition-transform"></div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 relative z-10">Ocupación</p>
              <div className="flex items-baseline gap-1 relative z-10">
                <p className="text-3xl font-black text-slate-800">{reportData.occupancy}</p>
                <span className="text-lg font-bold text-slate-500">%</span>
              </div>
            </div>
          </div>

          <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${printOnlyTable ? 'print:hidden' : ''}`}>
            
            {/* Booking Window */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-xl p-6 text-white relative overflow-hidden flex flex-col justify-center print-break-inside-avoid">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Clock className="w-32 h-32" />
              </div>
              <h3 className="font-bold text-slate-400 text-xs uppercase tracking-wider flex items-center gap-2 mb-6">
                <Clock className="w-4 h-4" /> Booking Window
              </h3>
              <div className="relative z-10 mb-4">
                <div className="flex items-baseline gap-2">
                  <p className="text-6xl font-black text-white">{reportData.bookingWindow}</p>
                  <p className="text-xl font-medium text-slate-400">días</p>
                </div>
                <p className="text-sm font-semibold text-indigo-400 mt-2">ANTICIPACIÓN DE COMPRA</p>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed max-w-[250px]">
                Tiempo promedio entre el momento en que se genera la reserva y el día de llegada del huésped.
              </p>
            </div>

            {/* Breakdown Nationality */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 print-break-inside-avoid">
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2 mb-6">
                <MapPin className="w-4 h-4 text-indigo-500" /> Ingresos por País
              </h3>
              <div className="space-y-5">
                {reportData.nationalities.length > 0 ? reportData.nationalities.map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-end mb-1.5">
                      <span className="text-sm font-bold text-slate-700">{item.name}</span>
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-400 mr-2">${item.revenue.toLocaleString()}</span>
                        <span className="text-sm font-black text-indigo-600">{item.percentage}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${item.percentage}%` }}></div>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-slate-400 text-center py-4">No hay datos para mostrar</p>
                )}
              </div>
            </div>

            {/* Breakdown Source */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 print-break-inside-avoid">
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2 mb-6">
                <Share2 className="w-4 h-4 text-emerald-500" /> Ingresos por Origen
              </h3>
              <div className="space-y-5">
                {reportData.sources.length > 0 ? reportData.sources.map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-end mb-1.5">
                      <span className="text-sm font-bold text-slate-700">{item.name}</span>
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-400 mr-2">${item.revenue.toLocaleString()}</span>
                        <span className="text-sm font-black text-emerald-600">{item.percentage}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${item.percentage}%` }}></div>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-slate-400 text-center py-4">No hay datos para mostrar</p>
                )}
              </div>
            </div>

          </div>

          {/* Daily Breakdown Table */}
          <div className="mt-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px] print:h-auto print:overflow-visible print:border-none print:shadow-none">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-slate-800 text-lg uppercase tracking-wider flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-indigo-500" /> Desglose Diario
                </h3>
                <p className="text-slate-500 text-sm mt-1">Evolución de métricas para cada día del período seleccionado.</p>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setPrintOnlyTable(true)}
                  className="flex items-center gap-2 bg-slate-800 text-white hover:bg-slate-900 px-4 py-2 rounded-lg text-sm font-semibold transition-colors print-hidden shadow-sm"
                >
                  <FileDown className="w-4 h-4" />
                  PDF
                </button>
                <button 
                  onClick={() => {
                    const headers = ['Fecha', 'Ingresos', 'Noches Vendidas', 'Pax', 'Ocupación (%)', 'Arrivals', 'Departures', 'Booking Window', 'ADR', 'RevPAR'].join(',');
                    const rows = reportData.dailyData.map(d => 
                      [d.date, d.revenue, d.nightsSold, d.pax, d.occupancy, d.arrivals, d.departures, d.bookingWindow, d.adr, d.revpar].join(',')
                    );
                    const totalRow = ['TOTAL', reportData.revenue, reportData.nights, reportData.totalPaxNights, reportData.occupancy, reportData.totalArrivals, reportData.totalDepartures, reportData.bookingWindow, reportData.adr, reportData.revpar].join(',');
                    
                    const csv = [headers, ...rows, totalRow].join('\n');
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = `desglose_diario_${startDate}_${endDate}.csv`;
                    link.click();
                  }}
                  className="flex items-center gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-lg text-sm font-semibold transition-colors print-hidden shadow-sm border border-indigo-100"
                >
                  <FileDown className="w-4 h-4" />
                  CSV
                </button>
              </div>
            </div>
            
            <div className="overflow-auto w-full flex-1 relative print:overflow-visible">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-20">
                  <tr>
                    <th className="px-3 py-2 bg-slate-50 border-b border-slate-200 font-bold text-slate-700 text-sm shadow-[0_1px_0_0_#e2e8f0]">
                      Fecha
                    </th>
                    <th className="px-3 py-2 bg-slate-50 border-b border-slate-200 font-bold text-slate-700 text-sm shadow-[0_1px_0_0_#e2e8f0] text-right">
                      Ingresos
                    </th>
                    <th className="px-3 py-2 bg-slate-50 border-b border-slate-200 font-bold text-slate-700 text-sm shadow-[0_1px_0_0_#e2e8f0] text-center">
                      Noches
                    </th>
                    <th className="px-3 py-2 bg-slate-50 border-b border-slate-200 font-bold text-slate-700 text-sm shadow-[0_1px_0_0_#e2e8f0] text-center">
                      Pax
                    </th>
                    <th className="px-3 py-2 bg-slate-50 border-b border-slate-200 font-bold text-slate-700 text-sm shadow-[0_1px_0_0_#e2e8f0] text-center">
                      Ocupación
                    </th>
                    <th className="px-3 py-2 bg-slate-50 border-b border-slate-200 font-bold text-slate-700 text-sm shadow-[0_1px_0_0_#e2e8f0] text-center">
                      Arr / Dep
                    </th>
                    <th className="px-3 py-2 bg-slate-50 border-b border-slate-200 font-bold text-slate-700 text-sm shadow-[0_1px_0_0_#e2e8f0] text-center">
                      BW (Días)
                    </th>
                    <th className="px-3 py-2 bg-slate-50 border-b border-slate-200 font-bold text-slate-700 text-sm shadow-[0_1px_0_0_#e2e8f0] text-right">
                      ADR
                    </th>
                    <th className="px-3 py-2 bg-slate-50 border-b border-slate-200 font-bold text-slate-700 text-sm shadow-[0_1px_0_0_#e2e8f0] text-right">
                      RevPAR
                    </th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {reportData.dailyData.map((d, i) => (
                    <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-2 font-semibold text-slate-700">
                        {d.date}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-600 font-medium">
                        ${d.revenue.toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-center text-slate-600 font-medium">
                        {d.nightsSold}
                      </td>
                      <td className="px-3 py-2 text-center text-slate-600 font-medium">
                        {d.pax}
                      </td>
                      <td className={`px-3 py-2 text-center font-bold ${d.occupancy >= 80 ? 'text-emerald-600' : d.occupancy > 0 ? 'text-indigo-600' : 'text-slate-400'}`}>
                        {d.occupancy}%
                      </td>
                      <td className="px-3 py-2 text-center text-slate-600">
                        {d.arrivals} / {d.departures}
                      </td>
                      <td className="px-3 py-2 text-center text-slate-600 font-medium">
                        {d.bookingWindow}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-600">
                        ${d.adr.toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-600">
                        ${d.revpar.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="sticky bottom-0 z-20">
                  <tr className="bg-indigo-50 border-t-2 border-indigo-200 shadow-[0_-1px_0_0_#c7d2fe]">
                    <td className="px-3 py-2 font-black text-indigo-900 text-sm">
                      TOTAL
                    </td>
                    <td className="px-3 py-2 text-right font-black text-indigo-700">
                      ${reportData.revenue.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-center font-black text-indigo-700">
                      {reportData.nights}
                    </td>
                    <td className="px-3 py-2 text-center font-black text-indigo-700">
                      {reportData.totalPaxNights}
                    </td>
                    <td className="px-3 py-2 text-center font-black text-indigo-700">
                      {reportData.occupancy}%
                    </td>
                    <td className="px-3 py-2 text-center font-black text-indigo-700">
                      {reportData.totalArrivals} / {reportData.totalDepartures}
                    </td>
                    <td className="px-3 py-2 text-center font-black text-indigo-700">
                      {reportData.bookingWindow}
                    </td>
                    <td className="px-3 py-2 text-right font-black text-indigo-700">
                      ${reportData.adr.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right font-black text-indigo-700">
                      ${reportData.revpar.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
