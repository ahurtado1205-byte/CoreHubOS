import { BookingStatus } from '../types';

export const BOOKING_COLORS: Record<BookingStatus, { label: string; colorClass: string }> = {
  confirmed: { label: 'Confirmada', colorClass: 'bg-emerald-100 text-emerald-800 border border-emerald-200' },
  pre_booked: { label: 'Pre-Reserva', colorClass: 'bg-amber-100 text-amber-800 border border-amber-200' },
  deposit_paid: { label: 'Señado', colorClass: 'bg-indigo-100 text-indigo-800 border border-indigo-200' },
  pending_payment: { label: 'Pago Pendiente', colorClass: 'bg-rose-100 text-rose-800 border border-rose-200' },
  cancelled: { label: 'Cancelada', colorClass: 'bg-slate-100 text-slate-800 border border-slate-300' }
};
