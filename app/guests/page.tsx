'use client';

import { useMemo, useState } from 'react';
import { usePMS } from '../../context/PMSContext';
import { Hexagon, Search, Users, Phone, Mail, Globe, Target, CalendarRange, CircleDollarSign, BarChart3, BookOpen, Settings, Bell, FileDown } from 'lucide-react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';

import { TopBar } from '../../components/layout/TopBar';
import { Modal } from '../../components/ui/Modal';

export default function GuestsPage() {
  const { bookings, quotes, deleteBooking, deleteQuote, updateBooking, updateQuote } = usePMS();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingGuest, setEditingGuest] = useState<any>(null);
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '', email: '', phone: '', nationality: '' });

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGuest) return;
    const guestBookings = bookings.filter(b => b.first_name === editingGuest.first_name && b.last_name === editingGuest.last_name);
    const guestQuotes = quotes.filter(q => q.first_name === editingGuest.first_name && q.last_name === editingGuest.last_name);
    
    guestBookings.forEach(b => updateBooking({ ...b, ...editForm }));
    guestQuotes.forEach(q => updateQuote({ ...q, ...editForm }));
    
    setEditingGuest(null);
  };


  const guests = useMemo(() => {
    const profileMap = new Map();

    const processPerson = (item: any, type: 'booking'|'quote', amount: number, nights: number) => {
      if (!item.first_name || !item.last_name) return;
      const key = `${item.first_name.trim().toLowerCase()} ${item.last_name.trim().toLowerCase()}`;
      
      if (!profileMap.has(key)) {
        profileMap.set(key, {
          id: key,
          first_name: item.first_name,
          last_name: item.last_name,
          email: item.email || '',
          phone: item.phone || '',
          nationality: item.nationality || '',
          total_spent: 0,
          total_nights: 0,
          bookings_count: 0,
          quotes_count: 0,
          last_activity: item.created_at || ''
        });
      }

      const profile = profileMap.get(key);
      
      if (item.email && !profile.email) profile.email = item.email;
      if (item.phone && !profile.phone) profile.phone = item.phone;
      if (item.nationality && !profile.nationality) profile.nationality = item.nationality;
      
      if (type === 'booking') {
        profile.bookings_count++;
        profile.total_spent += (amount || 0);
        profile.total_nights += (nights || 0);
      } else {
        profile.quotes_count++;
      }

      if (item.created_at && item.created_at > profile.last_activity) {
        profile.last_activity = item.created_at;
      }
    };

    bookings.forEach(b => processPerson(b, 'booking', b.total_amount || 0, b.total_nights || 0));
    quotes.forEach(q => processPerson(q, 'quote', 0, 0));

    return Array.from(profileMap.values()).sort((a, b) => b.total_spent - a.total_spent);
  }, [bookings, quotes]);

  const filteredGuests = guests.filter(g => 
    `${g.first_name} ${g.last_name} ${g.email} ${g.phone} ${g.nationality}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportCSV = () => {
    const headers = ['Nombre', 'Apellido', 'Email', 'Teléfono', 'Nacionalidad', 'Reservas', 'Cotizaciones', 'Noches Totales', 'Total Invertido', 'Última Actividad'];
    const rows = filteredGuests.map(g => [
      g.first_name,
      g.last_name,
      g.email,
      g.phone,
      g.nationality,
      g.bookings_count,
      g.quotes_count,
      g.total_nights,
      g.total_spent,
      g.last_activity ? format(parseISO(g.last_activity), 'dd/MM/yyyy') : ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${cell || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Huespedes_CoreHub OS_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      {/* Top Navigation */}
      <TopBar />

      {/* Main Content */}
      <main className="flex-1 overflow-hidden p-6 flex flex-col max-w-[1400px] mx-auto w-full">
        <div className="mb-6 flex justify-between items-end shrink-0">
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Directorio de Huéspedes</h2>
            <p className="text-slate-500 text-sm mt-1">Base de datos unificada generada automáticamente a partir de reservas y cotizaciones.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Buscar por nombre, email..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-72"
              />
            </div>
            <button 
              onClick={handleExportCSV}
              className="bg-white border-2 border-indigo-100 text-indigo-700 hover:bg-indigo-50 px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center gap-2"
            >
              <FileDown className="w-4 h-4" /> Exportar CSV
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6 shrink-0">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase">Total Perfiles</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{guests.length}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase">Huéspedes Frecuentes</p>
            <p className="text-2xl font-black text-indigo-600 mt-1">{guests.filter(g => g.bookings_count > 1).length}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase">Ingresos Totales (LTV)</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">${guests.reduce((acc, g) => acc + g.total_spent, 0).toLocaleString()}</p>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto flex-1 custom-scrollbar">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-bold sticky top-0 border-b border-slate-200 z-10">
                <tr>
                  <th className="px-6 py-4">Pasajero</th>
                  <th className="px-6 py-4">Contacto</th>
                  <th className="px-6 py-4">Nacionalidad</th>
                  <th className="px-6 py-4 text-center">Reservas / Coti.</th>
                  <th className="px-6 py-4 text-center">Noches</th>
                  <th className="px-6 py-4 text-right">LTV (Total Gastado)</th>
                  <th className="px-6 py-4">Última Actividad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredGuests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-medium">
                      No se encontraron huéspedes.
                    </td>
                  </tr>
                ) : (
                  filteredGuests.map((guest, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800 flex items-center justify-between">
                          <span>{guest.first_name} {guest.last_name}</span>
                          <button
                            onClick={() => {
                              setEditingGuest(guest);
                              setEditForm({ first_name: guest.first_name, last_name: guest.last_name, email: guest.email, phone: guest.phone, nationality: guest.nationality });
                            }}
                            className="text-slate-300 hover:text-indigo-600 transition-colors opacity-0 group-hover:opacity-100 p-1"
                            title="Editar Perfil"
                          >
                            <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {guest.email && (
                            <div className="flex items-center gap-1.5 text-xs">
                              <Mail className="w-3 h-3 text-slate-400" /> {guest.email}
                            </div>
                          )}
                          {guest.phone && (
                            <div className="flex items-center gap-1.5 text-xs">
                              <Phone className="w-3 h-3 text-slate-400" /> {guest.phone}
                            </div>
                          )}
                          {!guest.email && !guest.phone && <span className="text-slate-400 italic text-xs">Sin contacto</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {guest.nationality ? (
                          <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 w-fit px-2 py-1 rounded">
                            <Globe className="w-3 h-3" /> {guest.nationality}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2 font-bold">
                          <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded" title="Reservas Confirmadas">{guest.bookings_count}</span>
                          <span className="text-slate-300">/</span>
                          <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded" title="Cotizaciones">{guest.quotes_count}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-slate-700">
                        {guest.total_nights}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-black text-emerald-600">${guest.total_spent.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-500 flex items-center justify-between">
                        {guest.last_activity ? format(parseISO(guest.last_activity), 'dd/MM/yyyy') : '-'}
                        <button
                          onClick={() => {
                            if(window.confirm(`¿Seguro que deseas eliminar DEFINITIVAMENTE el perfil de ${guest.first_name} ${guest.last_name}? Se borrarán TODAS sus reservas y cotizaciones de la base de datos.`)) {
                              const guestBookings = bookings.filter(b => b.first_name === guest.first_name && b.last_name === guest.last_name);
                              const guestQuotes = quotes.filter(q => q.first_name === guest.first_name && q.last_name === guest.last_name);
                              
                              guestBookings.forEach(b => deleteBooking(b.id));
                              guestQuotes.forEach(q => deleteQuote(q.id));
                            }
                          }}
                          className="text-slate-300 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100 p-1"
                          title="Eliminar Perfil (Borra Reservas y Cotizaciones)"
                        >
                          <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal Editar Huésped */}
      {editingGuest && (
        <Modal
          isOpen={true}
          onClose={() => setEditingGuest(null)}
          title="Editar Perfil de Huésped"
        >
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-4">
              <p className="text-xs text-blue-700">Se actualizarán <b>todas</b> las reservas y cotizaciones asociadas a este pasajero con los nuevos datos.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Nombre</label>
                <input required type="text" value={editForm.first_name} onChange={e => setEditForm({...editForm, first_name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Apellido</label>
                <input required type="text" value={editForm.last_name} onChange={e => setEditForm({...editForm, last_name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
              <input type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Teléfono</label>
              <input type="tel" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Nacionalidad</label>
              <input type="text" value={editForm.nationality} onChange={e => setEditForm({...editForm, nationality: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
            </div>
            
            <div className="flex gap-3 justify-end pt-4 mt-6 border-t border-slate-200">
              <button type="button" onClick={() => setEditingGuest(null)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                Cancelar
              </button>
              <button type="submit" className="px-4 py-2 text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors">
                Guardar Cambios
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
