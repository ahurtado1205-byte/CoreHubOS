import React, { useState, useEffect } from 'react';
import { Target, Check, AlertCircle, RefreshCw, LogIn, LogOut, DollarSign } from 'lucide-react';

// Interfaces
export interface Reservation {
  id: string;
  guestName: string;
  checkInDate: string;
  checkOutDate: string;
  roomId: string;
  status: 'pending' | 'in_house' | 'checked_out';
  pendingBalance: number;
}

export interface Room {
  id: string;
  number: string;
  type: string;
  status: 'clean' | 'occupied' | 'dirty';
}

interface TodayArrivalsDeparturesProps {
  // En producción, estas funciones pueden pasar el db/firestore de Firebase
  firestoreDb?: any; 
  onStateChange?: () => void;
}

// Simulador de Firebase Transactions / Firestore (para aislamiento y fácil conexión a producción)
const runMockFirestoreTransaction = async (
  updateFn: (transaction: any) => Promise<void>
): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        const mockTransaction = {
          get: async (ref: any) => ({ data: () => ({}) }),
          update: (ref: any, data: any) => {},
          set: (ref: any, data: any) => {},
        };
        await updateFn(mockTransaction);
        resolve();
      } catch (error) {
        reject(error);
      }
    }, 800);
  });
};

export default function TodayArrivalsDepartures({ firestoreDb, onStateChange }: TodayArrivalsDeparturesProps) {
  // Estados mock para visualización reactiva inmediata
  const [reservations, setReservations] = useState<Reservation[]>([
    { id: 'res_1', guestName: 'Alejandro Hurtado', checkInDate: '2026-07-14', checkOutDate: '2026-07-18', roomId: 'room_101', status: 'pending', pendingBalance: 0 },
    { id: 'res_2', guestName: 'Martina Rossi', checkInDate: '2026-07-10', checkOutDate: '2026-07-14', roomId: 'room_102', status: 'in_house', pendingBalance: 150 },
    { id: 'res_3', guestName: 'John Doe', checkInDate: '2026-07-14', checkOutDate: '2026-07-20', roomId: 'room_103', status: 'pending', pendingBalance: 80 },
    { id: 'res_4', guestName: 'Sofía Valenzuela', checkInDate: '2026-07-09', checkOutDate: '2026-07-14', roomId: 'room_104', status: 'in_house', pendingBalance: 0 }
  ]);

  const [rooms, setRooms] = useState<Room[]>([
    { id: 'room_101', number: '101', type: 'Doble Estándar', status: 'clean' },
    { id: 'room_102', number: '102', type: 'Suite Ejecutiva', status: 'occupied' },
    { id: 'room_103', number: '103', type: 'Doble Estándar', status: 'clean' },
    { id: 'room_104', number: '104', type: 'Triple Premium', status: 'occupied' }
  ]);

  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Aislamiento para pasarela de pagos futura
  const processPendingPayment = async (reservationId: string, amount: number): Promise<boolean> => {
    /* 
      ========================================================
      CONECTOR PASARELA DE PAGOS REAL (A FUTURO)
      ========================================================
      Ejemplo:
      const response = await stripe.paymentIntents.create({
        amount: amount * 100,
        currency: 'usd',
        payment_method: selectedPaymentMethodId,
        confirm: true
      });
      return response.status === 'succeeded';
    */
    console.log(`[MOCK PAYMENT] Procesando pago de $${amount} para la reserva ${reservationId}...`);
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`[MOCK PAYMENT] Pago aprobado con éxito para la reserva ${reservationId}`);
        resolve(true);
      }, 1500);
    });
  };

  // CHECK-IN: Transacción Atómica
  const handleCheckIn = async (reservationId: string, roomId: string) => {
    setLoadingId(reservationId);
    setAlertMessage(null);
    try {
      if (firestoreDb) {
        // Lógica de Producción Firebase Firestore
        // import { doc, runTransaction } from "firebase/firestore";
        // await runTransaction(firestoreDb, async (transaction) => {
        //   const resRef = doc(firestoreDb, "reservations", reservationId);
        //   const roomRef = doc(firestoreDb, "rooms", roomId);
        //   transaction.update(resRef, { status: 'in_house' });
        //   transaction.update(roomRef, { status: 'occupied' });
        // });
      } else {
        // Lógica de desarrollo local aislada con simulación transaccional
        await runMockFirestoreTransaction(async (transaction) => {
          setReservations(prev => prev.map(r => r.id === reservationId ? { ...r, status: 'in_house' } : r));
          setRooms(prev => prev.map(rm => rm.id === roomId ? { ...rm, status: 'occupied' } : rm));
        });
      }
      setAlertMessage({ type: 'success', text: 'Check-in realizado exitosamente. Habitación ocupada.' });
      if (onStateChange) onStateChange();
    } catch (error: any) {
      console.error("Error en Check-in Transaccional:", error);
      setAlertMessage({ type: 'error', text: `Error en Check-in: ${error.message || 'Error del servidor'}` });
    } finally {
      setLoadingId(null);
    }
  };

  // CHECK-OUT: Validación Estricta de Saldo y Transacción Atómica
  const handleCheckOut = async (reservation: Reservation) => {
    setLoadingId(reservation.id);
    setAlertMessage(null);
    try {
      // Validación Estricta de Saldo Pendiente
      if (reservation.pendingBalance > 0) {
        setAlertMessage({ 
          type: 'error', 
          text: `Check-out bloqueado: La reserva tiene un saldo pendiente de $${reservation.pendingBalance}. Procesa el pago primero.` 
        });
        setLoadingId(null);
        return;
      }

      if (firestoreDb) {
        // Lógica de Producción Firebase Firestore
        // import { doc, runTransaction } from "firebase/firestore";
        // await runTransaction(firestoreDb, async (transaction) => {
        //   const resRef = doc(firestoreDb, "reservations", reservation.id);
        //   const roomRef = doc(firestoreDb, "rooms", reservation.roomId);
        //   transaction.update(resRef, { status: 'checked_out' });
        //   transaction.update(roomRef, { status: 'dirty' });
        // });
      } else {
        // Lógica de desarrollo local aislada con simulación transaccional
        await runMockFirestoreTransaction(async (transaction) => {
          setReservations(prev => prev.map(r => r.id === reservation.id ? { ...r, status: 'checked_out' } : r));
          setRooms(prev => prev.map(rm => rm.id === reservation.roomId ? { ...rm, status: 'dirty' } : rm));
        });
      }
      setAlertMessage({ type: 'success', text: 'Check-out realizado exitosamente. Habitación marcada como sucia (dirty).' });
      if (onStateChange) onStateChange();
    } catch (error: any) {
      console.error("Error en Check-out Transaccional:", error);
      setAlertMessage({ type: 'error', text: `Error en Check-out: ${error.message || 'Error del servidor'}` });
    } finally {
      setLoadingId(null);
    }
  };

  // Acción para pagar el saldo pendiente (Mock pasarela)
  const handleProcessPayment = async (reservationId: string, amount: number) => {
    setLoadingId(reservationId);
    setAlertMessage(null);
    try {
      const paymentSuccess = await processPendingPayment(reservationId, amount);
      if (paymentSuccess) {
        setReservations(prev => prev.map(r => r.id === reservationId ? { ...r, pendingBalance: 0 } : r));
        setAlertMessage({ type: 'success', text: `Pago de $${amount} procesado correctamente. Saldo saldado.` });
      } else {
        setAlertMessage({ type: 'error', text: 'Error al procesar el pago en la pasarela.' });
      }
    } catch (error: any) {
      setAlertMessage({ type: 'error', text: `Error de pago: ${error.message}` });
    } finally {
      setLoadingId(null);
    }
  };

  const todayStr = '2026-07-14'; // Fecha fija simulada de hoy en base a metadatos locales
  const arrivals = reservations.filter(r => r.checkInDate === todayStr && r.status === 'pending');
  const departures = reservations.filter(r => r.checkOutDate === todayStr && r.status === 'in_house');

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      
      {/* Mensajes de Alerta */}
      {alertMessage && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 animate-in fade-in duration-200 ${
          alertMessage.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {alertMessage.type === 'success' ? (
            <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <span className="text-sm font-bold">{alertMessage.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* PANEL DE LLEGADAS DE HOY */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 bg-indigo-50/40 flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-slate-800 flex items-center gap-2">
                <LogIn className="w-5 h-5 text-indigo-600" /> Llegadas de Hoy (Check-in)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Huéspedes programados para ingresar hoy</p>
            </div>
            <span className="bg-indigo-100 text-indigo-800 text-xs font-black px-2.5 py-1 rounded-full">
              {arrivals.length}
            </span>
          </div>

          <div className="p-4 flex-1 divide-y divide-slate-100">
            {arrivals.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm font-medium">
                No hay check-ins pendientes para hoy.
              </div>
            ) : (
              arrivals.map(res => {
                const room = rooms.find(rm => rm.id === res.roomId);
                return (
                  <div key={res.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="font-black text-slate-800 text-sm">{res.guestName}</div>
                      <div className="text-xs text-slate-500 font-medium">
                        Habitación: <span className="font-bold text-slate-700">{room?.number}</span> ({room?.type})
                      </div>
                      <div className="text-xs font-semibold flex items-center gap-1.5">
                        <span className="text-slate-400">Saldo:</span>
                        {res.pendingBalance > 0 ? (
                          <span className="text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded">${res.pendingBalance} pendiente</span>
                        ) : (
                          <span className="text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">Saldado</span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {res.pendingBalance > 0 && (
                        <button
                          disabled={loadingId !== null}
                          onClick={() => handleProcessPayment(res.id, res.pendingBalance)}
                          className="px-3.5 py-2 text-xs font-black text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <DollarSign className="w-3.5 h-3.5 text-slate-500" /> Cobrar
                        </button>
                      )}
                      <button
                        disabled={loadingId !== null}
                        onClick={() => handleCheckIn(res.id, res.roomId)}
                        className="px-3.5 py-2 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                      >
                        {loadingId === res.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <LogIn className="w-3.5 h-3.5" />
                        )}
                        Registrar Entrada
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* PANEL DE SALIDAS DE HOY */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 bg-amber-50/30 flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-slate-800 flex items-center gap-2">
                <LogOut className="w-5 h-5 text-amber-600" /> Salidas de Hoy (Check-out)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Huéspedes programados para retirarse hoy</p>
            </div>
            <span className="bg-amber-100 text-amber-800 text-xs font-black px-2.5 py-1 rounded-full">
              {departures.length}
            </span>
          </div>

          <div className="p-4 flex-1 divide-y divide-slate-100">
            {departures.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm font-medium">
                No hay check-outs pendientes para hoy.
              </div>
            ) : (
              departures.map(res => {
                const room = rooms.find(rm => rm.id === res.roomId);
                return (
                  <div key={res.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="font-black text-slate-800 text-sm">{res.guestName}</div>
                      <div className="text-xs text-slate-500 font-medium">
                        Habitación: <span className="font-bold text-slate-700">{room?.number}</span> ({room?.type})
                      </div>
                      <div className="text-xs font-semibold flex items-center gap-1.5">
                        <span className="text-slate-400">Saldo:</span>
                        {res.pendingBalance > 0 ? (
                          <span className="text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded">${res.pendingBalance} pendiente</span>
                        ) : (
                          <span className="text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">Saldado</span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {res.pendingBalance > 0 && (
                        <button
                          disabled={loadingId !== null}
                          onClick={() => handleProcessPayment(res.id, res.pendingBalance)}
                          className="px-3.5 py-2 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                        >
                          <DollarSign className="w-3.5 h-3.5" /> Procesar Pago
                        </button>
                      )}
                      <button
                        disabled={loadingId !== null}
                        onClick={() => handleCheckOut(res)}
                        className={`px-3.5 py-2 text-xs font-black text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 ${
                          res.pendingBalance > 0 
                            ? 'bg-slate-400 cursor-not-allowed' 
                            : 'bg-amber-600 hover:bg-amber-700'
                        }`}
                      >
                        {loadingId === res.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <LogOut className="w-3.5 h-3.5" />
                        )}
                        Registrar Salida
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
