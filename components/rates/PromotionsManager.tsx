import { useState } from 'react';
import { Tag, Plus, Edit2, Trash2, Search, Percent, DollarSign, Calendar } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { usePMS } from '../../context/PMSContext';
import { Promotion } from '../../types';

export function PromotionsManager() {
  const { promotions, addPromotion, updatePromotion, deletePromotion, currentPropertyId } = usePMS();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);

  const [formData, setFormData] = useState<Partial<Promotion>>({
    code: '',
    name: '',
    discount_type: 'percentage',
    discount_value: 0,
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: new Date().toISOString().split('T')[0],
    min_nights: 1,
    is_active: true
  });

  const handleOpenModal = (promo?: Promotion) => {
    if (promo) {
      setEditingPromo(promo);
      setFormData(promo);
    } else {
      setEditingPromo(null);
      setFormData({
        code: '',
        name: '',
        discount_type: 'percentage',
        discount_value: 0,
        valid_from: new Date().toISOString().split('T')[0],
        valid_until: new Date().toISOString().split('T')[0],
        min_nights: 1,
        is_active: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.code || !formData.name || !formData.discount_value) return;

    if (editingPromo) {
      updatePromotion({ ...editingPromo, ...formData } as Promotion);
    } else {
      addPromotion({
        ...formData,
        id: `promo_${Date.now()}`,
        created_at: new Date().toISOString()
      } as Promotion);
    }
    setIsModalOpen(false);
  };

  const filteredPromos = promotions.filter(p => 
    (p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
     p.code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="h-full flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
        <div className="relative w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Buscar promoción..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
          />
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors active:scale-95 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nueva Promoción
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {filteredPromos.length === 0 ? (
          <div className="text-center text-slate-500 py-12">
            <Tag className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p className="font-bold text-lg text-slate-700">No hay promociones</p>
            <p className="text-sm">Crea códigos de descuento para tu motor de reservas.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPromos.map((promo: Promotion) => (
              <div key={promo.id} className={`border ${promo.is_active ? 'border-indigo-200 bg-white' : 'border-slate-200 bg-slate-50 opacity-60'} rounded-xl p-4 hover:shadow-md transition-shadow relative overflow-hidden`}>
                {!promo.is_active && <div className="absolute top-0 right-0 bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">INACTIVA</div>}
                
                <div className="flex justify-between items-start mb-2">
                  <span className={`${promo.is_active ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'} text-xs font-black px-2 py-1 rounded uppercase tracking-wider`}>
                    {promo.code}
                  </span>
                  <div className="flex gap-1">
                    <button onClick={() => handleOpenModal(promo)} className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => { if(confirm('¿Seguro que deseas eliminar esta promo?')) deletePromotion(promo.id) }} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <h3 className="font-bold text-slate-800 text-lg">{promo.name}</h3>
                
                <div className="mt-3 text-xs text-slate-500 flex flex-col gap-1">
                   <div className="flex items-center gap-1"><Calendar className="w-3 h-3"/> Válido: {promo.valid_from} al {promo.valid_until}</div>
                   {promo.min_nights && promo.min_nights > 1 && <div className="flex items-center gap-1 font-bold text-slate-700">Mínimo de noches: {promo.min_nights}</div>}
                </div>

                <div className="mt-4 flex items-center justify-between text-sm pt-3 border-t border-slate-100">
                  <span className="text-slate-500 font-medium">Descuento:</span>
                  <span className="font-black text-emerald-600 flex items-center gap-1 text-lg">
                    {promo.discount_type === 'percentage' ? <Percent className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
                    {promo.discount_value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingPromo ? "Editar Promoción" : "Crear Promoción"}>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Nombre Interno</label>
              <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-slate-50" placeholder="Ej: Black Friday" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Código Público</label>
              <input required type="text" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} className="w-full px-3 py-2 border rounded-lg bg-slate-50 font-black text-indigo-700 uppercase tracking-wider" placeholder="BLACKFRIDAY26" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Tipo de Descuento</label>
              <select value={formData.discount_type} onChange={e => setFormData({...formData, discount_type: e.target.value as any})} className="w-full px-3 py-2 border rounded-lg bg-slate-50">
                <option value="percentage">Porcentaje (%)</option>
                <option value="fixed">Monto Fijo ($)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Valor</label>
              <input required type="number" min="1" value={formData.discount_value} onChange={e => setFormData({...formData, discount_value: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 border rounded-lg bg-slate-50 font-bold" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Válido Desde</label>
              <input type="date" value={formData.valid_from} onChange={e => setFormData({...formData, valid_from: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-slate-50" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Válido Hasta</label>
              <input type="date" value={formData.valid_until} onChange={e => setFormData({...formData, valid_until: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-slate-50" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Mín. Noches</label>
              <input type="number" min="1" value={formData.min_nights} onChange={e => setFormData({...formData, min_nights: parseInt(e.target.value) || 1})} className="w-full px-3 py-2 border rounded-lg bg-slate-50" />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer mt-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} className="rounded text-indigo-600 focus:ring-indigo-500" />
            <span className="text-sm font-bold text-slate-700">Promoción Activa (visible en el motor)</span>
          </label>

          <div className="flex justify-end gap-3 pt-4">
            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-bold text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
            <button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition-colors">Guardar Promoción</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
