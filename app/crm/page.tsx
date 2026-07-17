'use client';

import { useState, useMemo, useEffect } from 'react';
import { usePMS } from '../../context/PMSContext';
import { Hexagon, LayoutDashboard, Plus, CalendarRange, Clock, BookOpen, CircleDollarSign, BarChart3, Search, Bell, Settings, Target, Users, Filter, Sparkles, Trash2, Mail, MessageCircle, MoreVertical, DollarSign, Calendar, Phone, CheckCircle2, User, LayoutGrid, List, Download, Settings2, Zap } from 'lucide-react';
import Link from 'next/link';
import { Modal } from '../../components/ui/Modal';
import { QuoteForm } from '../../components/quotes/QuoteForm';
import { BookingForm } from '../../components/bookings/BookingForm';
import { Quote } from '../../types';
import { format, parseISO, differenceInDays } from 'date-fns';
import { buildWhatsAppQuoteMessage, buildWhatsAppLink, buildEmailSubject, buildEmailBody, buildMailtoLink } from '../../services/communicationTemplateService';

import { TopBar } from '../../components/layout/TopBar';

export type AutomationAction = 'open_send_modal' | 'auto_send_email' | 'auto_send_whatsapp' | 'create_task' | 'open_booking_modal';

export interface AutomationRule {
  id: string;
  trigger_stage: string;
  action: AutomationAction;
  template_id?: string;
  delay_days?: number;
  is_active: boolean;
}

const STAGES = [
  { id: 'draft', label: 'Borrador' },
  { id: 'sent', label: 'Enviada' },
  { id: 'follow_up', label: 'Seguimiento' },
  { id: 'pre_booked', label: 'Pre Reserva' },
  { id: 'booked', label: 'Reserva' },
  { id: 'lost', label: 'Perdida' }
];

export default function Home() {
  const { quotes, bookings, updateQuote, deleteQuote, deleteBooking, tasks, addTask, properties, currentPropertyId, searchQuery, templates } = usePMS();

  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | undefined>(undefined);
  const [crmView, setCrmView] = useState<'kanban' | 'list'>('kanban');
  
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingQuoteContext, setBookingQuoteContext] = useState<Quote | null>(null);
  const [bookingEditContext, setBookingEditContext] = useState<any | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  const [isAutomationsModalOpen, setIsAutomationsModalOpen] = useState(false);
  
  const [crmRules, setCrmRules] = useState<AutomationRule[]>([
    { id: 'def_1', trigger_stage: 'sent', action: 'open_send_modal', is_active: true },
    { id: 'def_2', trigger_stage: 'booked', action: 'open_booking_modal', is_active: true }
  ]);

  useEffect(() => {
    const saved = localStorage.getItem('crmRules');
    if (saved) {
      try {
        setCrmRules(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const handleSaveCrmRules = (rules: AutomationRule[]) => {
    setCrmRules(rules);
    localStorage.setItem('crmRules', JSON.stringify(rules));
    setIsAutomationsModalOpen(false);
  };
  
  const [isSendQuoteModalOpen, setIsSendQuoteModalOpen] = useState(false);
  const [sendQuoteTarget, setSendQuoteTarget] = useState<Quote | null>(null);
  const [quoteLang, setQuoteLang] = useState<'es' | 'en' | 'pt'>('es');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  const displayItems = useMemo(() => {
    // Get all quote IDs that have been converted to bookings
    const convertedQuoteIds = new Set(bookings.map((b: any) => b.quote_id).filter(Boolean));

    // Filter out quotes that have been converted to bookings
    const activeQuotes = quotes.filter((q: any) => {
      if (convertedQuoteIds.has(q.id)) return false;
      if (!startDate && !endDate) return true;
      const d = new Date(q.created_at || new Date().toISOString());
      if (startDate && d < new Date(startDate)) return false;
      if (endDate && d > new Date(endDate + 'T23:59:59')) return false;
      return true;
    });

    // Map actual confirmed bookings to a Quote-like structure for the CRM pipeline
    const virtualQuotesFromBookings = bookings.filter((b: any) => {
      if (!startDate && !endDate) return true;
      const d = new Date(b.created_at || new Date().toISOString());
      if (startDate && d < new Date(startDate)) return false;
      if (endDate && d > new Date(endDate + 'T23:59:59')) return false;
      return true;
    }).map((b: any) => ({
      id: b.id,
      property_id: b.property_id,
      first_name: b.first_name,
      last_name: b.last_name,
      phone: b.phone,
      email: b.email,
      check_in: b.check_in,
      check_out: b.check_out,
      pax: b.pax || 2,
      extra_beds: b.extra_beds || 0,
      status: b.booking_status === 'pre_booked' ? 'pre_booked' as const : 'booked' as const,
      total_amount: b.total_amount,
      rooms_count: b.rooms_count || 1,
      source: b.source || 'Reserva Directa',
      created_at: b.created_at || new Date().toISOString(),
      updated_at: b.updated_at || new Date().toISOString(),
      last_activity_at: b.updated_at || b.created_at || new Date().toISOString(),
      total_nights: b.total_nights || 0,
      follow_up_date: b.follow_up_date || undefined,
      confirmation_id: b.id.substring(0, 8).toUpperCase(),
      is_booking: true // Flag to know it is a real booking
    }));

    const allItems = [...activeQuotes, ...virtualQuotesFromBookings];

    if (!searchQuery) return allItems;
    const qVal = searchQuery.toLowerCase();
    return allItems.filter(item => 
      item.first_name.toLowerCase().includes(qVal) ||
      item.last_name.toLowerCase().includes(qVal) ||
      (item.confirmation_id && item.confirmation_id.toLowerCase().includes(qVal)) ||
      item.id.toLowerCase().includes(qVal)
    );
  }, [quotes, bookings, searchQuery, startDate, endDate]);

  // KPI Calculations
  const openQuotes = displayItems.filter((q: any) => !['booked', 'lost', 'expired'].includes(q.status));
  const quotesValue = openQuotes.reduce((acc, q: any) => acc + (q.total_amount || 0), 0);
  const pendingTasks = tasks.filter((t: any) => t.status === 'pending');
  
  const bookedQuotes = displayItems.filter((q: any) => q.status === 'booked');
  const bookedValue = bookedQuotes.reduce((acc, q: any) => acc + (q.total_amount || 0), 0);
  
  const today = new Date();
  const inactiveQuotes = openQuotes.filter((q: any) => {
    if (!q.last_activity_at) return true;
    const diff = (today.getTime() - new Date(q.last_activity_at).getTime()) / (1000 * 3600 * 24);
    return diff > 5;
  });

  const handleOpenQuote = (item?: any) => {
    if (item?.is_booking) {
      const realBooking = bookings.find((b: any) => b.id === item.id);
      if (realBooking) {
        setBookingEditContext(realBooking);
        setIsBookingModalOpen(true);
      }
    } else {
      setSelectedQuote(item);
      setIsQuoteModalOpen(true);
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('quote_id', id);
  };

  const handleDrop = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('quote_id');
    const quote = quotes.find((q: any) => q.id === id);
    if (quote) {
      const updatedQuote = { ...quote, status: colId as any, updated_at: new Date().toISOString() };
      updateQuote(updatedQuote);

      // Evaluate Active Rules for this Stage
      const activeRules = crmRules.filter(r => r.is_active && r.trigger_stage === colId);
      
      activeRules.forEach(rule => {
        if (rule.action === 'open_send_modal') {
          setSendQuoteTarget(updatedQuote);
          setSelectedTemplateId(rule.template_id || '');
          setIsSendQuoteModalOpen(true);
        } else if (rule.action === 'open_booking_modal') {
          setBookingQuoteContext(updatedQuote);
          setIsBookingModalOpen(true);
        } else if (rule.action === 'auto_send_whatsapp') {
          let msg = '';
          const tpl = templates.find((t: any) => t.id === rule.template_id);
          if (tpl) {
            msg = tpl.content
              .replace(/{{nombre}}/g, updatedQuote.first_name || '')
              .replace(/{{apellido}}/g, updatedQuote.last_name || '')
              .replace(/{{check_in}}/g, updatedQuote.check_in || '')
              .replace(/{{check_out}}/g, updatedQuote.check_out || '')
              .replace(/{{total}}/g, (updatedQuote.total_amount || 0).toString());
          }
          const link = buildWhatsAppLink(updatedQuote.phone || '000000000', msg);
          window.open(link, '_blank');
        } else if (rule.action === 'auto_send_email') {
          let subject = '';
          let body = '';
          const tpl = templates.find((t: any) => t.id === rule.template_id);
          if (tpl) {
            subject = tpl.subject || `Cotización para ${updatedQuote.first_name}`;
            body = tpl.content
              .replace(/{{nombre}}/g, updatedQuote.first_name || '')
              .replace(/{{apellido}}/g, updatedQuote.last_name || '')
              .replace(/{{check_in}}/g, updatedQuote.check_in || '')
              .replace(/{{check_out}}/g, updatedQuote.check_out || '')
              .replace(/{{total}}/g, (updatedQuote.total_amount || 0).toString());
          }
          const link = buildMailtoLink(updatedQuote.email || 'correo@ejemplo.com', subject, body);
          window.open(link, '_blank');
        } else if (rule.action === 'create_task') {
          addTask({
            id: `tsk_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            property_id: updatedQuote.property_id,
            agent_id: '',
            title: `Seguimiento: ${updatedQuote.first_name} ${updatedQuote.last_name}`,
            description: `Revisar estado de la cotización que pasó a ${colId}.`,
            status: 'pending',
            priority: 'medium',
            due_date: format(new Date(Date.now() + (rule.delay_days || 1) * 86400000), "yyyy-MM-dd'T'HH:mm:ssXXX")
          });
        }
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      {/* Top Navigation */}
      <TopBar />

      {/* Main Content */}
      <main className="flex-1 overflow-x-auto overflow-y-auto p-6 flex flex-col">
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">CRM & Cotizaciones</h2>
              <Link href="/funnels" className="opacity-0 hover:opacity-100 transition-opacity p-1">
                <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
              </Link>
            </div>
            <p className="text-slate-500 text-sm mt-1">Arrastra las pastillas para gestionar tus clientes y oportunidades.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase">Desde</span>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="text-sm font-semibold text-slate-700 bg-transparent outline-none cursor-pointer" />
              <span className="text-xs font-bold text-slate-500 uppercase ml-2">Hasta</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="text-sm font-semibold text-slate-700 bg-transparent outline-none cursor-pointer" />
              {(startDate || endDate) && (
                <button onClick={() => { setStartDate(''); setEndDate(''); }} className="ml-2 text-slate-400 hover:text-red-500" title="Limpiar fechas">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <button 
              onClick={() => setIsAutomationsModalOpen(true)}
              className="bg-white border border-slate-200 text-slate-700 px-3 py-2 rounded-lg text-sm font-semibold shadow-sm hover:bg-slate-50 flex items-center gap-2"
            >
              <Zap className="w-4 h-4 text-amber-500" /> Automatizaciones
            </button>
            <button 
              onClick={() => handleOpenQuote()}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm hover:bg-indigo-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Nueva Cotización
            </button>
          </div>
        </div>

        {/* KPIs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 shrink-0">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col relative overflow-hidden group">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 relative z-10">🟢 Reservas Generadas</p>
            <p className="text-3xl font-black text-slate-800 relative z-10">{bookedQuotes.length}</p>
            <p className="text-sm font-semibold text-emerald-600 mt-2">${bookedValue.toLocaleString()} USD convertidos</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col relative overflow-hidden group">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 relative z-10">🟣 Oportunidades Abiertas</p>
            <p className="text-3xl font-black text-slate-800 relative z-10">{openQuotes.length}</p>
            <p className="text-sm font-semibold text-indigo-600 mt-2">${quotesValue.toLocaleString()} USD potencial</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col relative overflow-hidden group">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 relative z-10">🟠 Acciones Pendientes</p>
            <p className="text-3xl font-black text-slate-800 relative z-10">{pendingTasks.length}</p>
            <p className="text-sm font-semibold text-amber-600 mt-2">Para hoy / atrasadas</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col relative overflow-hidden group">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 relative z-10">🔴 Leads en Riesgo</p>
            <p className="text-3xl font-black text-red-600 relative z-10">{inactiveQuotes.length}</p>
            <p className="text-sm font-semibold text-red-500 mt-2">Sin actividad</p>
          </div>
        </div>

        {/* View Toggle Selectors */}
        <div className="flex justify-between items-center mb-6 shrink-0 bg-white border border-slate-200 p-2.5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-2">Modo de visualización:</span>
            <div className="bg-slate-100 p-1 rounded-xl flex gap-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setCrmView('kanban')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  crmView === 'kanban' 
                    ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50' 
                    : 'text-slate-500 hover:text-slate-805'
                }`}
              >
                🟢 Tablero (Pastillas)
              </button>
              <button
                type="button"
                onClick={() => setCrmView('list')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  crmView === 'list' 
                    ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50' 
                    : 'text-slate-500 hover:text-slate-805'
                }`}
              >
                📋 Tablero (Renglones)
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
          {STAGES.map(stage => {
            const stageQuotes = displayItems.filter(q => q.status === stage.id);
            const totalValue = stageQuotes.reduce((acc, q) => acc + (q.total_amount || 0), 0);

            return (
              <div 
                key={stage.id} 
                className="w-[320px] shrink-0 flex flex-col bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden"
                onDrop={(e) => handleDrop(e, stage.id)}
                onDragOver={handleDragOver}
              >
                <div className="p-4 border-b border-slate-200 bg-slate-50">
                  <h3 className="font-bold text-slate-700 uppercase tracking-wide text-sm">{stage.label}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">{stageQuotes.length}</span>
                    <span className="text-xs font-bold text-indigo-600">${totalValue.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="flex-1 p-3 overflow-y-auto space-y-3 custom-scrollbar">
                  {stageQuotes.map(quote => {
                    const daysSinceCreation = differenceInDays(new Date(), parseISO(quote.created_at || new Date().toISOString()));
                    const isStale = daysSinceCreation > 3 && !['booked', 'lost'].includes(stage.id);
                    const isBooked = stage.id === 'booked';

                    if (crmView === 'list') {
                      return (
                        <div 
                          key={quote.id} 
                          draggable
                          onDragStart={(e) => handleDragStart(e, quote.id)}
                          onClick={() => handleOpenQuote(quote)}
                          className={`px-3 py-2.5 rounded-xl border shadow-sm cursor-grab active:cursor-grabbing transition-all hover:shadow-md flex justify-between items-center text-xs font-semibold relative ${isBooked ? 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-300' : 'bg-white border-slate-200 hover:border-indigo-300'}`}
                        >
                          <div className="truncate pr-2">
                            <p className="font-extrabold text-slate-800 truncate">{quote.first_name} {quote.last_name}</p>
                            <p className="text-[10px] text-slate-400 font-medium truncate">{quote.check_in} al {quote.check_out}</p>
                          </div>
                          <span className="font-bold text-emerald-600 shrink-0">${quote.total_amount?.toLocaleString()}</span>
                        </div>
                      );
                    }

                    return (
                      <div 
                        key={quote.id} 
                        draggable
                        onDragStart={(e) => handleDragStart(e, quote.id)}
                        onClick={() => handleOpenQuote(quote)}
                        className={`p-4 rounded-xl border shadow-sm cursor-grab active:cursor-grabbing transition-all hover:shadow-md relative ${isBooked ? 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-300' : 'bg-white border-slate-200 hover:border-indigo-300'}`}
                      >
                        {isStale && (
                          <div className="absolute -top-2 -right-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Inactiva
                          </div>
                        )}
                        <div className="flex justify-between items-start mb-1">
                          <div>
                            <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded uppercase mr-1.5">
                              {quote.confirmation_id || (quote.id ? quote.id.substring(0, 6) : '')}
                            </span>
                            <h4 className="font-bold text-slate-800 text-sm inline-block">{quote.first_name} {quote.last_name}</h4>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              const isBooking = (quote as any).is_booking;
                              console.log('CRM UI: delete click for ID:', quote.id, 'isBooking:', isBooking);
                              const confirmMsg = isBooking 
                                ? '¿Estás seguro de eliminar esta reserva?' 
                                : '¿Estás seguro de eliminar esta cotización?';
                                
                              if (confirm(confirmMsg)) {
                                if (isBooking) {
                                  console.log('CRM UI: calling deleteBooking for:', quote.id);
                                  deleteBooking(quote.id);
                                } else {
                                  console.log('CRM UI: calling deleteQuote for:', quote.id);
                                  deleteQuote(quote.id);
                                }
                              }
                            }}
                            className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1 rounded transition-colors"
                            title="Eliminar cotización"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {currentPropertyId === 'all' && (
                          <div className="text-[10px] text-indigo-600 font-bold mb-1 truncate">
                            {properties.find((p: any) => p.id === quote.property_id)?.name}
                          </div>
                        )}
                        <div className="text-xs text-slate-500 mb-2 flex flex-col gap-1">
                          <div className="flex items-center gap-1">
                            <CalendarRange className="w-3 h-3" /> {quote.check_in ? (
                              (() => {
                                try {
                                  return format(parseISO(quote.check_in), 'dd/MM/yyyy');
                                } catch(e) {
                                  return quote.check_in;
                                }
                              })()
                            ) : 'Sin fecha'} ({quote.total_nights || 0} noches)
                          </div>
                          <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                            👤 {quote.pax || 2} Pax {quote.extra_beds ? `(+${quote.extra_beds} camas extra)` : ''}
                          </div>
                        </div>

                        {quote.source && (
                          <div className="mb-2">
                            {quote.source.startsWith('Quiz Funnel') ? (
                              <span className="text-[9px] uppercase tracking-wider text-amber-700 font-bold bg-amber-100 px-1.5 py-0.5 rounded shadow-sm border border-amber-200">
                                ⚡ {quote.source.replace('Quiz Funnel', 'Quiz').replace(': ', ' ')}
                              </span>
                            ) : (
                              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-medium bg-slate-100 px-1.5 py-0.5 rounded">
                                {quote.source}
                              </span>
                            )}
                          </div>
                        )}
                        {isBooked ? (
                          <div className="space-y-2 mb-3">
                            <div className="text-xs text-emerald-700 font-bold flex items-center gap-1 bg-emerald-100 p-1.5 rounded border border-emerald-200">
                              ✅ Reserva confirmada
                            </div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-2">
                              Próxima acción: Pre-arrival
                            </div>
                          </div>
                        ) : quote.follow_up_date && (
                          <div className="text-xs text-red-600 font-bold mb-3 flex items-center gap-1 bg-red-50 p-1.5 rounded border border-red-100">
                            <Clock className="w-3 h-3" /> Seguimiento: {(() => {
                              try {
                                return format(parseISO(quote.follow_up_date), 'dd/MM/yyyy');
                              } catch(e) {
                                return quote.follow_up_date;
                              }
                            })()}
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                          <span className="font-black text-emerald-600">${quote.total_amount?.toLocaleString()} USD</span>
                          <span className="bg-slate-100 text-slate-600 font-bold text-[10px] px-2 py-0.5 rounded uppercase tracking-wider">{quote.rooms_count || 1} Hab.</span>
                        </div>
                      </div>
                    );
                  })}
                  {stageQuotes.length === 0 && (
                    <div className="h-24 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-xs font-medium text-slate-400">
                      Soltar aquí
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Modal de Cotización Único */}
      {isQuoteModalOpen && (
        <Modal 
          isOpen={isQuoteModalOpen} 
          onClose={() => setIsQuoteModalOpen(false)}
          title={selectedQuote ? "Detalle de Cotización" : "Nueva Cotización Express"}
          size="4xl"
        >
          <QuoteForm 
            initialQuote={selectedQuote}
            onSuccess={() => setIsQuoteModalOpen(false)} 
            onCancel={() => setIsQuoteModalOpen(false)} 
          />
        </Modal>
      )}

      {/* Modal de Automatizaciones */}
      {isAutomationsModalOpen && (
        <Modal
          isOpen={isAutomationsModalOpen}
          onClose={() => setIsAutomationsModalOpen(false)}
          title="Motor de Automatizaciones (Reglas)"
        >
          <div className="p-6 h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <p className="text-slate-500 text-sm">Configura reglas avanzadas cuando una cotización cambia de etapa.</p>
              <button 
                onClick={() => setCrmRules([...crmRules, { id: `rule_${Date.now()}`, trigger_stage: 'draft', action: 'create_task', is_active: true }])}
                className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-indigo-100 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Nueva Regla
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2 pb-4">
              {crmRules.map(rule => (
                <div key={rule.id} className={`p-4 border rounded-xl relative ${rule.is_active ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-200 opacity-70'}`}>
                  <div className="absolute right-4 top-4 flex gap-2">
                    <button 
                      onClick={() => setCrmRules(crmRules.map(r => r.id === rule.id ? {...r, is_active: !r.is_active} : r))}
                      className="text-xs font-bold text-slate-400 hover:text-slate-600"
                    >
                      {rule.is_active ? 'Apagar' : 'Encender'}
                    </button>
                    <button 
                      onClick={() => setCrmRules(crmRules.filter(r => r.id !== rule.id))}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Cuando la cotización entre a:</label>
                      <select 
                        value={rule.trigger_stage}
                        onChange={e => setCrmRules(crmRules.map(r => r.id === rule.id ? {...r, trigger_stage: e.target.value} : r))}
                        className="w-full text-sm p-2 rounded-lg border border-slate-300 outline-none focus:border-indigo-500"
                      >
                        {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Entonces hacer:</label>
                      <select 
                        value={rule.action}
                        onChange={e => setCrmRules(crmRules.map(r => r.id === rule.id ? {...r, action: e.target.value as AutomationAction} : r))}
                        className="w-full text-sm p-2 rounded-lg border border-slate-300 outline-none focus:border-indigo-500"
                      >
                        <option value="open_send_modal">Abrir selector de envío manual</option>
                        <option value="auto_send_whatsapp">Enviar WhatsApp automáticamente</option>
                        <option value="auto_send_email">Enviar Email automáticamente</option>
                        <option value="create_task">Crear recordatorio / Tarea</option>
                        <option value="open_booking_modal">Abrir confirmación de Reserva</option>
                      </select>
                    </div>
                  </div>
                  
                  {['open_send_modal', 'auto_send_whatsapp', 'auto_send_email'].includes(rule.action) && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <label className="block text-xs font-bold text-slate-700 mb-1">Con la plantilla (opcional):</label>
                      <select 
                        value={rule.template_id || ''}
                        onChange={e => setCrmRules(crmRules.map(r => r.id === rule.id ? {...r, template_id: e.target.value} : r))}
                        className="w-full text-sm p-2 rounded-lg border border-slate-300 outline-none focus:border-indigo-500"
                      >
                        <option value="">Ninguna / Preguntar siempre</option>
                        {templates.map((t: any) => <option key={t.id} value={t.id}>{t.name} ({t.type})</option>)}
                      </select>
                    </div>
                  )}
                  
                  {rule.action === 'create_task' && (
                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3">
                      <label className="text-xs font-bold text-slate-700">Recordarme a los</label>
                      <input 
                        type="number"
                        min="0"
                        value={rule.delay_days || 0}
                        onChange={e => setCrmRules(crmRules.map(r => r.id === rule.id ? {...r, delay_days: parseInt(e.target.value) || 0} : r))}
                        className="w-16 text-center text-sm p-1 rounded-lg border border-slate-300 outline-none focus:border-indigo-500"
                      />
                      <label className="text-xs font-bold text-slate-700">días.</label>
                    </div>
                  )}
                </div>
              ))}
              
              {crmRules.length === 0 && (
                <div className="text-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <p className="text-sm text-slate-500">No hay reglas configuradas. ¡Crea tu primera automatización!</p>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200 flex justify-end gap-3 shrink-0">
              <button 
                onClick={() => setIsAutomationsModalOpen(false)}
                className="px-4 py-2 font-bold text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button 
                onClick={() => handleSaveCrmRules(crmRules)}
                className="px-4 py-2 font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
              >
                Guardar Reglas
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal de Reserva (Al Ganar) */}
      {isBookingModalOpen && (
        <Modal 
          isOpen={isBookingModalOpen} 
          onClose={() => {
            setIsBookingModalOpen(false);
            setBookingQuoteContext(null);
            setBookingEditContext(null);
          }}
          title={bookingEditContext ? "Editar Reserva" : bookingQuoteContext ? "Convertir a Reserva" : "Nueva Reserva Directa"}
          size="4xl"
        >
          <BookingForm 
            initialBooking={bookingEditContext}
            initialQuote={bookingQuoteContext || undefined}
            onSuccess={() => {
              setIsBookingModalOpen(false);
              setBookingQuoteContext(null);
              setBookingEditContext(null);
            }} 
            onCancel={() => {
              setIsBookingModalOpen(false);
              setBookingQuoteContext(null);
              setBookingEditContext(null);
            }}
          />
        </Modal>
      )}

      {/* Modal de Envío de Cotización */}
      {isSendQuoteModalOpen && sendQuoteTarget && (
        <Modal 
          isOpen={isSendQuoteModalOpen} 
          onClose={() => setIsSendQuoteModalOpen(false)}
          title="Enviar Cotización"
        >
          <div className="p-2 space-y-6">
            <p className="text-slate-650 text-sm font-semibold">
              Estás pasando a <strong>{sendQuoteTarget.first_name} {sendQuoteTarget.last_name}</strong> a Enviada. ¿Cómo preferís mandar la propuesta personalizada?
            </p>

            <div className="mb-4">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Plantilla a utilizar</label>
              <select 
                value={selectedTemplateId || (templates[0]?.id || '')} 
                onChange={e => setSelectedTemplateId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-505 font-medium"
              >
                {templates.length > 0 ? (
                  <optgroup label="Tus Plantillas (Reemplaza variables automáticamente)">
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
                      .replace(/{{nombre}}/g, sendQuoteTarget.first_name || '')
                      .replace(/{{apellido}}/g, sendQuoteTarget.last_name || '')
                      .replace(/{{check_in}}/g, sendQuoteTarget.check_in || '')
                      .replace(/{{check_out}}/g, sendQuoteTarget.check_out || '')
                      .replace(/{{total}}/g, (sendQuoteTarget.total_amount || 0).toString());
                  }
                  const link = buildWhatsAppLink(sendQuoteTarget.phone || '000000000', msg);
                  window.open(link, '_blank');
                  updateQuote({ ...sendQuoteTarget, status: 'sent', updated_at: new Date().toISOString() });
                  setIsSendQuoteModalOpen(false);
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
                    subject = tpl.subject || `Cotización para ${sendQuoteTarget.first_name}`;
                    body = tpl.content
                      .replace(/{{nombre}}/g, sendQuoteTarget.first_name || '')
                      .replace(/{{apellido}}/g, sendQuoteTarget.last_name || '')
                      .replace(/{{check_in}}/g, sendQuoteTarget.check_in || '')
                      .replace(/{{check_out}}/g, sendQuoteTarget.check_out || '')
                      .replace(/{{total}}/g, (sendQuoteTarget.total_amount || 0).toString());
                  }
                  const link = buildMailtoLink(sendQuoteTarget.email || 'correo@ejemplo.com', subject, body);
                  window.open(link, '_blank');
                  updateQuote({ ...sendQuoteTarget, status: 'sent', updated_at: new Date().toISOString() });
                  setIsSendQuoteModalOpen(false);
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
                    subject = tpl.subject || `Cotización para ${sendQuoteTarget.first_name}`;
                    body = tpl.content
                      .replace(/{{nombre}}/g, sendQuoteTarget.first_name || '')
                      .replace(/{{apellido}}/g, sendQuoteTarget.last_name || '')
                      .replace(/{{check_in}}/g, sendQuoteTarget.check_in || '')
                      .replace(/{{check_out}}/g, sendQuoteTarget.check_out || '')
                      .replace(/{{total}}/g, (sendQuoteTarget.total_amount || 0).toString());
                  }
                  
                  const dateStr = new Date().toISOString().split('T')[0];
                  const pdfTitle = `${sendQuoteTarget.confirmation_id || sendQuoteTarget.id}_${dateStr}`;
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
                  
                  updateQuote({ ...sendQuoteTarget, status: 'sent', updated_at: new Date().toISOString() });
                  setIsSendQuoteModalOpen(false);
                }}
                className="col-span-2 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-slate-900/20"
              >
                <Download className="w-5 h-5" />
                <span>Generar PDF / Imprimir</span>
              </button>
            </div>
            <button 
              onClick={() => {
                updateQuote({ ...sendQuoteTarget, status: 'sent', updated_at: new Date().toISOString() });
                setIsSendQuoteModalOpen(false);
              }}
              className="w-full text-zinc-500 hover:text-zinc-300 text-xs mt-4 underline decoration-zinc-700 underline-offset-4 transition"
            >
              Solo cambiar estado (ya la envié)
            </button>
          </div>
        </Modal>
      )}

    </div>
  );
}
