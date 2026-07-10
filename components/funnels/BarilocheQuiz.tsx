'use client';

import React, { useState } from 'react';
import { usePMS } from '../../context/PMSContext';

export function BarilocheQuiz() {
  const { addQuote, properties } = usePMS();
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<any>({});
  
  const handleAnswer = (key: string, value: string) => {
    setAnswers((prev: any) => ({ ...prev, [key]: value }));
    setStep((prev: number) => prev + 1);
  };

  const submitLead = (e: React.FormEvent) => {
    e.preventDefault();
    const propertyId = properties[0]?.id || 'default-property';
    
    // Split the name into first name and last name
    const nameParts = (answers.name || 'Lead Bariloche').trim().split(/\s+/);
    const firstName = nameParts[0] || 'Lead';
    const lastName = nameParts.slice(1).join(' ') || 'Bariloche';
    
    addQuote({
      id: crypto.randomUUID(),
      property_id: propertyId,
      source: 'Quiz Funnel: Bariloche Parejas',
      status: 'draft',
      first_name: firstName,
      last_name: lastName,
      email: '', // El usuario pidió no pedir email
      phone: answers.phone || '',
      check_in: answers.checkIn || new Date().toISOString().split('T')[0],
      check_out: answers.checkOut || new Date(Date.now() + 86400000).toISOString().split('T')[0],
      unit_type_id: '',
      rate_rule_id: '',
      pax: answers.travelers?.includes('tercer') ? 3 : 2,
      total_amount: 0,
      currency: 'USD',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      internal_notes: `🏨 LEAD DE CAPTACIÓN: BARILOCHE PAREJAS\n\n🎯 TIPO DE VIAJE: ${answers.type || 'No especificado'}\n😴 RELACIÓN CON LA CAMA: ${answers.sleep || 'No especificado'}\n👥 ACOMPAÑANTES: ${answers.travelers || 'No especificado'}\n✨ ALOJAMIENTO IDEAL: ${answers.ideal || 'No especificado'}`,
      timeline: []
    });

    setStep(7); // Success step
  };

  if (step === 1) {
    return (
      <div className="max-w-2xl mx-auto p-6 animate-fade-in">
        <div className="flex justify-between items-center mb-8 text-zinc-500 text-sm font-bold tracking-widest">
          <span>PASO 1 DE 5</span>
          <button className="hover:text-zinc-300">✕ Cancelar</button>
        </div>
        <div className="w-full h-1 bg-zinc-800 mb-12 rounded-full overflow-hidden">
          <div className="h-full bg-amber-500 w-[20%] transition-all duration-500" />
        </div>

        <h2 className="text-3xl font-bold text-white mb-2">Primero lo importante...</h2>
        <h3 className="text-2xl font-bold text-white mb-8">¿Qué tipo de escapada están imaginando?</h3>

        <div className="space-y-4">
          {[
            { id: 'romantica', icon: '❤️', text: 'Escapada romántica total' },
            { id: 'aventura', icon: '🏔️', text: 'Aventura y paisajes' },
            { id: 'comer', icon: '🍷', text: 'Comer, tomar y disfrutar' },
            { id: 'desaparecer', icon: '🛌', text: 'Desaparecer del mundo' },
            { id: 'todo', icon: '✨', text: 'Un poquito de todo' },
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => handleAnswer('type', opt.text)}
              className="w-full text-left p-5 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 hover:border-amber-500/50 transition-all text-white text-lg flex items-center gap-4 group"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">{opt.icon}</span>
              {opt.text}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="max-w-2xl mx-auto p-6 animate-fade-in">
        <div className="flex justify-between items-center mb-8 text-zinc-500 text-sm font-bold tracking-widest">
          <span>PASO 2 DE 5</span>
          <button className="hover:text-zinc-300">✕ Cancelar</button>
        </div>
        <div className="w-full h-1 bg-zinc-800 mb-12 rounded-full overflow-hidden">
          <div className="h-full bg-amber-500 w-[40%] transition-all duration-500" />
        </div>

        <h2 className="text-3xl font-bold text-white mb-2">Seamos honestos...</h2>
        <h3 className="text-2xl font-bold text-white mb-8">¿Qué tan intensa es la relación con la cama del hotel?</h3>

        <div className="space-y-4">
          {[
            { id: 'temprano', icon: '🌅', text: '"Nos levantamos temprano. Hay mucho por hacer."' },
            { id: 'desayuno', icon: '☕', text: '"Después del desayuno vemos."' },
            { id: 'dormir', icon: '😴', text: '"Vacaciones significa dormir."' },
            { id: 'depende', icon: '👀', text: '"Depende de la noche anterior."' },
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => handleAnswer('sleep', opt.text)}
              className="w-full text-left p-5 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-amber-500/10 hover:border-amber-500 transition-all text-white text-lg flex items-center gap-4 group"
            >
              <span className="text-2xl">{opt.icon}</span>
              {opt.text}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="max-w-2xl mx-auto p-6 animate-fade-in">
        <div className="flex justify-between items-center mb-8 text-zinc-500 text-sm font-bold tracking-widest">
          <span>PASO 3 DE 5</span>
          <button className="hover:text-zinc-300">✕ Cancelar</button>
        </div>
        <div className="w-full h-1 bg-zinc-800 mb-12 rounded-full overflow-hidden">
          <div className="h-full bg-amber-500 w-[60%] transition-all duration-500" />
        </div>

        <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
          Now, necesitamos mirar el calendario 📅
        </h2>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-zinc-500 text-sm font-bold mb-2">FECHA DE LLEGADA</label>
            <input 
              type="date" 
              value={answers.checkIn || ''}
              onChange={(e) => setAnswers({...answers, checkIn: e.target.value})}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white focus:outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <label className="block text-zinc-500 text-sm font-bold mb-2">FECHA DE SALIDA</label>
            <input 
              type="date" 
              value={answers.checkOut || ''}
              onChange={(e) => setAnswers({...answers, checkOut: e.target.value})}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <button 
          onClick={() => setStep(4)}
          className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-lg py-4 rounded-xl transition-all shadow-lg hover:shadow-amber-500/25 mb-4"
        >
          CONTINUAR
        </button>
        <div className="text-center">
          <button onClick={() => setStep(4)} className="text-zinc-500 underline hover:text-zinc-300 transition-colors">
            Todavía no sabemos las fechas exactas.
          </button>
        </div>
      </div>
    );
  }

  if (step === 4) {
    return (
      <div className="max-w-2xl mx-auto p-6 animate-fade-in">
        <div className="flex justify-between items-center mb-8 text-zinc-500 text-sm font-bold tracking-widest">
          <span>PASO 4 DE 5</span>
          <button className="hover:text-zinc-300">✕ Cancelar</button>
        </div>
        <div className="w-full h-1 bg-zinc-800 mb-12 rounded-full overflow-hidden">
          <div className="h-full bg-amber-500 w-[80%] transition-all duration-500" />
        </div>

        <h2 className="text-3xl font-bold text-white mb-8">¿Es solo para dos?</h2>

        <div className="space-y-4">
          {[
            { id: 'dos', icon: '❤️', text: 'Sí. Nosotros dos.' },
            { id: 'bebe', icon: '👶', text: 'Viajamos con un pequeño tercer integrante.' },
            { id: 'mascota', icon: '🐶', text: 'Tenemos acompañante de cuatro patas.' },
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => handleAnswer('travelers', opt.text)}
              className="w-full text-left p-5 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 hover:border-amber-500/50 transition-all text-white text-lg flex items-center gap-4 group"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">{opt.icon}</span>
              {opt.text}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === 5) {
    return (
      <div className="max-w-2xl mx-auto p-6 animate-fade-in">
        <div className="flex justify-between items-center mb-8 text-zinc-500 text-sm font-bold tracking-widest">
          <span>PASO 5 DE 5</span>
          <button className="hover:text-zinc-300">✕ Cancelar</button>
        </div>
        <div className="w-full h-1 bg-zinc-800 mb-12 rounded-full overflow-hidden">
          <div className="h-full bg-amber-500 w-[100%] transition-all duration-500" />
        </div>

        <h2 className="text-3xl font-bold text-white mb-2">Última pregunta divertida...</h2>
        <h3 className="text-2xl font-bold text-white mb-8">Cuando imaginan el alojamiento ideal, ¿qué aparece primero?</h3>

        <div className="space-y-4">
          {[
            { id: 'vista', icon: '🏔️', text: 'Una vista que nos deje mudos' },
            { id: 'romantico', icon: '🔥', text: 'Un lugar cálido y romántico' },
            { id: 'relax', icon: '🛁', text: 'Relax total' },
            { id: 'ubicacion', icon: '📍', text: 'Estar bien ubicados para recorrer' },
            { id: 'sorpresa', icon: '✨', text: 'Sorpréndannos' },
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => handleAnswer('ideal', opt.text)}
              className="w-full text-left p-5 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 hover:border-amber-500/50 transition-all text-white text-lg flex items-center gap-4 group"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">{opt.icon}</span>
              {opt.text}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === 6) {
    return (
      <div className="max-w-2xl mx-auto p-6 animate-fade-in">
        <div className="w-full h-1 bg-zinc-800 mb-8 rounded-full overflow-hidden">
          <div className="h-full bg-amber-500 w-full" />
        </div>
        <div className="text-zinc-500 text-sm font-bold tracking-widest mb-8">FINAL DEL FORMULARIO</div>

        <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
          Tenemos una idea bastante clara de su viaje 👀❤️
        </h2>
        <p className="text-zinc-400 mb-8 text-lg">
          Dejanos dónde enviarles la guía personalizada y revisamos qué opciones de alojamiento podrían encajar con sus fechas.
        </p>

        <form onSubmit={submitLead} className="space-y-4">
          <input 
            type="text" 
            placeholder="Nombre completo" 
            required
            value={answers.name || ''}
            onChange={e => setAnswers({...answers, name: e.target.value})}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white focus:outline-none focus:border-rose-500"
          />
          <input 
            type="text" 
            placeholder="WhatsApp (con código de área)" 
            required
            value={answers.phone || ''}
            onChange={e => setAnswers({...answers, phone: e.target.value})}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white focus:outline-none focus:border-rose-500"
          />
          
          <div className="flex items-center gap-3 py-4">
            <input type="checkbox" id="news" defaultChecked className="w-5 h-5 accent-rose-500 bg-zinc-900 border-zinc-800 rounded" />
            <label htmlFor="news" className="text-zinc-400 text-sm">
              Quiero recibir secretos, planes y oportunidades especiales para viajar a Bariloche.
            </label>
          </div>

          <button 
            type="submit"
            className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold text-lg py-4 rounded-xl transition-all shadow-lg hover:shadow-rose-500/25 mb-4 uppercase tracking-wide"
          >
            ENVIAR POR MI GUÍA ❤️
          </button>
          
          <p className="text-center text-zinc-600 text-sm">
            Nada de spam. Bariloche tiene demasiadas cosas lindas como para mandarte basura.
          </p>
        </form>
      </div>
    );
  }

  if (step === 7) {
    return (
      <div className="max-w-2xl mx-auto p-12 text-center animate-fade-in flex flex-col items-center justify-center min-h-[50vh]">
        <h2 className="text-4xl font-black text-amber-500 mb-4">
          Listo. El viaje ya empezó.
        </h2>
        <div className="text-5xl mb-8 animate-bounce">🏔️❤️</div>
        <p className="text-xl text-white mb-4 font-medium">
          Estamos preparando los MUST para su escapada.
        </p>
        <p className="text-lg text-zinc-400 mb-12">
          También vamos a revisar qué opciones de alojamiento podrían funcionar mejor para sus fechas.
        </p>
        
        <div className="w-full h-px bg-zinc-800 mb-8" />
        
        <h3 className="text-lg font-bold text-white mb-4 uppercase tracking-wider">🎁 ¡Tus Guías y Regalos de Bienvenida!</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mb-12">
          <a 
            href="https://docs.google.com/document/d/12345/edit" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 hover:border-amber-500/50 transition-all text-left text-white group"
          >
            <span className="text-3xl bg-zinc-800/80 p-2.5 rounded-xl group-hover:scale-110 transition-transform">🍷</span>
            <div>
              <h4 className="font-bold text-sm">Guía Gastronómica 🍷</h4>
              <p className="text-xs text-zinc-400 mt-0.5">Los 5 lugares secretos para cenar en Bariloche.</p>
              <span className="text-amber-500 text-xs font-bold mt-2 block hover:underline">Descargar PDF →</span>
            </div>
          </a>

          <a 
            href="https://maps.google.com/?q=bariloche" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 hover:border-amber-500/50 transition-all text-left text-white group"
          >
            <span className="text-3xl bg-zinc-800/80 p-2.5 rounded-xl group-hover:scale-110 transition-transform">🗺️</span>
            <div>
              <h4 className="font-bold text-sm">Rutas Panorámicas 🗺️</h4>
              <p className="text-xs text-zinc-400 mt-0.5">Mapa interactivo con miradores secretos.</p>
              <span className="text-amber-500 text-xs font-bold mt-2 block hover:underline">Abrir Mapa →</span>
            </div>
          </a>
        </div>

        <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest mb-6">Mientras tanto...</p>
        
        <button 
          onClick={() => window.location.href = 'https://instagram.com/tu-hotel'}
          className="bg-white hover:bg-zinc-100 text-zinc-950 font-bold px-8 py-3 rounded-full transition-colors"
        >
          DESCUBRIR UN ADELANTO
        </button>
      </div>
    );
  }

  return null;
}
