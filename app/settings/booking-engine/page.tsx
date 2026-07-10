'use client';

import React, { useState } from 'react';
import { usePMS } from '@/context/PMSContext';
import { ArrowLeft, Save, Palette, FileText, Globe } from 'lucide-react';
import Link from 'next/link';
import { TopBar } from '@/components/layout/TopBar';
import { ImageUpload } from '@/components/ui/ImageUpload';

export default function BookingEngineSettingsPage() {
  const { properties, currentPropertyId, updateProperty } = usePMS();
  
  const currentProperty = properties.find(p => p.id === currentPropertyId);

  const [color, setColor] = useState(currentProperty?.booking_engine_color || '#312e81');
  const [logo, setLogo] = useState(currentProperty?.booking_engine_logo || '');
  const [hero, setHero] = useState(currentProperty?.booking_engine_hero || '');
  const [terms, setTerms] = useState(currentProperty?.terms_conditions || '');
  const [policy, setPolicy] = useState(currentProperty?.cancellation_policy || '');

  if (!currentProperty) {
    return <div className="p-8">No hay propiedad seleccionada</div>;
  }

  const handleSave = () => {
    updateProperty({
      ...currentProperty,
      booking_engine_color: color,
      booking_engine_logo: logo,
      booking_engine_hero: hero,
      terms_conditions: terms,
      cancellation_policy: policy,
    });
    alert('¡Configuración guardada exitosamente!');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <TopBar />
      
      <main className="flex-1 overflow-y-auto p-6 lg:p-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link href="/settings" className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-black text-slate-800">Motor de Reservas</h1>
                <p className="text-sm font-medium text-slate-500 mt-1">Personaliza la apariencia y reglas para {currentProperty.name}</p>
              </div>
            </div>
            <button 
              onClick={handleSave}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-md transition-colors"
            >
              <Save className="w-4 h-4" />
              Guardar Cambios
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Formulario */}
            <div className="md:col-span-2 space-y-6">
              
              {/* Apariencia */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Palette className="w-5 h-5 text-indigo-500" />
                  Apariencia
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Color Principal</label>
                    <p className="text-xs text-slate-500 mb-2">Este color se usará en la cabecera y botones principales del motor.</p>
                    <div className="flex items-center gap-3">
                      <input 
                        type="color" 
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-12 h-12 rounded cursor-pointer border-0 p-0"
                      />
                      <input 
                        type="text" 
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 uppercase"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <ImageUpload 
                      label="Logo de la Propiedad"
                      value={logo}
                      onChange={setLogo}
                    />

                    <ImageUpload 
                      label="Imagen Principal (Hero)"
                      value={hero}
                      onChange={setHero}
                    />
                  </div>
                  </div>
                </div>

              {/* Textos y Políticas */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-500" />
                  Textos y Políticas
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Política de Cancelación Estándar</label>
                    <textarea 
                      value={policy}
                      onChange={(e) => setPolicy(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      placeholder="Ej: Cancelación gratuita hasta 48hs antes del check-in..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Términos y Condiciones</label>
                    <textarea 
                      value={terms}
                      onChange={(e) => setTerms(e.target.value)}
                      rows={5}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      placeholder="Términos legales que el huésped debe aceptar al reservar..."
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Vista Previa */}
            <div className="md:col-span-1">
              <div className="sticky top-6">
                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-500" />
                  Vista Previa (Cabecera)
                </h3>
                
                <div className="rounded-xl overflow-hidden border border-slate-200 shadow-md bg-white">
                  {/* Mockup del Motor */}
                  <div className="p-4 relative" style={{ backgroundColor: color }}>
                    {hero && <div className="absolute inset-0 opacity-20 bg-cover bg-center" style={{ backgroundImage: `url('${hero}')` }}></div>}
                    <div className="relative z-10">
                      {logo ? (
                        <img src={logo} alt="Logo" className="h-8 object-contain mb-4" />
                      ) : (
                        <div className="text-white font-bold text-lg mb-4">{currentProperty.name}</div>
                      )}
                      <div className="bg-white/20 rounded h-2 w-3/4 mb-2"></div>
                      <div className="bg-white/20 rounded h-2 w-1/2"></div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="bg-slate-100 rounded h-16 w-full mb-3 flex items-center px-3">
                       <div className="w-4 h-4 bg-slate-300 rounded-full mr-2"></div>
                       <div className="w-20 h-2 bg-slate-300 rounded"></div>
                    </div>
                    <div className="bg-emerald-500 text-white text-[10px] font-bold py-2 rounded text-center mb-4">
                      SEARCH
                    </div>
                    
                    <div className="text-[10px] text-slate-500">
                      <div className="font-bold mb-1">Política</div>
                      <div className="line-clamp-2 leading-tight">{policy || 'No definida'}</div>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <Link 
                    href={`/book/${currentProperty.id}`} 
                    target="_blank"
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors border border-slate-200 shadow-sm"
                  >
                    Abrir Motor Público <Globe className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
