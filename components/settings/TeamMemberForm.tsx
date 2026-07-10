'use client';

import { useState } from 'react';
import { usePMS } from '../../context/PMSContext';
import { TeamMember } from '../../types/team';

interface Props {
  initialMember?: TeamMember;
  onSuccess: () => void;
  onCancel: () => void;
}

export function TeamMemberForm({ initialMember, onSuccess, onCancel }: Props) {
  const { addTeamMember, updateTeamMember, roles, properties } = usePMS();
  
  const [formData, setFormData] = useState<Partial<TeamMember>>(() => {
    if (initialMember) return { ...initialMember };
    return {
      first_name: '',
      last_name: '',
      email: '',
      role_id: roles[0]?.id || '',
      property_id: '', // Empty means all properties
      status: 'active'
    };
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_name || !formData.last_name || !formData.email || !formData.role_id) return;

    if (initialMember) {
      updateTeamMember(formData as TeamMember);
    } else {
      addTeamMember({
        ...formData,
        id: `usr_${Date.now()}`,
      } as TeamMember);
    }
    onSuccess();
  };

  const inputClass = "w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors";
  const labelClass = "block text-sm font-bold text-slate-700 mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Nombre</label>
          <input 
            required 
            type="text" 
            value={formData.first_name} 
            onChange={e => setFormData({...formData, first_name: e.target.value})} 
            className={inputClass} 
            placeholder="Ej: Juan"
          />
        </div>
        <div>
          <label className={labelClass}>Apellido</label>
          <input 
            required 
            type="text" 
            value={formData.last_name} 
            onChange={e => setFormData({...formData, last_name: e.target.value})} 
            className={inputClass} 
            placeholder="Ej: Pérez"
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Correo Electrónico</label>
        <input 
          required 
          type="email" 
          value={formData.email} 
          onChange={e => setFormData({...formData, email: e.target.value})} 
          className={inputClass} 
          placeholder="juan.perez@hotelflow.com"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Rol en el Sistema</label>
          <select 
            required 
            value={formData.role_id || ''} 
            onChange={e => setFormData({...formData, role_id: e.target.value})} 
            className={inputClass}
          >
            <option value="" disabled>Seleccione un rol...</option>
            {roles.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className={labelClass}>Acceso a Propiedades</label>
          <select 
            value={formData.property_id || ''} 
            onChange={e => setFormData({...formData, property_id: e.target.value === '' ? undefined : e.target.value})} 
            className={inputClass}
          >
            <option value="">Todas las propiedades (Global)</option>
            {properties.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <p className="text-[10px] text-slate-500 mt-1 font-medium">Asignar a una propiedad específica o dejar global.</p>
        </div>
      </div>

      <div>
        <label className={labelClass}>Estado</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="radio" 
              name="status"
              value="active"
              checked={formData.status === 'active'}
              onChange={() => setFormData({...formData, status: 'active'})}
              className="text-indigo-600 focus:ring-indigo-500 h-4 w-4"
            />
            <span className="text-sm font-semibold text-slate-700">Activo (Puede acceder)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="radio" 
              name="status"
              value="inactive"
              checked={formData.status === 'inactive'}
              onChange={() => setFormData({...formData, status: 'inactive'})}
              className="text-indigo-600 focus:ring-indigo-500 h-4 w-4"
            />
            <span className="text-sm font-semibold text-slate-700">Inactivo (Acceso revocado)</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <button type="button" onClick={onCancel} className="px-5 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
          Cancelar
        </button>
        <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors">
          {initialMember ? 'Guardar Cambios' : 'Crear Usuario'}
        </button>
      </div>
    </form>
  );
}
