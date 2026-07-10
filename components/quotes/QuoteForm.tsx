'use client';

import React, { useState, useMemo } from 'react';
import { usePMS } from '../../context/PMSContext';
import { Quote, QuoteStatus } from '../../types';
import { format, addDays, parseISO, startOfDay, differenceInDays } from 'date-fns';
import { Check, Globe, Megaphone, FileText, Smartphone, Mail, Coffee, Shield, Star, Clock } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { usePricing } from '../../hooks/usePricing';
import { QuoteCRM } from '../crm/QuoteCRM';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface QuoteFormProps {
  initialQuote?: Quote;
  onSuccess: () => void;
  onCancel: () => void;
}

export function QuoteForm({ initialQuote, onSuccess, onCancel }: QuoteFormProps) {
  const { addQuote, updateQuote, unitTypes, ratePlans, bookingSources, templates, activities, addActivity } = usePMS();
  const { calculateTotal, getPriceForPlanAndDate, calculatePricingBreakdown } = usePricing();
  
  const [formData, setFormData] = useState({
    first_name: initialQuote?.first_name || '',
    last_name: initialQuote?.last_name || '',
    email: initialQuote?.email || '',
    phone: initialQuote?.phone || '',
    nationality: initialQuote?.nationality || '',
    source: initialQuote?.source || bookingSources[0] || '',
    check_in: initialQuote?.check_in || format(new Date(), 'yyyy-MM-dd'),
    check_out: initialQuote?.check_out || format(addDays(new Date(), 2), 'yyyy-MM-dd'),
    adults: initialQuote?.pax || 2,
    children: 0,
    extra_beds: initialQuote?.extra_beds || 0,
    unit_type_id: initialQuote?.unit_type_id || [...unitTypes].sort((a, b) => a.base_price - b.base_price)[0]?.id || '',
    rate_plan_id: initialQuote?.rate_plan_id || ratePlans[0]?.id || '',
    discount_type: initialQuote?.discount_type || 'none' as 'none'|'percent'|'fixed',
    discount_value: initialQuote?.discount_value || 0,
    notes: initialQuote?.notes || '',
    follow_up_date: initialQuote?.follow_up_date || format(new Date(), 'yyyy-MM-dd'),
    status: initialQuote?.status || 'draft',
    rooms_count: initialQuote?.rooms_count || 1,
    document_id: ''
  });

  const totalNights = useMemo(() => {
    if (!formData.check_in || !formData.check_out) return 0;
    const checkIn = startOfDay(parseISO(formData.check_in));
    const checkOut = startOfDay(parseISO(formData.check_out));
    const nights = differenceInDays(checkOut, checkIn);
    return nights > 0 ? nights : 0;
  }, [formData.check_in, formData.check_out]);

  const pricing = useMemo(() => {
    const breakdown = calculatePricingBreakdown(formData.unit_type_id, formData.rate_plan_id, formData.check_in, formData.check_out, formData.extra_beds);
    const subtotal = breakdown.total * formData.rooms_count;
    let discount = 0;
    if (formData.discount_type === 'percent') {
      discount = subtotal * (formData.discount_value / 100);
    } else if (formData.discount_type === 'fixed') {
      discount = formData.discount_value;
    }
    
    const total_amount = Math.max(0, subtotal - discount);

    return { ...breakdown, subtotal, discount, total_amount };
  }, [formData.unit_type_id, formData.rate_plan_id, formData.check_in, formData.check_out, formData.extra_beds, formData.discount_type, formData.discount_value, formData.rooms_count, calculatePricingBreakdown]);

  const visibleRatePlans = useMemo(() => {
    return ratePlans.filter(rp => rp.is_visible_in_quotes !== false || rp.id === formData.rate_plan_id);
  }, [ratePlans, formData.rate_plan_id]);

  const rackPricing = useMemo(() => {
    const defaultPlan = visibleRatePlans.find(p => p.is_default) || visibleRatePlans[0];
    if (!defaultPlan || !formData.unit_type_id) return null;
    const breakdown = calculatePricingBreakdown(formData.unit_type_id, defaultPlan.id, formData.check_in, formData.check_out, formData.extra_beds);
    return breakdown.total * formData.rooms_count;
  }, [formData.unit_type_id, formData.check_in, formData.check_out, formData.extra_beds, formData.rooms_count, calculatePricingBreakdown, ratePlans]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.unit_type_id || !formData.rate_plan_id) {
      alert("Por favor selecciona una categoría y un plan tarifario.");
      return;
    }
    
    const selectedUnitType = unitTypes.find(ut => ut.id === formData.unit_type_id);
    const assignedPropertyId = initialQuote?.property_id || selectedUnitType?.property_id;

    const quoteData: Quote = {
      id: initialQuote ? initialQuote.id : `q_${Date.now()}`,
      property_id: assignedPropertyId as string,
      confirmation_id: initialQuote?.confirmation_id || `COT-${format(new Date(), 'yyyyMMdd')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      created_at: initialQuote?.created_at || new Date().toISOString(),
      status: formData.status as any,
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      phone: formData.phone,
      nationality: formData.nationality,
      source: formData.source,
      check_in: formData.check_in,
      check_out: formData.check_out,
      pax: formData.adults + formData.children,
      extra_beds: formData.extra_beds,
      unit_type_id: formData.unit_type_id,
      rate_plan_id: formData.rate_plan_id,
      total_nights: totalNights,
      subtotal: pricing.subtotal,
      discount_type: formData.discount_type,
      discount_value: formData.discount_value,
      total_amount: pricing.total_amount,
      notes: formData.notes,
      follow_up_date: formData.follow_up_date,
      rooms_count: formData.rooms_count,
      expiration_date: initialQuote?.expiration_date || format(addDays(new Date(), 7), 'yyyy-MM-dd')
    };

    if (initialQuote) {
      updateQuote(quoteData);
    } else {
      addQuote(quoteData);
    }
    
    onSuccess();
  };

  const parseTemplate = (content: string, raw: boolean = false) => {
    let text = content;
    const formatDate = (dateStr: string) => {
      if (!dateStr) return '';
      try { return format(parseISO(dateStr), 'dd/MM/yyyy'); } catch { return dateStr; }
    };
    
    // Support BOTH CamelCase and lowercase tags
    text = text.replace(/{{Nombre_Cliente}}/g, `${formData.first_name} ${formData.last_name}`.trim() || 'Cliente');
    text = text.replace(/{{nombre}}/g, formData.first_name || 'Cliente');
    text = text.replace(/{{apellido}}/g, formData.last_name || '');
    
    text = text.replace(/{{Nombre_Propiedad}}/g, 'Propiedad');
    text = text.replace(/{{ID_Cotizacion}}/g, initialQuote?.confirmation_id || 'NUEVA');
    text = text.replace(/{{Tipo_Habitacion_Unidad}}/g, formData.unit_type_id ? unitTypes.find(u => u.id === formData.unit_type_id)?.name || '' : '');
    text = text.replace(/{{Cantidad_Noches}}/g, totalNights.toString());
    
    text = text.replace(/{{Fecha_CheckIn}}/g, formatDate(formData.check_in));
    text = text.replace(/{{check_in}}/g, formatDate(formData.check_in));
    
    text = text.replace(/{{Fecha_CheckOut}}/g, formatDate(formData.check_out));
    text = text.replace(/{{check_out}}/g, formatDate(formData.check_out));
    
    text = text.replace(/{{Adultos}}/g, formData.adults.toString());
    text = text.replace(/{{Ninos}}/g, formData.children.toString());
    text = text.replace(/{{Pax}}/g, (formData.adults + formData.children).toString());
    text = text.replace(/{{Camas_Adicionales}}/g, formData.extra_beds?.toString() || '0');
    text = text.replace(/{{Moneda}}/g, 'USD');
    
    let pdfTotalText = `$${pricing.total_amount.toLocaleString()}`;
    if (rackPricing && rackPricing > pricing.total_amount) {
      pdfTotalText = `<span style="text-decoration: line-through; color: #94a3b8; font-size: 0.8em; margin-right: 8px;">RACK $${rackPricing.toLocaleString()}</span><span style="color: #ef4444; font-size: 0.8em; font-weight: bold; margin-right: 8px;">-${Math.round((1 - pricing.total_amount / rackPricing) * 100)}%</span> $${pricing.total_amount.toLocaleString()}`;
    }
    if (pricing.extraBedTotal > 0) {
      pdfTotalText += `<br><span style="font-size: 0.7em; color: #64748b; font-weight: normal; display: block; margin-top: 4px;">(Incluye Tarifa Base: $${pricing.baseTotal.toLocaleString()} + Cama Extra: $${pricing.extraBedTotal.toLocaleString()})</span>`;
    }
    
    text = text.replace(/{{Precio_Total}}/g, pdfTotalText);
    text = text.replace(/{{total}}/g, `$${pricing.total_amount.toLocaleString()} USD`);
    
    text = text.replace(/{{Precio_Por_Noche}}/g, (pricing.total_amount / (totalNights || 1)).toLocaleString());
    text = text.replace(/{{Impuestos_Tasas}}/g, '0');
    text = text.replace(/{{Horas_Validez}}/g, '48');
    text = text.replace(/{{Link_Pago_Reserva}}/g, 'https://pago.hotelflow.com/checkout');
    
    // Replace guide links
    text = text.replace(/{{link_guia_bariloche}}/g, 'https://hotelflow.app/guias/bariloche-completa.pdf');
    text = text.replace(/{{link_guia_gastronomica}}/g, 'https://hotelflow.app/guias/bariloche-gastronomia.pdf');
    text = text.replace(/{{link_guia_rutas}}/g, 'https://hotelflow.app/guias/bariloche-rutas.pdf');
    
    // Inyección de retrocompatibilidad si la plantilla no tiene el tag de camas adicionales
    if (formData.extra_beds && formData.extra_beds > 0 && !text.includes('{{Camas_Adicionales}}')) {
       text = text.replace(/(Quiénes van:<\/strong>.*?)(<\/p>)/, `$1 (con ${formData.extra_beds} cama/s adicional/es)$2`);
    }

    if (formData.extra_beds && formData.extra_beds > 0 && pricing.extraBedTotal > 0) {
       text = text.replace(/(Valor por noche:<\/strong>.*?)(<\/p>)/, `$1$2\n<p><strong>Camas adicionales:</strong> USD ${pricing.extraBedTotal}</p>`);
    }

    return raw ? text : encodeURIComponent(text);
  };

  const logActivity = (type: 'email' | 'whatsapp' | 'proposal', desc: string) => {
    if (!initialQuote) return; // Only log for saved quotes
    addActivity({
      id: `act_${Date.now()}`,
      property_id: initialQuote.property_id,
      quote_id: initialQuote.id,
      type,
      date: new Date().toISOString(),
      result: 'completed',
      description: desc
    } as any);
  };

  const handleSendWhatsApp = (e: React.MouseEvent) => {
    e.preventDefault();
    logActivity('whatsapp', 'Envió cotización por WhatsApp');
    window.open(`https://wa.me/${formData.phone.replace(/[^0-9]/g, '')}?text=${parseTemplate(templates.find(t => t.type === 'whatsapp')?.content || '')}`, '_blank');
  };

  const handleSendEmail = (e: React.MouseEvent) => {
    e.preventDefault();
    logActivity('email', 'Envió cotización por Email');
    window.location.href = `mailto:${formData.email}?subject=Cotización&body=${parseTemplate(templates.find(t => t.type === 'email')?.content || '')}`;
  };

  const handlePrintPDF = (templateType: string) => {
    logActivity('proposal', `Generó PDF: ${templateType === 'ficha' ? 'Ficha de Registro' : 'Cotización'}`);
    let finalTemplate = templates.find(t => t.type === 'pdf' && (templateType === 'ficha' ? t.name.toLowerCase().includes('ficha') : t.name.toLowerCase().includes('cotiz')));
    if (!finalTemplate) finalTemplate = templates.find(t => t.type === 'pdf');
    if (!finalTemplate) finalTemplate = templates[0];
    
    if (!finalTemplate) {
      alert("No hay plantillas creadas en el sistema.");
      return;
    }
    const pdfTitle = `${initialQuote?.confirmation_id || initialQuote?.id || 'NUEVA_RESERVA'}`;
    
    const htmlContent = parseTemplate(finalTemplate.content, true);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${pdfTitle}</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #1f2937; background: #fff; }
              .container { max-width: 800px; margin: 0 auto; line-height: 1.6; }
              .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; }
              .logo { color: #4f46e5; font-size: 24px; font-weight: bold; display: flex; align-items: center; justify-content: center; gap: 8px; }
              .content { white-space: pre-wrap; margin-bottom: 40px; }
              .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 20px; }
              @media print {
                body { padding: 0; }
                button { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
                  CoreHub OS
                </div>
                <h2 style="margin-top: 16px; color: #374151;">${templateType === 'ficha' ? 'Ficha de Registro' : 'Cotización de Alojamiento'}</h2>
              </div>
              <div class="content">${htmlContent}</div>
              <div class="footer">Documento generado automáticamente por CoreHub OS</div>
            </div>
            <script>
              window.onload = function() { window.print(); window.close(); }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const inputClass = "w-full border border-white/40 bg-white/50 backdrop-blur-sm rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white outline-none transition-all shadow-sm font-medium placeholder-slate-400";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {initialQuote?.created_at && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ID:</span>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                {initialQuote.confirmation_id || initialQuote.id}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Creada el:</span>
              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                {(() => {
                  try {
                    return format(parseISO(initialQuote.created_at), 'dd/MM/yyyy HH:mm');
                  } catch (e) {
                    return initialQuote.created_at;
                  }
                })()}
              </span>
            </div>
          </div>
          
          {/* Customer Journey Tracker for this lead */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 space-y-3 shadow-md">
            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block">Seguimiento del Camino del Huésped (Customer Journey) 🗺️</span>
            <div className="flex justify-between items-center gap-1.5 pt-1">
              {[
                { label: 'Atraer 📣', desc: 'Landing Page', done: true },
                { label: 'Perfilar ⚡', desc: 'Quiz Completado', done: !!initialQuote.source?.includes('Quiz') },
                { label: 'Cotizar ✉️', desc: 'Propuesta Enviada', done: ['sent', 'follow_up', 'pre_booked', 'booked'].includes(initialQuote.status) },
                { label: 'Reservar 🔑', desc: 'PMS Roomrack', done: initialQuote.status === 'booked' }
              ].map((step, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center text-center relative group">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all ${
                    step.done 
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-500/30' 
                      : 'bg-slate-800 border-slate-700 text-slate-500'
                  }`}>
                    {step.done ? '✓' : idx + 1}
                  </div>
                  <span className="text-[9px] font-black text-slate-200 mt-1.5 block">{step.label}</span>
                  <span className="text-[8px] text-slate-400 font-bold block">{step.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* BLOQUE 1: DATOS DEL PASAJERO */}
      <section className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative z-40">
        <h4 className="text-indigo-800 font-black text-sm flex items-center gap-2 tracking-wide mb-5 uppercase">
          <svg className="w-5 h-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          Datos del Pasajero
        </h4>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Nombre</label>
            <input required type="text" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} className={inputClass} placeholder="Ej: María" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Apellido</label>
            <input required type="text" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} className={inputClass} placeholder="Ej: García" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
            <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Teléfono</label>
            <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className={inputClass} placeholder="+54 9 11..." />
          </div>
        </div>

        <details className="group">
          <summary className="text-sm font-bold text-indigo-600 cursor-pointer list-none flex items-center gap-1 hover:text-indigo-700 transition-colors select-none">
            <span className="group-open:rotate-90 transition-transform">▸</span> Detalles Adicionales
          </summary>
          <div className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-1">
                <FileText className="w-3 h-3" /> DNI / Pasaporte
              </label>
              <input type="text" value={formData.document_id} onChange={e => setFormData({...formData, document_id: e.target.value})} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Globe className="w-3 h-3" /> Nacionalidad
              </label>
              <input type="text" value={formData.nationality} onChange={e => setFormData({...formData, nationality: e.target.value})} className={inputClass} placeholder="Ej: Argentina" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Megaphone className="w-3 h-3" /> Origen
              </label>
              <select value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})} className={inputClass}>
                {bookingSources.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </details>
      </section>

      {/* BLOQUE 2: FECHAS Y COTIZACIÓN */}
      <section className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <h4 className="text-indigo-800 font-black text-sm flex items-center gap-2 tracking-wide mb-5 uppercase">
          <svg className="w-5 h-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M17 14h-6"/><path d="M13 18H7"/><path d="M7 14h.01"/><path d="M17 18h.01"/></svg>
          Fechas y Categoría
        </h4>
        
        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-200 overflow-hidden">
          <div className="min-w-0">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Check In</label>
            <input 
              required type="date" value={formData.check_in}
              onChange={e => setFormData({...formData, check_in: e.target.value})}
              className="w-full bg-transparent font-black text-slate-900 outline-none truncate"
            />
          </div>
          
          <div className="flex flex-col items-center px-2 md:px-4 border-x border-slate-200 shrink-0">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Noches</label>
            <div className="flex items-center gap-1 md:gap-2 bg-white border border-slate-300 rounded-lg px-1 md:px-2 py-1 shadow-sm">
              <button type="button" onClick={() => {
                const n = Math.max(1, totalNights - 1);
                if (formData.check_in) {
                  setFormData({...formData, check_out: format(addDays(parseISO(formData.check_in), n), 'yyyy-MM-dd')});
                }
              }} className="text-slate-400 hover:text-indigo-600 font-bold px-1">−</button>
              <span className="font-black text-indigo-700 w-4 md:w-6 text-center">{totalNights}</span>
              <button type="button" onClick={() => {
                const n = totalNights + 1;
                if (formData.check_in) {
                  setFormData({...formData, check_out: format(addDays(parseISO(formData.check_in), n), 'yyyy-MM-dd')});
                }
              }} className="text-slate-400 hover:text-indigo-600 font-bold px-1">+</button>
            </div>
          </div>

          <div className="min-w-0 text-right">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Check Out</label>
            <input 
              required type="date" min={formData.check_in} value={formData.check_out}
              onChange={e => setFormData({...formData, check_out: e.target.value})}
              className="w-full bg-transparent font-black text-slate-900 outline-none text-right truncate"
            />
          </div>
        </div>

        {/* Categoría (Pastilla) y Tarifas */}
        <div className="mb-4">
          <label className="block text-sm font-bold text-slate-700 mb-2">Opciones de Alojamiento (x {formData.rooms_count} hab)</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {unitTypes.map(ut => {
              const isSelected = formData.unit_type_id === ut.id;
              
              // Calcular el precio real que tendría esta opción
              const utPrice = calculateTotal(ut.id, formData.rate_plan_id, formData.check_in, formData.check_out, formData.extra_beds) * formData.rooms_count;
              
              // Es la más económica si es el menor precio de todas
              const isCheapest = Math.min(...unitTypes.map(u => calculateTotal(u.id, formData.rate_plan_id, formData.check_in, formData.check_out, formData.extra_beds) * formData.rooms_count)) === utPrice;

              return (
                <div 
                  key={ut.id}
                  onClick={() => setFormData({...formData, unit_type_id: ut.id})}
                  className={cn(
                    "relative p-4 rounded-xl border-2 transition-all cursor-pointer group flex flex-col items-center justify-center text-center gap-1",
                    isSelected ? "bg-indigo-50 border-indigo-600 shadow-md ring-1 ring-indigo-600/20" : "bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm"
                  )}
                >
                  {isCheapest && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-sm flex items-center gap-1 whitespace-nowrap z-10">
                      🔥 Más Económica
                    </div>
                  )}
                  {isSelected && !isCheapest && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-sm whitespace-nowrap z-10">
                      Seleccionada
                    </div>
                  )}
                  <h5 className={cn("font-bold text-sm truncate w-full", isSelected ? "text-indigo-900" : "text-slate-700")}>{ut.name}</h5>
                  <div className={cn("text-lg font-black", isSelected ? "text-indigo-600" : "text-slate-900")}>
                    ${utPrice}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                    Total {totalNights} Noches
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-bold text-slate-700 mb-2">Plan Tarifario</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {visibleRatePlans.map(rp => (
              <div
                key={rp.id}
                onClick={() => setFormData({...formData, rate_plan_id: rp.id})}
                className={cn("cursor-pointer border p-3 rounded-xl transition-all relative flex flex-col justify-center gap-1",
                  formData.rate_plan_id === rp.id ? "bg-amber-50 border-amber-500 shadow-md ring-1 ring-amber-500/20" : "bg-white border-slate-200 hover:border-amber-300 hover:shadow-sm"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                   <div className="flex items-center gap-2">
                     {rp.is_default ? <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> : <Shield className="w-4 h-4 text-slate-400" />}
                     <span className={cn("font-bold text-sm", formData.rate_plan_id === rp.id ? "text-amber-900" : "text-slate-700")}>{rp.name}</span>
                   </div>
                   {formData.rate_plan_id === rp.id && <Check className="w-4 h-4 text-amber-600" />}
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-500 font-medium truncate flex items-center gap-1"><Coffee className="w-3 h-3"/> {rp.meal_plan}</span>
                  <span className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-500 font-medium truncate flex items-center gap-1"><FileText className="w-3 h-3"/> {rp.cancellation_policy}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-3 md:col-span-3">
             <label className="block text-sm font-bold text-slate-700 mb-1">Habitaciones</label>
             <input required type="number" min="1" value={formData.rooms_count} onChange={e => setFormData({...formData, rooms_count: Math.max(1, parseInt(e.target.value) || 1)})} className={inputClass} />
          </div>
          <div className="col-span-3 md:col-span-3">
             <label className="block text-sm font-bold text-slate-700 mb-1">Adultos</label>
             <input required type="number" min="1" value={formData.adults} onChange={e => setFormData({...formData, adults: parseInt(e.target.value) || 1})} className={inputClass} />
          </div>
          <div className="col-span-3 md:col-span-3">
             <label className="block text-sm font-bold text-slate-700 mb-1">Niños</label>
             <input required type="number" min="0" value={formData.children} onChange={e => setFormData({...formData, children: parseInt(e.target.value) || 0})} className={inputClass} />
          </div>
          <div className="col-span-3 md:col-span-3">
             <label className="block text-sm font-bold text-slate-700 mb-1">Camas Adic.</label>
             <input type="number" min="0" value={formData.extra_beds} onChange={e => setFormData({...formData, extra_beds: parseInt(e.target.value) || 0})} className={inputClass} />
          </div>
        </div>
      </section>

      {initialQuote && (
        <QuoteCRM quote={initialQuote} />
      )}

      {/* BLOQUE 3: CIERRE */}
      <section className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 border border-indigo-700/50 rounded-3xl p-6 shadow-2xl z-30 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1542314831-c6a4d14faaf2?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay"></div>
        <div className="relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-bold text-indigo-100 mb-1">Estado</label>
            <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as QuoteStatus})} className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 [&>option]:text-slate-900">
              <option value="draft">Borrador</option>
              <option value="sent">Enviada</option>
              <option value="follow_up">Seguimiento</option>
              <option value="pre_booked">Pre Reserva</option>
              <option value="booked">Reserva</option>
              <option value="lost">Perdida</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-indigo-100 mb-1">Fecha Seguimiento</label>
            <input type="date" value={formData.follow_up_date} onChange={e => setFormData({...formData, follow_up_date: e.target.value})} className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert" />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-bold text-indigo-100 mb-1">Notas Internas</label>
          <textarea 
            rows={2}
            value={formData.notes || ''} 
            onChange={e => setFormData({...formData, notes: e.target.value})} 
            placeholder="Comentarios adicionales de la cotización..."
            className="w-full bg-white/10 border border-white/20 text-white placeholder-indigo-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none" 
          />
        </div>

        <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20">
          <div className="flex justify-between items-center text-sm mb-3">
            <span className="text-indigo-100 font-bold">Tarifa Base Habitación ({totalNights} noches a ${pricing.nightlyAvg}/noche)</span>
            <span className="font-bold text-white">${pricing.baseTotal * formData.rooms_count}</span>
          </div>
          
          {pricing.extraBedTotal > 0 && (
            <div className="flex justify-between items-center text-sm mb-3 text-emerald-300">
              <span className="font-bold flex items-center gap-1">
                Camas Adicionales ({formData.extra_beds} x {totalNights} noches a ${pricing.extraBedNightlyAvg}/noche)
              </span>
              <span className="font-bold">${pricing.extraBedTotal * formData.rooms_count}</span>
            </div>
          )}

          <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-4">
            <select
              value={formData.discount_type}
              onChange={e => setFormData({...formData, discount_type: e.target.value as any})}
              className="bg-white/20 border border-white/30 rounded-lg px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-emerald-400 [&>option]:text-slate-900"
            >
              <option value="none">Sin Desc.</option>
              <option value="percent">% Desc</option>
              <option value="fixed">$ Desc</option>
            </select>

            {formData.discount_type !== 'none' && (
              <div className="relative w-24">
                <input
                  type="number"
                  min="0"
                  value={formData.discount_value}
                  onChange={e => setFormData({...formData, discount_value: parseFloat(e.target.value) || 0})}
                  className="w-full bg-white/20 border border-white/30 rounded-lg pl-6 pr-2 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-emerald-400"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-200 text-xs font-bold">
                  {formData.discount_type === 'percent' ? '%' : '$'}
                </span>
              </div>
            )}
            
            {pricing.discount > 0 && (
              <span className="ml-auto text-sm text-emerald-400 font-bold">-${pricing.discount}</span>
            )}
          </div>

          <div className="flex justify-between items-end mb-4">
            <span className="font-black text-indigo-50 text-lg">Total Cotización</span>
            <div className="text-right flex flex-col items-end">
              {rackPricing && rackPricing > pricing.total_amount && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-indigo-300 line-through font-bold">RACK: ${rackPricing}</span>
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-black">-{Math.round((1 - pricing.total_amount / rackPricing) * 100)}% (${rackPricing - pricing.total_amount})</span>
                </div>
              )}
              <span className="text-4xl font-black text-emerald-400">${pricing.total_amount}</span>
            </div>
          </div>
          
          {/* Opciones de Envío / Comunicación - Tidy up */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            <button 
              type="button"
              onClick={handleSendWhatsApp}
              disabled={!formData.phone}
              className={cn("bg-[#25D366] hover:bg-[#1DA851] text-white font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#25D366]/20 text-xs", !formData.phone && "opacity-50 cursor-not-allowed")}
            >
              <Smartphone className="w-4 h-4" /> WhatsApp
            </button>
            <button 
              type="button"
              onClick={handleSendEmail}
              disabled={!formData.email}
              className={cn("bg-white/10 hover:bg-white/20 text-white font-bold py-2.5 px-3 rounded-xl border border-white/20 flex items-center justify-center gap-2 transition-all text-xs", !formData.email && "opacity-50 cursor-not-allowed")}
            >
              <Mail className="w-4 h-4" /> Email
            </button>
            <button 
              type="button" 
              onClick={() => handlePrintPDF('cotiz')} 
              className="bg-indigo-500 hover:bg-indigo-400 text-white font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20 text-xs"
            >
              <FileText className="w-4 h-4" /> Ver PDF
            </button>
            <button 
              type="button" 
              onClick={() => handlePrintPDF('ficha')} 
              className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 text-xs"
            >
              <FileText className="w-4 h-4" /> Ficha Reg
            </button>
          </div>
        </div>
        </div>
      </section>

      {/* BLOQUE 4: HISTORIAL DE ENVÍOS */}
      {initialQuote && (
        <section className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-sm z-20 relative">
          <h4 className="text-slate-700 font-bold text-sm flex items-center gap-2 mb-4 tracking-wide">
            <Clock className="w-4 h-4" />
            Historial de Cotización
          </h4>
          
          <div className="space-y-3">
            {activities.filter(a => a.quote_id === initialQuote.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).length === 0 ? (
              <p className="text-xs text-slate-500 italic">No hay registros de envío para esta cotización todavía. Utiliza los botones superiores para enviarla al cliente.</p>
            ) : (
              activities.filter(a => a.quote_id === initialQuote.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(act => (
                <div key={act.id} className="flex gap-3 text-sm bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                  <div className="mt-0.5">
                    {act.type === 'whatsapp' && <Smartphone className="w-4 h-4 text-[#25D366]" />}
                    {act.type === 'email' && <Mail className="w-4 h-4 text-slate-600" />}
                    {act.type === 'proposal' && <FileText className="w-4 h-4 text-indigo-500" />}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{act.description}</p>
                    <p className="text-xs text-slate-400 mt-1">{format(parseISO(act.date), "dd/MM/yyyy 'a las' HH:mm")} hs</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      <div className="pt-2 flex gap-3 shrink-0">
        <button type="button" onClick={onCancel} className="px-6 py-3 font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors">
          Cancelar
        </button>
        <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 px-6 rounded-xl shadow-sm transition-all active:scale-[0.98] flex justify-center items-center gap-2">
          Guardar Cotización
        </button>
      </div>
    </form>
  );
}
