'use client';

import React, { useState, useMemo } from 'react';
import { usePMS } from '../../context/PMSContext';
import { Unit } from '../../types/inventory';
import { HousekeepingTask, Booking } from '../../types';
import { TeamMember } from '../../types/team';
import { 
  Sparkles, CheckCircle2, AlertTriangle, Play, Check, 
  UserPlus, ShieldAlert, Filter, List, Grid, RefreshCw,
  Search, ClipboardList, PenTool, Flame, ArrowUpDown, ChevronDown
} from 'lucide-react';

export default function HousekeepingDashboard() {
  const { 
    units, 
    bookings, 
    housekeepingTasks, 
    updateHousekeepingTask, 
    updateUnit, 
    teamMembers, 
    systemDate, 
    addMaintenanceBlock,
    addTask
  } = usePMS();

  // Filters state
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [selectedOccupancyFilter, setSelectedOccupancyFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'my-tasks' | 'supervisor'>('all');
  
  // Simulated logged-in cleaner ID (e.g., if a cleaner is using their phone)
  const [currentAttendantId, setCurrentAttendantId] = useState<string>(() => {
    const cleaners = teamMembers.filter(m => m.role_id === 'role_cleaner' || m.role_id === 'cleaner');
    return cleaners.length > 0 ? cleaners[0].id : '';
  });

  // Modal states
  const [assigningUnit, setAssigningUnit] = useState<Unit | null>(null);
  const [maintenanceUnit, setMaintenanceUnit] = useState<Unit | null>(null);
  const [inspectionUnit, setInspectionUnit] = useState<Unit | null>(null);

  // Maintenance form state
  const [maintenanceReason, setMaintenanceReason] = useState('');
  const [maintenancePriority, setMaintenancePriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [maintenanceBlockType, setMaintenanceBlockType] = useState<'out_of_service' | 'out_of_order'>('out_of_service');

  // Inspection state
  const [inspectionApproved, setInspectionApproved] = useState<boolean>(true);
  const [inspectionNotes, setInspectionNotes] = useState<string>('');

  // Operational Date
  const todayStr = systemDate || new Date().toISOString().split('T')[0];

  // Helper to compute room occupancy/booking info today
  const roomStatusMap = useMemo(() => {
    const map = new Map<string, {
      booking: Booking | null;
      type: 'checkout' | 'checkin' | 'stayover' | 'vacant';
      pax: number;
    }>();

    units.forEach(u => {
      // Find bookings for this room active today
      const todayBooking = bookings.find(b => 
        b.room_id === u.id && 
        b.booking_status !== 'cancelled' && 
        todayStr >= b.check_in && 
        todayStr <= b.check_out
      );

      if (todayBooking) {
        let type: 'checkout' | 'checkin' | 'stayover' = 'stayover';
        if (todayBooking.check_out === todayStr) {
          type = 'checkout';
        } else if (todayBooking.check_in === todayStr) {
          type = 'checkin';
        }
        map.set(u.id, {
          booking: todayBooking,
          type,
          pax: todayBooking.pax || 1
        });
      } else {
        map.set(u.id, {
          booking: null,
          type: 'vacant',
          pax: 0
        });
      }
    });

    return map;
  }, [units, bookings, todayStr]);

  // Map of unit_id -> current task for today
  const dailyTasksMap = useMemo(() => {
    const map = new Map<string, HousekeepingTask>();
    housekeepingTasks.forEach(task => {
      if (task.date === todayStr) {
        map.set(task.unit_id, task);
      }
    });
    return map;
  }, [housekeepingTasks, todayStr]);

  // Cleaners list for assignment
  const cleaners = useMemo(() => {
    return teamMembers.filter(m => 
      m.role_id?.toLowerCase().includes('cleaner') || 
      m.role_id?.toLowerCase().includes('camarera') ||
      m.role_id?.toLowerCase().includes('housekeeping') ||
      m.role_id?.toLowerCase().includes('admin') ||
      !m.role_id
    );
  }, [teamMembers]);

  // Get attendant task list (for My Tasks tab)
  const currentAttendantName = useMemo(() => {
    const member = teamMembers.find(m => m.id === currentAttendantId);
    return member ? `${member.first_name} ${member.last_name}` : 'Camarera';
  }, [teamMembers, currentAttendantId]);

  // Dynamic Statistics
  const stats = useMemo(() => {
    let clean = 0;
    let dirty = 0;
    let cleaning = 0;
    let inspected = 0;
    let checkins = 0;
    let checkouts = 0;

    units.forEach(u => {
      const hStatus = u.housekeeping_status || 'clean';
      if (hStatus === 'clean') clean++;
      else if (hStatus === 'dirty') dirty++;
      else if (hStatus === 'cleaning') cleaning++;
      else if (hStatus === 'inspected') inspected++;

      const occ = roomStatusMap.get(u.id);
      if (occ?.type === 'checkin') checkins++;
      if (occ?.type === 'checkout') checkouts++;
    });

    return { clean, dirty, cleaning, inspected, checkins, checkouts, total: units.length };
  }, [units, roomStatusMap]);

  // Apply filters
  const filteredUnits = useMemo(() => {
    return units.filter(u => {
      const occ = roomStatusMap.get(u.id);
      const task = dailyTasksMap.get(u.id);
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = u.name.toLowerCase().includes(query);
        const matchesType = u.unit_type_id.toLowerCase().includes(query);
        const matchesGuest = occ?.booking ? `${occ.booking.first_name} ${occ.booking.last_name}`.toLowerCase().includes(query) : false;
        if (!matchesName && !matchesType && !matchesGuest) return false;
      }

      // Housekeeping Status Filter
      if (selectedStatusFilter !== 'all') {
        const hStatus = u.housekeeping_status || 'clean';
        if (hStatus !== selectedStatusFilter) return false;
      }

      // Occupancy Filter
      if (selectedOccupancyFilter !== 'all') {
        if (occ?.type !== selectedOccupancyFilter) return false;
      }

      // Assigned Attendant Filter
      if (selectedStaffFilter !== 'all') {
        if (selectedStaffFilter === 'unassigned') {
          if (task?.team_member_id) return false;
        } else {
          if (task?.team_member_id !== selectedStaffFilter) return false;
        }
      }

      // Tab Specific Filtering
      if (activeTab === 'my-tasks') {
        if (task?.team_member_id !== currentAttendantId) return false;
      }

      return true;
    });
  }, [units, roomStatusMap, dailyTasksMap, searchQuery, selectedStatusFilter, selectedOccupancyFilter, selectedStaffFilter, activeTab, currentAttendantId]);

  // Handle Housekeeping Status transitions
  const changeHousekeepingStatus = (unit: Unit, newStatus: 'clean' | 'dirty' | 'cleaning' | 'inspected') => {
    updateUnit({
      ...unit,
      housekeeping_status: newStatus
    });

    // Sync task if exists, or create one
    const existingTask = dailyTasksMap.get(unit.id);
    const newStatusPMS = newStatus === 'cleaning' ? 'in_progress' : (newStatus === 'clean' || newStatus === 'inspected' ? 'completed' : 'pending');
    
    const calculatedTaskType = () => {
      const occ = roomStatusMap.get(unit.id);
      if (occ?.type === 'checkout') return 'check_out';
      if (occ?.type === 'checkin') return 'check_in';
      if (occ?.type === 'stayover') return 'stay_over';
      return 'deep_clean';
    };

    updateHousekeepingTask({
      id: existingTask?.id || `ht_${Date.now()}`,
      unit_id: unit.id,
      date: todayStr,
      team_member_id: existingTask?.team_member_id || (activeTab === 'my-tasks' ? currentAttendantId : null),
      task_type: existingTask?.task_type || calculatedTaskType(),
      status: newStatusPMS,
      notes: existingTask?.notes || ''
    });
  };

  // Quick action: Assign attendant to room
  const handleAssignAttendant = (attendantId: string | null) => {
    if (!assigningUnit) return;
    
    const existingTask = dailyTasksMap.get(assigningUnit.id);
    const calculatedTaskType = () => {
      const occ = roomStatusMap.get(assigningUnit.id);
      if (occ?.type === 'checkout') return 'check_out';
      if (occ?.type === 'checkin') return 'check_in';
      if (occ?.type === 'stayover') return 'stay_over';
      return 'deep_clean';
    };

    updateHousekeepingTask({
      id: existingTask?.id || `ht_${Date.now()}`,
      unit_id: assigningUnit.id,
      date: todayStr,
      team_member_id: attendantId,
      task_type: existingTask?.task_type || calculatedTaskType(),
      status: existingTask?.status || 'pending',
      notes: existingTask?.notes || ''
    });

    setAssigningUnit(null);
  };

  // Submit maintenance issue
  const handleReportMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintenanceUnit || !maintenanceReason.trim()) return;

    // 1. Create maintenance block
    const blockId = `mb_${Date.now()}`;
    addMaintenanceBlock({
      id: blockId,
      property_id: maintenanceUnit.property_id,
      unit_id: maintenanceUnit.id,
      type: maintenanceBlockType,
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days block
      reason: `[Housekeeping Mantenimiento]: ${maintenanceReason}`
    });

    // 2. Create Task for maintenance staff
    addTask({
      id: `task_${Date.now()}`,
      property_id: maintenanceUnit.property_id,
      title: `Reparación Hab. ${maintenanceUnit.name}: ${maintenanceReason.slice(0, 30)}`,
      description: `Reportado por Housekeeping. Habitación ${maintenanceUnit.name}.\nDetalle: ${maintenanceReason}`,
      due_date: todayStr,
      priority: maintenancePriority,
      status: 'pending',
      agent_id: 'usr_admin' // fallback admin
    });

    // 3. Mark room as dirty & out of order/service
    updateUnit({
      ...maintenanceUnit,
      status: maintenanceBlockType,
      housekeeping_status: 'dirty'
    });

    setMaintenanceUnit(null);
    setMaintenanceReason('');
    alert(`Reporte cargado. Habitación ${maintenanceUnit.name} marcada en mantenimiento.`);
  };

  // Submit inspection feedback
  const handleInspectRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectionUnit) return;

    if (inspectionApproved) {
      changeHousekeepingStatus(inspectionUnit, 'inspected');
    } else {
      changeHousekeepingStatus(inspectionUnit, 'dirty');
      
      // Update task note with reason for rejection
      const task = dailyTasksMap.get(inspectionUnit.id);
      if (task) {
        updateHousekeepingTask({
          ...task,
          status: 'pending',
          notes: `[Inspección Rechazada]: ${inspectionNotes}`
        });
      }
    }

    setInspectionUnit(null);
    setInspectionNotes('');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      
      {/* Top Banner stats (KPIs) - Mobile Scrollable */}
      <div className="bg-white border-b border-slate-200 p-4 shrink-0 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
                Gobernancía & Limpieza
              </h1>
              <p className="text-slate-500 text-xs mt-0.5">
                Panel de control de habitaciones hotelero • Fecha: <span className="font-extrabold text-slate-700">{todayStr}</span>
              </p>
            </div>
            
            {/* Quick user role selector for simulation */}
            <div className="flex items-center gap-2 bg-slate-55 bg-slate-50 p-1.5 rounded-lg border border-slate-200 text-xs shrink-0 self-stretch sm:self-auto">
              <span className="text-slate-400 font-bold ml-1">Simular Camarera:</span>
              <select
                value={currentAttendantId}
                onChange={e => setCurrentAttendantId(e.target.value)}
                className="bg-white border border-slate-200 rounded px-2 py-1 font-bold text-slate-800 focus:outline-none"
              >
                {cleaners.map(c => (
                  <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Cards metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2 sm:gap-3">
            <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 flex flex-col justify-between">
              <span className="text-[10px] font-black text-rose-500 uppercase tracking-wider block">Sucias</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-rose-700">{stats.dirty}</span>
                <span className="text-[10px] text-rose-450 font-bold">/ {stats.total} hab</span>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex flex-col justify-between">
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-wider block">Limpiando</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-amber-700">{stats.cleaning}</span>
                <span className="text-[10px] text-amber-450 font-bold">en curso</span>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex flex-col justify-between">
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-wider block">Limpias</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-emerald-700">{stats.clean}</span>
                <span className="text-[10px] text-emerald-450 font-bold">listas</span>
              </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex flex-col justify-between">
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-wider block">Inspeccionadas</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-indigo-700">{stats.inspected}</span>
                <span className="text-[10px] text-indigo-450 font-bold">aprobadas</span>
              </div>
            </div>

            <div className="bg-sky-50 border border-sky-100 rounded-xl p-3 flex flex-col justify-between">
              <span className="text-[10px] font-black text-sky-500 uppercase tracking-wider block">Salidas Hoy</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-sky-700">{stats.checkouts}</span>
                <span className="text-[10px] text-sky-450 font-bold">Check-outs</span>
              </div>
            </div>

            <div className="bg-violet-50 border border-violet-100 rounded-xl p-3 flex flex-col justify-between">
              <span className="text-[10px] font-black text-violet-500 uppercase tracking-wider block">Entradas Hoy</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-violet-700">{stats.checkins}</span>
                <span className="text-[10px] text-violet-450 font-bold">Check-ins</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs & Filters bar */}
      <div className="max-w-7xl w-full mx-auto p-4 flex-1 flex flex-col gap-4">
        
        {/* Navigation tabs */}
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 self-start">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${activeTab === 'all' ? 'bg-indigo-600 text-white shadow' : 'text-slate-650 hover:bg-slate-50'}`}
          >
            Todas las Habitaciones
          </button>
          <button
            onClick={() => setActiveTab('my-tasks')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${activeTab === 'my-tasks' ? 'bg-indigo-600 text-white shadow' : 'text-slate-655 hover:bg-slate-50'}`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            Mis Tareas ({currentAttendantName.split(' ')[0]})
          </button>
          <button
            onClick={() => setActiveTab('supervisor')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${activeTab === 'supervisor' ? 'bg-indigo-600 text-white shadow' : 'text-slate-655 hover:bg-slate-50'}`}
          >
            Panel Supervisor
          </button>
        </div>

        {/* Filters Grid */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="relative col-span-1 sm:col-span-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar hab. o huésped..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full"
            />
          </div>

          <div>
            <select
              value={selectedStatusFilter}
              onChange={e => setSelectedStatusFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="all">Estado: Todos</option>
              <option value="clean">Limpia</option>
              <option value="dirty">Sucia</option>
              <option value="cleaning">Limpiando</option>
              <option value="inspected">Inspeccionada</option>
            </select>
          </div>

          <div>
            <select
              value={selectedOccupancyFilter}
              onChange={e => setSelectedOccupancyFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="all">Ocupación: Todas</option>
              <option value="vacant">Vacía / Libre</option>
              <option value="checkout">Salida Hoy (Checkout)</option>
              <option value="checkin">Entrada Hoy (Checkin)</option>
              <option value="stayover">Con Huésped (Stayover)</option>
            </select>
          </div>

          <div>
            <select
              value={selectedStaffFilter}
              onChange={e => setSelectedStaffFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="all">Asignado: Todos</option>
              <option value="unassigned">Sin Asignar</option>
              {cleaners.map(c => (
                <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Room Attendant Header Info */}
        {activeTab === 'my-tasks' && (
          <div className="bg-indigo-50 border border-indigo-150 p-4 rounded-2xl flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-indigo-950">Tareas Asignadas a {currentAttendantName}</h3>
              <p className="text-xs text-indigo-700 font-medium">Marcá "Iniciar" al entrar a la habitación y "Finalizar" al salir.</p>
            </div>
            <div className="bg-indigo-650 text-white font-black text-xs px-3 py-1.5 rounded-lg">
              {filteredUnits.length} Habitaciones
            </div>
          </div>
        )}

        {/* Room Grid Display */}
        {filteredUnits.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {filteredUnits.map(unit => {
              const occ = roomStatusMap.get(unit.id);
              const task = dailyTasksMap.get(unit.id);
              const assignedCleaner = cleaners.find(c => c.id === task?.team_member_id);
              const hStatus = unit.housekeeping_status || 'clean';

              return (
                <div 
                  key={unit.id}
                  className={`bg-white rounded-2xl border-2 transition-all p-4.5 flex flex-col justify-between gap-4 shadow-sm hover:shadow-md relative overflow-hidden ${
                    hStatus === 'dirty' ? 'border-l-rose-500 border-l-4' :
                    hStatus === 'cleaning' ? 'border-l-amber-500 border-l-4 animate-pulse' :
                    hStatus === 'inspected' ? 'border-l-indigo-500 border-l-4' :
                    'border-l-emerald-500 border-l-4'
                  }`}
                >
                  
                  {/* Top: Room details */}
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
                          {unit.unit_type_id.replace('ut_', '').toUpperCase()}
                        </span>
                        <h3 className="text-xl font-black text-slate-900 mt-0.5">Hab. {unit.name}</h3>
                      </div>

                      {/* Status Badges */}
                      <div className="flex flex-col items-end gap-1.5">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-current ${
                          hStatus === 'dirty' ? 'bg-rose-50 text-rose-600' :
                          hStatus === 'cleaning' ? 'bg-amber-55 bg-amber-50 text-amber-600' :
                          hStatus === 'inspected' ? 'bg-indigo-50 text-indigo-650' :
                          'bg-emerald-50 text-emerald-600'
                        }`}>
                          {hStatus === 'dirty' ? 'Sucia 🔴' :
                           hStatus === 'cleaning' ? 'Limpiando ⏳' :
                           hStatus === 'inspected' ? 'Inspeccionada 🛡️' :
                           'Limpia 🟢'}
                        </span>

                        {unit.status !== 'active' && (
                          <span className="text-[8px] font-black uppercase bg-slate-900 text-white px-2 py-0.5 rounded-full">
                            BLOQUEADA 🚫
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Occupancy Indicator */}
                    <div className="mt-3.5 bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-semibold text-slate-700">
                      {occ?.type === 'checkout' && (
                        <div className="flex items-center gap-1 text-sky-700 font-bold">
                          <span className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-ping" />
                          <span>Salida Hoy (Checkout)</span>
                        </div>
                      )}
                      {occ?.type === 'checkin' && (
                        <div className="flex items-center gap-1 text-violet-700 font-bold">
                          <span className="w-1.5 h-1.5 bg-violet-500 rounded-full" />
                          <span>Entrada Hoy (Checkin)</span>
                        </div>
                      )}
                      {occ?.type === 'stayover' && (
                        <div className="flex items-center gap-1 text-slate-700 font-bold">
                          <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                          <span>Pasajero Hospedado</span>
                        </div>
                      )}
                      {occ?.type === 'vacant' && (
                        <div className="flex items-center gap-1 text-slate-400 font-medium">
                          <span>Vacía / Libre</span>
                        </div>
                      )}

                      {occ?.booking && (
                        <div className="text-[10px] text-slate-500 font-bold truncate mt-1">
                          Pax: {occ.pax} • {occ.booking.first_name} {occ.booking.last_name}
                        </div>
                      )}
                    </div>

                    {/* Assigned attendant */}
                    <div className="mt-3 text-xs flex items-center justify-between text-slate-500">
                      <span className="font-bold">Asignado:</span>
                      <span className="font-black text-slate-750">
                        {assignedCleaner ? `${assignedCleaner.first_name} ${assignedCleaner.last_name}` : 'Sin asignar'}
                      </span>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex flex-col gap-2 pt-3 border-t border-slate-100 mt-2">
                    
                    {/* Camarera quick action */}
                    <div className="grid grid-cols-2 gap-1.5">
                      {hStatus === 'dirty' && (
                        <button
                          type="button"
                          onClick={() => changeHousekeepingStatus(unit, 'cleaning')}
                          className="w-full py-2 px-2 bg-amber-55 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-black flex items-center justify-center gap-1 shadow-sm transition-all active:scale-95 cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          Iniciar
                        </button>
                      )}
                      {hStatus === 'cleaning' && (
                        <button
                          type="button"
                          onClick={() => changeHousekeepingStatus(unit, 'clean')}
                          className="w-full py-2 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black flex items-center justify-center gap-1 shadow-sm transition-all active:scale-95 cursor-pointer col-span-2"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Finalizar Limpieza
                        </button>
                      )}
                      {hStatus === 'clean' && activeTab === 'supervisor' && (
                        <button
                          type="button"
                          onClick={() => setInspectionUnit(unit)}
                          className="w-full py-2 px-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-black flex items-center justify-center gap-1 shadow-sm transition-all active:scale-95 cursor-pointer col-span-2"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Inspeccionar
                        </button>
                      )}
                      {hStatus === 'dirty' && (
                        <button
                          type="button"
                          onClick={() => setAssigningUnit(unit)}
                          className="w-full py-2 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          Asignar
                        </button>
                      )}
                    </div>

                    {/* Common actions: maintenance & dirty status reset */}
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setMaintenanceUnit(unit)}
                        className="py-1.5 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-500 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-1 transition-all cursor-pointer"
                      >
                        <AlertTriangle className="w-3 h-3 text-amber-500" />
                        Avería
                      </button>

                      {hStatus !== 'dirty' && hStatus !== 'cleaning' && (
                        <button
                          type="button"
                          onClick={() => changeHousekeepingStatus(unit, 'dirty')}
                          className="py-1.5 px-2 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-1 transition-all cursor-pointer"
                        >
                          Ensuciar 🧹
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-extrabold text-slate-800 text-sm">No encontramos habitaciones</h3>
            <p className="text-slate-500 text-xs mt-1">Intentá cambiar los filtros de búsqueda o de estado.</p>
          </div>
        )}
      </div>

      {/* Modal 1: Assign Attendant */}
      {assigningUnit && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 border border-slate-100 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-black text-slate-900">Asignar Limpieza</h3>
            <p className="text-slate-500 text-xs mt-1">Selecciona la camarera para la habitación <strong>{assigningUnit.name}</strong>.</p>
            
            <div className="space-y-2 mt-4 max-h-60 overflow-y-auto">
              <button
                type="button"
                onClick={() => handleAssignAttendant(null)}
                className="w-full p-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-left text-xs font-bold text-slate-600"
              >
                Desasignar / Dejar libre
              </button>
              {cleaners.map(cleaner => (
                <button
                  key={cleaner.id}
                  type="button"
                  onClick={() => handleAssignAttendant(cleaner.id)}
                  className="w-full p-3 rounded-xl border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 text-left text-xs font-bold text-slate-800 flex justify-between items-center"
                >
                  <span>{cleaner.first_name} {cleaner.last_name}</span>
                  <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded font-black uppercase">Camarera</span>
                </button>
              ))}
            </div>
            
            <button
              type="button"
              onClick={() => setAssigningUnit(null)}
              className="w-full mt-4 h-10 border border-slate-200 text-slate-500 font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors uppercase tracking-wider"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Modal 2: Report Maintenance */}
      {maintenanceUnit && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 border border-slate-100 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
              Reportar Avería / Bloqueo
            </h3>
            <p className="text-slate-500 text-xs mt-1">Registra un desperfecto para la habitación <strong>{maintenanceUnit.name}</strong>. Esto creará un bloqueo temporal en la grilla del hotel.</p>
            
            <form onSubmit={handleReportMaintenance} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Descripción del Problema</label>
                <textarea
                  required
                  placeholder="Ej: Pérdida de agua en mochila de baño, llave de luz rota, etc."
                  value={maintenanceReason}
                  onChange={e => setMaintenanceReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 h-24"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Tipo de Bloqueo</label>
                  <select
                    value={maintenanceBlockType}
                    onChange={e => setMaintenanceBlockType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-700"
                  >
                    <option value="out_of_service">Fuera de Servicio (Inhabitable)</option>
                    <option value="out_of_order">Fuera de Orden (Avería menor)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Prioridad de Reparación</label>
                  <select
                    value={maintenancePriority}
                    onChange={e => setMaintenancePriority(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-700"
                  >
                    <option value="low">Baja (Sin urgencia)</option>
                    <option value="medium">Media (Urgente hoy)</option>
                    <option value="high">Alta (Inmediata)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setMaintenanceUnit(null)}
                  className="flex-1 h-11 border border-slate-200 text-slate-500 font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 h-11 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all shadow-md uppercase tracking-wider"
                >
                  Cargar Reporte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Supervisor Inspection */}
      {inspectionUnit && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 border border-slate-100 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-black text-slate-900">Inspección de Habitación</h3>
            <p className="text-slate-500 text-xs mt-1">Aprobá o rechazá la limpieza de la habitación <strong>{inspectionUnit.name}</strong>.</p>
            
            <form onSubmit={handleInspectRoom} className="space-y-4 mt-4 text-xs">
              <div className="flex gap-2 p-1 bg-slate-50 border border-slate-200 rounded-xl">
                <button
                  type="button"
                  onClick={() => setInspectionApproved(true)}
                  className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${
                    inspectionApproved 
                      ? 'bg-emerald-600 text-white shadow' 
                      : 'text-slate-600 hover:bg-slate-200/50'
                  }`}
                >
                  Aprobada 🟢
                </button>
                <button
                  type="button"
                  onClick={() => setInspectionApproved(false)}
                  className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${
                    !inspectionApproved 
                      ? 'bg-rose-600 text-white shadow' 
                      : 'text-slate-600 hover:bg-slate-200/50'
                  }`}
                >
                  Rechazada 🔴
                </button>
              </div>

              {!inspectionApproved && (
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Motivo del Rechazo / Observaciones</label>
                  <textarea
                    required
                    placeholder="Ej: Polvo en velador, sábanas mal tendidas..."
                    value={inspectionNotes}
                    onChange={e => setInspectionNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 h-20"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setInspectionUnit(null)}
                  className="flex-1 h-10 border border-slate-200 text-slate-500 font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-md uppercase tracking-wider"
                >
                  Guardar Inspección
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
