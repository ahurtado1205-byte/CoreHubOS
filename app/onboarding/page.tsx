'use client';

import { useState } from 'react';
import { Hexagon, PlayCircle, Sparkles, ArrowRight, Hotel, Check, Building2, BedDouble, Key } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { usePMS } from '../../context/PMSContext';

export default function OnboardingPage() {
  const router = useRouter();
  const { initializeSystem, addUnitType, addUnit, updateUnitType, currentPropertyId } = usePMS();
  
  const [step, setStep] = useState<'welcome' | 'wizard_property' | 'wizard_category' | 'wizard_unit' | 'done'>('welcome');
  const [loading, setLoading] = useState(false);

  // Wizard State
  const [propertyName, setPropertyName] = useState('');
  
  const [categoryName, setCategoryName] = useState('');
  const [categoryCapacity, setCategoryCapacity] = useState(2);
  const [createdCategoryId, setCreatedCategoryId] = useState('');

  const [unitName, setUnitName] = useState('');

  const handleSelectDemo = () => {
    setLoading(true);
    setTimeout(() => {
      initializeSystem('demo');
      router.push('/');
    }, 1500);
  };

  const handleSelectBlank = () => {
    setStep('wizard_property');
  };

  const handlePropertySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyName) return;
    initializeSystem('blank', propertyName);
    setStep('wizard_category');
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName) return;
    const newCat = await addUnitType({
      property_id: currentPropertyId,
      name: categoryName,
      description: 'Creado desde el asistente inicial.',
      base_price: 0,
      max_pax: categoryCapacity,
      amenities: []
    });
    
    if (newCat) {
      setCreatedCategoryId(newCat.id);
      setStep('wizard_unit');
    } else {
      alert("Error al guardar la categoría en Supabase.");
    }
  };

  const handleUnitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitName) return;
    await addUnit({
      property_id: currentPropertyId,
      unit_type_id: createdCategoryId,
      name: unitName,
      status: 'active',
      housekeeping_status: 'clean'
    });
    setStep('done');
  };

  const finishWizard = () => {
    router.push('/');
  };

  const inputClass = "w-full p-4 bg-white border-2 border-slate-200 rounded-xl text-slate-900 font-bold text-lg focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 transition-all";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        
        <div className="text-center mb-10">
          <div className="bg-indigo-600 p-3 rounded-2xl inline-block mb-6 shadow-lg shadow-indigo-600/20">
            <Hexagon className="w-10 h-10 text-white" />
          </div>
          {step === 'welcome' && (
            <>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">Te damos la bienvenida a CoreHub OS</h1>
              <p className="text-slate-500 text-lg font-medium max-w-xl mx-auto">
                El ecosistema operativo definitivo para alojamientos. Para empezar a transformar tu gestión, elegí cómo querés arrancar.
              </p>
            </>
          )}
          {step !== 'welcome' && step !== 'done' && (
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Configuración Inicial</h1>
          )}
        </div>

        {step === 'welcome' && (
          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Opcion Demo */}
            <button 
              onClick={handleSelectDemo}
              disabled={loading}
              className="bg-white rounded-3xl p-8 border-2 border-slate-100 shadow-xl shadow-slate-200/50 hover:border-indigo-400 hover:shadow-indigo-500/10 transition-all text-left group flex flex-col items-start relative overflow-hidden"
            >
              {loading && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                  <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                  <p className="font-bold text-indigo-900">Cargando datos de prueba...</p>
                </div>
              )}
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                <PlayCircle className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-3">Explorar Demo</h3>
              <p className="text-slate-500 font-medium mb-6 leading-relaxed">
                Ideal para aprender a usar el sistema. Cargaremos reservas falsas, tipos de habitaciones, perfiles de clientes y el roomrack completo para que juegues sin miedo.
              </p>
              <div className="mt-auto flex items-center gap-2 text-indigo-600 font-bold group-hover:gap-4 transition-all">
                Iniciar Modo Prueba <ArrowRight className="w-5 h-5" />
              </div>
            </button>

            {/* Opcion Desde Cero */}
            <button 
              onClick={handleSelectBlank}
              disabled={loading}
              className="bg-white rounded-3xl p-8 border-2 border-slate-100 shadow-xl shadow-slate-200/50 hover:border-emerald-400 hover:shadow-emerald-500/10 transition-all text-left group flex flex-col items-start"
            >
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-3">Empezar de Cero</h3>
              <p className="text-slate-500 font-medium mb-6 leading-relaxed">
                Tu lienzo en blanco. Entrarás a un entorno limpio y te guiaremos paso a paso para configurar tu propiedad real, tus categorías y tu primera unidad.
              </p>
              <div className="mt-auto flex items-center gap-2 text-emerald-600 font-bold group-hover:gap-4 transition-all">
                Configurar mi Propiedad <ArrowRight className="w-5 h-5" />
              </div>
            </button>
          </div>
        )}

        {/* Wizard Paso 1: Propiedad */}
        {step === 'wizard_property' && (
          <div className="max-w-xl mx-auto bg-white rounded-3xl p-10 shadow-xl shadow-slate-200/50 border border-slate-100">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center"><Building2 className="w-6 h-6" /></div>
              <div>
                <div className="text-sm font-bold text-indigo-600 uppercase tracking-widest mb-1">Paso 1 de 3</div>
                <h2 className="text-2xl font-black text-slate-800">Nombre del Alojamiento</h2>
              </div>
            </div>
            <form onSubmit={handlePropertySubmit}>
              <div className="mb-8">
                <label className="block text-slate-500 font-medium mb-3">¿Cómo se llama tu hotel, hostal o propiedad?</label>
                <input 
                  autoFocus
                  required
                  type="text" 
                  value={propertyName}
                  onChange={e => setPropertyName(e.target.value)}
                  placeholder="Ej: Grand Hotel Plaza" 
                  className={inputClass}
                />
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white font-black p-4 rounded-xl hover:bg-indigo-700 transition-colors flex justify-center items-center gap-2">
                Continuar <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          </div>
        )}

        {/* Wizard Paso 2: Categoria */}
        {step === 'wizard_category' && (
          <div className="max-w-xl mx-auto bg-white rounded-3xl p-10 shadow-xl shadow-slate-200/50 border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center"><BedDouble className="w-6 h-6" /></div>
              <div>
                <div className="text-sm font-bold text-indigo-600 uppercase tracking-widest mb-1">Paso 2 de 3</div>
                <h2 className="text-2xl font-black text-slate-800">Tu primera Categoría</h2>
              </div>
            </div>
            <p className="text-slate-500 mb-6 font-medium">Las categorías agrupan habitaciones iguales (Ej: Doble Estándar, Suite, Cabaña 2 Pax).</p>
            <form onSubmit={handleCategorySubmit}>
              <div className="space-y-6 mb-8">
                <div>
                  <label className="block text-slate-700 font-bold mb-2">Nombre de la Categoría</label>
                  <input 
                    autoFocus
                    required
                    type="text" 
                    value={categoryName}
                    onChange={e => setCategoryName(e.target.value)}
                    placeholder="Ej: Habitación Doble Estándar" 
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-2">Capacidad Máxima de Personas (Pax)</label>
                  <input 
                    required
                    type="number" 
                    min="1"
                    value={categoryCapacity}
                    onChange={e => setCategoryCapacity(Number(e.target.value))}
                    className={inputClass}
                  />
                </div>
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white font-black p-4 rounded-xl hover:bg-indigo-700 transition-colors flex justify-center items-center gap-2">
                Continuar <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          </div>
        )}

        {/* Wizard Paso 3: Unidad Física */}
        {step === 'wizard_unit' && (
          <div className="max-w-xl mx-auto bg-white rounded-3xl p-10 shadow-xl shadow-slate-200/50 border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center"><Key className="w-6 h-6" /></div>
              <div>
                <div className="text-sm font-bold text-indigo-600 uppercase tracking-widest mb-1">Último Paso</div>
                <h2 className="text-2xl font-black text-slate-800">Unidad Física Real</h2>
              </div>
            </div>
            <p className="text-slate-500 mb-6 font-medium">Creemos la primera habitación física que pertenece a la categoría "{categoryName}".</p>
            <form onSubmit={handleUnitSubmit}>
              <div className="mb-8">
                <label className="block text-slate-700 font-bold mb-2">Nombre o Número de Habitación</label>
                <input 
                  autoFocus
                  required
                  type="text" 
                  value={unitName}
                  onChange={e => setUnitName(e.target.value)}
                  placeholder="Ej: 101, Cabaña A, etc." 
                  className={inputClass}
                />
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white font-black p-4 rounded-xl hover:bg-indigo-700 transition-colors flex justify-center items-center gap-2">
                Finalizar Configuración <Check className="w-5 h-5" />
              </button>
            </form>
          </div>
        )}

        {/* Wizard Finalizado */}
        {step === 'done' && (
          <div className="max-w-md mx-auto text-center animate-in zoom-in duration-500">
            <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-12 h-12" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-4">¡Todo Listo!</h2>
            <p className="text-slate-500 font-medium mb-8 text-lg">
              Tu base de datos ha sido inicializada. Ya podés empezar a cargar más habitaciones y registrar tus primeras reservas.
            </p>
            <button 
              onClick={finishWizard}
              className="w-full bg-slate-900 text-white font-black p-5 rounded-2xl hover:bg-slate-800 active:scale-95 transition-all text-lg"
            >
              Ir a mi Roomrack
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
