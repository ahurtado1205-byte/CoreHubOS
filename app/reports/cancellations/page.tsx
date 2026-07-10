'use client';

import React, { useState } from 'react';
import { usePMS } from '../../../context/PMSContext';
import { format, parseISO } from 'date-fns';
import { FileDown, Calendar, Filter, XCircle } from 'lucide-react';

export default function CancellationsReport() {
  const { bookings, deleteBooking } = usePMS();
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Filter bookings to only show cancelled ones
  const cancelledBookings = bookings.filter(b => b.booking_status === 'cancelled');

  // Apply date range filters if set
  const filteredBookings = cancelledBookings.filter(b => {
    if (dateRange.start && b.check_in < dateRange.start) return false;
    if (dateRange.end && b.check_in > dateRange.end) return false;
    return true;
  });

  // Calculate metrics
  const totalCancellations = filteredBookings.length;
  const lostRevenue = filteredBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
  
  const reasonCounts = filteredBookings.reduce((acc, b) => {
    const reason = b.cancellation_reason || 'Sin Especificar';
    acc[reason] = (acc[reason] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topReason = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0];

  const handleExportCSV = () => {
    const headers = ['ID', 'Huesped', 'Check-In', 'Check-Out', 'Monto Perdido', 'Motivo de Cancelacion'];
    const rows = filteredBookings.map(b => [
      b.confirmation_id || b.id,
      `${b.first_name} ${b.last_name}`,
      b.check_in,
      b.check_out,
      b.total_amount || 0,
      b.cancellation_reason || 'Sin Especificar'
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reporte_cancelaciones_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-end">
          <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <XCircle className="w-8 h-8 text-red-600" /> Reporte de Cancelaciones (CXL)
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Analiza los motivos y el impacto de las reservas perdidas.</p>
        </div>
        <button onClick={handleExportCSV} className="bg-white border-2 border-slate-200 text-slate-700 font-bold py-2 px-4 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2">
          <FileDown className="w-4 h-4" /> Exportar CSV
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
        <Filter className="w-5 h-5 text-slate-400" />
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-600">Desde Check-In:</span>
          <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="border-2 border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-600">Hasta Check-In:</span>
          <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="border-2 border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500" />
        </div>
        {(dateRange.start || dateRange.end) && (
          <button onClick={() => setDateRange({start:'', end:''})} className="text-sm font-bold text-indigo-600 hover:text-indigo-800 ml-auto">
            Limpiar Filtros
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-red-50 rounded-2xl p-6 border border-red-100 shadow-sm">
          <h3 className="text-red-800 text-sm font-bold uppercase tracking-wider mb-2">Total Canceladas</h3>
          <p className="text-4xl font-black text-red-600">{totalCancellations}</p>
        </div>
        <div className="bg-orange-50 rounded-2xl p-6 border border-orange-100 shadow-sm">
          <h3 className="text-orange-800 text-sm font-bold uppercase tracking-wider mb-2">Ingresos Perdidos</h3>
          <p className="text-4xl font-black text-orange-600">${lostRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 shadow-sm">
          <h3 className="text-indigo-800 text-sm font-bold uppercase tracking-wider mb-2">Motivo Principal</h3>
          <p className="text-xl font-black text-indigo-600">{topReason ? topReason[0] : 'N/A'}</p>
          <p className="text-sm text-indigo-500 font-bold">{topReason ? `${topReason[1]} reservas` : ''}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b-2 border-slate-200">
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Huesped / ID</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Fechas</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Motivo (CXL Reason)</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Monto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredBookings.length > 0 ? filteredBookings.map(b => (
              <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4">
                  <div className="font-bold text-slate-900">{b.first_name} {b.last_name}</div>
                  <div className="text-xs text-slate-500 font-mono">{b.confirmation_id || b.id.substring(0, 8)}</div>
                </td>
                <td className="p-4">
                  <div className="text-sm text-slate-700 font-medium">
                    {format(parseISO(b.check_in), 'dd/MM/yy')} → {format(parseISO(b.check_out), 'dd/MM/yy')}
                  </div>
                </td>
                <td className="p-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                    {b.cancellation_reason || 'Sin Especificar'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <div className="font-bold text-slate-900">${b.total_amount?.toLocaleString() || 0}</div>
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => {
                      if (window.confirm(`¿Estás seguro de eliminar definitivamente la reserva de ${b.first_name} ${b.last_name}? Esta acción no se puede deshacer.`)) {
                        deleteBooking(b.id);
                      }
                    }}
                    className="text-slate-400 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-red-50"
                    title="Eliminar permanentemente"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-500 italic font-medium">
                  No se encontraron reservas canceladas en este periodo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
    </div>
  );
}
