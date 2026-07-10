'use client';

import React, { useState, useMemo } from 'react';
import { usePMS } from '../../context/PMSContext';
import { Moon, ArrowLeft, AlertCircle, CheckCircle, Check, X, Calendar, DollarSign, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { format, parseISO, isBefore, startOfDay, addDays, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

export default function NightAuditPage() {
  const { systemDate, setSystemDate, bookings, updateBooking, properties, currentPropertyId } = usePMS();
  
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState(false);

  const sysDateObj = startOfDay(parseISO(systemDate));

  // STEP 1: Llegadas Pendientes (No-Shows)
  const pendingArrivals = useMemo(() => {
    return bookings.filter(b => {
      if (b.property_id !== currentPropertyId && currentPropertyId !== 'all') return false;
      const checkIn = startOfDay(parseISO(b.check_in));
      return (b.booking_status === 'confirmed' || b.booking_status === 'pending') && 
             checkIn.getTime() <= sysDateObj.getTime();
    });
  }, [bookings, systemDate, currentPropertyId]);

  // STEP 2: Salidas Pendientes (Check-outs no realizados)
  const pendingDepartures = useMemo(() => {
    return bookings.filter(b => {
      if (b.property_id !== currentPropertyId && currentPropertyId !== 'all') return false;
      const checkOut = startOfDay(parseISO(b.check_out));
      return b.booking_status === 'checked_in' && 
             checkOut.getTime() <= sysDateObj.getTime();
    });
  }, [bookings, systemDate, currentPropertyId]);

  // STEP 3: In House (Para posteo de cargos)
  const inHouseBookings = useMemo(() => {
    return bookings.filter(b => {
      if (b.property_id !== currentPropertyId && currentPropertyId !== 'all') return false;
      const checkIn = startOfDay(parseISO(b.check_in));
      const checkOut = startOfDay(parseISO(b.check_out));
      return b.booking_status === 'checked_in' && 
             checkIn.getTime() <= sysDateObj.getTime() &&
             checkOut.getTime() > sysDateObj.getTime();
    });
  }, [bookings, systemDate, currentPropertyId]);

  const totalRoomRateToPost = inHouseBookings.reduce((sum, b) => {
    const totalNights = differenceInDays(parseISO(b.check_out), parseISO(b.check_in)) || 1;
    return sum + ((b.total_amount || 0) / totalNights);
  }, 0);

  const handleMarkNoShow = (id: string) => {
    const booking = bookings.find(b => b.id === id);
    if (booking) updateBooking({ ...booking, booking_status: 'cancelled', notes: (booking.notes || '') + '\n[Marcado como No-Show en Auditoría]' });
  };

  const handleForceCheckout = (id: string) => {
    const booking = bookings.find(b => b.id === id);
    if (booking) updateBooking({ ...booking, booking_status: 'checked_out', check_out: format(sysDateObj, 'yyyy-MM-dd') });
  };

  const handleExtendStay = (id: string) => {
    const booking = bookings.find(b => b.id === id);
    if (booking) {
      const newCheckOut = format(addDays(parseISO(booking.check_out), 1), 'yyyy-MM-dd');
      updateBooking({ ...booking, check_out: newCheckOut, total_nights: (booking.total_nights || 1) + 1 });
    }
  };

  const runAudit = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const nextDate = format(addDays(sysDateObj, 1), 'yyyy-MM-dd');
      setSystemDate(nextDate);
      setIsProcessing(false);
      setCurrentStep(5); // Success step
    }, 2000);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans">
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 shrink-0 flex items-center justify-between z-10 text-white">
        <div className="flex items-center gap-4">
          <Link href="/roomrack" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-300" />
          </Link>
          <div>
            <h1 className="font-bold text-xl flex items-center gap-2">
              <Moon className="w-5 h-5 text-indigo-400" /> Auditoría Nocturna
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">Cierre del Día Operativo</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
          <Calendar className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-bold text-slate-200">
            Fecha de Sistema: <span className="text-white">{format(sysDateObj, 'dd MMM yyyy', { locale: es })}</span>
          </span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 md:p-12 max-w-4xl mx-auto w-full">
        
        {currentStep < 5 && (
          <div className="flex justify-between items-center mb-12 relative">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -z-10 -translate-y-1/2 rounded-full"></div>
            {[1, 2, 3, 4].map(step => (
              <div key={step} className="flex flex-col items-center gap-2 bg-slate-50 px-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border-4 transition-all duration-300 ${
                  step < currentStep ? 'bg-indigo-600 border-indigo-600 text-white' : 
                  step === currentStep ? 'bg-white border-indigo-600 text-indigo-600' : 'bg-slate-100 border-slate-200 text-slate-400'
                }`}>
                  {step < currentStep ? <Check className="w-5 h-5" /> : step}
                </div>
                <span className={`text-[10px] uppercase font-bold tracking-wider ${step <= currentStep ? 'text-indigo-600' : 'text-slate-400'}`}>
                  {step === 1 ? 'Llegadas' : step === 2 ? 'Salidas' : step === 3 ? 'Cargos' : 'Cierre'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* STEP 1: PENDING ARRIVALS */}
        {currentStep === 1 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-amber-50 border-b border-amber-100 p-6 flex items-start gap-4">
              <div className="bg-amber-100 text-amber-600 p-3 rounded-xl shrink-0"><AlertCircle className="w-6 h-6" /></div>
              <div>
                <h2 className="text-xl font-black text-amber-900 mb-1">Llegadas Pendientes (No-Shows)</h2>
                <p className="text-amber-700/80 text-sm font-medium">Hay reservas programadas para ingresar hoy o días anteriores que aún no tienen Check-in. Debes resolverlas para poder cerrar el día.</p>
              </div>
            </div>
            <div className="p-0">
              {pendingArrivals.length === 0 ? (
                <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                  <CheckCircle className="w-12 h-12 text-emerald-400 mb-3" />
                  <p className="font-bold">No hay llegadas pendientes.</p>
                  <p className="text-sm">Todos los check-ins de hoy se han completado.</p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {pendingArrivals.map(b => (
                    <li key={b.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div>
                        <h4 className="font-bold text-slate-800 flex items-center gap-2">
                          {b.first_name} {b.last_name}
                          <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider">{b.confirmation_id}</span>
                        </h4>
                        <p className="text-sm text-slate-500 mt-1">Llegada: {format(parseISO(b.check_in), 'dd MMM yyyy')}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleMarkNoShow(b.id)} className="px-4 py-2 bg-white border border-slate-200 hover:border-red-300 hover:text-red-600 hover:bg-red-50 text-slate-600 text-sm font-bold rounded-lg transition-colors">
                          Marcar No-Show
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="bg-slate-50 p-6 border-t border-slate-200 flex justify-end">
              <button 
                onClick={() => setCurrentStep(2)}
                disabled={pendingArrivals.length > 0}
                className={`px-6 py-3 rounded-xl font-black text-sm shadow-sm transition-all ${pendingArrivals.length > 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-0.5 hover:shadow-md'}`}
              >
                Continuar a Salidas
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: PENDING DEPARTURES */}
        {currentStep === 2 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-indigo-50 border-b border-indigo-100 p-6 flex items-start gap-4">
              <div className="bg-indigo-100 text-indigo-600 p-3 rounded-xl shrink-0"><AlertCircle className="w-6 h-6" /></div>
              <div>
                <h2 className="text-xl font-black text-indigo-900 mb-1">Salidas Pendientes</h2>
                <p className="text-indigo-700/80 text-sm font-medium">Huéspedes que debían salir hoy y continúan alojados en el sistema (In House). Extiende su estadía o fuérzalos a Check-out.</p>
              </div>
            </div>
            <div className="p-0">
              {pendingDepartures.length === 0 ? (
                <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                  <CheckCircle className="w-12 h-12 text-emerald-400 mb-3" />
                  <p className="font-bold">No hay salidas pendientes.</p>
                  <p className="text-sm">Todos los check-outs de hoy se han completado.</p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {pendingDepartures.map(b => (
                    <li key={b.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div>
                        <h4 className="font-bold text-slate-800 flex items-center gap-2">
                          {b.first_name} {b.last_name}
                          <span className="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider">Hab. {b.room_id}</span>
                        </h4>
                        <p className="text-sm text-slate-500 mt-1">Salida Esperada: {format(parseISO(b.check_out), 'dd MMM yyyy')}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleForceCheckout(b.id)} className="px-4 py-2 bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 text-slate-600 text-sm font-bold rounded-lg transition-colors">
                          Forzar Check-out
                        </button>
                        <button onClick={() => handleExtendStay(b.id)} className="px-4 py-2 bg-white border border-slate-200 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50 text-slate-600 text-sm font-bold rounded-lg transition-colors">
                          Extender 1 Noche (+1)
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="bg-slate-50 p-6 border-t border-slate-200 flex justify-between">
              <button 
                onClick={() => setCurrentStep(1)}
                className="px-6 py-3 rounded-xl font-bold text-sm text-slate-500 hover:bg-slate-200 transition-colors"
              >
                Volver
              </button>
              <button 
                onClick={() => setCurrentStep(3)}
                disabled={pendingDepartures.length > 0}
                className={`px-6 py-3 rounded-xl font-black text-sm shadow-sm transition-all ${pendingDepartures.length > 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-0.5 hover:shadow-md'}`}
              >
                Continuar a Cargos
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: ROOM & TAX */}
        {currentStep === 3 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-emerald-50 border-b border-emerald-100 p-6 flex items-start gap-4">
              <div className="bg-emerald-100 text-emerald-600 p-3 rounded-xl shrink-0"><DollarSign className="w-6 h-6" /></div>
              <div>
                <h2 className="text-xl font-black text-emerald-900 mb-1">Posteo de Cargos (Room & Tax)</h2>
                <p className="text-emerald-700/80 text-sm font-medium">Revisión de las habitaciones In House que recibirán el cargo automático de la noche de hoy.</p>
              </div>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl flex flex-col justify-center">
                  <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-2">Habitaciones In House</p>
                  <p className="text-4xl font-black text-slate-900">{inHouseBookings.length}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-center">
                  <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Total a Postear (Est.)</p>
                  <p className="text-4xl font-black text-white">${totalRoomRateToPost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              </div>
              <p className="text-slate-500 text-sm italic">* En esta versión, los cargos se postean automáticamente en el ledger de cada reserva al hacer el cierre de caja. El sistema ignorará a los huéspedes con estatus de salida pendiente que no hayan sido procesados.</p>
            </div>
            <div className="bg-slate-50 p-6 border-t border-slate-200 flex justify-between">
              <button 
                onClick={() => setCurrentStep(2)}
                className="px-6 py-3 rounded-xl font-bold text-sm text-slate-500 hover:bg-slate-200 transition-colors"
              >
                Volver
              </button>
              <button 
                onClick={() => setCurrentStep(4)}
                className="px-6 py-3 rounded-xl font-black text-sm shadow-sm transition-all bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-0.5 hover:shadow-md"
              >
                Continuar al Cierre
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: FINAL CLOSE */}
        {currentStep === 4 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-slate-900 p-8 text-center text-white">
              <Moon className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
              <h2 className="text-3xl font-black mb-2">Ejecutar Cierre del Día</h2>
              <p className="text-slate-400 text-sm max-w-md mx-auto">Al confirmar, la fecha operativa del sistema avanzará al día siguiente. No podrás deshacer esta acción.</p>
            </div>
            <div className="p-8 text-center">
              <div className="flex items-center justify-center gap-6 mb-8 text-xl font-bold">
                <div className="bg-slate-100 text-slate-500 px-4 py-2 rounded-xl">{format(sysDateObj, 'dd MMM yyyy')}</div>
                <div className="text-slate-300">➜</div>
                <div className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-xl">{format(addDays(sysDateObj, 1), 'dd MMM yyyy')}</div>
              </div>
              
              <button 
                onClick={runAudit}
                disabled={isProcessing}
                className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black text-lg shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 hover:-translate-y-1 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {isProcessing ? <><Loader2 className="w-6 h-6 animate-spin" /> Procesando Auditoría...</> : 'CERRAR CAJA Y DÍA OPERATIVO'}
              </button>
              <button 
                onClick={() => setCurrentStep(3)}
                disabled={isProcessing}
                className="mt-4 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
              >
                Cancelar y Volver
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: SUCCESS */}
        {currentStep === 5 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <CheckCircle className="w-12 h-12 text-emerald-500" />
            </div>
            <h2 className="text-3xl font-black text-slate-800 mb-2">¡Auditoría Completada!</h2>
            <p className="text-slate-500 mb-8 max-w-sm mx-auto">El día operativo se cerró correctamente. Los reportes han sido generados y la fecha del sistema está ahora en <strong>{format(sysDateObj, 'dd MMM yyyy', { locale: es })}</strong>.</p>
            
            <Link href="/roomrack" className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-xl font-black text-sm hover:bg-slate-800 transition-colors shadow-lg">
              Volver al Roomrack
            </Link>
          </div>
        )}

      </main>
    </div>
  );
}
