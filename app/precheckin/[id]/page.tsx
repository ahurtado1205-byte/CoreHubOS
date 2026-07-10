'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { usePMS } from '../../../context/PMSContext';
import { Companion } from '../../../types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Check, User, Users, Calendar, ArrowRight, ArrowLeft, QrCode } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function PreCheckinPage() {
  const { id } = useParams();
  const { bookings, updateBooking, properties } = usePMS();
  
  const [booking, setBooking] = useState<any>(null);
  const [property, setProperty] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Step state
  const [currentStep, setCurrentStep] = useState(0);

  // Form State
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    nationality: '',
    document_id: '',
    dob: '',
    companions: [] as Companion[],
    acceptedTerms: false
  });

  useEffect(() => {
    if (id && bookings.length > 0) {
      const b = bookings.find(b => b.id === id);
      if (b) {
        setBooking(b);
        setProperty(properties.find(p => p.id === b.property_id));
        setFormData({
          email: b.email || '',
          phone: b.phone || '',
          nationality: b.nationality || '',
          document_id: b.document_id || '',
          dob: b.dob || '',
          companions: b.companions && b.companions.length > 0 ? b.companions : Array(Math.max(0, (b.pax || 1) - 1)).fill({ firstName: '', lastName: '', documentId: '', dob: '' }),
          acceptedTerms: false
        });
        if (b.pre_checkin_completed) {
          setIsSuccess(true);
        }
      }
    }
  }, [id, bookings, properties]);

  if (!booking) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-white text-center animate-pulse">Cargando tu reserva...</div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 relative">
        <div className="relative z-10 max-w-sm w-full bg-white p-8 rounded-[2rem] shadow-2xl text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">¡Todo Listo!</h1>
          <p className="text-slate-500 text-sm mb-8">Mostrá este código QR en recepción para retirar tu llave en segundos.</p>
          
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-6 flex flex-col items-center justify-center">
             <QrCode className="w-48 h-48 text-slate-800" />
             <div className="mt-4 font-mono font-bold text-slate-400 tracking-widest">{booking.confirmation_id || booking.id}</div>
          </div>
          
          <div className="text-sm font-bold text-slate-900">
            {booking.first_name} {booking.last_name}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {property?.name} • {format(parseISO(booking.check_in), 'dd MMM', { locale: es })} al {format(parseISO(booking.check_out), 'dd MMM', { locale: es })}
          </div>
        </div>
      </div>
    );
  }

  const steps = [
    { id: 'intro', title: 'Bienvenido' },
    { id: 'titular', title: 'Tus Datos' },
    ...formData.companions.map((_, i) => ({ id: `comp_${i}`, title: `Acompañante ${i+1}` })),
    { id: 'terms', title: 'Confirmación' }
  ];

  const totalSteps = steps.length;
  
  const handleNext = () => {
    if (currentStep < totalSteps - 1) setCurrentStep(prev => prev + 1);
  };
  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.acceptedTerms) {
      alert('Por favor, acepta los términos y condiciones.');
      return;
    }
    
    setIsSubmitting(true);
    
    setTimeout(() => {
      updateBooking({
        ...booking,
        email: formData.email,
        phone: formData.phone,
        nationality: formData.nationality,
        document_id: formData.document_id,
        dob: formData.dob,
        companions: formData.companions,
        pre_checkin_completed: true
      });
      setIsSuccess(true);
      setIsSubmitting(false);
    }, 1500);
  };

  const updateCompanion = (index: number, field: keyof Companion, value: string) => {
    const newCompanions = [...formData.companions];
    newCompanions[index] = { ...newCompanions[index], [field]: value };
    setFormData({ ...formData, companions: newCompanions });
  };

  // font-size 16px is text-base in tailwind (prevents iOS zoom)
  const inputClass = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-base text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all";
  const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1";

  const renderStep = () => {
    const step = steps[currentStep];

    if (step.id === 'intro') {
      return (
        <div className="flex flex-col h-full justify-center animation-fade-in">
          <div className="mb-8 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 mb-6">
            <User className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4">Hola, {booking.first_name}</h2>
          <p className="text-lg text-slate-600 mb-8 leading-relaxed">
            Hagamos esto rápido. Completá tus datos ahora para hacer el <strong>Express Check-in</strong> y evitar filas en recepción.
          </p>
          
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 mb-8 space-y-4">
             <div className="flex justify-between items-center border-b border-slate-200 pb-4">
               <span className="text-slate-500 font-medium">Llegada</span>
               <span className="font-bold text-slate-900">{format(parseISO(booking.check_in), 'dd MMM yyyy', { locale: es })}</span>
             </div>
             <div className="flex justify-between items-center border-b border-slate-200 pb-4">
               <span className="text-slate-500 font-medium">Salida</span>
               <span className="font-bold text-slate-900">{format(parseISO(booking.check_out), 'dd MMM yyyy', { locale: es })}</span>
             </div>
             <div className="flex justify-between items-center">
               <span className="text-slate-500 font-medium">Huéspedes</span>
               <span className="font-bold text-slate-900">{booking.pax} Personas</span>
             </div>
          </div>
        </div>
      );
    }

    if (step.id === 'titular') {
      return (
        <div className="flex flex-col h-full justify-center animation-fade-in">
          <h2 className="text-2xl font-black text-slate-900 mb-2">Tus Datos Personales</h2>
          <p className="text-slate-500 mb-8">Por favor, completá la información obligatoria.</p>
          
          <div className="space-y-6">
            <div>
              <label className={labelClass}>Documento / Pasaporte *</label>
              <input required type="text" value={formData.document_id} onChange={e => setFormData({...formData, document_id: e.target.value})} className={inputClass} placeholder="Ej: 35123456" />
            </div>
            <div>
              <label className={labelClass}>Fecha de Nacimiento *</label>
              <input required type="date" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Email *</label>
              <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className={inputClass} placeholder="correo@ejemplo.com" />
            </div>
            <div>
              <label className={labelClass}>Nacionalidad *</label>
              <input required type="text" value={formData.nationality} onChange={e => setFormData({...formData, nationality: e.target.value})} className={inputClass} placeholder="Ej: Argentina" />
            </div>
            <div>
              <label className={labelClass}>Teléfono</label>
              <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className={inputClass} placeholder="+54 9 11..." />
            </div>
          </div>
        </div>
      );
    }

    if (step.id.startsWith('comp_')) {
      const idx = parseInt(step.id.split('_')[1]);
      const comp = formData.companions[idx];
      return (
        <div className="flex flex-col h-full justify-center animation-fade-in">
          <h2 className="text-2xl font-black text-slate-900 mb-2">Acompañante {idx + 1}</h2>
          <p className="text-slate-500 mb-8">Datos legales requeridos del acompañante.</p>
          
          <div className="space-y-6">
            <div>
              <label className={labelClass}>Nombre *</label>
              <input required type="text" value={comp.firstName} onChange={e => updateCompanion(idx, 'firstName', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Apellido *</label>
              <input required type="text" value={comp.lastName} onChange={e => updateCompanion(idx, 'lastName', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Documento / Pasaporte *</label>
              <input required type="text" value={comp.documentId} onChange={e => updateCompanion(idx, 'documentId', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Fecha de Nacimiento *</label>
              <input required type="date" value={comp.dob} onChange={e => updateCompanion(idx, 'dob', e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>
      );
    }

    if (step.id === 'terms') {
      return (
        <div className="flex flex-col h-full justify-center animation-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-6">
            <Check className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4">Último paso</h2>
          <p className="text-slate-500 text-lg mb-8">Por favor, revisá y aceptá para finalizar tu registro.</p>
          
          <label className="flex items-start gap-4 p-5 rounded-2xl border-2 border-slate-200 bg-white cursor-pointer hover:border-indigo-500 transition-colors mb-8">
            <div className="mt-1 flex-shrink-0">
              <input 
                type="checkbox" 
                required
                checked={formData.acceptedTerms} 
                onChange={e => setFormData({...formData, acceptedTerms: e.target.checked})}
                className="w-6 h-6 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
            </div>
            <div className="text-sm text-slate-600 leading-relaxed font-medium">
              Declaro bajo juramento que los datos ingresados son correctos y verdaderos. Acepto los términos, condiciones y políticas de cancelación de {property?.name}.
            </div>
          </label>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans selection:bg-indigo-200">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-2 bg-slate-100 z-50">
        <div 
          className="h-full bg-indigo-600 transition-all duration-500 ease-out"
          style={{ width: `${((currentStep) / (totalSteps - 1)) * 100}%` }}
        />
      </div>

      {/* Header */}
      <header className="p-6 flex items-center justify-between z-40 bg-white/80 backdrop-blur-md sticky top-0">
        <div className="font-black text-slate-900 text-xl tracking-tight">{property?.name}</div>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{currentStep + 1} / {totalSteps}</div>
      </header>

      {/* Main Content Form */}
      <main className="flex-1 flex flex-col justify-between max-w-md w-full mx-auto p-6 pt-2">
        
        <form id="precheckin-form" onSubmit={currentStep === totalSteps - 1 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }} className="flex-1 flex flex-col">
          {renderStep()}
        </form>

        {/* Footer Navigation */}
        <div className="mt-8 flex items-center gap-4 pt-6 bg-white sticky bottom-6">
          {currentStep > 0 && (
            <button 
              type="button" 
              onClick={handlePrev}
              className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 transition-colors shrink-0"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          )}
          
          <button 
            form="precheckin-form"
            type="submit"
            disabled={isSubmitting || (currentStep === totalSteps - 1 && !formData.acceptedTerms)}
            className="flex-1 h-14 rounded-2xl bg-indigo-600 text-white font-bold text-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_14px_rgba(79,70,229,0.4)]"
          >
            {isSubmitting ? 'Procesando...' : currentStep === totalSteps - 1 ? 'Finalizar Check-in' : 'Continuar'}
            {!isSubmitting && currentStep < totalSteps - 1 && <ArrowRight className="w-5 h-5" />}
          </button>
        </div>
      </main>

      <style jsx global>{`
        .animation-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
