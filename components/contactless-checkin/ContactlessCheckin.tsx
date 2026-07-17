'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePMS } from '../../context/PMSContext';
import { Companion } from '../../types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Check, User, Users, Calendar, ArrowRight, ArrowLeft, QrCode, 
  Upload, Shield, FileText, CreditCard, Gift, Wifi, MapPin, 
  Sparkles, Coffee, AlertCircle, Phone, Mail, Award
} from 'lucide-react';
import { ImageUpload } from '../ui/ImageUpload';

interface ContactlessCheckinProps {
  bookingId?: string;
  onComplete?: () => void;
}

export default function ContactlessCheckin({ bookingId, onComplete }: ContactlessCheckinProps) {
  const { bookings, updateBooking, properties, addActivity } = usePMS();
  
  const [booking, setBooking] = useState<any>(null);
  const [property, setProperty] = useState<any>(null);
  
  // App state
  const [isSearching, setIsSearching] = useState(!bookingId);
  const [searchCode, setSearchCode] = useState('');
  const [searchLastName, setSearchLastName] = useState('');
  const [searchError, setSearchError] = useState('');
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    nationality: '',
    document_id: '',
    dob: '',
    docFrontUrl: '',
    docBackUrl: '',
    companions: [] as Companion[],
    acceptedTerms: false,
    selectedAddons: [] as string[],
    signatureDataUrl: ''
  });

  // Canvas signature ref
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Load booking if ID is provided
  useEffect(() => {
    if (bookingId) {
      if (bookings.length > 0) {
        const b = bookings.find(x => x.id === bookingId || x.confirmation_id === bookingId);
        if (b) {
          selectBooking(b);
          return;
        }
      }
      
      const fetchBookingPublic = async () => {
        try {
          const res = await fetch(`/api/db?precheckinId=${encodeURIComponent(bookingId)}`);
          if (res.ok) {
            const data = await res.json();
            const found = (data.bookings || []).find((b: any) => b.id === bookingId || b.confirmation_id === bookingId);
            if (found) {
              selectBooking(found);
            } else {
              setIsSearching(true);
              setSearchError('No encontramos ninguna reserva con ese enlace. Ingresá el código manualmente.');
            }
          } else {
            setIsSearching(true);
            setSearchError('Error de red al cargar la reserva.');
          }
        } catch (e) {
          console.error("Error loading precheckin booking:", e);
          setIsSearching(true);
          setSearchError('Error al conectar con el servidor.');
        }
      };
      fetchBookingPublic();
    }
  }, [bookingId, bookings]);

  const selectBooking = (b: any) => {
    setBooking(b);
    const prop = properties.find(p => p.id === b.property_id);
    setProperty(prop || properties[0]);
    
    // Initialize form
    setFormData({
      email: b.email || '',
      phone: b.phone || '',
      nationality: b.nationality || '',
      document_id: b.document_id || '',
      dob: b.dob || '',
      docFrontUrl: b.pre_checkin_pending_data?.docFrontUrl || '',
      docBackUrl: b.pre_checkin_pending_data?.docBackUrl || '',
      companions: b.companions && b.companions.length > 0 
        ? b.companions 
        : Array(Math.max(0, (b.pax || 1) - 1)).fill(null).map(() => ({ firstName: '', lastName: '', documentId: '', dob: '' })),
      acceptedTerms: false,
      selectedAddons: b.pre_checkin_pending_data?.selectedAddons || [],
      signatureDataUrl: b.pre_checkin_pending_data?.signatureDataUrl || ''
    });

    if (b.pre_checkin_status === 'pending_review' || b.pre_checkin_status === 'approved' || b.pre_checkin_completed) {
      setIsSuccess(true);
    }
    setIsSearching(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError('');
    setIsSearching(true);
    
    if (!searchCode.trim() || !searchLastName.trim()) {
      setSearchError('Por favor ingresá el código de reserva y tu apellido.');
      setIsSearching(false);
      return;
    }

    try {
      const res = await fetch(`/api/db?searchCode=${encodeURIComponent(searchCode.trim())}&lastName=${encodeURIComponent(searchLastName.trim().toLowerCase())}`);
      if (res.ok) {
        const data = await res.json();
        const found = (data.bookings || []).find((b: any) => 
          (b.confirmation_id?.toLowerCase() === searchCode.toLowerCase().trim() || b.id === searchCode.trim()) &&
          b.last_name?.toLowerCase().trim() === searchLastName.toLowerCase().trim()
        );
        if (found) {
          selectBooking(found);
          return;
        }
      }
      setSearchError('No encontramos ninguna reserva con esos datos. Verificá y volvé a intentar.');
    } catch (err) {
      console.error(err);
      setSearchError('Error al buscar la reserva. Intenta de nuevo más tarde.');
    } finally {
      setIsSearching(false);
    }
  };

  // Addons available for upsell
  const availableAddons = [
    { id: 'early_checkin', name: 'Early Check-in (11:00 hs)', price: 20, desc: 'Ingresá antes a tu habitación y aprovechá la mañana', icon: Coffee },
    { id: 'late_checkout', name: 'Late Check-out (15:00 hs)', price: 25, desc: 'Extendé tu salida y descansá más el último día', icon: Calendar },
    { id: 'breakfast', name: 'Desayuno Buffet Premium (Diario)', price: 12, desc: 'Acceso ilimitado a nuestra panadería artesanal y jugos', icon: Sparkles },
    { id: 'transfer', name: 'Traslado al Aeropuerto / Centro', price: 30, desc: 'Viajá cómodo y seguro con nuestro transporte privado', icon: MapPin },
  ];

  const toggleAddon = (addonId: string) => {
    setFormData(prev => {
      const exists = prev.selectedAddons.includes(addonId);
      const selectedAddons = exists 
        ? prev.selectedAddons.filter(id => id !== addonId)
        : [...prev.selectedAddons, addonId];
      return { ...prev, selectedAddons };
    });
  };

  // Signature canvas handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#312e81'; // Deep Indigo
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    saveSignature();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setFormData(prev => ({ ...prev, signatureDataUrl: '' }));
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL();
    setFormData(prev => ({ ...prev, signatureDataUrl: dataUrl }));
  };

  // Step configs
  const DEFAULT_PRE_CHECKIN_FIELDS = {
    document_id: { enabled: true, required: true, label: 'Documento / Pasaporte' },
    dob: { enabled: true, required: true, label: 'Fecha de Nacimiento' },
    email: { enabled: true, required: true, label: 'Email' },
    nationality: { enabled: true, required: true, label: 'Nacionalidad' },
    phone: { enabled: true, required: false, label: 'Teléfono' },
    companions: { enabled: true, required: false, label: 'Acompañantes' }
  };

  const fieldConfigs = property?.pre_checkin_fields || DEFAULT_PRE_CHECKIN_FIELDS;

  const steps = [
    { id: 'intro', title: 'Bienvenido' },
    { id: 'titular', title: 'Tus Datos' },
    { id: 'documents', title: 'Documento ID' },
    ...(fieldConfigs.companions?.enabled && formData.companions.length > 0 
      ? formData.companions.map((_, i) => ({ id: `comp_${i}`, title: `Acompañante ${i+1}` })) 
      : []),
    { id: 'addons', title: 'Servicios Extra' },
    { id: 'terms', title: 'Firma y Envío' }
  ];

  const totalSteps = steps.length;

  const handleNext = () => {
    // Basic validation
    if (steps[currentStep].id === 'titular') {
      if (fieldConfigs.document_id.required && !formData.document_id) return alert('Por favor, completa tu Documento.');
      if (fieldConfigs.dob.required && !formData.dob) return alert('Por favor, completa tu Fecha de Nacimiento.');
      if (fieldConfigs.email.required && !formData.email) return alert('Por favor, completa tu Email.');
      if (fieldConfigs.nationality.required && !formData.nationality) return alert('Por favor, completa tu Nacionalidad.');
    }
    if (steps[currentStep].id === 'documents') {
      if (!formData.docFrontUrl) return alert('Por favor subí la foto de frente de tu documento.');
    }
    if (steps[currentStep].id.startsWith('comp_')) {
      const idx = parseInt(steps[currentStep].id.split('_')[1]);
      const comp = formData.companions[idx];
      if (!comp.firstName || !comp.lastName || !comp.documentId) {
        return alert(`Por favor, completa los campos requeridos del Acompañante ${idx + 1}.`);
      }
    }

    if (currentStep < totalSteps - 1) setCurrentStep(prev => prev + 1);
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.acceptedTerms) {
      alert('Por favor, acepta los términos y condiciones.');
      return;
    }
    if (!formData.signatureDataUrl) {
      alert('Por favor, realiza tu firma digital.');
      return;
    }

    setIsSubmitting(true);

    // Mock API Save delay
    setTimeout(() => {
      const updatedBooking = {
        ...booking,
        pre_checkin_status: 'pending_review' as const,
        pre_checkin_completed: true,
        pre_checkin_pending_data: {
          email: formData.email,
          phone: formData.phone,
          nationality: formData.nationality,
          document_id: formData.document_id,
          dob: formData.dob,
          docFrontUrl: formData.docFrontUrl,
          docBackUrl: formData.docBackUrl,
          companions: formData.companions,
          selectedAddons: formData.selectedAddons,
          signatureDataUrl: formData.signatureDataUrl
        }
      };

      // If any addons selected, append to booking notes
      if (formData.selectedAddons.length > 0) {
        const addonsText = formData.selectedAddons
          .map(id => availableAddons.find(a => a.id === id)?.name)
          .filter(Boolean)
          .join(', ');
        updatedBooking.notes = `${booking.notes || ''}\n[Solicitud Pre-Checkin Addons]: ${addonsText}`.trim();
      }

      updateBooking(updatedBooking);
      
      // Add timeline activity to PMS
      addActivity({
        id: `act_${Date.now()}`,
        property_id: booking.property_id,
        type: 'reserva' as const,
        date: new Date().toISOString(),
        result: 'completed',
        description: `Huésped completó pre-checkin express en línea: ${booking.first_name} ${booking.last_name}`
      } as any);

      setIsSuccess(true);
      setIsSubmitting(false);
      if (onComplete) onComplete();
    }, 1500);
  };

  const updateCompanion = (index: number, field: keyof Companion, value: string) => {
    const newCompanions = [...formData.companions];
    newCompanions[index] = { ...newCompanions[index], [field]: value };
    setFormData(prev => ({ ...prev, companions: newCompanions }));
  };

  const inputClass = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-base text-slate-900 font-semibold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all";
  const labelClass = "block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1";

  if (!booking && bookingId && !isSearching) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="text-slate-450 font-extrabold text-sm text-indigo-200">Cargando los datos de tu reserva...</p>
        </div>
      </div>
    );
  }

  if (isSearching) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-6 border border-slate-100">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-650 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-slate-900">Check-in Contactless</h1>
            <p className="text-slate-500 text-sm mt-1">Ingresá tus datos para agilizar tu recepción en el hotel.</p>
          </div>

          <form onSubmit={handleSearch} className="space-y-4">
            {searchError && (
              <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold p-3.5 rounded-xl flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{searchError}</span>
              </div>
            )}

            <div>
              <label className={labelClass}>Código de Reserva</label>
              <input 
                type="text" 
                placeholder="Ej: XF89A" 
                value={searchCode} 
                onChange={e => setSearchCode(e.target.value)} 
                className={inputClass}
                autoCapitalize="characters"
              />
            </div>

            <div>
              <label className={labelClass}>Apellido del Titular</label>
              <input 
                type="text" 
                placeholder="Ej: Pérez" 
                value={searchLastName} 
                onChange={e => setSearchLastName(e.target.value)} 
                className={inputClass}
              />
            </div>

            <button 
              type="submit"
              className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg rounded-2xl transition-all shadow-lg active:scale-98 flex items-center justify-center gap-2 mt-2"
            >
              Iniciar Express Check-in
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-2xl text-center border border-slate-100">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-1">¡Registro Completado!</h1>
          <p className="text-slate-500 text-xs mb-6 px-4">Tus datos fueron cargados. Al llegar, presentá tu QR en recepción para retirar la llave física.</p>
          
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-6 flex flex-col items-center justify-center">
             <QrCode className="w-40 h-40 text-slate-800" />
             <div className="mt-3 font-mono font-black text-slate-400 tracking-widest uppercase">
               {booking.confirmation_id || booking.id}
             </div>
          </div>

          <div className="space-y-3.5 bg-indigo-50/50 p-4.5 rounded-2xl border border-indigo-100 text-left mb-6">
            <div className="flex gap-3">
              <Award className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider">Pase Digital de Huésped</h4>
                <p className="text-sm font-bold text-slate-850 mt-0.5">{booking.first_name} {booking.last_name}</p>
                <p className="text-xs text-slate-500">{property?.name}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-indigo-100/50 text-xs">
              <div>
                <span className="text-slate-400 font-bold uppercase tracking-wider block">Entrada</span>
                <span className="font-extrabold text-slate-800">{format(parseISO(booking.check_in), 'dd MMM yyyy', { locale: es })}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase tracking-wider block">Salida</span>
                <span className="font-extrabold text-slate-800">{format(parseISO(booking.check_out), 'dd MMM yyyy', { locale: es })}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left space-y-2 mb-6">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Wifi className="w-4 h-4 text-indigo-600" />
              <span>Wi-Fi del Hotel:</span>
              <span className="font-extrabold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">CoreHubGuest / pms2026</span>
            </div>
            {booking.room_id && (
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>Habitación Asignada:</span>
                <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">{booking.room_id.replace('u_', '').toUpperCase()}</span>
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
            ¿Deseas realizar algún cambio? Comunicate con nosotros al <span className="font-bold text-indigo-650">{property?.phone || '+54 9 11 1234-5678'}</span>
          </p>
        </div>
      </div>
    );
  }

  const renderStep = () => {
    const step = steps[currentStep];

    switch (step.id) {
      case 'intro':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-650 mb-2">
              <User className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900">Hola, {booking.first_name}</h2>
              <p className="text-slate-500 mt-1.5 leading-relaxed text-sm">
                Tu reserva está confirmada en <strong>{property?.name}</strong>. Completá esta breve ficha legal ahora y evitá demoras al ingresar.
              </p>
            </div>
            
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3.5 text-sm font-semibold text-slate-700">
              <div className="flex justify-between items-center border-b border-slate-200/60 pb-3">
                <div className="flex items-center gap-2 text-slate-500">
                  <Calendar className="w-4 h-4" />
                  <span>Llegada</span>
                </div>
                <span className="font-extrabold text-slate-900">{format(parseISO(booking.check_in), 'dd MMM yyyy', { locale: es })}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200/60 pb-3">
                <div className="flex items-center gap-2 text-slate-500">
                  <Calendar className="w-4 h-4" />
                  <span>Salida</span>
                </div>
                <span className="font-extrabold text-slate-900">{format(parseISO(booking.check_out), 'dd MMM yyyy', { locale: es })}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-slate-500">
                  <Users className="w-4 h-4" />
                  <span>Pasajeros</span>
                </div>
                <span className="font-extrabold text-slate-900">{booking.pax} {booking.pax === 1 ? 'Persona' : 'Personas'}</span>
              </div>
            </div>
          </div>
        );

      case 'titular':
        return (
          <div className="space-y-4.5 animate-in fade-in duration-300">
            <div>
              <h2 className="text-xl font-black text-slate-950">Datos Personales</h2>
              <p className="text-slate-500 text-xs">Por favor, completá los datos del titular de la reserva.</p>
            </div>
            
            <div className="space-y-4">
              {fieldConfigs.document_id?.enabled && (
                <div>
                  <label className={labelClass}>{fieldConfigs.document_id.label} {fieldConfigs.document_id.required ? '*' : ''}</label>
                  <input required={fieldConfigs.document_id.required} type="text" value={formData.document_id} onChange={e => setFormData({...formData, document_id: e.target.value})} className={inputClass} placeholder="Ej: Pasaporte o DNI" />
                </div>
              )}
              {fieldConfigs.dob?.enabled && (
                <div>
                  <label className={labelClass}>{fieldConfigs.dob.label} {fieldConfigs.dob.required ? '*' : ''}</label>
                  <input required={fieldConfigs.dob.required} type="date" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} className={inputClass} />
                </div>
              )}
              {fieldConfigs.email?.enabled && (
                <div>
                  <label className={labelClass}>{fieldConfigs.email.label} {fieldConfigs.email.required ? '*' : ''}</label>
                  <input required={fieldConfigs.email.required} type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className={inputClass} placeholder="correo@ejemplo.com" />
                </div>
              )}
              {fieldConfigs.nationality?.enabled && (
                <div>
                  <label className={labelClass}>{fieldConfigs.nationality.label} {fieldConfigs.nationality.required ? '*' : ''}</label>
                  <input required={fieldConfigs.nationality.required} type="text" value={formData.nationality} onChange={e => setFormData({...formData, nationality: e.target.value})} className={inputClass} placeholder="Ej: Argentina" />
                </div>
              )}
              {fieldConfigs.phone?.enabled && (
                <div>
                  <label className={labelClass}>{fieldConfigs.phone.label} {fieldConfigs.phone.required ? '*' : ''}</label>
                  <input required={fieldConfigs.phone.required} type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className={inputClass} placeholder="+54 9 11..." />
                </div>
              )}
            </div>
          </div>
        );

      case 'documents':
        return (
          <div className="space-y-4.5 animate-in fade-in duration-300">
            <div>
              <h2 className="text-xl font-black text-slate-950">Foto de Documento / Pasaporte</h2>
              <p className="text-slate-500 text-xs">Subí una foto nítida de tu credencial de identidad para el registro oficial de seguridad de la propiedad.</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <span className={labelClass}>Foto Frente de Documento (Obligatoria) *</span>
                <ImageUpload 
                  value={formData.docFrontUrl} 
                  onChange={url => setFormData({...formData, docFrontUrl: url})} 
                  label="" 
                />
              </div>

              <div>
                <span className={labelClass}>Foto Dorso de Documento (Opcional)</span>
                <ImageUpload 
                  value={formData.docBackUrl} 
                  onChange={url => setFormData({...formData, docBackUrl: url})} 
                  label="" 
                />
              </div>
            </div>
          </div>
        );

      case 'addons':
        return (
          <div className="space-y-4.5 animate-in fade-in duration-300">
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-indigo-650" />
              <div>
                <h2 className="text-xl font-black text-slate-950">Mejorá tu Estadía</h2>
                <p className="text-slate-500 text-xs">Agregá servicios especiales a tu reserva. Podrás pagarlos directamente al ingresar.</p>
              </div>
            </div>
            
            <div className="space-y-3">
              {availableAddons.map(addon => {
                const AddonIcon = addon.icon;
                const isSelected = formData.selectedAddons.includes(addon.id);
                return (
                  <button
                    key={addon.id}
                    type="button"
                    onClick={() => toggleAddon(addon.id)}
                    className={`w-full p-4 rounded-2xl border-2 text-left flex items-start gap-4 transition-all ${
                      isSelected 
                        ? 'border-indigo-600 bg-indigo-50/40 shadow-sm' 
                        : 'border-slate-200 hover:border-slate-350 bg-white'
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl shrink-0 ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-55 bg-slate-100 text-slate-500'}`}>
                      <AddonIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">{addon.name}</span>
                        <span className="font-black text-sm text-indigo-700 shrink-0">USD {addon.price}</span>
                      </div>
                      <p className="text-slate-500 text-xs mt-1 leading-normal font-medium">{addon.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'terms':
        return (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div>
              <h2 className="text-xl font-black text-slate-950">Firma de Declaración Jurada</h2>
              <p className="text-slate-500 text-xs">Firmá sobre el recuadro para validar legalmente tu ficha.</p>
            </div>

            <div className="border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 p-2 relative flex flex-col items-center">
              <canvas
                ref={canvasRef}
                width={340}
                height={160}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="bg-white rounded-xl cursor-crosshair max-w-full border border-slate-200"
              />
              <div className="flex justify-between w-full text-xs font-bold text-slate-400 mt-2 px-2">
                <span>Firma digital del huésped</span>
                <button 
                  type="button" 
                  onClick={clearCanvas}
                  className="text-red-500 hover:text-red-600 cursor-pointer uppercase tracking-wider font-black"
                >
                  Limpiar Firma
                </button>
              </div>
            </div>

            <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-white cursor-pointer hover:border-slate-300 transition-colors">
              <input 
                type="checkbox" 
                required
                checked={formData.acceptedTerms} 
                onChange={e => setFormData({...formData, acceptedTerms: e.target.checked})}
                className="w-5 h-5 rounded border-slate-300 text-indigo-650 focus:ring-indigo-500 mt-0.5 cursor-pointer shrink-0"
              />
              <span className="text-xs text-slate-500 leading-normal font-medium">
                Declaro bajo juramento que todos los datos declarados y el documento adjunto me corresponden. Acepto los términos y condiciones, las normas de convivencia del establecimiento y sus políticas.
              </span>
            </label>
          </div>
        );

      default:
        if (step.id.startsWith('comp_')) {
          const idx = parseInt(step.id.split('_')[1]);
          const comp = formData.companions[idx];
          return (
            <div className="space-y-4.5 animate-in fade-in duration-300" key={step.id}>
              <div>
                <h2 className="text-xl font-black text-slate-950">Acompañante {idx + 1}</h2>
                <p className="text-slate-500 text-xs">Datos obligatorios para registro legal en el hotel.</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Nombre *</label>
                  <input required type="text" value={comp?.firstName || ''} onChange={e => updateCompanion(idx, 'firstName', e.target.value)} className={inputClass} placeholder="Ej: María" />
                </div>
                <div>
                  <label className={labelClass}>Apellido *</label>
                  <input required type="text" value={comp?.lastName || ''} onChange={e => updateCompanion(idx, 'lastName', e.target.value)} className={inputClass} placeholder="Ej: Gómez" />
                </div>
                <div>
                  <label className={labelClass}>Documento / Pasaporte *</label>
                  <input required type="text" value={comp?.documentId || ''} onChange={e => updateCompanion(idx, 'documentId', e.target.value)} className={inputClass} placeholder="Ej: Pasaporte o DNI" />
                </div>
                <div>
                  <label className={labelClass}>Fecha de Nacimiento *</label>
                  <input required type="date" value={comp?.dob || ''} onChange={e => updateCompanion(idx, 'dob', e.target.value)} className={inputClass} />
                </div>
              </div>
            </div>
          );
        }
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1.5 bg-slate-200 z-50">
        <div 
          className="h-full bg-indigo-600 transition-all duration-300 ease-out"
          style={{ width: `${((currentStep) / (totalSteps - 1)) * 100}%` }}
        />
      </div>

      {/* Header */}
      <header className="p-4 bg-white border-b border-slate-200 sticky top-0 z-40 flex items-center justify-between shadow-sm">
        <div className="font-black text-slate-900 text-lg tracking-tight truncate max-w-[200px]">
          {property?.name}
        </div>
        <div className="text-[10px] font-black text-slate-400 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
          Paso {currentStep + 1} de {totalSteps}
        </div>
      </header>

      {/* Main Content Form */}
      <main className="flex-1 flex flex-col justify-between max-w-md w-full mx-auto p-4 py-6">
        <form onSubmit={currentStep === totalSteps - 1 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }} className="flex-1 flex flex-col justify-between">
          <div className="flex-1">
            {renderStep()}
          </div>

          {/* Footer Navigation */}
          <div className="mt-8 flex items-center gap-3.5 pt-4 bg-transparent sticky bottom-0">
            {currentStep > 0 && (
              <button 
                type="button" 
                onClick={handlePrev}
                className="w-14 h-14 rounded-2xl bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-50 transition-colors shrink-0 shadow-sm"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
            )}
            
            <button 
              type="submit"
              disabled={isSubmitting || (currentStep === totalSteps - 1 && (!formData.acceptedTerms || !formData.signatureDataUrl))}
              className="flex-1 h-14 rounded-2xl bg-indigo-650 text-white font-bold text-base hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_12px_rgba(79,70,229,0.3)] hover:scale-[1.01]"
            >
              {isSubmitting ? (
                'Procesando...'
              ) : currentStep === totalSteps - 1 ? (
                'Confirmar Check-in Express'
              ) : (
                <>
                  Continuar
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
