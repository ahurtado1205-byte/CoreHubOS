import React, { useState } from 'react';
import { Quote, Activity, Opportunity } from '../../types';
import { usePMS } from '../../context/PMSContext';
import { Target, Phone, Mail, FileText, Check, Plus } from 'lucide-react';
import { format } from 'date-fns';

export function QuoteCRM({ quote }: { quote: Quote }) {
  const { activities, addActivity, opportunities, addOpportunity, updateQuote } = usePMS();
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [activityDesc, setActivityDesc] = useState('');
  
  const quoteActivities = activities.filter(a => a.quote_id === quote.id);
  const opp = opportunities.find(o => o.primary_quote_id === quote.id);

  const handleCreateActivity = () => {
    if (!activityDesc.trim()) return;
    const newAct: Activity = {
      id: `act_${Date.now()}`,
      type: 'note',
      date: new Date().toISOString(),
      result: 'completed',
      description: activityDesc,
      quote_id: quote.id,
      agent_id: 'Ana'
    };
    addActivity(newAct);
    setActivityDesc('');
    setShowActivityForm(false);
  };

  const handleConvertToOpp = () => {
    if (opp) return;
    const newOpp: Opportunity = {
      id: `opp_${Date.now()}`,
      name: `Oportunidad ${quote.first_name} ${quote.last_name}`,
      primary_quote_id: quote.id,
      estimated_value: quote.total_amount,
      currency: 'USD',
      stage: 'draft',
      business_type: quote.rooms_count && quote.rooms_count > 4 ? 'group' : 'individual',
      probability: 50,
      status: 'open',
      agent_id: 'Ana',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    addOpportunity(newOpp);
    updateQuote({ ...quote, opportunity_id: newOpp.id });
    alert('¡Convertida a Oportunidad Comercial!');
  };

  return (
    <div className="mt-6 border-t border-slate-200 pt-6">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-indigo-600 font-bold text-sm flex items-center gap-2">
          <Target className="w-4 h-4" /> Historial de Actividades (CRM)
        </h4>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <div className="flex justify-between items-center mb-3">
          <h5 className="font-bold text-slate-700 text-xs uppercase tracking-wider">Historial de Actividades</h5>
          <button 
            type="button" 
            onClick={() => setShowActivityForm(!showActivityForm)}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Añadir Nota
          </button>
        </div>

        {showActivityForm && (
          <div className="mb-4 bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex gap-2">
            <input 
              type="text" 
              placeholder="Ej: Llamada de seguimiento..." 
              value={activityDesc}
              onChange={e => setActivityDesc(e.target.value)}
              className="flex-1 text-sm border border-slate-300 rounded px-3 py-1.5 focus:outline-none focus:border-indigo-500"
            />
            <button 
              type="button" 
              onClick={handleCreateActivity}
              className="bg-indigo-600 text-white px-3 py-1.5 rounded text-sm font-bold"
            >
              Guardar
            </button>
          </div>
        )}

        <div className="space-y-3 max-h-40 overflow-y-auto custom-scrollbar pr-2">
          {quoteActivities.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No hay actividades registradas.</p>
          ) : (
            quoteActivities.slice().reverse().map(act => (
              <div key={act.id} className="flex gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0">
                  {act.type === 'call' ? <Phone className="w-3.5 h-3.5 text-slate-500" /> :
                   act.type === 'email' ? <Mail className="w-3.5 h-3.5 text-slate-500" /> :
                   <FileText className="w-3.5 h-3.5 text-slate-500" />}
                </div>
                <div>
                  <p className="text-slate-800 font-medium">{act.description}</p>
                  <p className="text-xs text-slate-400">{format(new Date(act.date), 'dd/MM/yyyy HH:mm')} - {act.agent_id}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
