'use client';

import { useState } from 'react';
import { Roomrack } from '@/components/roomrack/Roomrack';
import { Hexagon, Bell, Search, Settings, CalendarRange, LayoutDashboard, Calendar as CalendarIcon, ChevronLeft, ChevronRight, CircleDollarSign, BookOpen, BarChart3, Target, Users } from 'lucide-react';
import Link from 'next/link';
import { subDays, addDays, format, parseISO } from 'date-fns';
import { Modal } from '@/components/ui/Modal';
import { BookingForm } from '@/components/bookings/BookingForm';
import { MaintenanceBlockForm } from '@/components/inventory/MaintenanceBlockForm';
import { Booking } from '@/types';

import { TopBar } from '../../components/layout/TopBar';
export default function RoomrackPage() {
  const [startDate, setStartDate] = useState<Date>(() => subDays(new Date(), 3));
  const [daysToView, setDaysToView] = useState<number>(15);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);

  // Estados para bloqueos y selección rápida
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [editingMaintenanceBlock, setEditingMaintenanceBlock] = useState<any>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{unitId: string, date: Date} | null>(null);

  const handleOpenNewBooking = () => {
    setEditingBooking(null);
    setSelectedCell(null);
    setIsBookingModalOpen(true);
  };

  const handleEditBooking = (booking: Booking) => {
    setEditingBooking(booking);
    setIsBookingModalOpen(true);
  };

  const handleEditMaintenanceBlock = (block: any) => {
    setEditingMaintenanceBlock(block);
    setIsMaintenanceModalOpen(true);
  };

  const handleCellDoubleClick = (unitId: string, date: Date) => {
    setSelectedCell({ unitId, date });
    setIsActionModalOpen(true);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      setStartDate(parseISO(e.target.value));
    }
  };

  const shiftDates = (days: number) => {
    setStartDate(prev => addDays(prev, days));
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100 overflow-hidden">
      {/* Top Navigation */}
      <TopBar />

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col p-6">
        <div className="mb-6 shrink-0 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Roomrack</h2>
            <p className="text-slate-500 text-sm mt-1">Control de disponibilidad y asignación de habitaciones.</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Controles de Fecha */}
            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
              <button 
                onClick={() => shiftDates(-7)}
                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                title="-1 Semana"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-2 px-2 border-x border-slate-100">
                <CalendarIcon className="w-4 h-4 text-slate-400" />
                <input 
                  type="date" 
                  value={format(startDate, 'yyyy-MM-dd')}
                  onChange={handleDateChange}
                  className="text-sm font-medium text-slate-700 bg-transparent focus:outline-none cursor-pointer"
                />
              </div>

              <button 
                onClick={() => shiftDates(7)}
                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                title="+1 Semana"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Selector de Rango */}
            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 shadow-sm text-sm font-medium">
              <button 
                onClick={() => setDaysToView(15)}
                className={`px-3 py-1.5 rounded transition-colors ${daysToView === 15 ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
              >
                15D
              </button>
              <button 
                onClick={() => setDaysToView(30)}
                className={`px-3 py-1.5 rounded transition-colors ${daysToView === 30 ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
              >
                30D
              </button>
              <button 
                onClick={() => setDaysToView(60)}
                className={`px-3 py-1.5 rounded transition-colors ${daysToView === 60 ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
              >
                60D
              </button>
            </div>

            <button 
              onClick={handleOpenNewBooking}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors active:scale-95 ml-2"
            >
              + Nueva Reserva
            </button>
          </div>
        </div>

        {/* Roomrack Container */}
        <div className="flex-1 overflow-hidden relative">
          <Roomrack 
            startDate={startDate} 
            daysToView={daysToView} 
            onEditBooking={handleEditBooking} 
            onCellDoubleClick={handleCellDoubleClick} 
            onEditMaintenanceBlock={handleEditMaintenanceBlock}
          />
        </div>
      </main>

      <Modal 
        isOpen={isBookingModalOpen} 
        onClose={() => setIsBookingModalOpen(false)}
        title={editingBooking ? "Editar Reserva" : "Crear Nueva Reserva"}
      >
        <BookingForm 
          initialBooking={editingBooking}
          onSuccess={() => setIsBookingModalOpen(false)} 
          onCancel={() => setIsBookingModalOpen(false)} 
        />
      </Modal>

      <Modal
        isOpen={isMaintenanceModalOpen}
        onClose={() => { setIsMaintenanceModalOpen(false); setEditingMaintenanceBlock(null); }}
        title={editingMaintenanceBlock ? "Editar Bloqueo" : "Bloquear Habitación (Mantenimiento)"}
      >
        <MaintenanceBlockForm
          initialBlock={editingMaintenanceBlock}
          initialUnitId={selectedCell?.unitId}
          initialDate={selectedCell?.date}
          onSuccess={() => { setIsMaintenanceModalOpen(false); setEditingMaintenanceBlock(null); }}
          onCancel={() => { setIsMaintenanceModalOpen(false); setEditingMaintenanceBlock(null); }}
        />
      </Modal>

      <Modal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        title="¿Qué deseas crear?"
      >
        <div className="flex flex-col gap-4 p-4">
          <button
            onClick={() => {
              setIsActionModalOpen(false);
              setIsBookingModalOpen(true);
            }}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
          >
            Nueva Reserva
          </button>
          <button
            onClick={() => {
              setIsActionModalOpen(false);
              setEditingMaintenanceBlock(null);
              setIsMaintenanceModalOpen(true);
            }}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
          >
            Bloquear Habitación (OOO / OOS)
          </button>
        </div>
      </Modal>
    </div>
  );
}
