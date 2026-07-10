import React, { useState } from 'react';
import { Opportunity } from '../../types';
import { usePMS } from '../../context/PMSContext';

interface OpportunityFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function OpportunityForm({ onSuccess, onCancel }: OpportunityFormProps) {
  const { addOpportunity } = usePMS();
  
  const [formData, setFormData] = useState({
    name: '',
    estimated_value: 0,
    business_type: 'individual' as 'individual' | 'group' | 'corporate',
    pax: 2,
    probability: 50,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      alert("Por favor, ingresa un nombre para la oportunidad.");
      return;
    }
    
    const newOpp: Opportunity = {
      id: `opp_${Date.now()}`,
      name: formData.name,
      estimated_value: formData.estimated_value,
      currency: 'USD',
      stage: 'draft',
      business_type: formData.business_type,
      probability: formData.probability,
      status: 'open',
      pax: formData.pax,
      agent_id: 'Ana',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    addOpportunity(newOpp);
    onSuccess();
  };

  const inputClass = "w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full bg-white p-6">
      <div className="space-y-4 flex-1">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Nombre de la Oportunidad</label>
          <input 
            type="text" 
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
            placeholder="Ej: Grupo Boda Smith"
            className={inputClass}
            required
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Valor Estimado (USD)</label>
            <input 
              type="number" 
              min="0"
              value={formData.estimated_value}
              onChange={e => setFormData({...formData, estimated_value: parseFloat(e.target.value) || 0})}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Probabilidad de Cierre (%)</label>
            <input 
              type="number" 
              min="0" max="100"
              value={formData.probability}
              onChange={e => setFormData({...formData, probability: parseInt(e.target.value) || 0})}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Tipo de Negocio</label>
            <select 
              value={formData.business_type}
              onChange={e => setFormData({...formData, business_type: e.target.value as any})}
              className={inputClass}
            >
              <option value="individual">Individual</option>
              <option value="group">Grupo / Evento</option>
              <option value="corporate">Corporativo</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Cantidad de Pax Estimados</label>
            <input 
              type="number" 
              min="1"
              value={formData.pax}
              onChange={e => setFormData({...formData, pax: parseInt(e.target.value) || 1})}
              className={inputClass}
            />
          </div>
        </div>
      </div>
      
      <div className="pt-6 flex gap-3 mt-4 border-t border-slate-200">
        <button type="button" onClick={onCancel} className="px-6 py-2.5 font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors">
          Cancelar
        </button>
        <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-sm transition-all active:scale-[0.98]">
          Crear Oportunidad
        </button>
      </div>
    </form>
  );
}
