'use client';

import { useMemo, useState } from 'react';
import { usePMS } from '../../context/PMSContext';
import { TopBar } from '../../components/layout/TopBar';
import { CircleDollarSign, FileText, TrendingUp, AlertCircle, Search, Download, Plus } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function BillingDashboard() {
  const { payments, invoices, bookings, currentPropertyId } = usePMS();
  const [activeTab, setActiveTab] = useState<'payments' | 'invoices'>('payments');
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate KPIs
  const totalRevenue = payments.reduce((acc, p) => p.status === 'completed' ? acc + p.amount : acc, 0);
  const pendingInvoices = invoices.filter(i => i.status === 'draft' || i.status === 'issued');
  const totalInvoiced = invoices.reduce((acc, i) => acc + i.total_amount, 0);

  // Computed data for payments
  const displayPayments = payments.filter(p => {
    if (currentPropertyId !== 'all' && p.property_id !== currentPropertyId) return false;
    if (searchTerm) {
      const b = bookings.find(bk => bk.id === p.booking_id);
      const search = searchTerm.toLowerCase();
      if (!b) return false;
      return `${b.first_name} ${b.last_name}`.toLowerCase().includes(search) || p.id.toLowerCase().includes(search);
    }
    return true;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Computed data for invoices
  const displayInvoices = invoices.filter(i => {
    if (currentPropertyId !== 'all' && i.property_id !== currentPropertyId) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return i.billing_name.toLowerCase().includes(search) || (i.invoice_number && i.invoice_number.toLowerCase().includes(search));
    }
    return true;
  }).sort((a, b) => new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime());

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      <TopBar />

      <main className="flex-1 overflow-y-auto p-6 flex flex-col max-w-[1400px] mx-auto w-full">
        <div className="mb-6 flex justify-between items-end shrink-0">
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Facturación y Pagos</h2>
            <p className="text-slate-500 text-sm mt-1">Controla los ingresos, pagos y comprobantes de tu propiedad.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Buscar por pasajero o N°..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-72"
              />
            </div>
            <button className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center gap-2">
              <Download className="w-4 h-4" /> Exportar Reporte
            </button>
          </div>
        </div>

        {/* KPIs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 shrink-0">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col relative overflow-hidden group">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 relative z-10">Ingresos Cobrados</p>
            <p className="text-3xl font-black text-slate-800 relative z-10">${totalRevenue.toLocaleString()}</p>
            <p className="text-sm font-semibold text-emerald-600 mt-2 flex items-center gap-1"><TrendingUp className="w-4 h-4"/> En tiempo real</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col relative overflow-hidden group">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 relative z-10">Total Facturado</p>
            <p className="text-3xl font-black text-slate-800 relative z-10">${totalInvoiced.toLocaleString()}</p>
            <p className="text-sm font-semibold text-indigo-600 mt-2 flex items-center gap-1"><FileText className="w-4 h-4"/> Emitidas al momento</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col relative overflow-hidden group">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 relative z-10">Facturas Pendientes</p>
            <p className="text-3xl font-black text-amber-600 relative z-10">{pendingInvoices.length}</p>
            <p className="text-sm font-semibold text-amber-600 mt-2 flex items-center gap-1"><AlertCircle className="w-4 h-4"/> Esperando cobro/emisión</p>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 rounded-2xl shadow-md text-white flex flex-col items-start justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <CircleDollarSign className="w-24 h-24" />
            </div>
            <h3 className="font-bold text-lg mb-2 relative z-10">Nuevo Pago</h3>
            <p className="text-indigo-100 text-sm mb-4 relative z-10">Registra ingresos desde el detalle de cada reserva.</p>
            <button className="bg-white text-indigo-700 px-4 py-2 rounded-lg text-sm font-black shadow-sm hover:bg-indigo-50 relative z-10">
              Ver Reservas
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 border-b border-slate-200 mb-6 shrink-0">
          <button 
            className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'payments' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('payments')}
          >
            Historial de Pagos
          </button>
          <button 
            className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'invoices' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('invoices')}
          >
            Gestión de Facturas
          </button>
        </div>

        {/* Table Content */}
        <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-y-auto flex-1 custom-scrollbar">
            {activeTab === 'payments' ? (
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-bold sticky top-0 border-b border-slate-200 z-10">
                  <tr>
                    <th className="px-6 py-4">Fecha</th>
                    <th className="px-6 py-4">Huésped / Reserva</th>
                    <th className="px-6 py-4 text-center">Método</th>
                    <th className="px-6 py-4 text-center">Estado</th>
                    <th className="px-6 py-4 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayPayments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium">
                        No se encontraron pagos.
                      </td>
                    </tr>
                  ) : (
                    displayPayments.map(payment => {
                      const b = bookings.find(bk => bk.id === payment.booking_id);
                      return (
                        <tr key={payment.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-700">
                            {format(parseISO(payment.date), 'dd/MM/yyyy HH:mm')}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-800">{b ? `${b.first_name} ${b.last_name}` : 'Reserva eliminada'}</div>
                            <div className="text-xs text-slate-500 mt-0.5">Ref: {payment.reference || '-'}</div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="bg-slate-100 text-slate-600 font-bold text-xs px-2.5 py-1 rounded-md uppercase tracking-wider">
                              {payment.method}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`font-bold text-xs px-2.5 py-1 rounded-md uppercase tracking-wider ${
                              payment.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                              payment.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {payment.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="font-black text-emerald-600 text-base">${payment.amount.toLocaleString()}</span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-bold sticky top-0 border-b border-slate-200 z-10">
                  <tr>
                    <th className="px-6 py-4">Emisión</th>
                    <th className="px-6 py-4">N° Factura</th>
                    <th className="px-6 py-4">Razón Social / Cliente</th>
                    <th className="px-6 py-4 text-center">Estado</th>
                    <th className="px-6 py-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium">
                        No se encontraron facturas.
                      </td>
                    </tr>
                  ) : (
                    displayInvoices.map(invoice => (
                      <tr key={invoice.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-700">
                          {format(parseISO(invoice.issue_date), 'dd/MM/yyyy')}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-800">
                          {invoice.invoice_number || 'Pendiente de emisión'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800">{invoice.billing_name}</div>
                          <div className="text-xs text-slate-500 mt-0.5">Doc: {invoice.billing_document}</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`font-bold text-xs px-2.5 py-1 rounded-md uppercase tracking-wider ${
                            invoice.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                            invoice.status === 'issued' ? 'bg-blue-100 text-blue-700' :
                            invoice.status === 'draft' ? 'bg-slate-100 text-slate-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {invoice.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-black text-slate-800 text-base">${invoice.total_amount.toLocaleString()}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
