import { Quote } from '../types';

export const getQuoteStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    draft: 'Borrador',
    sent: 'Enviada',
    viewed: 'Vista',
    follow_up_pending: 'Seguimiento',
    expiring_soon: 'Por vencer',
    booked: 'Ganada',
    lost: 'Perdida',
    expired: 'Vencida',
    reopened: 'Reabierta'
  };
  return labels[status] || status;
};

export const getQuoteStatusStyle = (status: string): string => {
  const styles: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-600',
    sent: 'bg-blue-100 text-blue-600',
    viewed: 'bg-indigo-100 text-indigo-600',
    follow_up_pending: 'bg-amber-100 text-amber-600',
    expiring_soon: 'bg-red-100 text-red-600',
    booked: 'bg-emerald-100 text-emerald-600',
    lost: 'bg-slate-200 text-slate-700',
    expired: 'bg-red-200 text-red-800',
    reopened: 'bg-purple-100 text-purple-600'
  };
  return styles[status] || 'bg-gray-100';
};

export const isQuoteExpired = (quote: Quote, today: string): boolean => {
  return quote.status !== 'booked' && quote.expiration_date < today;
};

export const isQuoteExpiringSoon = (quote: Quote, today: string): boolean => {
  const diff = new Date(quote.expiration_date).getTime() - new Date(today).getTime();
  const days = diff / (1000 * 3600 * 24);
  return quote.status !== 'booked' && days >= 0 && days <= 3;
};
