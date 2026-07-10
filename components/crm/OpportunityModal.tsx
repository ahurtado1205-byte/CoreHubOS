import React, { useState } from 'react';
import { Opportunity, Quote, Activity } from '../../types';
import { usePMS } from '../../context/PMSContext';
import { Target, FileText, CheckCircle2, Phone, Mail, XCircle, Plus, Edit2, CalendarRange } from 'lucide-react';
import { format } from 'date-fns';

interface OpportunityModalProps {
  opportunityId: string;
  onClose: () => void;
  onNewQuote: (opp: Opportunity) => void;
  onConvertToBooking: (quote: Quote) => void;
  onSendTemplate: (quote: Quote) => void;
}

export function OpportunityModal({ opportunityId, onClose, onNewQuote, onConvertToBooking, onSendTemplate }: OpportunityModalProps) {
  const { opportunities, quotes, activities, updateOpportunity, updateQuote, addActivity } = usePMS();
  
  const opp = opportunities.find(o => o.id === opportunityId);
  const oppQuotes = quotes.filter(q => q.opportunity_id === opportunityId);
  const oppActivities = activities.filter(a => a.opportunity_id === opportunityId || oppQuotes.some(q => q.id === a.quote_id));
  
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [activityDesc, setActivityDesc] = useState('');

  if (!opp) return null;

  const handleCreateActivity = () => {
    if (!activityDesc.trim()) return;
    const newAct: Activity = {
      id: `act_${Date.now()}`,
      type: 'note',
      date: new Date().toISOString(),
      result: 'completed',
      description: activityDesc,
      opportunity_id: opp.id,
      agent_id: 'Ana'
    };
    addActivity(newAct);
    setActivityDesc('');
    setShowActivityForm(false);
  };

  const handleMarkQuoteWon = (quote: Quote) => {
    updateQuote({ ...quote, status: 'booked', updated_at: new Date().toISOString() });
    updateOpportunity({ ...opp, stage: 'pre_booked', updated_at: new Date().toISOString() });
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-6 shrink-0">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">{opp.name}</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">
              {opp.business_type === 'individual' ? 'Alojamiento Individual' : 'Grupo/Evento'} • {opp.pax} pax
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-emerald-600">${opp.estimated_value.toLocaleString()}</p>
            <span className={`inline-block mt-1 px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${opp.probability >= 50 ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
              {opp.probability >= 50 ? 'Caliente' : 'Tibio'}
            </span>
          </div>
        </div>
        
        <div className="flex gap-4 items-center mt-4">
           <button 
             onClick={() => onNewQuote(opp)}
             className="bg-indigo-600 text-white font-semibold text-sm px-4 py-2 rounded-lg shadow-sm hover:bg-indigo-700 transition-colors flex items-center gap-2"
           >
             <Plus className="w-4 h-4" /> Nueva Cotización
           </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex gap-6 custom-scrollbar">
        {/* Columna Izquierda: Cotizaciones y Detalles */}
        <div className="flex-1 space-y-6">
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-indigo-500" /> Cotizaciones Asociadas
            </h3>
            
            <div className="space-y-4">
              {oppQuotes.length === 0 ? (
                <p className="text-sm text-slate-500 italic">No hay cotizaciones para esta oportunidad.</p>
              ) : (
                oppQuotes.map(quote => (
                  <div key={quote.id} className={`border rounded-lg p-4 transition-colors ${quote.status === 'booked' ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-bold text-slate-800 text-sm">{quote.first_name} {quote.last_name}</div>
                        <div className="text-xs text-slate-500">
                          {format(new Date(quote.check_in), 'dd/MM/yyyy')} al {format(new Date(quote.check_out), 'dd/MM/yyyy')} • {quote.total_nights} noches
                          <span className="block mt-0.5 text-[11px] font-medium text-slate-400">👤 {quote.pax || 2} Pax {quote.extra_beds ? `(+${quote.extra_beds} camas extra)` : ''}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-800">${quote.total_amount}</div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">{quote.status}</div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-200/60">
                      {quote.status !== 'booked' ? (
                        <>
                          <button onClick={() => handleMarkQuoteWon(quote)} className="text-xs bg-emerald-100 text-emerald-700 font-bold px-3 py-1.5 rounded hover:bg-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Marcar Ganada
                          </button>
                          <button onClick={() => onSendTemplate(quote)} className="text-xs bg-white border border-slate-300 text-slate-700 font-bold px-3 py-1.5 rounded hover:bg-slate-50 flex items-center gap-1">
                            <Mail className="w-3 h-3" /> Plantilla
                          </button>
                        </>
                      ) : (
                        <button onClick={() => onConvertToBooking(quote)} className="text-xs bg-indigo-600 text-white font-bold px-4 py-1.5 rounded hover:bg-indigo-700 flex items-center gap-1">
                          <CalendarRange className="w-3 h-3" /> Crear Reserva
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Columna Derecha: Actividades (Timeline) */}
        <div className="w-[350px] shrink-0 bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col h-full">
          <div className="flex justify-between items-center mb-4 shrink-0">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-500" /> Historial CRM
            </h3>
            <button 
              onClick={() => setShowActivityForm(!showActivityForm)}
              className="text-xs text-indigo-600 font-bold hover:text-indigo-800 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Nota
            </button>
          </div>

          {showActivityForm && (
            <div className="mb-4 bg-slate-50 p-3 rounded-lg border border-slate-200 shrink-0">
              <textarea 
                placeholder="Registra un llamado, reunión o nota..." 
                value={activityDesc}
                onChange={e => setActivityDesc(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded px-3 py-2 focus:outline-none focus:border-indigo-500 mb-2"
                rows={2}
              />
              <button 
                onClick={handleCreateActivity}
                className="w-full bg-indigo-600 text-white px-3 py-1.5 rounded text-sm font-bold hover:bg-indigo-700"
              >
                Guardar Actividad
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
            {oppActivities.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No hay historial comercial.</p>
            ) : (
              oppActivities.slice().reverse().map(act => (
                <div key={act.id} className="relative pl-6 before:content-[''] before:absolute before:left-[11px] before:top-6 before:bottom-[-24px] before:w-px before:bg-slate-200 last:before:hidden">
                  <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center z-10">
                    {act.type === 'call' ? <Phone className="w-3 h-3 text-slate-600" /> :
                     act.type === 'email' ? <Mail className="w-3 h-3 text-slate-600" /> :
                     <FileText className="w-3 h-3 text-slate-600" />}
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <p className="text-sm font-medium text-slate-800">{act.description}</p>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 mt-1 font-bold">{format(new Date(act.date), 'dd/MM/yyyy HH:mm')} - {act.agent_id}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
