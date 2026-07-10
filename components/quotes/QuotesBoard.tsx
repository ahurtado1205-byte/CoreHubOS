'use client';

import { useState } from 'react';
import { Quote, QuoteStatus } from '../../types';
import { QuoteCard } from './QuoteCard';
import { usePMS } from '../../context/PMSContext';
import { OperationalConfirmationPanel } from '../bookings/OperationalConfirmationPanel';
import { Modal } from '../ui/Modal';
import { BookingForm } from '../bookings/BookingForm';
import { QuoteForm } from './QuoteForm';

const COLUMNS: { id: QuoteStatus; title: string }[] = [
  { id: 'draft', title: 'Borrador' },
  { id: 'sent', title: 'Enviadas' },
  { id: 'pre_booked', title: 'Pre Reserva' },
  { id: 'booked', title: 'Reserva' },
  { id: 'lost', title: 'Perdida' }
];

export function QuotesBoard() {
  const { quotes, updateQuote } = usePMS();
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const selectedQuote = quotes.find(q => q.id === selectedQuoteId);

  const handleConfirmQuote = () => {
    if (!selectedQuoteId) return;
    setIsBookingModalOpen(true);
  };

  const handleDragStart = (e: React.DragEvent, quote: Quote) => {
    e.dataTransfer.setData('quote_id', quote.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, newStatus: QuoteStatus) => {
    e.preventDefault();
    const quoteId = e.dataTransfer.getData('quote_id');
    const quote = quotes.find(q => q.id === quoteId);
    if (quote && quote.status !== newStatus) {
      updateQuote({ ...quote, status: newStatus });
    }
  };

  return (
    <div className="flex h-full gap-6 overflow-x-auto pb-4">
      {COLUMNS.map(col => {
        const columnQuotes = quotes.filter(q => q.status === col.id);
        
        return (
          <div 
            key={col.id} 
            className="flex flex-col min-w-[280px] w-[320px] shrink-0"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="font-bold text-slate-700 text-sm">{col.title}</h2>
              <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">
                {columnQuotes.length}
              </span>
            </div>
            
            {/* Column Body */}
            <div className="flex-1 bg-slate-50/50 rounded-2xl p-3 border border-slate-100/50 shadow-inner overflow-y-auto">
              {columnQuotes.length === 0 ? (
                <div className="text-center p-4 text-xs text-slate-400 font-medium border-2 border-dashed border-slate-200 rounded-xl">
                  Sin cotizaciones
                </div>
              ) : (
                columnQuotes.map(quote => (
                  <div key={quote.id} className="mb-3 last:mb-0">
                    <QuoteCard 
                      quote={quote}
                      isSelected={selectedQuoteId === quote.id}
                      onSelect={() => setSelectedQuoteId(quote.id)}
                      onViewProposal={() => {
                        setSelectedQuoteId(quote.id);
                        setIsEditModalOpen(true);
                      }}
                      isOperationallyConfirmed={quote.status === 'booked'}
                      onUpdateQuote={updateQuote}
                      onDragStart={handleDragStart}
                    />
                    
                    {/* Render Confirmation Panel inline if selected and not yet booked */}
                    {selectedQuoteId === quote.id && quote.status !== 'booked' && (
                      <div className="mt-2 mb-4 animate-in slide-in-from-top-2 duration-200">
                        <OperationalConfirmationPanel 
                          canConfirm={true}
                          isConfirmed={false}
                          onConfirm={handleConfirmQuote}
                        />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}

      <Modal 
        isOpen={isBookingModalOpen} 
        onClose={() => setIsBookingModalOpen(false)}
        title="Convertir a Reserva"
      >
        <BookingForm 
          initialQuote={selectedQuote}
          onSuccess={() => setIsBookingModalOpen(false)} 
          onCancel={() => setIsBookingModalOpen(false)} 
        />
      </Modal>

      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)}
        title="Editar Cotización"
      >
        {selectedQuote && (
          <QuoteForm 
            initialQuote={selectedQuote}
            onSuccess={() => setIsEditModalOpen(false)} 
            onCancel={() => setIsEditModalOpen(false)} 
          />
        )}
      </Modal>
    </div>
  );
}
