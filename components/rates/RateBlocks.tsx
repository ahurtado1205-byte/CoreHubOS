'use client';

import { useState, useMemo } from 'react';
import { usePMS } from '../../context/PMSContext';
import { RateRule } from '../../types/inventory';
import { Plus, Trash2, Calendar, Tag, Edit2, BedDouble } from 'lucide-react';
import { Modal } from '../ui/Modal';

export function RateBlocks() {
  const { rateRules, ratePlans, unitTypes, addRateRule, deleteRateRule } = usePMS();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSeasonKey, setEditingSeasonKey] = useState<string | null>(null);
  const [oldRuleIds, setOldRuleIds] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    season_name: '',
    start_date: '',
    end_date: '',
    rate_plan_id: ratePlans[0]?.id || '',
    min_nights: 1,
    prices: {} as Record<string, number>,
    extra_bed_prices: {} as Record<string, number>
  });

  const seasons = useMemo(() => {
    const grouped = new Map<string, {
      season_name: string;
      start_date: string;
      end_date: string;
      rate_plan_id: string;
      min_nights: number;
      rules: RateRule[];
      extraBedRules: RateRule[];
    }>();
    
    // First, group normal rules
    rateRules.forEach(rule => {
      if (rule.rate_plan_id === 'extra_bed') return;
      const key = `${rule.season_name}|${rule.start_date}|${rule.end_date}|${rule.rate_plan_id}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          season_name: rule.season_name,
          start_date: rule.start_date,
          end_date: rule.end_date,
          rate_plan_id: rule.rate_plan_id,
          min_nights: rule.min_nights || 1,
          rules: [],
          extraBedRules: []
        });
      }
      grouped.get(key)!.rules.push(rule);
    });
    
    // Then attach extra bed rules
    rateRules.forEach(rule => {
      if (rule.rate_plan_id === 'extra_bed') {
        const block = Array.from(grouped.values()).find(b => b.season_name === rule.season_name && b.start_date === rule.start_date && b.end_date === rule.end_date);
        if (block) {
          block.extraBedRules.push(rule);
        }
      }
    });
    
    return Array.from(grouped.values());
  }, [rateRules]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.season_name || !formData.start_date || !formData.end_date) return;
    
    if (editingSeasonKey && oldRuleIds.length > 0) {
      oldRuleIds.forEach(id => deleteRateRule(id));
    }
    
    unitTypes.forEach(ut => {
      const price = formData.prices[ut.id];
      if (price !== undefined && price !== null && price > 0) {
        addRateRule({
          id: `rr_${Date.now()}_${ut.id}_${Math.random().toString(36).substring(7)}`,
          rate_plan_id: formData.rate_plan_id,
          unit_type_id: ut.id,
          season_name: formData.season_name,
          start_date: formData.start_date,
          end_date: formData.end_date,
          price: Number(price),
          min_nights: Number(formData.min_nights)
        });
      }

      const extraBedPrice = formData.extra_bed_prices[ut.id];
      if (extraBedPrice !== undefined && extraBedPrice !== null && extraBedPrice > 0) {
        addRateRule({
          id: `rr_eb_${Date.now()}_${ut.id}_${Math.random().toString(36).substring(7)}`,
          rate_plan_id: 'extra_bed',
          unit_type_id: ut.id,
          season_name: formData.season_name,
          start_date: formData.start_date,
          end_date: formData.end_date,
          price: Number(extraBedPrice),
          min_nights: Number(formData.min_nights)
        });
      }
    });
    
    closeModal();
  };

  const openNewModal = () => {
    setEditingSeasonKey(null);
    setOldRuleIds([]);
    
    const initialPrices: Record<string, number> = {};
    const initialExtraBed: Record<string, number> = {};
    unitTypes.forEach(ut => {
      initialPrices[ut.id] = ut.base_price;
      initialExtraBed[ut.id] = 0;
    });

    setFormData({
      season_name: '',
      start_date: '',
      end_date: '',
      rate_plan_id: ratePlans[0]?.id || '',
      min_nights: 1,
      prices: initialPrices,
      extra_bed_prices: initialExtraBed
    });
    setIsModalOpen(true);
  };

  const openEditModal = (season: any) => {
    const key = `${season.season_name}|${season.start_date}|${season.end_date}|${season.rate_plan_id}`;
    setEditingSeasonKey(key);
    
    const allRuleIds = [
      ...season.rules.map((r: RateRule) => r.id),
      ...season.extraBedRules.map((r: RateRule) => r.id)
    ];
    setOldRuleIds(allRuleIds);
    
    const initialPrices: Record<string, number> = {};
    const initialExtraBed: Record<string, number> = {};
    
    unitTypes.forEach(ut => {
      const rule = season.rules.find((r: RateRule) => r.unit_type_id === ut.id);
      if (rule) initialPrices[ut.id] = rule.price;
      
      const ebRule = season.extraBedRules.find((r: RateRule) => r.unit_type_id === ut.id);
      if (ebRule) initialExtraBed[ut.id] = ebRule.price;
    });

    setFormData({
      season_name: season.season_name,
      start_date: season.start_date,
      end_date: season.end_date,
      rate_plan_id: season.rate_plan_id,
      min_nights: season.min_nights,
      prices: initialPrices,
      extra_bed_prices: initialExtraBed
    });
    setIsModalOpen(true);
  };

  const handleDeleteSeason = (season: any) => {
    if (confirm(`¿Estás seguro de que quieres eliminar la temporada "${season.season_name}"?`)) {
      season.rules.forEach((r: RateRule) => deleteRateRule(r.id));
      season.extraBedRules.forEach((r: RateRule) => deleteRateRule(r.id));
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSeasonKey(null);
    setOldRuleIds([]);
  };

  return (
    <div className="h-full flex flex-col p-6">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h3 className="font-bold text-slate-800 text-lg">Bloques de Temporada</h3>
          <p className="text-sm text-slate-500">Define precios base para rangos de fechas específicos en múltiples tipos de habitación.</p>
        </div>
        <button
          onClick={openNewModal}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Nueva Temporada
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {seasons.map((season, i) => {
            const rp = ratePlans.find(r => r.id === season.rate_plan_id);
            return (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm relative group flex flex-col">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-indigo-500" />
                    <h4 className="font-bold text-slate-800">{season.season_name}</h4>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => openEditModal(season)}
                      className="p-1.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                      title="Editar Temporada"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteSeason(season)}
                      className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded transition-colors"
                      title="Eliminar Temporada"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4 flex-1">
                  <div className="flex items-center gap-2 text-sm text-slate-600 font-medium bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                    <Calendar className="w-4 h-4 text-indigo-400" />
                    <span>{season.start_date} <span className="text-slate-400 mx-1">al</span> {season.end_date}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 px-1 pt-2">
                    <p>Plan: <span className="font-medium text-slate-700">{rp?.name}</span></p>
                    <p>Min. noches: <span className="font-medium text-slate-700">{season.min_nights}</span></p>
                  </div>
                </div>
                
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Tarifas por Habitación</p>
                  <div className="space-y-1.5">
                    {season.rules.map((rule: RateRule) => {
                      const ut = unitTypes.find(u => u.id === rule.unit_type_id);
                      const ebRule = season.extraBedRules.find((r: RateRule) => r.unit_type_id === rule.unit_type_id);
                      return (
                        <div key={rule.id} className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-600 font-medium">{ut?.name || 'Desconocido'}</span>
                            {ebRule && ebRule.price > 0 && (
                              <span className="text-[10px] bg-orange-50 text-orange-600 border border-orange-100 px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                                <BedDouble className="w-3 h-3" /> +${ebRule.price}
                              </span>
                            )}
                          </div>
                          <span className="font-bold text-emerald-600">${rule.price}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
          {seasons.length === 0 && (
            <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-xl">
              <p className="text-slate-500 font-medium">No hay bloques de tarifas creados.</p>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingSeasonKey ? "Editar Temporada" : "Crear Temporada"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Nombre de la Temporada</label>
            <input required type="text" value={formData.season_name} onChange={e => setFormData({...formData, season_name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="Ej: Verano 2024" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Desde</label>
              <input required type="date" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Hasta</label>
              <input required type="date" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Plan de Tarifa Asociado</label>
              <select value={formData.rate_plan_id} onChange={e => setFormData({...formData, rate_plan_id: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white">
                {ratePlans.map(rp => (
                  <option key={rp.id} value={rp.id}>{rp.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Mínimo de Noches</label>
              <input type="number" min="1" value={formData.min_nights} onChange={e => setFormData({...formData, min_nights: Number(e.target.value)})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 mt-6">
            <h4 className="text-sm font-bold text-slate-800 mb-3">Precios por Tipo de Habitación (Noche)</h4>
            <div className="grid grid-cols-1 gap-3">
              {unitTypes.map(ut => (
                <div key={ut.id} className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col md:flex-row items-center gap-3">
                  <label className="text-sm font-bold text-slate-700 w-full md:w-1/3 truncate" title={ut.name}>{ut.name}</label>
                  
                  <div className="flex-1 w-full grid grid-cols-2 gap-2">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Base</span>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                        <input 
                          type="number" min="0" 
                          value={formData.prices[ut.id] || ''} 
                          onChange={e => setFormData({...formData, prices: {...formData.prices, [ut.id]: Number(e.target.value)}})} 
                          className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-bold" 
                          placeholder="Sin tarifa"
                        />
                      </div>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-orange-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <BedDouble className="w-3 h-3" /> Cama Adicional
                      </span>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400">$</span>
                        <input 
                          type="number" min="0" 
                          value={formData.extra_bed_prices[ut.id] || ''} 
                          onChange={e => setFormData({...formData, extra_bed_prices: {...formData.extra_bed_prices, [ut.id]: Number(e.target.value)}})} 
                          className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 font-bold text-orange-700" 
                          placeholder="Sin cama ad."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 mt-2 italic">* Deja el campo vacío o en 0 si no aplica.</p>
          </div>
          
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={closeModal} className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              Cancelar
            </button>
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-sm">
              {editingSeasonKey ? "Guardar Cambios" : "Crear Temporada"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
