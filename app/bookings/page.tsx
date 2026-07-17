'use client';

import { useState, useMemo } from 'react';
import { usePMS } from '../../context/PMSContext';
import { Hexagon, Search, CalendarRange, Users, BookOpen, CircleDollarSign, BarChart3, LayoutDashboard, Target, Settings, Bell, Filter, Plus, ChevronLeft, ChevronRight, Edit2, MessageCircle, Mail, Download } from 'lucide-react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { Modal } from '../../components/ui/Modal';
import { BookingForm } from '../../components/bookings/BookingForm';
import { Booking } from '../../types';


import { TopBar } from '../../components/layout/TopBar';
import { buildWhatsAppLink, buildMailtoLink } from '../../services/communicationTemplateService';

function UpgradeDowngradeBadge({ booking, units, unitTypes }: { booking: any; units: any[]; unitTypes: any[] }) {
  if (!booking.room_id) return null;
  
  const room = units.find(u => u.id === booking.room_id);
  if (!room) return null;

  const reservedCategory = unitTypes.find(ut => ut.id === booking.unit_type_id);
  const assignedCategory = unitTypes.find(ut => ut.id === room.unit_type_id);

  if (!reservedCategory || !assignedCategory) return null;

  if (assignedCategory.base_price < reservedCategory.base_price) {
    return (
      <span className="inline-flex items-center gap-0.5 bg-rose-50 text-rose-700 border border-rose-200 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ml-1.5 shrink-0 animate-in fade-in" title="Downgrade: Habitación de menor categoría asignada">
        ⚠️ Down
      </span>
    );
  }

  if (assignedCategory.base_price > reservedCategory.base_price) {
    const isUpsell = booking.upgrade_type === 'upsell';
    return (
      <span className={`inline-flex items-center gap-0.5 border text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ml-1.5 shrink-0 animate-in fade-in ${
        isUpsell 
          ? 'bg-amber-50 text-amber-700 border-amber-200' 
          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
      }`} title={isUpsell ? "Upgrade con cobro adicional (Upsell)" : "Upgrade de cortesía"}>
        {isUpsell ? '💎 Upsell' : '✨ Up'}
      </span>
    );
  }

  return null;
}

export default function BookingsPage() {
  const { bookings, properties, currentPropertyId, units, unitTypes, addBooking, updateBooking, deleteBooking, bookingColors, searchQuery, setSearchQuery, templates } = usePMS();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [isSendMessageModalOpen, setIsSendMessageModalOpen] = useState(false);
  const [sendMessageTarget, setSendMessageTarget] = useState<Booking | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [sortField, setSortField] = useState<'guest' | 'check_in' | 'status'>('check_in');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: 'guest' | 'check_in' | 'status') => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sortArrow = (field: 'guest' | 'check_in' | 'status') => {
    if (sortField !== field) return <span className="text-slate-300 ml-1">↕</span>;
    return <span className="text-indigo-500 ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  const handleEditBooking = (booking: Booking) => {
    setEditingBooking(booking);
    setIsBookingModalOpen(true);
  };

  const handleNewBooking = () => {
    setEditingBooking(null);
    setIsBookingModalOpen(true);
  };

  // Filter + Sort bookings
  const filteredBookings = useMemo(() => {
    const filtered = bookings.filter(b => {
      const q = (searchQuery || '').toLowerCase();
      const matchesSearch = !q || `${b.first_name} ${b.last_name} ${b.email || ''} ${b.confirmation_id || ''} ${b.id}`.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || b.booking_status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    return filtered.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'guest') {
        const nameA = `${a.last_name} ${a.first_name}`.toLowerCase();
        const nameB = `${b.last_name} ${b.first_name}`.toLowerCase();
        cmp = nameA.localeCompare(nameB);
      } else if (sortField === 'check_in') {
        cmp = new Date(a.check_in).getTime() - new Date(b.check_in).getTime();
      } else if (sortField === 'status') {
        const sA = (bookingColors[a.booking_status]?.label || a.booking_status).toLowerCase();
        const sB = (bookingColors[b.booking_status]?.label || b.booking_status).toLowerCase();
        cmp = sA.localeCompare(sB);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [bookings, searchQuery, statusFilter, sortField, sortDir, bookingColors]);

  return (
    <div className="flex flex-col h-screen bg-slate-100 overflow-hidden">
      {/* Top Navigation */}
      <TopBar />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Todas las Reservas</h2>
              <p className="text-slate-500 text-sm mt-1">Busca y administra las reservas registradas en el sistema.</p>
            </div>
            <button 
              onClick={handleNewBooking}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors active:scale-95 shrink-0"
            >
              + Nueva Reserva
            </button>
          </div>

          {/* Filtros */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Buscar por huésped, ID o email..." 
                value={searchQuery || ''}
                onChange={e => setSearchQuery?.(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
            <select 
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 min-w-[160px]"
            >
                <option value="all">Todos los estados</option>
                {Object.entries(bookingColors).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
            </select>
          </div>

          {/* Tabla (Desktop) */}
          <div className="hidden md:block bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold tracking-wider">
                    <th className="p-4 cursor-pointer hover:text-indigo-600 select-none" onClick={() => handleSort('guest')}>
                      Huésped {sortArrow('guest')}
                    </th>
                    <th className="p-4 cursor-pointer hover:text-indigo-600 select-none" onClick={() => handleSort('check_in')}>
                      Check-in / Out {sortArrow('check_in')}
                    </th>
                    <th className="p-4">Habitación</th>
                    <th className="p-4 cursor-pointer hover:text-indigo-600 select-none" onClick={() => handleSort('status')}>
                      Estado {sortArrow('status')}
                    </th>
                    <th className="p-4">Total</th>
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredBookings.length > 0 ? (
                    filteredBookings.map(booking => {
                      const unit = units.find(u => u.id === booking.room_id);
                      const unitType = unitTypes.find(ut => ut.id === booking.unit_type_id);
                      const statusConfig = bookingColors[booking.booking_status];
                      
                      return (
                        <tr key={booking.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 uppercase">{booking.confirmation_id || booking.id}</span>
                            </div>
                            <div className="font-bold text-slate-800 flex items-center flex-wrap gap-1">
                              {booking.first_name} {booking.last_name}
                              <UpgradeDowngradeBadge booking={booking} units={units} unitTypes={unitTypes} />
                            </div>
                            {booking.email && <div className="text-xs text-slate-500 mt-0.5">{booking.email}</div>}
                          </td>
                          <td className="p-4">
                            <div className="font-medium text-slate-700">{format(parseISO(booking.check_in), 'dd/MM/yyyy')}</div>
                            <div className="text-xs text-slate-500 mt-0.5">al {format(parseISO(booking.check_out), 'dd/MM/yyyy')}</div>
                          </td>
                          <td className="p-4">
                            {unit ? (
                              <div className="font-bold text-slate-700">{unit.name}</div>
                            ) : (
                              <div className="text-amber-600 font-semibold text-xs bg-amber-100 px-2 py-0.5 rounded inline-block">Sin Asignar</div>
                            )}
                            <div className="text-xs text-slate-500 mt-0.5">{unitType?.name}</div>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusConfig?.colorClass || 'bg-slate-100 text-slate-600'}`}>
                              {statusConfig?.label || booking.booking_status}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-emerald-600">${booking.total_amount || 0}</div>
                          </td>
                          <td className="p-4 text-right">
                            <button 
                              onClick={() => {
                                setSendMessageTarget(booking);
                                setIsSendMessageModalOpen(true);
                              }}
                              title="Enviar Mensaje"
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors inline-block mr-1"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleEditBooking(booking)}
                              title="Editar"
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors inline-block"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500 font-medium">
                        No se encontraron reservas con los filtros actuales.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cards (Mobile) */}
          <div className="md:hidden space-y-4">
            {filteredBookings.length > 0 ? (
              filteredBookings.map(booking => {
                const unit = units.find(u => u.id === booking.room_id);
                const unitType = unitTypes.find(ut => ut.id === booking.unit_type_id);
                const statusConfig = bookingColors[booking.booking_status];
                
                return (
                  <div key={booking.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 uppercase">{booking.confirmation_id || booking.id.substring(0,8)}</span>
                        <h4 className="font-bold text-slate-800 text-sm mt-1 flex items-center flex-wrap gap-1">
                          {booking.first_name} {booking.last_name}
                          <UpgradeDowngradeBadge booking={booking} units={units} unitTypes={unitTypes} />
                        </h4>
                        {booking.email && <p className="text-xs text-slate-500">{booking.email}</p>}
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusConfig?.colorClass || 'bg-slate-100 text-slate-600'}`}>
                        {statusConfig?.label || booking.booking_status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-3">
                      <div>
                        <span className="text-slate-400 block uppercase text-[9px] font-black">Estadía</span>
                        <span className="font-semibold text-slate-700">{format(parseISO(booking.check_in), 'dd/MM')} al {format(parseISO(booking.check_out), 'dd/MM')}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block uppercase text-[9px] font-black">Habitación</span>
                        <span className="font-bold text-slate-700">{unit ? unit.name : 'Sin Asignar'}</span>
                        <span className="text-[10px] text-slate-500 block truncate">{unitType?.name}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                      <span className="font-bold text-emerald-600 text-sm">${booking.total_amount || 0}</span>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setSendMessageTarget(booking);
                            setIsSendMessageModalOpen(true);
                          }}
                          className="p-2 text-slate-500 hover:text-emerald-600 bg-slate-50 rounded-lg border border-slate-200 transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleEditBooking(booking)}
                          className="p-2 text-slate-500 hover:text-indigo-600 bg-slate-50 rounded-lg border border-slate-200 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-white p-8 text-center text-slate-500 font-medium rounded-xl border border-slate-200">
                No se encontraron reservas con los filtros actuales.
              </div>
            )}
          </div>
        </div>
      </main>

      <Modal 
        isOpen={isBookingModalOpen} 
        onClose={() => setIsBookingModalOpen(false)}
        title={editingBooking ? "Editar Reserva" : "Crear Nueva Reserva"}
        size="4xl"
      >
        <BookingForm 
          initialBooking={editingBooking}
          onSuccess={() => setIsBookingModalOpen(false)} 
          onCancel={() => setIsBookingModalOpen(false)} 
        />
      </Modal>

      {/* Modal de Envío de Mensajes (Plantillas) */}
      {isSendMessageModalOpen && sendMessageTarget && (
        <Modal 
          isOpen={isSendMessageModalOpen} 
          onClose={() => setIsSendMessageModalOpen(false)}
          title="Enviar Mensaje / Generar PDF"
        >
          <div className="p-2 space-y-6">
            <p className="text-slate-600 text-sm">
              Comunicación con <strong>{sendMessageTarget.first_name} {sendMessageTarget.last_name}</strong>. Seleccioná una plantilla.
            </p>

            <div className="mb-4">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Plantilla a utilizar</label>
              <select 
                value={selectedTemplateId || (templates[0]?.id || '')} 
                onChange={e => setSelectedTemplateId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
              >
                {templates.length > 0 ? (
                  <optgroup label="Tus Plantillas">
                    {templates.map((t: any) => (
                      <option key={t.id} value={t.id}>{t.name} ({t.type})</option>
                    ))}
                  </optgroup>
                ) : (
                  <option value="">No hay plantillas creadas. Crea una en Configuración.</option>
                )}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <button 
                onClick={() => {
                  let msg = '';
                  const templateIdToUse = selectedTemplateId || templates[0]?.id;
                  const tpl = templates.find((t: any) => t.id === templateIdToUse);
                  if (tpl) {
                    msg = tpl.content
                      .replace(/{{nombre}}/g, sendMessageTarget.first_name || '')
                      .replace(/{{apellido}}/g, sendMessageTarget.last_name || '')
                      .replace(/{{check_in}}/g, sendMessageTarget.check_in || '')
                      .replace(/{{check_out}}/g, sendMessageTarget.check_out || '')
                      .replace(/{{total}}/g, (sendMessageTarget.total_amount || 0).toString());
                  }
                  const link = buildWhatsAppLink(sendMessageTarget.phone || '000000000', msg);
                  window.open(link, '_blank');
                  setIsSendMessageModalOpen(false);
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/20"
              >
                <MessageCircle className="w-8 h-8" />
                <span>WhatsApp</span>
              </button>
              
              <button 
                onClick={() => {
                  let subject = '';
                  let body = '';
                  const templateIdToUse = selectedTemplateId || templates[0]?.id;
                  const tpl = templates.find((t: any) => t.id === templateIdToUse);
                  if (tpl) {
                    subject = tpl.subject || `Confirmación de Reserva - ${sendMessageTarget.first_name}`;
                    body = tpl.content
                      .replace(/{{nombre}}/g, sendMessageTarget.first_name || '')
                      .replace(/{{apellido}}/g, sendMessageTarget.last_name || '')
                      .replace(/{{check_in}}/g, sendMessageTarget.check_in || '')
                      .replace(/{{check_out}}/g, sendMessageTarget.check_out || '')
                      .replace(/{{total}}/g, (sendMessageTarget.total_amount || 0).toString());
                  }
                  const link = buildMailtoLink(sendMessageTarget.email || 'correo@ejemplo.com', subject, body);
                  window.open(link, '_blank');
                  setIsSendMessageModalOpen(false);
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-900/20"
              >
                <Mail className="w-8 h-8" />
                <span>Email</span>
              </button>

              <button 
                onClick={() => {
                  let subject = '';
                  let body = '';
                  const templateIdToUse = selectedTemplateId || templates[0]?.id;
                  const tpl = templates.find((t: any) => t.id === templateIdToUse);
                  if (tpl) {
                    subject = tpl.subject || `Reserva - ${sendMessageTarget.first_name}`;
                    body = tpl.content
                      .replace(/{{nombre}}/g, sendMessageTarget.first_name || '')
                      .replace(/{{apellido}}/g, sendMessageTarget.last_name || '')
                      .replace(/{{check_in}}/g, sendMessageTarget.check_in || '')
                      .replace(/{{check_out}}/g, sendMessageTarget.check_out || '')
                      .replace(/{{total}}/g, (sendMessageTarget.total_amount || 0).toString());
                  }
                  
                  const dateStr = new Date().toISOString().split('T')[0];
                  const pdfTitle = `${sendMessageTarget.confirmation_id || sendMessageTarget.id}_${dateStr}`;
                  
                  const printWindow = window.open('', '_blank');
                  if (printWindow) {
                    printWindow.document.write(`
                      <html>
                        <head>
                          <title>${pdfTitle}</title>
                          <style>
                            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #1f2937; background: #fff; }
                            .container { max-width: 800px; margin: 0 auto; line-height: 1.6; }
                            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; }
                            .logo { color: #4f46e5; font-size: 24px; font-weight: bold; display: flex; align-items: center; justify-content: center; gap: 8px; }
                            .content { white-space: pre-wrap; margin-bottom: 40px; }
                            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 20px; }
                            @media print {
                              body { padding: 0; }
                              button { display: none; }
                            }
                          </style>
                        </head>
                        <body>
                          <div class="container">
                            <div class="header">
                              <div class="logo">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
                                CoreHub OS
                              </div>
                              <h2 style="margin-top: 16px; color: #374151;">${subject}</h2>
                            </div>
                            <div class="content">${body}</div>
                            <div class="footer">Documento generado automáticamente por CoreHub OS</div>
                          </div>
                          <script>
                            window.onload = function() {
                              window.print();
                            }
                          </script>
                        </body>
                      </html>
                    `);
                    printWindow.document.close();
                  }
                  
                  setIsSendMessageModalOpen(false);
                }}
                className="col-span-2 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-slate-900/20"
              >
                <Download className="w-5 h-5" />
                <span>Generar PDF / Imprimir</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
