'use client';

import { useState } from 'react';
import { usePMS } from '../../context/PMSContext';
import { Role } from '../../types/team';

interface Props {
  initialRole?: Role;
  onSuccess: () => void;
  onCancel: () => void;
}

const AVAILABLE_PERMISSIONS = [
  { id: 'all', label: 'Acceso Total (Admin)' },
  { id: 'read:bookings', label: 'Ver Reservas' },
  { id: 'write:bookings', label: 'Crear/Editar Reservas' },
  { id: 'read:inventory', label: 'Ver Inventario / Housekeeping' },
  { id: 'write:inventory', label: 'Editar Inventario / Housekeeping' },
  { id: 'write:payments', label: 'Registrar Pagos' },
  { id: 'read:crm', label: 'Ver CRM (Leads, Cotizaciones)' },
  { id: 'write:crm', label: 'Editar CRM' },
  { id: 'read:rates', label: 'Ver Tarifas y Reglas' },
  { id: 'write:rates', label: 'Editar Tarifas y Reglas' }
];

export function RoleForm({ initialRole, onSuccess, onCancel }: Props) {
  const { addRole, updateRole } = usePMS();
  
  const [formData, setFormData] = useState<Partial<Role>>(() => {
    if (initialRole) return { ...initialRole };
    return {
      name: '',
      description: '',
      permissions: []
    };
  });

  const handleTogglePermission = (permId: string) => {
    setFormData(prev => {
      const current = prev.permissions || [];
      if (current.includes(permId)) {
        return { ...prev, permissions: current.filter(p => p !== permId) };
      } else {
        return { ...prev, permissions: [...current, permId] };
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.permissions) return;

    if (initialRole) {
      updateRole(formData as Role);
    } else {
      addRole({
        ...formData,
        id: `role_${Date.now()}`,
      } as Role);
    }
    onSuccess();
  };

  const inputClass = "w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors";
  const labelClass = "block text-sm font-bold text-slate-700 mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className={labelClass}>Nombre del Rol</label>
        <input 
          required 
          type="text" 
          value={formData.name} 
          onChange={e => setFormData({...formData, name: e.target.value})} 
          className={inputClass} 
          placeholder="Ej: Recepcionista Noche"
        />
      </div>

      <div>
        <label className={labelClass}>Descripción (Opcional)</label>
        <textarea 
          rows={2}
          value={formData.description} 
          onChange={e => setFormData({...formData, description: e.target.value})} 
          className={inputClass} 
          placeholder="Ej: Encargado del turno noche con permisos limitados..."
        />
      </div>

      <div>
        <label className={labelClass}>Permisos</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
          {AVAILABLE_PERMISSIONS.map(perm => {
            const isSelected = formData.permissions?.includes(perm.id);
            return (
              <label key={perm.id} className="flex items-start gap-3 cursor-pointer group">
                <div className={`mt-0.5 flex shrink-0 items-center justify-center w-5 h-5 rounded border ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-300'}`}>
                  {isSelected && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-3 h-3">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                </div>
                <input 
                  type="checkbox" 
                  className="hidden"
                  checked={isSelected}
                  onChange={() => handleTogglePermission(perm.id)}
                />
                <span className={`text-sm font-semibold transition-colors ${isSelected ? 'text-indigo-900' : 'text-slate-600 group-hover:text-slate-900'}`}>
                  {perm.label}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <button type="button" onClick={onCancel} className="px-5 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
          Cancelar
        </button>
        <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors">
          {initialRole ? 'Guardar Cambios' : 'Crear Rol'}
        </button>
      </div>
    </form>
  );
}
