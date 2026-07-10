'use client';

import { useState } from 'react';
import { usePMS } from '../../context/PMSContext';
import { RatePlan } from '../../types/inventory';
import { Plus, Trash2, ShieldCheck, GitMerge, Edit2 } from 'lucide-react';
import { Modal } from '../ui/Modal';

const RatePlanNode = ({ plan, level, ratePlans, onEdit, onDelete }: { plan: RatePlan, level: number, ratePlans: RatePlan[], onEdit: (p: RatePlan) => void, onDelete: (id: string) => void }) => {
  const children = ratePlans.filter(p => p.parent_plan_id === plan.id);
  const isMaster = level === 0;

  return (
    <div className={`border-l-2 ${level > 0 ? 'border-slate-200 ml-6 pl-4 mt-3 relative' : 'border-transparent mb-6'}`}>
      {level > 0 && <div className="absolute w-4 border-b-2 border-slate-200 top-6 -left-0.5" />}
      <div className={`bg-white border ${isMaster ? 'border-indigo-100 shadow-sm' : 'border-slate-200'} rounded-xl overflow-hidden flex flex-col group relative z-10`}>
        <div className={`p-4 flex justify-between items-center ${isMaster ? 'bg-slate-50' : 'hover:bg-slate-50/50 transition-colors'}`}>
          <div className="flex items-center gap-3">
            {isMaster ? <ShieldCheck className="w-5 h-5 text-indigo-600" /> : <GitMerge className="w-4 h-4 text-slate-400" />}
            <div>
              <div className="flex items-center gap-2">
                <h4 className={`font-bold text-slate-800 ${isMaster ? 'text-base' : 'text-sm'}`}>{plan.name}</h4>
                {plan.is_default && (
                  <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Por Defecto</span>
                )}
                {plan.is_visible_in_quotes === false && (
                  <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Oculta en Cotizador</span>
                )}
              </div>
              {plan.description && (
                <p className={`text-slate-500 mt-1 ${isMaster ? 'text-sm' : 'text-xs'}`}>{plan.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {!isMaster && (
              <div className="text-right mr-2">
                <span className="text-xs text-slate-400 uppercase font-medium">Regla</span>
                <p className="text-sm font-bold text-indigo-600">
                  -{plan.discount_value}{plan.discount_type === 'percent' ? '%' : ' USD'}
                </p>
              </div>
            )}
            <div className={`flex gap-1 ${isMaster ? '' : 'opacity-0 group-hover:opacity-100 transition-all'}`}>
              <button onClick={() => onEdit(plan)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={() => onDelete(plan.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Render Children */}
      {children.length > 0 && (
        <div className="mt-1">
          {children.map(child => (
            <RatePlanNode key={child.id} plan={child} level={level + 1} ratePlans={ratePlans} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
};

export function RatePlansManager() {
  const { ratePlans, addRatePlan, updateRatePlan, deleteRatePlan, currentPropertyId } = usePMS();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<RatePlan>>({
    name: '',
    description: '',
    is_default: false,
    parent_plan_id: '',
    discount_type: 'percent',
    discount_value: 0,
    is_visible_in_quotes: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    
    if (editingId) {
      updateRatePlan({
        id: editingId,
        property_id: currentPropertyId === 'all' ? 'prop_1' : currentPropertyId,
        name: formData.name,
        description: formData.description,
        is_default: formData.is_default,
        parent_plan_id: formData.parent_plan_id || undefined,
        discount_type: formData.discount_type as 'percent' | 'fixed',
        discount_value: formData.parent_plan_id ? Number(formData.discount_value) : undefined,
        is_visible_in_quotes: formData.is_visible_in_quotes
      });
    } else {
      addRatePlan({
        id: `rp_${Date.now()}`,
        property_id: currentPropertyId === 'all' ? 'prop_1' : currentPropertyId,
        name: formData.name,
        description: formData.description,
        is_default: formData.is_default,
        parent_plan_id: formData.parent_plan_id || undefined,
        discount_type: formData.discount_type as 'percent' | 'fixed',
        discount_value: formData.parent_plan_id ? Number(formData.discount_value) : undefined,
        is_visible_in_quotes: formData.is_visible_in_quotes
      });
    }
    
    closeModal();
  };

  const openNewModal = () => {
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      is_default: false,
      parent_plan_id: '',
      discount_type: 'percent',
      discount_value: 0,
      is_visible_in_quotes: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (plan: RatePlan) => {
    setEditingId(plan.id);
    setFormData({
      ...plan,
      parent_plan_id: plan.parent_plan_id || '',
      discount_type: plan.discount_type || 'percent',
      discount_value: plan.discount_value || 0,
      is_visible_in_quotes: plan.is_visible_in_quotes !== false
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const masterPlans = ratePlans.filter(p => !p.parent_plan_id);

  // Helper to prevent circular dependencies in the select dropdown
  const getDescendants = (planId: string): string[] => {
    const children = ratePlans.filter(p => p.parent_plan_id === planId).map(p => p.id);
    let all = [...children];
    children.forEach(childId => {
      all = [...all, ...getDescendants(childId)];
    });
    return all;
  };

  const disabledSelectIds = editingId ? [editingId, ...getDescendants(editingId)] : [];

  return (
    <div className="h-full flex flex-col p-6">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h3 className="font-bold text-slate-800 text-lg">Planes de Tarifa</h3>
          <p className="text-sm text-slate-500">Administra las tarifas base (madre) y sus derivadas (en cascada).</p>
        </div>
        <button
          onClick={openNewModal}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Nuevo Plan
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2">
        <div className="space-y-2">
          {masterPlans.map(master => (
            <RatePlanNode 
              key={master.id} 
              plan={master} 
              level={0} 
              ratePlans={ratePlans} 
              onEdit={openEditModal} 
              onDelete={deleteRatePlan} 
            />
          ))}
          {masterPlans.length === 0 && (
            <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-xl text-slate-500">
              No hay planes de tarifa creados. Empezá creando una tarifa madre.
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingId ? "Editar Plan de Tarifa" : "Crear Plan de Tarifa"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Nombre del Plan</label>
            <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="Ej: Tarifa No Reembolsable" />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Descripción</label>
            <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" rows={2} />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">¿Deriva de otra tarifa (Cascada)?</label>
            <select 
              value={formData.parent_plan_id || ''} 
              onChange={e => setFormData({...formData, parent_plan_id: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">No, es una Tarifa Madre (Independiente)</option>
              {ratePlans.map(rp => (
                <option key={rp.id} value={rp.id} disabled={disabledSelectIds.includes(rp.id)}>
                  Sí, derivar de: {rp.name}
                </option>
              ))}
            </select>
          </div>

          {formData.parent_plan_id && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Descuento</label>
                <select 
                  value={formData.discount_type} 
                  onChange={e => setFormData({...formData, discount_type: e.target.value as any})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
                >
                  <option value="percent">Porcentaje (%)</option>
                  <option value="fixed">Fijo (USD)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Valor a descontar</label>
                <input 
                  type="number" 
                  min="0"
                  step="any"
                  value={formData.discount_value} 
                  onChange={e => setFormData({...formData, discount_value: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" 
                />
              </div>
            </div>
          )}

          {!formData.parent_plan_id && (
            <label className="flex items-center gap-2 mt-2">
              <input 
                type="checkbox" 
                checked={formData.is_default}
                onChange={e => setFormData({...formData, is_default: e.target.checked})}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-slate-700">Establecer como Plan de Tarifa por defecto</span>
            </label>
          )}

          <label className="flex items-center gap-2 mt-2">
            <input 
              type="checkbox" 
              checked={formData.is_visible_in_quotes !== false}
              onChange={e => setFormData({...formData, is_visible_in_quotes: e.target.checked})}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <span className="text-sm font-medium text-slate-700">Mostrar en el Cotizador Manual</span>
          </label>

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={closeModal} className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              Cancelar
            </button>
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition-colors">
              {editingId ? "Guardar Cambios" : "Guardar"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
