'use client';

import { useState } from 'react';
import { Users, Settings, Plus, Edit2, Trash2, ArrowLeft, Shield, Mail, Calendar, KeyRound } from 'lucide-react';
import Link from 'next/link';
import { usePMS } from '../../../context/PMSContext';
import { Modal } from '../../../components/ui/Modal';
import { TeamMember, Role } from '../../../types/team';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { TeamMemberForm } from '../../../components/settings/TeamMemberForm';
import { RoleForm } from '../../../components/settings/RoleForm';

export default function TeamSettings() {
  const { teamMembers, roles, deleteTeamMember, deleteRole, properties } = usePMS();
  const [activeTab, setActiveTab] = useState<'members' | 'roles'>('members');

  // Modal State
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | undefined>(undefined);
  
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | undefined>(undefined);

  const handleOpenMemberModal = (member?: TeamMember) => {
    setEditingMember(member);
    setIsMemberModalOpen(true);
  };

  const handleOpenRoleModal = (role?: Role) => {
    setEditingRole(role);
    setIsRoleModalOpen(true);
  };

  const handleDeleteMember = (id: string, name: string) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar al usuario ${name}?`)) {
      deleteTeamMember(id);
    }
  };

  const handleDeleteRole = (id: string, name: string) => {
    // Check if role is used
    if (teamMembers.some(m => m.role_id === id)) {
      alert(`No se puede eliminar el rol "${name}" porque hay usuarios asignados a él.`);
      return;
    }
    if (window.confirm(`¿Estás seguro de que deseas eliminar el rol ${name}?`)) {
      deleteRole(id);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <main className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full">
        <div className="mb-8 flex items-center gap-4">
          <Link href="/settings" className="w-12 h-12 rounded-xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center hover:bg-slate-100 hover:text-slate-700 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <Users className="w-6 h-6 text-indigo-600" />
              Equipo y Accesos
            </h2>
            <p className="text-slate-500 text-sm mt-1">Administrá tu staff, sus roles y los permisos del sistema.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-slate-200">
          <button 
            onClick={() => setActiveTab('members')}
            className={`pb-3 px-1 text-sm font-bold border-b-2 transition-colors ${activeTab === 'members' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Miembros del Equipo
          </button>
          <button 
            onClick={() => setActiveTab('roles')}
            className={`pb-3 px-1 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'roles' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <Shield className="w-4 h-4" /> Roles y Permisos
          </button>
        </div>

        {/* Content */}
        {activeTab === 'members' ? (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button 
                onClick={() => handleOpenMemberModal()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-black shadow-sm flex items-center gap-2 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" /> Nuevo Usuario
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teamMembers.map(member => {
                const role = roles.find(r => r.id === member.role_id);
                const isActive = member.status === 'active';
                const memberProperty = properties.find(p => p.id === member.property_id);
                
                return (
                  <div key={member.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:border-indigo-300 transition-colors shadow-sm flex flex-col group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-black text-lg">
                          {member.first_name[0]}{member.last_name[0]}
                        </div>
                        <div>
                          <div className="font-black text-slate-800 text-lg">{member.first_name} {member.last_name}</div>
                          <div className="text-xs font-bold text-slate-500">{role?.name || 'Sin Rol'}</div>
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {isActive ? 'Activo' : 'Inactivo'}
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-6">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Mail className="w-4 h-4 text-slate-400" />
                        {member.email}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <span className="text-slate-400 font-bold">Acceso:</span>
                        <span className="font-bold text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 uppercase">
                          {memberProperty ? memberProperty.name : 'Todas las propiedades'}
                        </span>
                      </div>
                      {member.last_login && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          Último acceso: {format(parseISO(member.last_login), "dd MMM yyyy, HH:mm", { locale: es })}
                        </div>
                      )}
                    </div>

                    <div className="mt-auto flex justify-end gap-2 border-t border-slate-100 pt-4">
                      <button 
                        onClick={() => handleOpenMemberModal(member)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                        title="Editar usuario"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteMember(member.id, member.first_name)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Eliminar usuario"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button 
                onClick={() => handleOpenRoleModal()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-black shadow-sm flex items-center gap-2 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" /> Nuevo Rol
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {roles.map(role => (
                <div key={role.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm group">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                      <KeyRound className="w-5 h-5 text-indigo-500" />
                      {role.name}
                    </h3>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleOpenRoleModal(role)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                        title="Editar rol"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteRole(role.id, role.name)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Eliminar rol"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mb-4">{role.description}</p>
                  
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Permisos ({role.permissions.length})</h4>
                    <div className="flex flex-wrap gap-2">
                      {role.permissions.includes('all') ? (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-1 rounded-md font-bold uppercase border border-emerald-200">
                          Todos los permisos (Admin)
                        </span>
                      ) : (
                        role.permissions.map((perm, idx) => (
                          <span key={idx} className="bg-slate-100 text-slate-700 text-[10px] px-2 py-1 rounded-md font-bold uppercase border border-slate-200">
                            {perm}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Member Form Modal */}
      <Modal 
        isOpen={isMemberModalOpen} 
        onClose={() => setIsMemberModalOpen(false)}
        title={editingMember ? "Editar Usuario" : "Nuevo Usuario"}
      >
        <TeamMemberForm 
          initialMember={editingMember}
          onSuccess={() => setIsMemberModalOpen(false)}
          onCancel={() => setIsMemberModalOpen(false)}
        />
      </Modal>

      {/* Role Form Modal */}
      <Modal 
        isOpen={isRoleModalOpen} 
        onClose={() => setIsRoleModalOpen(false)}
        title={editingRole ? "Editar Rol" : "Nuevo Rol"}
      >
        <RoleForm 
          initialRole={editingRole}
          onSuccess={() => setIsRoleModalOpen(false)}
          onCancel={() => setIsRoleModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
