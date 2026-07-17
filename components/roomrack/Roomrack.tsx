'use client';

import { useState, useMemo } from 'react';
import { addDays, subDays, format, eachDayOfInterval, parseISO, startOfDay, differenceInDays, isWeekend } from 'date-fns';
import { es } from 'date-fns/locale';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Booking, BookingStatus } from '../../types';
import { usePMS } from '../../context/PMSContext';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Roomrack({ startDate, daysToView, onEditBooking, onCellDoubleClick, onEditMaintenanceBlock }: { startDate: Date; daysToView: number; onEditBooking: (booking: Booking) => void; onCellDoubleClick?: (unitId: string, date: Date) => void; onEditMaintenanceBlock?: (block: any) => void; }) {
  const { bookings: allBookings, updateBooking, units, updateUnit, unitTypes, properties, currentPropertyId, dockedBookingIds, setDockedBookingIds, maintenanceBlocks, updateMaintenanceBlock, bookingColors, updateBookingColor } = usePMS();
  const bookings = allBookings.filter(b => b.booking_status !== 'cancelled');
  const today = startOfDay(new Date());
  
  const [showStats, setShowStats] = useState(false);
  const [isDockExpanded, setIsDockExpanded] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Rango de fechas dinámico según las props
  const dates = useMemo(() => {
    return eachDayOfInterval({
      start: startOfDay(startDate),
      end: addDays(startOfDay(startDate), Math.max(1, daysToView - 1))
    });
  }, [startDate, daysToView]);

  const visibleStartDate = dates[0];
  const calendarEndDate = dates[dates.length - 1];

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, booking: Booking) => {
    e.dataTransfer.setData('bookingId', booking.id);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
      if (e.target instanceof HTMLElement) {
        e.target.style.opacity = '0.5';
      }
    }, 0);
  };

  const handleResizeStart = (e: React.DragEvent, id: string, type: 'booking'|'block', edge: 'start'|'end') => {
    e.dataTransfer.setData('resizeId', id);
    e.dataTransfer.setData('resizeType', type);
    e.dataTransfer.setData('resizeEdge', edge);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.target instanceof HTMLElement) {
      e.target.style.opacity = '1';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetUnitId: string, targetDate: Date) => {
    e.preventDefault();
    const resizeId = e.dataTransfer.getData('resizeId');
    
    if (resizeId) {
      const resizeType = e.dataTransfer.getData('resizeType');
      const resizeEdge = e.dataTransfer.getData('resizeEdge');
      
      if (resizeType === 'booking') {
        const booking = bookings.find(b => b.id === resizeId);
        if (!booking) return;
        
        let newIn = parseISO(booking.check_in);
        let newOut = parseISO(booking.check_out);
        
        if (resizeEdge === 'start') {
          newIn = targetDate;
          if (newIn >= newOut) newIn = subDays(newOut, 1);
        } else {
          newOut = addDays(targetDate, 1);
          if (newOut <= newIn) newOut = addDays(newIn, 1);
        }
        
        // Detección colisión en resize
        const hasCollision = bookings.some(b => {
          if (b.id === resizeId || b.room_id !== booking.room_id) return false;
          const existingIn = startOfDay(parseISO(b.check_in));
          const existingOut = startOfDay(parseISO(b.check_out));
          return (newIn < existingOut) && (newOut > existingIn);
        });

        if (hasCollision) {
          alert('❌ Error: Colisión con otra reserva.');
          return;
        }

        updateBooking({
          ...booking,
          check_in: format(newIn, 'yyyy-MM-dd'),
          check_out: format(newOut, 'yyyy-MM-dd')
        });
      } else if (resizeType === 'block') {
        const block = maintenanceBlocks.find(m => m.id === resizeId);
        if (!block) return;
        
        let newStart = parseISO(block.start_date);
        let newEnd = parseISO(block.end_date);
        
        if (resizeEdge === 'start') {
          newStart = targetDate;
          if (newStart >= newEnd) newStart = newEnd; // allow same day
        } else {
          newEnd = targetDate;
          if (newEnd < newStart) newEnd = newStart;
        }
        
        updateMaintenanceBlock({
          ...block,
          start_date: format(newStart, 'yyyy-MM-dd'),
          end_date: format(newEnd, 'yyyy-MM-dd')
        });
      }
      return;
    }

    const bookingId = e.dataTransfer.getData('bookingId');
    if (!bookingId) return;

    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    const checkInDate = startOfDay(parseISO(booking.check_in));
    const checkOutDate = startOfDay(parseISO(booking.check_out));
    const nights = differenceInDays(checkOutDate, checkInDate);

    const newIn = targetDate;
    const newOut = addDays(targetDate, nights);
    
    // Detección de Colisiones (Overbooking)
    const hasCollision = bookings.some(b => {
      if (b.id === bookingId) return false;
      if (b.room_id !== targetUnitId) return false;
      
      const existingIn = startOfDay(parseISO(b.check_in));
      const existingOut = startOfDay(parseISO(b.check_out));
      
      // Hay colisión si la nueva entrada es antes de la salida existente Y la nueva salida es después de la entrada existente
      return (newIn < existingOut) && (newOut > existingIn);
    });

    if (hasCollision) {
      alert('❌ Error: La habitación ya está ocupada en esas fechas por otra reserva.');
      return;
    }

    const newCheckIn = format(newIn, 'yyyy-MM-dd');
    const newCheckOut = format(newOut, 'yyyy-MM-dd');
    const targetUnit = units.find(u => u.id === targetUnitId);
    
    if (targetUnit?.housekeeping_status === 'dirty') {
      if (!window.confirm(`⚠️ Advertencia de Housekeeping:\nLa habitación ${targetUnit.name} figura como SUCIA. ¿Deseás forzar la asignación de todas formas?`)) {
        return;
      }
    }

    if (booking.property_id && targetUnit && booking.property_id !== targetUnit.property_id) {
       if (!window.confirm(`🚨 Ajuste Comercial Inter-Propiedad\nEstás moviendo esta reserva a otra propiedad (${targetUnit.name}).\nLas tarifas y políticas pueden variar. ¿Deseas mantener la tarifa original del huésped como cortesía? (Aceptar = Sí, Cancelar = No, impactar nueva tarifa)`)) {
          // Aquí podríamos ajustar la tarifa, por ahora es solo una advertencia simulada
       }
    }

    
    const targetUnitType = unitTypes.find(t => t.id === targetUnit?.unit_type_id);

    const confirmMsg = `¿Mover reserva de ${booking.first_name} ${booking.last_name}?\n\nNueva Habitación: ${targetUnit?.name} (${targetUnitType?.name})\nNuevo Ingreso: ${newCheckIn}\nNuevo Egreso: ${newCheckOut}`;
    
    if (window.confirm(confirmMsg)) {
      if (dockedBookingIds.includes(bookingId)) {
        setDockedBookingIds(dockedBookingIds.filter(id => id !== bookingId));
      }
      
      updateBooking({ 
        ...booking, 
        room_id: targetUnitId, 
        property_id: targetUnit?.property_id || booking.property_id,
        check_in: newCheckIn, 
        check_out: newCheckOut 
      });
    }
  };

  const [openUnassignedDate, setOpenUnassignedDate] = useState<string | null>(null);
  const [filterUnitTypeId, setFilterUnitTypeId] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'dashboard' | 'grid'>('dashboard');
  
  const filteredUnits = useMemo(() => {
    if (filterUnitTypeId === 'all') return units;
    return units.filter(u => u.unit_type_id === filterUnitTypeId);
  }, [units, filterUnitTypeId]);

  if (currentPropertyId === 'all' && viewMode === 'dashboard') {
    return (
      <div className="flex flex-col gap-6 p-6 h-full overflow-y-auto bg-slate-50">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-slate-800">Dashboard de Ocupación Consolidado</h2>
            <div className="text-sm font-semibold text-indigo-600 mt-1">Vista Global Multi-Propiedad</div>
          </div>
          <button 
            onClick={() => setViewMode('grid')}
            className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-4 py-2 rounded-xl font-bold text-sm transition-colors"
          >
            Ver Grilla Unificada
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map(prop => {
            const propBookings = bookings.filter(b => b.property_id === prop.id);
            const propUnits = units.filter(u => u.property_id === prop.id);
            const occRooms = propBookings.filter(b => {
              if (!b.room_id) return false;
              const bStart = startOfDay(parseISO(b.check_in));
              const bEnd = startOfDay(parseISO(b.check_out));
              return today >= bStart && today < bEnd;
            }).length;
            const occPercent = propUnits.length > 0 ? Math.round((occRooms / propUnits.length) * 100) : 0;
            return (
              <div key={prop.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center text-center transition-transform hover:-translate-y-1">
                <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-black text-3xl mb-6 border-[6px] border-indigo-100 shadow-inner">
                  {occPercent}%
                </div>
                <h3 className="text-xl font-black text-slate-800">{prop.name}</h3>
                <p className="text-sm font-bold text-slate-500 mt-2">{occRooms} de {propUnits.length} unidades ocupadas hoy</p>
                <div className="w-full bg-slate-100 h-3 rounded-full mt-6 overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full transition-all duration-1000" style={{ width: `${occPercent}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-4">
      {currentPropertyId === 'all' && (
        <div className="flex justify-end pr-4">
          <button 
            onClick={() => setViewMode('dashboard')}
            className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-4 py-2 rounded-xl font-bold text-sm transition-colors shadow-sm"
          >
            ← Volver al Dashboard
          </button>
        </div>
      )}
      <div className="flex h-full gap-4">
        {/* Main Roomrack Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1 min-w-0">
        {/* Scrollable Container */}
        <div className="overflow-auto flex-1 relative">
        <table className="w-full border-collapse text-sm min-w-max table-fixed origin-top-left" style={{ zoom: zoomLevel }}>
          <thead className="sticky top-0 bg-white z-30 shadow-sm">
            <tr>
              <th className="sticky left-0 z-40 bg-white border-b border-r border-slate-300 p-3 w-[200px] text-left text-xs uppercase text-slate-500 font-bold tracking-wider align-top">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span>Unidades</span>
                    <div className="flex gap-1">
                      <button onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.1))} className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-1 rounded font-bold" title="Zoom Out">-</button>
                      <button onClick={() => setZoomLevel(1)} className="text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-1 rounded font-bold" title="Reset Zoom">100%</button>
                      <button onClick={() => setZoomLevel(prev => Math.min(2, prev + 0.1))} className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-1 rounded font-bold" title="Zoom In">+</button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <button 
                      onClick={() => setShowStats(!showStats)} 
                      className="text-[9px] w-full bg-slate-100 hover:bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded transition-colors font-bold"
                      title="Mostrar/Ocultar estadísticas diarias"
                    >
                      {showStats ? 'Ocultar Info Diaria' : 'Mostrar Info Diaria'}
                    </button>
                  </div>
                  <select 
                    value={filterUnitTypeId}
                    onChange={e => setFilterUnitTypeId(e.target.value)}
                    className="w-full text-[10px] p-1.5 bg-slate-50 border border-slate-200 rounded font-bold text-slate-900 normal-case focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="all">Todas las Categorías</option>
                    {unitTypes.map(ut => (
                      <option key={ut.id} value={ut.id}>{ut.name}</option>
                    ))}
                  </select>
                </div>
              </th>
              {dates.map((date, i) => {
                const isToday = date.getTime() === today.getTime();
                const isWeekEnd = isWeekend(date);
                const dateStr = format(date, 'yyyy-MM-dd');
                
                // Calculate Stats
                const dailyAssigned = bookings.filter(b => b.room_id && startOfDay(parseISO(b.check_in)) <= date && startOfDay(parseISO(b.check_out)) > date);
                const dailyUnassigned = bookings.filter(b => !b.room_id && startOfDay(parseISO(b.check_in)) <= date && startOfDay(parseISO(b.check_out)) > date);
                
                const dailyOOO = maintenanceBlocks.filter(m => m.type === 'out_of_order' && startOfDay(parseISO(m.start_date)) <= date && startOfDay(parseISO(m.end_date)) > date);
                
                const totalUnits = units.length;
                const availableUnits = totalUnits - dailyOOO.length;
                const occRooms = dailyAssigned.length;
                const freeRooms = Math.max(0, availableUnits - occRooms);
                const occPercent = availableUnits > 0 ? Math.round((occRooms / availableUnits) * 100) : 0;
                
                let dailyRevenue = 0;
                dailyAssigned.forEach(b => { dailyRevenue += (b.nightly_rate || 0); });
                const adr = occRooms > 0 ? Math.round(dailyRevenue / occRooms) : 0;
                
                return (
                  <th 
                    key={i} 
                    className={cn(
                      "border-b border-slate-300 border-r border-r-slate-200 p-2 w-[120px] text-center transition-colors relative align-top",
                      isToday ? "bg-indigo-50 border-b-2 border-b-indigo-500" : isWeekEnd ? "bg-slate-50/80" : ""
                    )}
                  >
                    <div className={cn("text-sm font-black", isToday ? "text-indigo-700" : isWeekEnd ? "text-slate-600" : "text-slate-800")}>
                      {format(date, 'dd')} <span className="text-[10px] uppercase opacity-70 font-bold">{format(date, 'EEE', { locale: es })}</span>
                    </div>
                    
                    <div className="mt-2 space-y-1">
                      {/* Unassigned Indicator */}
                      {dailyUnassigned.length > 0 ? (
                        <div className="relative">
                          <button 
                            onClick={() => setOpenUnassignedDate(openUnassignedDate === dateStr ? null : dateStr)}
                            className="w-full text-[10px] bg-amber-100 text-amber-700 hover:bg-amber-200 font-bold py-0.5 px-1 rounded flex items-center justify-center gap-1 transition-colors"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            {dailyUnassigned.length} Sin Asignar
                          </button>
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-400 font-medium py-0.5">Todo asignado</div>
                      )}

                      {/* Stats */}
                      {showStats && (
                        <div className="bg-slate-100 rounded text-[9px] p-1 text-left grid grid-cols-2 gap-x-1 gap-y-0.5 mt-2">
                          <div className="text-slate-500">Libres:</div>
                          <div className={cn("font-bold text-right", freeRooms === 0 ? "text-red-600" : "text-emerald-600")}>{freeRooms}</div>
                          <div className="text-slate-500">Ocup:</div>
                          <div className="font-bold text-slate-700 text-right">{occRooms}</div>
                          <div className="text-slate-500">Occ %:</div>
                          <div className="font-bold text-indigo-600 text-right">{occPercent}%</div>
                          <div className="text-slate-500">ADR:</div>
                          <div className="font-bold text-slate-700 text-right">${adr}</div>
                        </div>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {filteredUnits.map((unit, unitIndex) => {
              const type = unitTypes.find(t => t.id === unit.unit_type_id);
              const property = properties.find(p => p.id === unit.property_id);
              const unitBookings = bookings.filter(b => b.room_id === unit.id);
              const unitMaintenanceBlocks = maintenanceBlocks.filter(m => m.unit_id === unit.id);
              const isEven = unitIndex % 2 === 0;
              const isOccupiedToday = unitBookings.some(b => startOfDay(parseISO(b.check_in)) <= today && startOfDay(parseISO(b.check_out)) > today);
              const isDirtyCheckout = unit.housekeeping_status === 'dirty' && !isOccupiedToday;
              const isDirtyStay = unit.housekeeping_status === 'dirty' && isOccupiedToday;

              return (
                <tr key={unit.id} className={cn("group relative", isEven ? "bg-white" : "bg-slate-50/30")}>
                  {/* Left Column (Unit Name) */}
                  <td className={cn(
                    "sticky left-0 z-20 border-b border-r border-slate-300 py-1.5 px-2 group-hover:bg-indigo-50/30 transition-colors w-[200px]",
                    isEven ? "bg-white" : "bg-slate-50/90",
                    isDirtyCheckout ? "border-l-4 border-l-orange-500" : isDirtyStay ? "border-l-4 border-l-slate-400" : ""
                  )}>
                    <div className="flex items-center gap-1.5 w-full">
                      <span className="font-black text-slate-800 text-sm whitespace-nowrap">{unit.name}</span>
                      
                      <div className="flex-1 min-w-0 flex items-center gap-1.5 overflow-hidden">
                        <select
                          className={cn(
                            "appearance-none text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase cursor-pointer border focus:outline-none transition-all shadow-sm shrink-0",
                            (!unit.housekeeping_status || unit.housekeeping_status === 'clean') ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            unit.housekeeping_status === 'dirty' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            unit.housekeeping_status === 'cleaning' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-purple-50 text-purple-700 border-purple-200'
                          )}
                          value={unit.housekeeping_status || 'clean'}
                          onChange={(e) => updateUnit({...unit, housekeeping_status: e.target.value as any})}
                          title="Cambiar estado de limpieza"
                        >
                          <option value="clean">✨ L</option>
                          <option value="dirty">🧹 S</option>
                          <option value="cleaning">🧽 LM</option>
                          <option value="inspected">✅ IN</option>
                        </select>
                        <span className="text-[9px] text-slate-500 truncate" title={type?.name}>{type?.name}</span>
                      </div>
                      
                      {isDirtyCheckout && (
                         <span className="text-orange-600 text-[8px] font-black uppercase shrink-0 bg-orange-50 px-1 rounded border border-orange-100" title="Salida">SLD</span>
                      )}
                      {isDirtyStay && (
                         <span className="text-slate-500 text-[8px] font-black uppercase shrink-0 bg-slate-100 px-1 rounded border border-slate-200" title="Estadía">EST</span>
                      )}
                    </div>
                    {currentPropertyId === 'all' && (
                      <div className="text-[9px] text-indigo-600 font-bold truncate mt-0.5">{property?.name}</div>
                    )}
                  </td>
                  
                  {/* Date Cells (Backgrounds & Drop Zones) */}
                  {dates.map((date, i) => {
                    const isToday = date.getTime() === today.getTime();
                    const isWeekEnd = isWeekend(date);
                    
                    return (
                      <td 
                        key={i} 
                        className={cn(
                          "border-b border-r border-slate-300 p-0 relative w-[120px] h-[30px]",
                          isToday ? "bg-indigo-50/20" : isWeekEnd ? "bg-slate-50/50" : "",
                          "hover:bg-slate-100/50 transition-colors cursor-pointer"
                        )}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, unit.id, date)}
                        onDoubleClick={() => onCellDoubleClick && onCellDoubleClick(unit.id, date)}
                      >
                        {/* Las pastillas de toda la fila se renderizan dentro de la primera celda visible para evitar errores de DOM, 
                            ya que HTML no permite <div> como hijo directo de <tr> */}
                        {i === 0 && unitBookings.map(booking => {
                          const checkIn = startOfDay(parseISO(booking.check_in));
                          const checkOut = startOfDay(parseISO(booking.check_out));
                          
                          // Solo renderizar si cae dentro del calendario visible
                          if (checkOut <= visibleStartDate || checkIn >= addDays(calendarEndDate, 1)) {
                            return null; 
                          }

                          return (
                            <BookingPill 
                              key={booking.id}
                              booking={booking} 
                              visibleStartDate={visibleStartDate} 
                              calendarEndDate={calendarEndDate} 
                              onDragStart={(e) => handleDragStart(e, booking)}
                              onDragEnd={handleDragEnd}
                              onDoubleClick={() => onEditBooking(booking)}
                              onResizeStart={(e, edge) => handleResizeStart(e, booking.id, 'booking', edge)}
                            />
                          );
                        })}
                        {i === 0 && unitMaintenanceBlocks.map(block => {
                          const start = startOfDay(parseISO(block.start_date));
                          const end = startOfDay(parseISO(block.end_date));
                          
                          if (end <= visibleStartDate || start >= addDays(calendarEndDate, 1)) {
                            return null;
                          }
                          
                          return (
                            <MaintenancePill
                              key={block.id}
                              block={block}
                              visibleStartDate={visibleStartDate}
                              calendarEndDate={calendarEndDate}
                              onDoubleClick={() => {
                                if (onEditMaintenanceBlock) onEditMaintenanceBlock(block);
                              }}
                              onResizeStart={(e, edge) => handleResizeStart(e, block.id, 'block', edge)}
                            />
                          );
                        })}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Dock (Portapapeles Flotante) */}
      <div 
        onDrop={(e) => {
          e.preventDefault();
          const bookingId = e.dataTransfer.getData('bookingId');
          if (bookingId && !dockedBookingIds.includes(bookingId)) {
            setDockedBookingIds([...dockedBookingIds, bookingId]);
            const b = bookings.find(x => x.id === bookingId);
            if (b && b.room_id) {
              updateBooking({ ...b, room_id: undefined });
            }
            setIsDockExpanded(true); // Auto-expand on drop
          }
        }}
        onDragOver={handleDragOver}
        className={cn(
          "bg-slate-800 text-white flex items-center px-4 overflow-x-auto shadow-[0_-10px_40px_rgba(0,0,0,0.1)] transition-all duration-300 ease-in-out shrink-0 relative",
          dockedBookingIds.length > 0 ? "opacity-100" : "opacity-90 hover:opacity-100",
          isDockExpanded ? "h-24 py-4" : "h-10 py-0"
        )}
      >
        <button 
          onClick={() => setIsDockExpanded(!isDockExpanded)}
          className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-800 text-slate-300 hover:text-white rounded-full p-0.5 shadow-md border border-slate-700 z-10"
        >
          {isDockExpanded ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
          )}
        </button>

        <div className={cn("flex flex-col shrink-0 text-slate-300 transition-all", isDockExpanded ? "w-32 mr-4" : "w-auto mr-6")}>
          <span className="font-bold text-sm text-white flex items-center gap-2">
            Dock 
            {!isDockExpanded && dockedBookingIds.length > 0 && (
              <span className="bg-indigo-600 text-[10px] px-1.5 py-0.5 rounded-full">{dockedBookingIds.length}</span>
            )}
          </span>
          {isDockExpanded && <span className="text-[10px] leading-tight mt-1">Arrastrá reservas acá para moverlas</span>}
        </div>
        
        {isDockExpanded && dockedBookingIds.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-slate-500 text-sm border-2 border-dashed border-slate-600 rounded-xl h-16">
            Soltar reserva aquí
          </div>
        )}

        {isDockExpanded && dockedBookingIds.map(id => {
          const b = bookings.find(x => x.id === id);
          if (!b) return null;
          return (
            <div 
              key={id}
              draggable
              onDragStart={(e) => handleDragStart(e, b)}
              onDragEnd={handleDragEnd}
              className="bg-indigo-600 rounded-lg p-2 h-16 min-w-[150px] shrink-0 cursor-grab active:cursor-grabbing flex flex-col justify-center border border-indigo-500 shadow-sm hover:bg-indigo-500 transition-colors mr-4"
            >
              <div className="font-bold text-xs truncate">{b.first_name} {b.last_name}</div>
              <div className="text-[10px] opacity-80 mt-1 truncate">{format(parseISO(b.check_in), 'dd/MM')} - {format(parseISO(b.check_out), 'dd/MM')}</div>
            </div>
          );
        })}
      </div>
      </div>
      
      {/* Sidebar Dock (Sin Asignar) */}
      {openUnassignedDate && (
        <div className="w-80 bg-white border border-slate-200 shadow-xl rounded-xl flex flex-col shrink-0 animate-in slide-in-from-right-8 duration-200 text-slate-800">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-amber-50 rounded-t-xl">
            <div>
              <h3 className="font-bold text-amber-800 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                Sin Asignar
              </h3>
              <p className="text-xs text-amber-700 mt-0.5">
                {openUnassignedDate === 'all' ? 'Todas las reservas flotantes' : format(parseISO(openUnassignedDate), 'dd/MM/yyyy')}
              </p>
            </div>
            <button 
              onClick={() => setOpenUnassignedDate(null)}
              className="text-amber-700 hover:bg-amber-200/50 p-1.5 rounded-lg transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {(() => {
              const unassigned = openUnassignedDate === 'all'
                ? bookings.filter(b => !b.room_id && b.booking_status !== 'cancelled')
                : (() => {
                    const date = parseISO(openUnassignedDate);
                    return bookings.filter(b => !b.room_id && startOfDay(parseISO(b.check_in)) <= date && startOfDay(parseISO(b.check_out)) > date);
                  })();
              
              if (unassigned.length === 0) {
                return <div className="text-sm text-slate-500 text-center italic mt-4">No hay reservas sin asignar.</div>;
              }

              return unassigned.map(booking => {
                const colorClass = bookingColors[booking.booking_status]?.colorClass || 'bg-slate-500 text-white';
                return (
                  <div 
                    key={booking.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, booking)}
                    onDragEnd={handleDragEnd}
                    onClick={() => onEditBooking(booking)}
                    className="bg-white border-2 border-slate-200 rounded-lg p-3 cursor-grab hover:border-amber-400 hover:shadow-md transition-all group"
                  >
                    <div className="font-black text-xs text-slate-800 mb-1 group-hover:text-amber-700 transition-colors">{booking.first_name} {booking.last_name}</div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-500">
                        {format(parseISO(booking.check_in), 'dd/MM')} - {format(parseISO(booking.check_out), 'dd/MM')}
                      </span>
                      <span className="font-bold text-emerald-600">${booking.total_amount || 0}</span>
                    </div>
                    {booking.notes && (
                      <div className="text-[10px] text-slate-500 italic mt-1.5 line-clamp-2 bg-slate-50 p-1.5 rounded">
                        "{booking.notes}"
                      </div>
                    )}
                    <div className="mt-2 flex items-center justify-between">
                      <div className={cn("text-[9px] uppercase font-bold px-2 py-0.5 rounded-full", colorClass)}>
                        {bookingColors[booking.booking_status]?.label}
                      </div>
                      <span className="text-[9px] text-slate-400 font-bold group-hover:text-amber-500">Arrastrar al mapa</span>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

function BookingPill({ booking, visibleStartDate, calendarEndDate, onDragStart, onDragEnd, onDoubleClick, onResizeStart }: { booking: Booking, visibleStartDate: Date, calendarEndDate: Date, onDragStart: (e: React.DragEvent) => void, onDragEnd: (e: React.DragEvent) => void, onDoubleClick: () => void, onResizeStart?: (e: React.DragEvent, edge: 'start'|'end') => void }) {
  const { unitTypes, bookingColors, updateBooking } = usePMS();
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceInput, setPriceInput] = useState('');

  const checkIn = startOfDay(parseISO(booking.check_in));
  const checkOut = startOfDay(parseISO(booking.check_out));
  
  const isCutStart = checkIn < visibleStartDate;
  const isCutEnd = checkOut > calendarEndDate;

  const effectiveStart = isCutStart ? visibleStartDate : checkIn;
  const effectiveEnd = isCutEnd ? calendarEndDate : checkOut;
  
  const startIndex = differenceInDays(effectiveStart, visibleStartDate);
  const endIndex = differenceInDays(effectiveEnd, visibleStartDate);
  
  const startOffsetPercent = isCutStart ? 0 : 60;
  const endAbsolutePercent = isCutEnd 
    ? (endIndex + 1) * 100 
    : endIndex * 100 + 40;
  const startAbsolutePercent = startIndex * 100 + startOffsetPercent;
  const widthPercent = endAbsolutePercent - startAbsolutePercent;
  
  const colorClass = bookingColors[booking.booking_status]?.colorClass || 'bg-slate-500 hover:bg-slate-600';
  const leftPx = (startAbsolutePercent / 100) * 120;
  const widthPx = (widthPercent / 100) * 120;
  const bookedUnitType = unitTypes.find(ut => ut.id === booking.unit_type_id);

  const handleConfirmPrice = (e: React.MouseEvent) => {
    e.stopPropagation();
    const val = parseFloat(priceInput);
    if (!isNaN(val) && val >= 0) {
      updateBooking({ ...booking, total_amount: val });
    }
    setEditingPrice(false);
  };

  const handleStartEditPrice = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPriceInput(String(booking.total_amount || 0));
    setEditingPrice(true);
  };

  return (
    <div 
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick();
      }}
      style={{ left: `${leftPx}px`, width: `${widthPx}px` }}
      className={cn(
        "absolute top-[2px] bottom-[2px] z-10 text-white shadow-sm flex items-center px-1.5 cursor-grab active:cursor-grabbing transition-colors group/pill hover:z-[60]",
        colorClass,
        isCutStart ? "rounded-r border-l-2 border-dashed border-white/50" : "rounded",
        isCutEnd ? "rounded-l border-r-2 border-dashed border-white/50" : ""
      )}
    >
      {!isCutStart && (
        <div 
          draggable
          onDragStart={(e) => { e.stopPropagation(); onResizeStart?.(e, 'start'); }}
          className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-black/20" 
        />
      )}
      {!isCutEnd && (
        <div 
          draggable
          onDragStart={(e) => { e.stopPropagation(); onResizeStart?.(e, 'end'); }}
          className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-black/20" 
        />
      )}
      <span className="text-[11px] font-semibold truncate select-none flex-1">
        {booking.first_name} {booking.last_name}
      </span>
      <span className="ml-2 text-[9px] font-bold opacity-90 whitespace-nowrap overflow-hidden text-ellipsis max-w-[80px]">
        {format(checkIn, 'dd/MM')} &rarr; {format(checkOut, 'dd/MM')}
      </span>

      {/* Hover Tooltip */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-60 bg-slate-800 text-white text-xs p-3 rounded-lg shadow-xl opacity-0 group-hover/pill:opacity-100 transition-opacity pointer-events-auto z-[100] flex flex-col gap-1">
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-800"></div>
        
        <div className="font-bold text-sm border-b border-slate-700 pb-1 mb-1">{booking.first_name} {booking.last_name}</div>
        <div className="text-slate-300 mt-1">🗓️ {format(checkIn, 'dd/MM/yyyy')} - {format(checkOut, 'dd/MM/yyyy')}</div>
        {bookedUnitType && <div className="text-slate-300">🛏️ {bookedUnitType.name}</div>}
        
        {/* Tarifa editable */}
        <div className="flex justify-between items-center mt-1 border-t border-slate-700 pt-1.5">
          <span className="text-slate-400">Tarifa:</span>
          {editingPrice ? (
            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
              <span className="text-slate-400 text-[10px]">$</span>
              <input
                autoFocus
                type="number"
                min="0"
                value={priceInput}
                onChange={e => setPriceInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleConfirmPrice(e as any); if (e.key === 'Escape') setEditingPrice(false); }}
                className="w-16 bg-slate-700 border border-indigo-400 rounded px-1 py-0.5 text-white text-xs text-right focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
              <button
                onClick={handleConfirmPrice}
                className="w-5 h-5 flex items-center justify-center bg-emerald-500 hover:bg-emerald-400 rounded text-white font-black text-[10px] transition-colors"
                title="Confirmar"
              >
                ✓
              </button>
            </div>
          ) : (
            <button
              onClick={handleStartEditPrice}
              className="text-emerald-400 font-bold hover:text-emerald-300 hover:underline transition-colors cursor-pointer"
              title="Click para editar tarifa"
            >
              ${booking.total_amount || 0} ✎
            </button>
          )}
        </div>

        {booking.notes && (
          <div className="mt-1 pt-1 border-t border-slate-700">
            <span className="text-slate-400 block mb-0.5 text-[10px] uppercase">Nota:</span>
            <div className="text-slate-300 italic text-[11px]">"{booking.notes}"</div>
          </div>
        )}
        
        <div className="text-indigo-300 font-semibold mt-1 uppercase text-[10px]">{bookingColors[booking.booking_status]?.label}</div>
      </div>
    </div>
  );
}

function MaintenancePill({ block, visibleStartDate, calendarEndDate, onDoubleClick, onResizeStart }: { block: any, visibleStartDate: Date, calendarEndDate: Date, onDoubleClick: () => void, onResizeStart?: (e: React.DragEvent, edge: 'start'|'end') => void }) {
  const start = startOfDay(parseISO(block.start_date));
  const end = startOfDay(parseISO(block.end_date));
  
  const isCutStart = start < visibleStartDate;
  const isCutEnd = end > calendarEndDate;

  const effectiveStart = isCutStart ? visibleStartDate : start;
  const effectiveEnd = isCutEnd ? calendarEndDate : end;
  
  const startIndex = differenceInDays(effectiveStart, visibleStartDate);
  const endIndex = differenceInDays(effectiveEnd, visibleStartDate);
  
  const startOffsetPercent = isCutStart ? 0 : 60;
  
  const endAbsolutePercent = isCutEnd 
    ? (endIndex + 1) * 100 
    : endIndex * 100 + 40;
    
  const startAbsolutePercent = startIndex * 100 + startOffsetPercent;
  const widthPercent = endAbsolutePercent - startAbsolutePercent;
  
  // OOO = Red stripes, OOS = Orange stripes
  const colorClass = block.type === 'out_of_order' 
    ? 'bg-[repeating-linear-gradient(45deg,#ef4444,#ef4444_10px,#dc2626_10px,#dc2626_20px)] border-red-700' 
    : 'bg-[repeating-linear-gradient(45deg,#f59e0b,#f59e0b_10px,#d97706_10px,#d97706_20px)] border-amber-600';

  const leftPx = (startAbsolutePercent / 100) * 120;
  const widthPx = (widthPercent / 100) * 120;

  return (
    <div 
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick();
      }}
      style={{ left: `${leftPx}px`, width: `${widthPx}px` }}
      className={cn(
        "absolute top-[2px] bottom-[2px] z-10 text-white shadow-sm flex items-center px-1.5 cursor-pointer transition-colors group/pill hover:z-[60] border",
        colorClass,
        isCutStart ? "rounded-r border-l-2 border-dashed border-white/50" : "rounded",
        isCutEnd ? "rounded-l border-r-2 border-dashed border-white/50" : ""
      )}
    >
      {!isCutStart && (
        <div 
          draggable
          onDragStart={(e) => { e.stopPropagation(); onResizeStart?.(e, 'start'); }}
          className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-black/20" 
        />
      )}
      {!isCutEnd && (
        <div 
          draggable
          onDragStart={(e) => { e.stopPropagation(); onResizeStart?.(e, 'end'); }}
          className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-black/20" 
        />
      )}
      <span className="text-[11px] font-bold uppercase truncate select-none flex-1 drop-shadow-md">
        {block.type === 'out_of_order' ? 'OOO' : 'OOS'}
      </span>
      <span className="ml-2 text-[9px] font-bold opacity-90 whitespace-nowrap overflow-hidden text-ellipsis drop-shadow-md max-w-[80px]">
        {format(start, 'dd/MM')} &rarr; {format(end, 'dd/MM')}
      </span>

      {/* Hover Tooltip */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 bg-slate-800 text-white text-xs p-3 rounded-lg shadow-xl opacity-0 group-hover/pill:opacity-100 transition-opacity pointer-events-none z-[100] flex flex-col gap-1">
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-800"></div>
        <div className="font-bold text-sm border-b border-slate-700 pb-1 mb-1 text-center uppercase text-amber-400">
          {block.type === 'out_of_order' ? 'Fuera de Orden' : 'Fuera de Servicio'}
        </div>
        <div className="text-slate-300 mt-1 text-center">🗓️ {format(start, 'dd/MM/yyyy')} - {format(end, 'dd/MM/yyyy')}</div>
        {block.reason && (
          <div className="mt-2 pt-2 border-t border-slate-700">
            <span className="text-slate-400 block mb-0.5 text-[10px] uppercase">Motivo:</span>
            <div className="text-slate-300 italic text-[11px]">"{block.reason}"</div>
          </div>
        )}
      </div>
    </div>
  );
}
