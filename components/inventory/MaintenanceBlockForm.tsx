'use client';

import { useState } from 'react';
import { MaintenanceBlock } from '@/types/inventory';
import { usePMS } from '@/context/PMSContext';
import { format, parseISO } from 'date-fns';

interface Props {
  initialBlock?: MaintenanceBlock | null;
  initialUnitId?: string;
  initialDate?: Date;
  onSuccess: () => void;
  onCancel: () => void;
}

export function MaintenanceBlockForm({ initialBlock, initialUnitId, initialDate, onSuccess, onCancel }: Props) {
  const { addMaintenanceBlock, updateMaintenanceBlock, deleteMaintenanceBlock, units } = usePMS();
  
  const [formData, setFormData] = useState<Partial<MaintenanceBlock>>(() => {
    if (initialBlock) return { ...initialBlock };
    
    return {
      type: 'out_of_order',
      unit_id: initialUnitId || (units[0]?.id || ''),
      start_date: initialDate ? format(initialDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      end_date: initialDate ? format(initialDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      reason: ''
    };
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.unit_id || !formData.start_date || !formData.end_date || !formData.type) return;

    if (initialBlock) {
      updateMaintenanceBlock(formData as MaintenanceBlock);
    } else {
      addMaintenanceBlock({
        ...formData,
        id: `mb_${Date.now()}`
      } as MaintenanceBlock);
    }
    onSuccess();
  };

  const inputClass = "w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors";
  const labelClass = "block text-sm font-bold text-slate-700 mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Tipo de Bloqueo</label>
          <select 
            required 
            value={formData.type} 
            onChange={e => setFormData({...formData, type: e.target.value as any})} 
            className={inputClass}
          >
            <option value="out_of_order">Out of Order (Resta inventario)</option>
            <option value="out_of_service">Out of Service (Aviso visual)</option>
          </select>
        </div>
        
        <div>
          <label className={labelClass}>Unidad Afectada</label>
          <select 
            required 
            value={formData.unit_id} 
            onChange={e => setFormData({...formData, unit_id: e.target.value})} 
            className={inputClass}
          >
            {units.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Fecha de Inicio</label>
          <input 
            required 
            type="date" 
            value={formData.start_date} 
            onChange={e => setFormData({...formData, start_date: e.target.value})} 
            className={inputClass} 
          />
        </div>
        
        <div>
          <label className={labelClass}>Fecha de Fin</label>
          <input 
            required 
            type="date" 
            value={formData.end_date} 
            onChange={e => setFormData({...formData, end_date: e.target.value})} 
            className={inputClass} 
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Motivo / Descripción</label>
        <textarea 
          rows={3}
          value={formData.reason} 
          onChange={e => setFormData({...formData, reason: e.target.value})} 
          className={inputClass} 
          placeholder="Ej: Reparación de tubería, pintura, etc."
        />
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-slate-100">
        {initialBlock ? (
          <button 
            type="button" 
            onClick={() => {
              if (window.confirm('¿Eliminar este bloqueo?')) {
                deleteMaintenanceBlock(initialBlock.id);
                onSuccess();
              }
            }} 
            className="px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            Eliminar Bloqueo
          </button>
        ) : <div />}
        <div className="flex gap-3">
          <button type="button" onClick={onCancel} className="px-5 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            Cancelar
          </button>
          <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors">
            {initialBlock ? 'Guardar Cambios' : 'Bloquear Habitación'}
          </button>
        </div>
      </div>
    </form>
  );
}
