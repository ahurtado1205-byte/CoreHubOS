'use client';

import React, { useState } from 'react';
import { Settings, Hotel, Users, CreditCard, Bell, Shield, ArrowLeft, CircleDollarSign, Globe, Trash2, RotateCcw, AlertTriangle, Plus, X } from 'lucide-react';
import Link from 'next/link';
import { usePMS } from '../../context/PMSContext';

export default function SettingsPage() {
  const { initializeSystem, bookingSources, addSource, deleteSource } = usePMS();
  const [newSource, setNewSource] = useState('');
  const [newEmoji, setNewEmoji] = useState('📌');

  const sourceEmojis: Record<string, string> = {
    'WhatsApp': '💬', 'Email': '📧', 'Teléfono': '📞', 'Instagram': '📸',
    'Booking.com': '🏨', 'Web': '🌐', 'Walk-in': '🚶', 'Airbnb': '🏠',
    'Facebook': '📘', 'Referido': '🤝', 'Agencia': '🏢', 'Directo': '✈️'
  };

  const getEmoji = (s: string) => sourceEmojis[s] || '📌';

  const sections = [
    { icon: Hotel, title: 'Propiedades y Unidades', description: 'Gestioná tus propiedades y tipos de unidades.', href: '/settings/inventory' },
    { icon: CircleDollarSign, title: 'Tarifas y Reglas', description: 'Administrá planes de tarifas, descuentos y reglas de revenue.', href: '/settings/rates' },
    { icon: Hotel, title: 'Motor de Reservas', description: 'Configurá colores, logo, y términos del motor.', href: '/settings/booking-engine' },
    { icon: Globe, title: 'Sitio Web de la Propiedad', description: 'Personalizá el sitio web público de tu propiedad.', href: '/settings/website' },
    { icon: Users, title: 'Equipo y Accesos', description: 'Administrá roles y permisos para tu staff.', href: '/settings/team' },
    { icon: CreditCard, title: 'Facturación y Pagos', description: 'Configurá métodos de cobro y pasarelas de pago.', href: '#' },
    { icon: Bell, title: 'Notificaciones', description: 'Reglas de envío automático de emails y alertas.', href: '#' },
    { icon: Shield, title: 'Seguridad', description: 'Contraseñas, 2FA y logs de actividad.', href: '#' }
  ];

  const handleResetToDemo = (mode: 'demo' | 'demo_1' | 'demo_2' | 'demo_3' = 'demo') => {
    const labels = {
      demo: 'Hotel Estándar con grilla rica',
      demo_1: 'Cabañas de Montaña (5 unidades estándar)',
      demo_2: 'Complejo Mixto (Departamentos, Casas y Casa Grande)',
      demo_3: 'Gran Complejo Hotelero (30 habitaciones y kitchinet)'
    };
    if (confirm(`¿Quieres cargar el preset: "${labels[mode]}"? Se sobreescribirán los cambios actuales.`)) {
      initializeSystem(mode);
      alert('¡Base de datos demo restablecida con éxito! Navega libremente.');
    }
  };

  const handleNuclearBomb = () => {
    if (confirm('⚠️ ADVERTENCIA DE BOMBA NUCLEAR ⚠️\n\n¿Estás absolutamente seguro de detonar el sistema? Se borrarán físicamente todas las propiedades, reservas, cotizaciones, leads, pagos y tareas, dejando el sistema 100% virgen en blanco.')) {
      const code = prompt('Para confirmar la detonación total y dejar la base de datos en blanco, escribe la palabra: "VIRGEN"');
      if (code && code.trim().toUpperCase() === 'VIRGEN') {
        initializeSystem('blank', 'Nueva Propiedad');
        alert('💥 ¡BOOM! Sistema detonado. Se ha creado una propiedad en blanco llamada "Nueva Propiedad". Tu base de datos quedó 100% virgen.');
      } else {
        alert('Cancelado. Bomba nuclear desactivada.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 overflow-y-auto font-sans text-slate-900 pb-20">
      <div className="max-w-5xl mx-auto p-6 lg:p-12">
        
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/roomrack" className="w-12 h-12 rounded-xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center hover:bg-slate-100 hover:text-slate-700 transition-colors shadow-sm">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Configuración</h1>
                <div className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg uppercase tracking-widest">Beta</div>
              </div>
              <p className="text-slate-500 text-base font-medium">Administrá todos los aspectos operativos de CoreHub OS.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((section, idx) => {
            const Icon = section.icon;
            return (
              <Link href={section.href} key={idx} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(99,102,241,0.1)] hover:border-indigo-300 transition-all cursor-pointer group hover:-translate-y-1 block">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 text-slate-600 flex items-center justify-center mb-5 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-colors">
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-black text-slate-800 mb-2">{section.title}</h3>
                <p className="text-sm font-medium text-slate-500 leading-relaxed">{section.description}</p>
              </Link>
            );
          })}
        </div>



        {/* Database & Sandboxing Tools Section */}
        <div className="mt-12 border-t border-slate-200 pt-12">
          <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">
            ⚙️ Herramientas de Base de Datos y Demo
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Demo Reset Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                  <RotateCcw className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-slate-800 mb-2">Cargar Demo Completo 🚀</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-4 font-medium">
                  Restaura la base de datos con datos de prueba ricos para bucear por toda la interfaz.
                </p>
                
                <div className="space-y-2 mb-6">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Presets de Estructura:</span>
                  <div className="flex flex-col gap-1.5">
                    <button 
                      onClick={() => handleResetToDemo('demo_1')}
                      className="w-full text-left text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-3 py-2 rounded-xl transition-all font-semibold flex justify-between items-center"
                    >
                      <span>🏔️ Cabañas de Montaña</span>
                      <span className="text-[10px] text-slate-400 font-bold">5 Cabañas</span>
                    </button>
                    <button 
                      onClick={() => handleResetToDemo('demo_2')}
                      className="w-full text-left text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-3 py-2 rounded-xl transition-all font-semibold flex justify-between items-center"
                    >
                      <span>🏡 Complejo Mixto</span>
                      <span className="text-[10px] text-slate-400 font-bold">Deptos & Casas</span>
                    </button>
                    <button 
                      onClick={() => handleResetToDemo('demo_3')}
                      className="w-full text-left text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-3 py-2 rounded-xl transition-all font-semibold flex justify-between items-center"
                    >
                      <span>🏨 Gran Hotel</span>
                      <span className="text-[10px] text-slate-400 font-bold">30 Habitaciones</span>
                    </button>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => handleResetToDemo('demo')}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all"
              >
                Cargar Hotel Estándar
              </button>
            </div>

            {/* Nuclear Bomb Card */}
            <div className="bg-rose-50/50 rounded-3xl p-6 border border-rose-100 shadow-[0_8px_30px_rgb(244,63,94,0.02)] flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-rose-800 mb-2">Bomba Nuclear 💣</h3>
                <p className="text-sm text-rose-600/80 leading-relaxed mb-6 font-medium">
                  ¡PELIGRO! Limpia absolutamente todo el sistema (reservas, cotizaciones, leads, pagos). Ideal para dejar el sistema 100% virgen y empezar de cero.
                </p>
              </div>
              <button 
                onClick={handleNuclearBomb}
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-1 shadow-md shadow-rose-200"
              >
                <Trash2 className="w-4 h-4" /> Detonar Base de Datos
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
