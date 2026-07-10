'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { usePMS } from '../../context/PMSContext';
import { Booking, BookingStatus, Quote, Companion } from '../../types';

import { format, addDays, parseISO, startOfDay, differenceInDays } from 'date-fns';
import { usePricing } from '../../hooks/usePricing';
import { Globe, Megaphone, FileText, QrCode, Check, Users, CalendarRange } from 'lucide-react';

interface BookingFormProps {
  initialBooking?: Booking | null;
  initialQuote?: Quote | null;
  initialDate?: Date;
  initialUnitId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function BookingForm({ initialBooking, initialQuote, initialDate, initialUnitId, onSuccess, onCancel }: BookingFormProps) {
  const { addBooking, updateBooking, deleteBooking, bookings, units, unitTypes, ratePlans, bookingSources, updateQuote, templates, payments, addPayment, bookingColors } = usePMS();
  const { calculateTotal, getPriceForPlanAndDate, calculatePricingBreakdown } = usePricing();
  
  const defaultCheckIn = initialBooking 
    ? initialBooking.check_in
    : initialQuote 
      ? initialQuote.check_in 
      : initialDate 
        ? format(initialDate, 'yyyy-MM-dd') 
        : format(new Date(), 'yyyy-MM-dd');

  const defaultCheckOut = initialBooking
    ? initialBooking.check_out
    : initialQuote 
      ? initialQuote.check_out 
      : initialDate 
        ? format(addDays(initialDate, 1), 'yyyy-MM-dd') 
        : format(addDays(new Date(), 1), 'yyyy-MM-dd');

  const initialAvailableUnits = units.filter(unit => {
    const checkIn = startOfDay(parseISO(defaultCheckIn));
    const checkOut = startOfDay(parseISO(defaultCheckOut));
    const hasOverlap = bookings.some(b => {
      if (b.room_id !== unit.id) return false;
      if (initialBooking && b.id === initialBooking.id) return false;
      const bIn = startOfDay(parseISO(b.check_in));
      const bOut = startOfDay(parseISO(b.check_out));
      return (checkIn < bOut) && (checkOut > bIn);
    });
    return !hasOverlap;
  });

  const unitsWithPrice = initialAvailableUnits.map(u => {
    const ut = unitTypes.find(t => t.id === u.unit_type_id);
    return { ...u, base_price: ut?.base_price || 999999 };
  }).sort((a, b) => a.base_price - b.base_price);
  
  const cheapestAvailable = unitsWithPrice[0];
  const cheapestForQuoteUnitType = initialQuote?.unit_type_id 
    ? unitsWithPrice.find(u => u.unit_type_id === initialQuote.unit_type_id) 
    : cheapestAvailable;

  const defaultUnitTypeId = initialBooking?.unit_type_id || initialQuote?.unit_type_id || cheapestAvailable?.unit_type_id || unitTypes[0]?.id || '';
  const defaultRoomId = initialBooking?.room_id || initialUnitId || cheapestForQuoteUnitType?.id || '';

  const [formData, setFormData] = useState({
    first_name: initialBooking?.first_name || initialQuote?.first_name || '',
    last_name: initialBooking?.last_name || initialQuote?.last_name || '',
    email: initialBooking?.email || initialQuote?.email || '',
    phone: initialBooking?.phone || initialQuote?.phone || '',
    nationality: initialBooking?.nationality || initialQuote?.nationality || '',
    source: initialBooking?.source || initialQuote?.source || bookingSources[0] || '',
    unit_type_id: defaultUnitTypeId,
    room_id: defaultRoomId,
    rate_plan_id: initialBooking?.rate_plan_id || initialQuote?.rate_plan_id || ratePlans[0]?.id || '',
    notes: initialBooking?.notes || initialQuote?.notes || '',
    follow_up_date: initialBooking?.follow_up_date || initialQuote?.follow_up_date || format(new Date(), 'yyyy-MM-dd'),
    check_in: defaultCheckIn,
    check_out: defaultCheckOut,
    booking_status: initialBooking?.booking_status || (initialQuote?.status === 'pre_booked' ? 'pre_booked' : 'confirmed' as BookingStatus),
    discount_type: initialBooking?.discount_type || ('none' as 'none'|'percent'|'fixed'),
    discount_value: initialBooking?.discount_value || 0,
    pax: initialBooking?.pax || initialQuote?.pax || 1,
    extra_beds: initialBooking?.extra_beds || initialQuote?.extra_beds || 0,
    document_id: initialBooking?.document_id || '',
    dob: initialBooking?.dob || '',
    pre_checkin_completed: initialBooking?.pre_checkin_completed || false,
    companions: initialBooking?.companions || [] as Companion[],
    cancellation_reason: initialBooking?.cancellation_reason || ''
  });

  const [showCancellation, setShowCancellation] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: 0, method: 'credit_card', reference: '' });

  // Automatically update unit_type_id if room_id is selected
  useEffect(() => {
    if (formData.room_id) {
      const room = units.find(u => u.id === formData.room_id);
      if (room && room.unit_type_id !== formData.unit_type_id) {
        setFormData(prev => ({ ...prev, unit_type_id: room.unit_type_id }));
      }
    }
  }, [formData.room_id, units, formData.unit_type_id]);

  // Calculate Nights
  const totalNights = useMemo(() => {
    if (!formData.check_in || !formData.check_out) return 0;
    const checkIn = startOfDay(parseISO(formData.check_in));
    const checkOut = startOfDay(parseISO(formData.check_out));
    const nights = differenceInDays(checkOut, checkIn);
    return nights > 0 ? nights : 0;
  }, [formData.check_in, formData.check_out]);

  // Pricing Engine
  const pricing = useMemo(() => {
    const breakdown = calculatePricingBreakdown(formData.unit_type_id, formData.rate_plan_id, formData.check_in, formData.check_out, formData.extra_beds);
    const subtotal = breakdown.total;
    
    let discount = 0;
    if (formData.discount_type === 'percent') {
      discount = subtotal * (formData.discount_value / 100);
    } else if (formData.discount_type === 'fixed') {
      discount = formData.discount_value;
    }
    
    const total_amount = Math.max(0, subtotal - discount);

    return { ...breakdown, subtotal, discount, total_amount };
  }, [formData.unit_type_id, formData.rate_plan_id, formData.check_in, formData.check_out, formData.extra_beds, formData.discount_type, formData.discount_value, calculatePricingBreakdown]);

  const getRoomName = () => {
    if (!formData.room_id) return '';
    const unit = units.find(u => u.id === formData.room_id);
    return unit ? unit.name : '';
  };

  const parseTemplate = (content: string) => {
    let text = content;
    
    const formatDate = (dateStr: string) => {
      if (!dateStr) return '';
      try { return format(parseISO(dateStr), 'dd/MM/yyyy'); }
      catch { return dateStr; }
    };

    // Support BOTH CamelCase and lowercase tags
    text = text.replace(/{{Nombre_Cliente}}/g, `${formData.first_name} ${formData.last_name}`.trim());
    text = text.replace(/{{nombre}}/g, formData.first_name || 'Cliente');
    text = text.replace(/{{apellido}}/g, formData.last_name || '');
    
    text = text.replace(/{{Nombre_Propiedad}}/g, 'Propiedad');
    text = text.replace(/{{ID_Reserva}}/g, initialBooking?.confirmation_id || '');
    text = text.replace(/{{Tipo_Habitacion_Unidad}}/g, getRoomName() || (formData.unit_type_id ? unitTypes.find(u => u.id === formData.unit_type_id)?.name || '' : ''));
    text = text.replace(/{{Cantidad_Noches}}/g, String(totalNights));
    
    text = text.replace(/{{Fecha_CheckIn}}/g, formatDate(formData.check_in));
    text = text.replace(/{{check_in}}/g, formatDate(formData.check_in));
    
    text = text.replace(/{{Hora_CheckIn}}/g, '14:00');
    
    text = text.replace(/{{Fecha_CheckOut}}/g, formatDate(formData.check_out));
    text = text.replace(/{{check_out}}/g, formatDate(formData.check_out));
    
    text = text.replace(/{{Hora_CheckOut}}/g, '11:00');
    text = text.replace(/{{Link_Google_Maps}}/g, 'https://maps.app.goo.gl/...');
    text = text.replace(/{{Estado_Pago}}/g, bookingColors[formData.booking_status]?.label || '');
    text = text.replace(/{{Moneda}}/g, 'USD');
    text = text.replace(/{{Saldo_Pendiente}}/g, formData.booking_status === 'confirmed' ? '0' : pricing.total_amount.toLocaleString());
    text = text.replace(/{{Link_Pre_CheckIn}}/g, `http://localhost:3000/precheckin/${initialBooking?.id || ''}`);
    text = text.replace(/{{Monto_A_Pagar}}/g, pricing.total_amount.toLocaleString());
    text = text.replace(/{{Fecha_Limite_Pago}}/g, formatDate(formData.check_in));
    text = text.replace(/{{Link_Pago}}/g, 'https://pago.hotelflow.com/checkout');
    text = text.replace(/{{Diferencia_Precio}}/g, '0');
    
    text = text.replace(/{{Precio_Total}}/g, pricing.total_amount.toLocaleString());
    text = text.replace(/{{total}}/g, `$${pricing.total_amount.toLocaleString()} USD`);
    
    text = text.replace(/{{Link_Resumen_Reserva}}/g, 'https://hotelflow.com/reserva/' + (initialBooking?.confirmation_id || ''));
    text = text.replace(/{{Politica_Cancelacion_Aplicada}}/g, 'Cancelación Estándar');
    text = text.replace(/{{Detalle_Reembolso_O_Credito}}/g, 'N/A');
    
    // Replace guide links
    text = text.replace(/{{link_guia_bariloche}}/g, 'https://hotelflow.app/guias/bariloche-completa.pdf');
    text = text.replace(/{{link_guia_gastronomica}}/g, 'https://hotelflow.app/guias/bariloche-gastronomia.pdf');
    text = text.replace(/{{link_guia_rutas}}/g, 'https://hotelflow.app/guias/bariloche-rutas.pdf');
    
    return encodeURIComponent(text);
  };

  // Calculate available rooms for the selected dates
  const availableUnits = useMemo(() => {
    if (!formData.check_in || !formData.check_out) return [];
    const checkIn = startOfDay(parseISO(formData.check_in));
    const checkOut = startOfDay(parseISO(formData.check_out));

    return units.filter(unit => {
      // Must match selected type if chosen
      if (formData.unit_type_id && unit.unit_type_id !== formData.unit_type_id) return false;

      // Check if this unit has any overlapping bookings (excluding the booking currently being edited)
      const hasOverlap = bookings.some(b => {
        if (b.room_id !== unit.id) return false;
        if (b.booking_status === 'cancelled') return false; // Ignore cancelled bookings
        if (initialBooking && b.id === initialBooking.id) return false; // Ignore self

        const bIn = startOfDay(parseISO(b.check_in));
        const bOut = startOfDay(parseISO(b.check_out));
        return (checkIn < bOut) && (checkOut > bIn);
      });
      return !hasOverlap;
    });
  }, [formData.check_in, formData.check_out, units, bookings, initialBooking, formData.unit_type_id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let assignedPropertyId = initialBooking?.property_id || initialQuote?.property_id;
    if (formData.room_id) {
      const room = units.find(u => u.id === formData.room_id);
      if (room) {
        assignedPropertyId = room.property_id;
      }
    }

    const newBooking: Booking = {
      id: initialBooking ? initialBooking.id : `b_${Date.now()}`,
      property_id: assignedPropertyId as string,
      confirmation_id: initialBooking?.confirmation_id || `RES-${format(new Date(), 'yyyyMMdd')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      quote_id: initialQuote ? initialQuote.id : undefined,
      unit_type_id: formData.unit_type_id,
      room_id: formData.room_id,
      rate_plan_id: formData.rate_plan_id,
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      phone: formData.phone,
      nationality: formData.nationality,
      document_id: formData.document_id,
      dob: formData.dob,
      pre_checkin_completed: formData.pre_checkin_completed,
      source: formData.source,
      check_in: formData.check_in,
      check_out: formData.check_out,
      booking_status: formData.booking_status,
      total_nights: totalNights,
      subtotal: pricing.subtotal,
      discount_type: formData.discount_type,
      discount_value: formData.discount_value,
      total_amount: pricing.total_amount,
      notes: formData.notes,
      follow_up_date: formData.follow_up_date,
      pax: formData.pax,
      extra_beds: formData.extra_beds,
      companions: formData.companions,
      cancellation_reason: formData.cancellation_reason,
      created_at: initialBooking?.created_at || new Date().toISOString()
    };

    if (initialBooking) {
      updateBooking(newBooking);
    } else {
      addBooking(newBooking);
    }

    // If this came from a Quote, mark it as won
    if (initialQuote) {
      updateQuote({ ...initialQuote, status: 'booked' });
    }

    onSuccess();
  };

  const handlePrintRegistration = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${initialBooking?.confirmation_id || initialBooking?.id || 'NUEVA_RESERVA'}</title>
            <style>
              body { font-family: system-ui, sans-serif; padding: 40px; color: #1e293b; max-width: 800px; margin: 0 auto; }
              .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e2e8f0; }
              .header h1 { margin: 0; color: #334155; font-size: 24px; text-transform: uppercase; letter-spacing: 2px; }
              .header p { margin: 5px 0 0; color: #64748b; font-size: 14px; }
              .section-title { font-size: 16px; font-weight: bold; color: #475569; margin: 25px 0 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
              .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px 30px; margin-bottom: 20px; }
              .field { margin-bottom: 10px; }
              .label { font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; margin-bottom: 3px; display: block; }
              .value { font-size: 14px; color: #0f172a; border-bottom: 1px dotted #cbd5e1; padding-bottom: 2px; min-height: 20px; }
              .terms { margin-top: 40px; font-size: 10px; color: #64748b; text-align: justify; line-height: 1.5; padding: 20px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
              .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 60px; }
              .signature-box { text-align: center; }
              .signature-line { border-top: 1px solid #334155; margin-bottom: 10px; padding-top: 5px; font-size: 12px; font-weight: bold; color: #475569; }
              @media print {
                @page { margin: 15mm; }
                body { padding: 0; }
                .terms { background: none; border: none; padding: 10px 0; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Ficha de Registro de Huésped</h1>
              <p>Registration Card</p>
            </div>

            <div class="section-title">Datos del Huésped Principal</div>
            <div class="grid">
              <div class="field"><span class="label">Nombre / First Name</span><div class="value">${formData.first_name}</div></div>
              <div class="field"><span class="label">Apellido / Last Name</span><div class="value">${formData.last_name}</div></div>
              <div class="field"><span class="label">Nacionalidad / Nationality</span><div class="value">${formData.nationality || ''}</div></div>
              <div class="field"><span class="label">Documento o Pasaporte / ID or Passport</span><div class="value"></div></div>
              <div class="field"><span class="label">Teléfono / Phone</span><div class="value">${formData.phone || ''}</div></div>
              <div class="field"><span class="label">Email</span><div class="value">${formData.email || ''}</div></div>
            </div>

            ${formData.companions && formData.companions.length > 0 ? `
            <div class="section-title">Acompañantes Registrados</div>
            ${formData.companions.map((c, i) => `
              <div style="font-weight: bold; margin-top: 10px; font-size: 12px; color: #64748b;">Acompañante ${i+1}</div>
              <div class="grid">
                <div class="field"><span class="label">Nombre / First Name</span><div class="value">${c.firstName}</div></div>
                <div class="field"><span class="label">Apellido / Last Name</span><div class="value">${c.lastName}</div></div>
                <div class="field"><span class="label">Documento o Pasaporte / ID or Passport</span><div class="value">${c.documentId}</div></div>
                <div class="field"><span class="label">Fecha de Nac. / DOB</span><div class="value">${c.dob ? format(parseISO(c.dob), 'dd/MM/yyyy') : ''}</div></div>
              </div>
            `).join('')}
            ` : ''}

            ${Array.from({ length: Math.max(0, (formData.pax || 1) - 1 - (formData.companions?.length || 0)) }).map((_, i) => `
              <div class="section-title" style="border:none; margin-bottom:5px;">Acompañante ${(formData.companions?.length || 0) + i + 1} (A Completar)</div>
              <div class="grid">
                <div class="field"><span class="label">Nombre / First Name</span><div class="value"></div></div>
                <div class="field"><span class="label">Apellido / Last Name</span><div class="value"></div></div>
                <div class="field"><span class="label">Documento o Pasaporte / ID or Passport</span><div class="value"></div></div>
                <div class="field"><span class="label">Fecha de Nac. / DOB</span><div class="value"></div></div>
              </div>
            `).join('')}

            <div class="section-title" style="margin-top: 30px;">Datos de la Estadía</div>
            <div class="grid">
              <div class="field"><span class="label">Check-in</span><div class="value">${formData.check_in ? format(parseISO(formData.check_in), 'dd/MM/yyyy') : ''}</div></div>
              <div class="field"><span class="label">Check-out</span><div class="value">${formData.check_out ? format(parseISO(formData.check_out), 'dd/MM/yyyy') : ''}</div></div>
              <div class="field"><span class="label">Habitación / Room</span><div class="value">${getRoomName() || 'A designar al momento del check-in'}</div></div>
              <div class="field"><span class="label">Noches Totales / Total Nights</span><div class="value">${totalNights}</div></div>
              <div class="field"><span class="label">Pasajeros / Pax</span><div class="value">${formData.pax || 1}</div></div>
              <div class="field"><span class="label">Camas Extra / Extra Beds</span><div class="value">${formData.extra_beds || 0}</div></div>
            </div>

            <div class="terms">
              <strong>TÉRMINOS Y CONDICIONES GENERALES DE ALOJAMIENTO</strong><br><br>
              <strong>1. Check-in y Check-out:</strong> El horario de ingreso (Check-in) es a partir de las 14:00 hrs. El horario de salida (Check-out) es a las 10:00 hrs. El late check-out está sujeto a disponibilidad y puede generar cargos adicionales.<br>
              <strong>2. Pagos:</strong> El pago total de la reserva o su saldo pendiente debe ser cancelado al momento del ingreso.<br>
              <strong>3. Daños y Perjuicios:</strong> El huésped es responsable de cualquier daño o faltante ocasionado en la habitación durante su estadía, cuyo costo será cargado a su cuenta.<br>
              <strong>4. Políticas Libres de Humo:</strong> Se encuentra estrictamente prohibido fumar en el interior de las habitaciones y espacios cerrados. El incumplimiento resultará en una multa por limpieza profunda.<br>
              <strong>5. Mascotas:</strong> Solo se permite el ingreso de mascotas en habitaciones específicamente designadas y con autorización previa de la gerencia.<br>
              <br>
              <em>Con mi firma, declaro haber leído, comprendido y aceptado los términos y condiciones del establecimiento, y confirmo que los datos proporcionados son correctos. / By signing below, I acknowledge that I have read, understood and agree to the terms and conditions of the establishment, and confirm that the details provided are correct.</em>
            </div>

            <div class="signatures">
              <div class="signature-box">
                <br><br><br>
                <div class="signature-line">Firma del Huésped / Guest Signature</div>
                Aclaración: ${formData.first_name} ${formData.last_name}
              </div>
              <div class="signature-box">
                <br><br><br>
                <div class="signature-line">Recepción / Front Desk</div>
                Firma y Sello
              </div>
            </div>
            
            <script>
              window.onload = () => { window.print(); window.close(); };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const [crmSearch, setCrmSearch] = useState('');
  const [showCrmResults, setShowCrmResults] = useState(false);
  const crmResults = useMemo(() => {
    if (crmSearch.length < 2) return [];
    const query = crmSearch.toLowerCase();
    const uniqueGuests = new Map<string, Booking>();
    bookings.forEach(b => {
      const match = b.first_name.toLowerCase().includes(query) || 
                    b.last_name.toLowerCase().includes(query) ||
                    (b.document_id && b.document_id.toLowerCase().includes(query)) ||
                    (b.email && b.email.toLowerCase().includes(query));
      if (match) {
        const key = b.email || b.document_id || `${b.first_name} ${b.last_name}`;
        if (!uniqueGuests.has(key)) {
          uniqueGuests.set(key, b);
        }
      }
    });
    return Array.from(uniqueGuests.values()).slice(0, 5);
  }, [crmSearch, bookings]);

  const handleCrmSelect = (b: Booking) => {
    setFormData({
      ...formData,
      first_name: b.first_name,
      last_name: b.last_name,
      email: b.email || '',
      phone: b.phone || '',
      nationality: b.nationality || '',
      document_id: b.document_id || '',
      dob: b.dob || ''
    });
    setCrmSearch('');
    setShowCrmResults(false);
  };

  const inputClass = "w-full border border-white/40 bg-white/50 backdrop-blur-sm rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white outline-none transition-all shadow-sm font-medium placeholder-slate-400 text-ellipsis overflow-hidden whitespace-nowrap";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {initialBooking?.created_at && (
        <div className="flex items-center gap-4 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ID:</span>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
              {initialBooking.confirmation_id || initialBooking.id}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Creada el:</span>
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
              {format(parseISO(initialBooking.created_at), 'dd/MM/yyyy HH:mm')}
            </span>
          </div>
        </div>
      )}

      {formData.pre_checkin_completed && (
        <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg border border-emerald-200 flex items-center gap-2">
          <Check className="w-5 h-5" />
          <span className="font-bold text-sm">Ficha de Registro Completada (Pre Check-in Express)</span>
        </div>
      )}

      {/* BLOQUE 1: CRM (Datos del Huésped) */}
      <section className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative z-40">
        <h4 className="text-indigo-800 font-black text-sm flex items-center gap-2 tracking-wide mb-5 uppercase">
          <svg className="w-5 h-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          Datos del Huésped
        </h4>
        
        {/* BUSCADOR CRM PROMINENTE */}
        <div className="relative w-full mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <input 
            type="text" 
            placeholder="Buscar por Nombre o DNI para autocompletar huésped recurrente..." 
            value={crmSearch}
            onChange={e => { setCrmSearch(e.target.value); setShowCrmResults(true); }}
            onFocus={() => setShowCrmResults(true)}
            className="w-full bg-indigo-50/50 border-2 border-indigo-100 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-800 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none placeholder:text-slate-500 font-bold shadow-sm transition-all"
          />
          {showCrmResults && crmSearch.length >= 2 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden">
              {crmResults.length > 0 ? (
                crmResults.map(b => (
                  <button type="button" key={b.id} onClick={() => handleCrmSelect(b)} className="w-full text-left px-5 py-3 hover:bg-indigo-50 border-b border-slate-100 last:border-0 transition-colors flex items-center justify-between group">
                    <div>
                      <div className="font-black text-sm text-slate-800 group-hover:text-indigo-700">{b.first_name} {b.last_name}</div>
                      <div className="text-xs text-slate-500 font-medium">{b.email || b.document_id || 'Sin email'}</div>
                    </div>
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-1 rounded">Autocompletar</span>
                  </button>
                ))
              ) : (
                <div className="px-5 py-4 text-sm text-slate-500 text-center italic">No se encontraron huéspedes con ese criterio</div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Nombre</label>
            <input required type="text" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Apellido</label>
            <input required type="text" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
            <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Teléfono</label>
            <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className={inputClass} />
          </div>
        </div>

        <details className="group">
          <summary className="text-sm font-bold text-indigo-600 cursor-pointer list-none flex items-center gap-1 hover:text-indigo-700 transition-colors select-none">
            <span className="group-open:rotate-90 transition-transform">▸</span> Datos Adicionales (Opcional)
          </summary>
          <div className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">DNI / Pasaporte</label>
              <input type="text" value={formData.document_id} onChange={e => setFormData({...formData, document_id: e.target.value})} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">F. Nacimiento</label>
              <input type="date" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Nacionalidad</label>
              <input type="text" value={formData.nationality} onChange={e => setFormData({...formData, nationality: e.target.value})} className={inputClass} />
            </div>
          </div>
        </details>
      </section>

      {/* BLOQUE 2: FECHAS Y DISPONIBILIDAD */}
      <section className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <h4 className="text-indigo-800 font-black text-sm flex items-center gap-2 mb-5 tracking-wide uppercase">
          <svg className="w-5 h-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M17 14h-6"/><path d="M13 18H7"/><path d="M7 14h.01"/><path d="M17 18h.01"/></svg>
          Fechas y Disponibilidad
        </h4>
        
        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-200 overflow-hidden">
          <div className="min-w-0">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Check In</label>
            <input 
              required type="date" value={formData.check_in}
              onChange={e => setFormData({...formData, check_in: e.target.value, room_id: ''})}
              className="w-full bg-transparent font-black text-slate-900 outline-none truncate"
            />
          </div>
          
          <div className="flex flex-col items-center px-2 md:px-4 border-x border-slate-200 shrink-0">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Noches</label>
            <div className="flex items-center gap-1 md:gap-2 bg-white border border-slate-300 rounded-lg px-1 md:px-2 py-1 shadow-sm">
              <button type="button" onClick={() => {
                const n = Math.max(1, totalNights - 1);
                if (formData.check_in) {
                  setFormData({...formData, check_out: format(addDays(parseISO(formData.check_in), n), 'yyyy-MM-dd'), room_id: ''});
                }
              }} className="text-slate-400 hover:text-indigo-600 font-bold px-1">−</button>
              <span className="font-black text-indigo-700 w-4 md:w-6 text-center">{totalNights}</span>
              <button type="button" onClick={() => {
                const n = totalNights + 1;
                if (formData.check_in) {
                  setFormData({...formData, check_out: format(addDays(parseISO(formData.check_in), n), 'yyyy-MM-dd'), room_id: ''});
                }
              }} className="text-slate-400 hover:text-indigo-600 font-bold px-1">+</button>
            </div>
          </div>

          <div className="min-w-0 text-right">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Check Out</label>
            <input 
              required type="date" min={formData.check_in} value={formData.check_out}
              onChange={e => setFormData({...formData, check_out: e.target.value, room_id: ''})}
              className="w-full bg-transparent font-black text-slate-900 outline-none text-right truncate"
            />
          </div>
        </div>

        {/* Categorías como pastillas visuales */}
        <div className="mb-4">
          <label className="block text-sm font-bold text-slate-700 mb-2">Categoría de Habitación</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {unitTypes.map(ut => {
              const isSelected = formData.unit_type_id === ut.id;
              const utPrice = pricing.total_amount > 0 && formData.unit_type_id === ut.id 
                ? pricing.total_amount 
                : (() => {
                    const bd = calculatePricingBreakdown(ut.id, formData.rate_plan_id, formData.check_in, formData.check_out, formData.extra_beds);
                    return bd.total;
                  })();
              const allPrices = unitTypes.map(u => {
                const bd = calculatePricingBreakdown(u.id, formData.rate_plan_id, formData.check_in, formData.check_out, formData.extra_beds);
                return bd.total;
              });
              const isCheapest = Math.min(...allPrices) === (() => {
                const bd = calculatePricingBreakdown(ut.id, formData.rate_plan_id, formData.check_in, formData.check_out, formData.extra_beds);
                return bd.total;
              })();

              return (
                <div
                  key={ut.id}
                  onClick={() => setFormData({...formData, unit_type_id: ut.id, room_id: ''})}
                  className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-1 ${
                    isSelected ? 'bg-indigo-50 border-indigo-600 shadow-md ring-1 ring-indigo-600/20' : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm'
                  }`}
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
                  <h5 className={`font-bold text-sm truncate w-full ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>{ut.name}</h5>
                  <div className={`text-lg font-black ${isSelected ? 'text-indigo-600' : 'text-slate-900'}`}>
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

        {/* Plan tarifario como pastillas */}
        <div className="mb-4">
          <label className="block text-sm font-bold text-slate-700 mb-2">Plan Tarifario</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ratePlans.map(rp => (
              <div
                key={rp.id}
                onClick={() => setFormData({...formData, rate_plan_id: rp.id})}
                className={`cursor-pointer border p-3 rounded-xl transition-all flex flex-col justify-center gap-1 ${
                  formData.rate_plan_id === rp.id
                    ? 'bg-amber-50 border-amber-500 shadow-md ring-1 ring-amber-500/20'
                    : 'bg-white border-slate-200 hover:border-amber-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`font-bold text-sm ${formData.rate_plan_id === rp.id ? 'text-amber-900' : 'text-slate-700'}`}>{rp.name}</span>
                  {formData.rate_plan_id === rp.id && <Check className="w-4 h-4 text-amber-600" />}
                </div>
                {(rp.meal_plan || rp.cancellation_policy) && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {rp.meal_plan && <span className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-500 font-medium">{rp.meal_plan}</span>}
                    {rp.cancellation_policy && <span className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-500 font-medium">{rp.cancellation_policy}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Habitación Asignada */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Habitación Asignada</label>
          <select 
            value={formData.room_id}
            onChange={e => {
              const selectedRoom = units.find(u => u.id === e.target.value);
              setFormData({
                ...formData, 
                room_id: e.target.value,
                unit_type_id: selectedRoom ? selectedRoom.unit_type_id : formData.unit_type_id
              });
            }}
            className={inputClass}
          >
            <option value="">Flotante (Sin Asignar)</option>
            {availableUnits.map(unit => {
              const type = unitTypes.find(ut => ut.id === unit.unit_type_id);
              return <option key={unit.id} value={unit.id}>{unit.name} ({type?.name})</option>;
            })}
          </select>
        </div>
      </section>

      {/* BLOQUE 3: CIERRE */}
      <section className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 border border-indigo-700/50 rounded-3xl p-6 shadow-2xl z-30 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1542314831-c6a4d14faaf2?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay"></div>
        <div className="relative z-10">
        {/* Origen */}
        <div className="mb-5">
          <label className="block text-xs font-bold text-indigo-200 uppercase tracking-widest mb-3">Canal de Origen</label>
          <div className="flex flex-wrap gap-2">
            {bookingSources.map(s => {
              const icons: Record<string, string> = {
                'WhatsApp': '💬', 'Email': '📧', 'Teléfono': '📞', 'Instagram': '📸',
                'Booking.com': '🏨', 'Web': '🌐', 'Walk-in': '🚶', 'Airbnb': '🏠'
              };
              const emoji = icons[s] || '📌';
              const isSelected = formData.source === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFormData({...formData, source: s})}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                    isSelected
                      ? 'bg-emerald-400 border-emerald-300 text-emerald-900 shadow-lg shadow-emerald-400/20'
                      : 'bg-white/10 border-white/20 text-indigo-200 hover:bg-white/20 hover:text-white'
                  }`}
                >
                  <span>{emoji}</span> {s}
                </button>
              );
            })}
          </div>
        </div>

        {/* Pax + Camas en fila de 2 */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Huéspedes Stepper */}
          <div className="bg-white/10 border border-white/20 rounded-2xl p-4 flex flex-col items-center gap-2">
            <label className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Huéspedes</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const newPax = Math.max(1, formData.pax - 1);
                  setFormData({...formData, pax: newPax, companions: formData.companions.slice(0, newPax - 1)});
                }}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white font-black text-lg flex items-center justify-center transition-all active:scale-95"
              >−</button>
              <span className="text-3xl font-black text-white w-8 text-center">{formData.pax}</span>
              <button
                type="button"
                onClick={() => setFormData({...formData, pax: formData.pax + 1})}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white font-black text-lg flex items-center justify-center transition-all active:scale-95"
              >+</button>
            </div>
            <span className="text-[10px] text-indigo-300 font-medium">
              {formData.pax === 1 ? '1 persona' : `${formData.pax} personas`}
            </span>
          </div>

          {/* Camas Extra Stepper */}
          <div className="bg-white/10 border border-white/20 rounded-2xl p-4 flex flex-col items-center gap-2">
            <label className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Camas Extra</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFormData({...formData, extra_beds: Math.max(0, formData.extra_beds - 1)})}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white font-black text-lg flex items-center justify-center transition-all active:scale-95"
              >−</button>
              <span className="text-3xl font-black text-white w-8 text-center">{formData.extra_beds}</span>
              <button
                type="button"
                onClick={() => setFormData({...formData, extra_beds: formData.extra_beds + 1})}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white font-black text-lg flex items-center justify-center transition-all active:scale-95"
              >+</button>
            </div>
            <span className="text-[10px] text-indigo-300 font-medium">
              {formData.extra_beds === 0 ? 'Sin camas extra' : `${formData.extra_beds} cama${formData.extra_beds > 1 ? 's' : ''} extra`}
            </span>
          </div>
        </div>

        {/* Estado de Pago — full width */}
        <div className="bg-white/10 border border-white/20 rounded-2xl p-4 flex flex-col gap-3 mb-5">
          <label className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Estado de Pago</label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(bookingColors).map(([key, config]) => {
              const isSelected = formData.booking_status === key;
              const statusIcons: Record<string, string> = {
                confirmed: '✅', pending: '⏳', pre_booked: '🔒', cancelled: '❌',
                no_show: '👻', checked_in: '🏨', checked_out: '🚪', overdue: '⚠️'
              };
              const icon = statusIcons[key] || '•';
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFormData({...formData, booking_status: key as BookingStatus})}
                  className={`py-2.5 px-4 rounded-xl font-bold text-xs transition-all flex items-center gap-2 border-2 whitespace-nowrap ${
                    isSelected
                      ? `${config.colorClass} border-white/40 shadow-lg scale-[1.03]`
                      : 'bg-white/10 border-white/10 text-indigo-200 hover:bg-white/20 hover:border-white/20'
                  }`}
                >
                  <span>{icon}</span>
                  <span>{config.label}</span>
                  {isSelected && <span className="text-[10px] font-black opacity-80">✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Pricing Engine Break Down */}
        <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 flex flex-col gap-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-indigo-100 font-bold">Tarifa Base ({totalNights} noches a ${pricing.nightlyAvg}/noche)</span>
            <span className="font-black text-white">${pricing.baseTotal}</span>
          </div>

          {pricing.extraBedTotal > 0 && (
            <div className="flex justify-between items-center text-sm text-emerald-300">
              <span className="font-bold">Camas Adicionales ({formData.extra_beds} x {totalNights} noches a ${pricing.extraBedNightlyAvg}/noche)</span>
              <span className="font-bold">${pricing.extraBedTotal}</span>
            </div>
          )}
          
          <div className="flex items-center gap-3 mt-2 border-t border-white/10 pt-3">
            <select value={formData.discount_type} onChange={e => setFormData({...formData, discount_type: e.target.value as any})} className="bg-white/20 border border-white/30 rounded-lg px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-emerald-400 [&>option]:text-slate-900">
              <option value="none">Sin Descuento extra</option>
              <option value="percent">Descuento (%)</option>
              <option value="fixed">Descuento ($)</option>
            </select>
            {formData.discount_type !== 'none' && (
              <div className="relative w-24">
                <input type="number" min="0" value={formData.discount_value} onChange={e => setFormData({...formData, discount_value: parseFloat(e.target.value) || 0})} className="w-full bg-white/20 border border-white/30 rounded-lg pl-6 pr-2 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-emerald-400" />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-200 text-xs font-bold">{formData.discount_type === 'percent' ? '%' : '$'}</span>
              </div>
            )}
            {pricing.discount > 0 && <span className="ml-auto text-sm text-emerald-400 font-bold">-${pricing.discount}</span>}
          </div>

          <div className="pt-4 border-t border-white/10 flex justify-between items-center">
            <span className="font-bold text-indigo-50 text-lg">Total Reserva</span>
            <span className="text-4xl font-black text-emerald-400">${pricing.total_amount}</span>
          </div>

          {/* Pagos Section */}
          {initialBooking && (
            <div className="pt-4 mt-2 border-t border-white/10">
              <div className="flex justify-between items-center mb-3">
                <span className="font-bold text-indigo-50">Estado de Cuenta</span>
                <button type="button" onClick={() => setShowPaymentForm(!showPaymentForm)} className="text-xs font-bold text-indigo-900 bg-indigo-100 px-3 py-1.5 rounded-lg hover:bg-white transition-colors">
                  + Registrar Pago
                </button>
              </div>
              
              {showPaymentForm && (
                <div className="bg-white border border-indigo-100 p-3 rounded-lg mb-3 flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Monto</label>
                    <input type="number" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: parseFloat(e.target.value) || 0})} className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Método</label>
                    <select value={paymentForm.method} onChange={e => setPaymentForm({...paymentForm, method: e.target.value})} className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm bg-white">
                      <option value="cash">Efectivo</option>
                      <option value="credit_card">Tarjeta Crédito</option>
                      <option value="debit_card">Tarjeta Débito</option>
                      <option value="bank_transfer">Transferencia</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Ref (Opcional)</label>
                    <input type="text" value={paymentForm.reference} onChange={e => setPaymentForm({...paymentForm, reference: e.target.value})} className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" />
                  </div>
                  <button type="button" onClick={() => {
                    if(paymentForm.amount <= 0) { alert('Monto inválido'); return; }
                    addPayment({
                      id: `pay_${Date.now()}`,
                      booking_id: initialBooking.id,
                      amount: paymentForm.amount,
                      currency: 'USD',
                      method: paymentForm.method,
                      status: 'completed',
                      date: new Date().toISOString(),
                      reference: paymentForm.reference
                    });
                    setShowPaymentForm(false);
                    setPaymentForm({ amount: 0, method: 'credit_card', reference: '' });
                  }} className="bg-indigo-600 text-white px-3 py-1.5 rounded text-sm font-bold hover:bg-indigo-700">Guardar</button>
                </div>
              )}

              <div className="space-y-2 mb-3 max-h-32 overflow-y-auto">
                {payments.filter(p => p.booking_id === initialBooking.id).map(p => (
                  <div key={p.id} className="flex justify-between items-center bg-white/10 border border-white/5 p-2 rounded text-sm">
                    <div>
                      <span className="font-bold text-white">${p.amount}</span>
                      <span className="text-xs text-indigo-200 ml-2 uppercase">{p.method}</span>
                    </div>
                    <span className="text-xs text-indigo-200">{format(parseISO(p.date), 'dd/MM/yy HH:mm')}</span>
                  </div>
                ))}
                {payments.filter(p => p.booking_id === initialBooking.id).length === 0 && (
                  <p className="text-xs text-indigo-200 italic text-center py-2">No hay pagos registrados.</p>
                )}
              </div>

              <div className="flex justify-between items-center text-sm bg-white/20 px-3 py-2 rounded-lg">
                <span className="font-bold text-indigo-50">Saldo Pendiente</span>
                <span className={`font-black ${pricing.total_amount - payments.filter(p => p.booking_id === initialBooking.id && p.status === 'completed').reduce((acc, p) => acc + p.amount, 0) <= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                  ${Math.max(0, pricing.total_amount - payments.filter(p => p.booking_id === initialBooking.id && p.status === 'completed').reduce((acc, p) => acc + p.amount, 0))}
                </span>
              </div>
            </div>
          )}

          <div className="mt-4 bg-white/5 border-l-4 border-emerald-400 p-4 rounded-r-xl shadow-sm">
            <label className="flex items-center gap-2 text-sm font-black text-emerald-100 mb-2">
              <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z"/><path d="M15 3v6h6"/></svg>
              Nota Interna
            </label>
            <textarea 
              rows={3}
              value={formData.notes || ''} 
              onChange={e => setFormData({...formData, notes: e.target.value})} 
              placeholder="Comentarios adicionales, requerimientos especiales o notas exclusivas para el staff..."
              className="w-full bg-transparent border-0 border-b border-white/20 px-0 py-2 text-sm text-white focus:ring-0 focus:border-emerald-400 placeholder:text-white/50 resize-none font-medium outline-none" 
            />
          </div>
        </div>
        </div>
      </section>

      {/* BLOQUE CANCELACION UI */}
      {showCancellation && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mt-4 animate-in fade-in slide-in-from-bottom-4">
          <h4 className="text-red-700 font-bold text-sm mb-3">Motivo de Cancelación</h4>
          <p className="text-xs text-red-600 mb-3">Por favor selecciona un motivo o escribe uno nuevo. Esta acción liberará el inventario.</p>
          <input 
            type="text" 
            list="cxl-reasons"
            value={formData.cancellation_reason}
            onChange={e => setFormData({...formData, cancellation_reason: e.target.value})}
            className="w-full border-2 border-red-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none font-bold mb-4"
            placeholder="Ej: No Show, Problemas de salud..."
          />
          <datalist id="cxl-reasons">
            <option value="No Show" />
            <option value="Cambio de planes" />
            <option value="Problemas de salud" />
            <option value="Fuerza mayor / Clima" />
            <option value="Duplicada / Error" />
          </datalist>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowCancellation(false)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-red-100 rounded-lg transition-colors">
              Abortar
            </button>
            <button type="button" onClick={(e) => {
              if(!formData.cancellation_reason) { alert("Ingresa un motivo de cancelación"); return; }
              // Force update the form data and trigger submit manually with the right data
              const finalData = { ...formData, booking_status: 'cancelled' as BookingStatus };
              setFormData(finalData);
              
              // Direct submission logic to avoid closure issues
              let assignedPropertyId = initialBooking?.property_id || initialQuote?.property_id;
              if (finalData.room_id) {
                const room = units.find(u => u.id === finalData.room_id);
                if (room) assignedPropertyId = room.property_id;
              }
              const newBooking: Booking = {
                id: initialBooking ? initialBooking.id : `b_${Date.now()}`,
                property_id: assignedPropertyId as string,
                confirmation_id: initialBooking?.confirmation_id,
                quote_id: initialQuote ? initialQuote.id : undefined,
                unit_type_id: finalData.unit_type_id,
                room_id: finalData.room_id,
                rate_plan_id: finalData.rate_plan_id,
                first_name: finalData.first_name,
                last_name: finalData.last_name,
                email: finalData.email,
                phone: finalData.phone,
                nationality: finalData.nationality,
                document_id: finalData.document_id,
                dob: finalData.dob,
                pre_checkin_completed: finalData.pre_checkin_completed,
                source: finalData.source,
                check_in: finalData.check_in,
                check_out: finalData.check_out,
                booking_status: 'cancelled',
                total_nights: totalNights,
                subtotal: pricing.subtotal,
                discount_type: finalData.discount_type,
                discount_value: finalData.discount_value,
                total_amount: pricing.total_amount,
                notes: finalData.notes,
                follow_up_date: finalData.follow_up_date,
                pax: finalData.pax,
                companions: finalData.companions,
                cancellation_reason: finalData.cancellation_reason,
                created_at: initialBooking?.created_at || new Date().toISOString()
              };
              if (initialBooking) updateBooking(newBooking);
              else addBooking(newBooking);
              onSuccess();
            }} className="px-4 py-2 text-sm font-black text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors">
              Confirmar Cancelación
            </button>
          </div>
        </div>
      )}

      <div className="pt-4 flex items-center justify-between">
        <div className="flex gap-3">
          {initialBooking && initialBooking.pre_checkin_completed ? (
            <button type="button" onClick={() => alert('Simulando escaneo de cámara QR...')} className="px-4 py-2 text-sm font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors flex items-center gap-2">
              <QrCode className="w-4 h-4" /> Escanear QR
            </button>
          ) : initialBooking ? (
            <button type="button" onClick={handlePrintRegistration} className="px-4 py-2 text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-2">
              <FileText className="w-4 h-4" /> Ficha de Registro
            </button>
          ) : null}
          
          {initialBooking && formData.booking_status !== 'cancelled' && !showCancellation && (
            <button type="button" onClick={() => setShowCancellation(true)} className="px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100">
              Cancelar Reserva
            </button>
          )}
          {initialBooking && !showCancellation && (
            <button type="button" onClick={() => {
              if(window.confirm('¿Estás seguro de eliminar DEFINITIVAMENTE esta reserva? Esto borrará el registro de la base de datos de manera irreversible.')) {
                deleteBooking(initialBooking.id);
                onSuccess();
              }
            }} className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-2">
              Eliminar
            </button>
          )}
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={onCancel} className="px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            Cerrar
          </button>
          <button id="submit-booking-btn" type="submit" className="px-6 py-3 text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors disabled:opacity-50" disabled={showCancellation}>
            {initialBooking ? 'Guardar Cambios' : (formData.room_id ? 'Confirmar Reserva' : 'Crear Reserva')}
          </button>
        </div>
      </div>
    </form>
  );
}
