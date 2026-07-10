import React, { useMemo } from 'react';
import { Quote } from '../../types';
import { usePMS } from '../../context/PMSContext';
import { getQuoteStatusLabel, getQuoteStatusStyle, isQuoteExpired, isQuoteExpiringSoon } from '../../services/quoteService';
import { getTodayString } from '../../lib/dateUtils';
import { format, parseISO, differenceInDays } from 'date-fns';
import {
  buildWhatsAppQuoteMessage,
  buildWhatsAppLink,
  buildMailtoLink,
  buildEmailSubject,
  buildEmailBody
} from '../../services/communicationTemplateService';
import { CalendarDays, Users, Mail, MessageCircle, ExternalLink, CalendarClock, Download } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { usePricing } from '../../hooks/usePricing';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Props {
  quote: Quote;
  isSelected: boolean;
  onSelect: () => void;
  onViewProposal?: () => void;
  onConvertToBooking?: () => void;
  isOperationallyConfirmed?: boolean;
  onUpdateQuote?: (updated: Quote) => void;
  onDragStart?: (e: React.DragEvent, quote: Quote) => void;
}

export function QuoteCard({ quote, isSelected, onSelect, onViewProposal, onConvertToBooking, isOperationallyConfirmed, onUpdateQuote, onDragStart }: Props) {
  const { templates, unitTypes, ratePlans } = usePMS();
  const { calculatePricingBreakdown } = usePricing();
  
  const rackPricing = useMemo(() => {
    const defaultPlan = ratePlans.find(p => p.is_default);
    if (!defaultPlan || !quote.unit_type_id) return null;
    const breakdown = calculatePricingBreakdown(quote.unit_type_id, defaultPlan.id, quote.check_in, quote.check_out, quote.extra_beds || 0);
    return breakdown.total * (quote.rooms_count || 1);
  }, [quote, ratePlans, calculatePricingBreakdown]);

  const breakdown = useMemo(() => {
    if (!quote.unit_type_id || !quote.rate_plan_id) return null;
    return calculatePricingBreakdown(quote.unit_type_id, quote.rate_plan_id, quote.check_in, quote.check_out, quote.extra_beds || 0);
  }, [quote, calculatePricingBreakdown]);
  
  const today = getTodayString();
  const waMsg = buildWhatsAppQuoteMessage(quote);
  const isExpired = isQuoteExpired(quote, today);
  const isExpiring = isQuoteExpiringSoon(quote, today);
  
  const expirationColor = isExpired ? 'text-rose-600 bg-rose-50' : isExpiring ? 'text-amber-600 bg-amber-50' : 'text-slate-500 bg-slate-50';
  const currency = quote.options?.[0]?.currency || "USD";
  
  const statusLabel = getQuoteStatusLabel(quote.status);
  const statusStyle = getQuoteStatusStyle(quote.status);

  const handlePrintPDF = (e: React.MouseEvent) => {
    e.stopPropagation();
    const pdfTemplate = templates.find(t => t.type === 'pdf');
    if (!pdfTemplate) {
      alert("No hay plantilla PDF configurada.");
      return;
    }
    
    let text = pdfTemplate.content;
    const formatDate = (dateStr: string) => {
      if (!dateStr) return '';
      try { return format(parseISO(dateStr), 'dd/MM/yyyy'); } catch { return dateStr; }
    };
    
    const checkIn = parseISO(quote.check_in);
    const checkOut = parseISO(quote.check_out);
    const totalNights = differenceInDays(checkOut, checkIn);
    
    text = text.replace(/{{nombre}}/g, `${quote.first_name} ${quote.last_name}`.trim());
    text = text.replace(/{{checkin}}/g, formatDate(quote.check_in));
    text = text.replace(/{{checkout}}/g, formatDate(quote.check_out));
    text = text.replace(/{{habitacion}}/g, quote.unit_type_id ? unitTypes.find(u => u.id === quote.unit_type_id)?.name || '' : '');
    
    let pdfTotalText = `$${quote.total_amount.toLocaleString()}`;
    if (rackPricing && rackPricing > quote.total_amount) {
      pdfTotalText = `<span style="text-decoration: line-through; color: #94a3b8; font-size: 0.8em; margin-right: 8px;">RACK $${rackPricing.toLocaleString()}</span><span style="color: #ef4444; font-size: 0.8em; font-weight: bold; margin-right: 8px;">-${Math.round((1 - quote.total_amount / rackPricing) * 100)}%</span> $${quote.total_amount.toLocaleString()}`;
    }
    if (breakdown && breakdown.extraBedTotal > 0) {
      pdfTotalText += `<br><span style="font-size: 0.7em; color: #64748b; font-weight: normal; display: block; margin-top: 4px;">(Incluye Tarifa Base: $${breakdown.baseTotal.toLocaleString()} + Cama Extra: $${breakdown.extraBedTotal.toLocaleString()})</span>`;
    }
    
    text = text.replace(/{{total_amount}}/g, pdfTotalText);
    text = text.replace(/{{Precio_Total}}/g, pdfTotalText);
    text = text.replace(/{{Precio_Por_Noche}}/g, (quote.total_amount / (totalNights || 1)).toLocaleString());
    
    text = text.replace(/{{pax}}/g, quote.pax?.toString() || '2');
    text = text.replace(/{{Camas_Adicionales}}/g, quote.extra_beds?.toString() || '0');
    
    // Si la cotización tiene los detalles (a través de internal_notes o metadata)
    text = text.replace(/{{Adultos}}/g, quote.pax?.toString() || '2');
    text = text.replace(/{{Ninos}}/g, '0');

    // Inyección de retrocompatibilidad si la plantilla no tiene el tag de camas adicionales
    if (quote.extra_beds && quote.extra_beds > 0 && !pdfTemplate.content.includes('{{Camas_Adicionales}}')) {
       text = text.replace(/(Quiénes van:<\/strong>.*?)(<\/p>)/, `$1 (con ${quote.extra_beds} cama/s adicional/es)$2`);
    }

    // Calcular el costo extra de la cama e inyectarlo en NÚMEROS CLAROS
    if (quote.extra_beds && quote.extra_beds > 0 && quote.unit_type_id && quote.rate_plan_id) {
       const breakdown = calculatePricingBreakdown(quote.unit_type_id, quote.rate_plan_id, quote.check_in, quote.check_out, quote.extra_beds);
       if (breakdown.extraBedTotal > 0) {
         text = text.replace(/(Valor por noche:<\/strong>.*?)(<\/p>)/, `$1$2\n<p><strong>Camas adicionales:</strong> ${currency} ${breakdown.extraBedTotal}</p>`);
       }
    }
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Cotización - ${quote.first_name} ${quote.last_name}</title>
            <style>
              body { font-family: system-ui, sans-serif; padding: 40px; color: #333; }
              h1 { color: #4f46e5; }
              hr { border: 0; border-top: 2px solid #eee; margin: 20px 0; }
              @media print {
                @page { margin: 20mm; }
                body { padding: 0; }
              }
            </style>
          </head>
          <body>
            ${text}
            <script>
              window.onload = () => { window.print(); window.close(); };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div 
      onClick={onSelect}
      draggable={!!onDragStart}
      onDragStart={(e) => onDragStart?.(e, quote)}
      className={cn(
        "relative p-4 mb-3 border rounded-xl cursor-pointer transition-all duration-300 ease-out group",
        "hover:shadow-md hover:-translate-y-0.5",
        isSelected 
          ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-white shadow-sm ring-1 ring-indigo-500/20' 
          : 'border-slate-200 bg-white shadow-sm hover:border-indigo-300'
      )}
    >
      {/* Status Badge & Name */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <span className="text-[9px] font-mono text-slate-400 bg-slate-100 px-1 py-0.5 rounded mr-1.5">
            #{quote.id.substring(0, 6)}
          </span>
          <h3 className="font-semibold text-slate-800 text-sm tracking-tight truncate inline-block">
            {quote.first_name} {quote.last_name}
          </h3>
        </div>
        <span className={cn("text-[10px] px-2 py-1 rounded-full font-medium tracking-wide whitespace-nowrap", statusStyle)}>
          {statusLabel}
        </span>
      </div>

      {/* Details */}
      <div className="space-y-1.5 mb-3 text-xs text-slate-600">
        <div className="flex items-center gap-1.5">
          <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
          <span>{quote.check_in} &rarr; {quote.check_out}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>{quote.pax} pax</span>
          </div>
          {quote.source?.startsWith('Quiz Funnel') ? (
            <span className="text-[9px] uppercase tracking-wider text-amber-700 font-bold bg-amber-100 px-1.5 py-0.5 rounded shadow-sm border border-amber-200">
              ⚡ {quote.source.replace('Quiz Funnel', 'Quiz').replace(': ', ' ')}
            </span>
          ) : (
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium bg-slate-100 px-1.5 py-0.5 rounded">
              {quote.source || 'Directo'}
            </span>
          )}
        </div>
      </div>

      {/* Price & Expiration & Follow up */}
      <div className="flex flex-col gap-2 mb-3 pt-3 border-t border-slate-100">
        {breakdown && breakdown.extraBedTotal > 0 && (
          <div className="flex flex-col text-[10px] text-slate-500 mb-1 pb-2 border-b border-slate-100/50">
            <div className="flex justify-between items-center">
              <span>Tarifa Base ({breakdown.nights}n):</span>
              <span className="font-medium">${breakdown.baseTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Cama Adicional ({quote.extra_beds}):</span>
              <span className="font-medium">${breakdown.extraBedTotal.toLocaleString()}</span>
            </div>
          </div>
        )}
        <div className="flex justify-between items-end">
          <div>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-0.5">Total</p>
            <div className="flex flex-col">
              {rackPricing && rackPricing > quote.total_amount && (
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[10px] text-slate-400 line-through font-bold">RACK: ${rackPricing}</span>
                  <span className="text-[9px] bg-red-100 text-red-700 px-1 rounded font-black">-{Math.round((1 - quote.total_amount / rackPricing) * 100)}%</span>
                </div>
              )}
              <span className="text-sm font-bold text-slate-800">
                {quote.total_amount.toLocaleString('en-US', { style: 'currency', currency: currency })}
              </span>
            </div>
          </div>
          <div className={cn("flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md font-medium", expirationColor)}>
            <CalendarClock className="w-3 h-3" />
            <span>Exp: {quote.expiration_date}</span>
          </div>
        </div>

        {onUpdateQuote && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-slate-400 font-medium uppercase">Seguimiento:</span>
            <input 
              type="date"
              value={quote.follow_up_date || ''}
              onClick={e => e.stopPropagation()}
              onChange={(e) => {
                e.stopPropagation();
                onUpdateQuote({ ...quote, follow_up_date: e.target.value });
              }}
              className="text-xs bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-600"
            />
          </div>
        )}
      </div>

      {/* Confirmed Badge */}
      {isOperationallyConfirmed && (
        <div className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
          Mock Confirmed
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 mt-1 pt-3 border-t border-slate-100 text-[11px] font-medium">
        {quote.phone ? (
          <a 
            href={buildWhatsAppLink(quote.phone, waMsg)} 
            target="_blank" 
            rel="noopener noreferrer" 
            onClick={(e) => e.stopPropagation()} 
            className="flex items-center gap-1 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded transition-colors"
          >
            <MessageCircle className="w-3 h-3" /> WA
          </a>
        ) : (
          <span className="flex items-center gap-1 text-slate-400 px-2 py-1">
            <MessageCircle className="w-3 h-3 opacity-50" /> No WA
          </span>
        )}
        
        {quote.email ? (
          <a 
            href={buildMailtoLink(quote.email, buildEmailSubject(quote), buildEmailBody(quote))} 
            onClick={(e) => e.stopPropagation()} 
            className="flex items-center gap-1 text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors"
          >
            <Mail className="w-3 h-3" /> Email
          </a>
        ) : (
          <span className="flex items-center gap-1 text-slate-400 px-2 py-1">
            <Mail className="w-3 h-3 opacity-50" /> No Email
          </span>
        )}
        
        <div className="flex-1" />

        <button 
          onClick={handlePrintPDF} 
          className="flex items-center gap-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 px-2 py-1 rounded transition-colors"
          title="Descargar PDF"
        >
          <Download className="w-3 h-3" /> PDF
        </button>

        {onViewProposal && (
          <button 
            onClick={(e) => { e.stopPropagation(); onViewProposal(); }} 
            className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-2 py-1 rounded transition-colors"
          >
            Ver <ExternalLink className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}
