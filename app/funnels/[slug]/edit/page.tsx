'use client';

import React, { useState, useEffect } from 'react';
import { defaultFunnelConfig, FunnelConfig, FunnelStep } from '../../../../lib/funnelConfig';
import { Save, ArrowLeft, Image as ImageIcon, Type, Layout, Bot, ListTree, Plus, Trash2, ArrowRight, Gift, ChevronDown, ChevronUp, ArrowUp, ArrowDown, UploadCloud, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

export default function FunnelEditor() {
  const router = useRouter();
  const params = useParams();
  const slug = (params?.slug as string) || 'parejas';
  const [config, setConfig] = useState<FunnelConfig>(defaultFunnelConfig);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'steps' | 'images' | 'hooks'>('general');
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [activePreview, setActivePreview] = useState(0);
  const [uploadingHookIdx, setUploadingHookIdx] = useState<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('hotelFlow_funnels');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed[slug]) {
          const loadedConfig = parsed[slug];
          if (!loadedConfig.steps) loadedConfig.steps = defaultFunnelConfig.steps;
          setConfig(loadedConfig);
        }
      } catch (e) {}
    }
  }, [slug]);

  const handleSave = () => {
    // 1. Save funnel config
    const saved = localStorage.getItem('hotelFlow_funnels');
    let parsed = { [slug]: config };
    if (saved) {
      try { parsed = { ...JSON.parse(saved), [slug]: config }; } catch (e) {}
    }
    localStorage.setItem('hotelFlow_funnels', JSON.stringify(parsed));

    // 2. Sync with landings config so it replicates on the website promotions block
    try {
      const savedLandings = localStorage.getItem('hotelFlow_landings');
      let landingsParsed = savedLandings ? JSON.parse(savedLandings) : {};
      
      if (!landingsParsed[slug]) {
        landingsParsed[slug] = {
          slug: slug,
          targetQuizSlug: slug,
          bookingDirectEnabled: true,
          bookingDirectPromoCode: slug.toUpperCase(),
          bookingPropertyId: 'all', // Matches any active website property
          hero: {
            tagline: `OFERTA EXCLUSIVA: ${(config.title || slug).toUpperCase()}`,
            title: config.welcomeHeading || `Preparamos tu estadía soñada.`,
            subtitle: config.reflectionBenefit || `Beneficio Exclusivo Incluido 🎁`,
            description1: config.welcomeDescription || `Completá nuestro breve cuestionario de 1 minuto y accedé a un beneficio único en tu reserva.`,
            description2: "El cupón se activará de forma automática al finalizar.",
            ctaText: "QUIERO MI DESCUENTO ⚡",
            footerText: "Es gratis y te tomará menos de 60 segundos."
          }
        };
      } else {
        landingsParsed[slug].hero.title = config.welcomeHeading || landingsParsed[slug].hero.title;
        landingsParsed[slug].hero.subtitle = config.reflectionBenefit || landingsParsed[slug].hero.subtitle;
        landingsParsed[slug].hero.description1 = config.welcomeDescription || landingsParsed[slug].hero.description1;
      }
      localStorage.setItem('hotelFlow_landings', JSON.stringify(landingsParsed));
      // Trigger storage event so other tabs refresh
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error(e);
    }

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const removeStep = (index: number) => {
    const newSteps = [...config.steps];
    newSteps.splice(index, 1);
    setConfig({ ...config, steps: newSteps });
  };

  const addStep = () => {
    const newStep: FunnelStep = {
      id: "Nueva_Pregunta",
      type: "multiple_choice",
      question: "¿Nueva pregunta?",
      options: [{ label: "Opción 1", value: "1" }],
      maxSelect: 1
    };
    setConfig({ ...config, steps: [...config.steps, newStep] });
    setExpandedStep(config.steps.length);
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === config.steps.length - 1) return;
    const newSteps = [...config.steps];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    [newSteps[index], newSteps[targetIdx]] = [newSteps[targetIdx], newSteps[index]];
    setConfig({ ...config, steps: newSteps });
    
    if (expandedStep === index) {
      setExpandedStep(targetIdx);
    } else if (expandedStep === targetIdx) {
      setExpandedStep(index);
    }
  };

  const handleImageUpload = async (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) {
        setConfig(prev => ({
          ...prev,
          images: { ...prev.images, [key]: data.url }
        }));
      } else {
        alert(data.error || "Error al subir la imagen.");
      }
    } catch (err) {
      alert("Hubo un problema al subir el archivo.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/funnels" className="text-slate-400 hover:text-slate-600 transition-colors bg-slate-100 p-2 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-800">Editor Avanzado</h1>
            <p className="text-sm text-slate-500 font-medium">Embudo: {slug}</p>
          </div>
        </div>
        <button 
          onClick={handleSave}
          className={`px-5 py-2 text-sm font-bold rounded-xl flex items-center gap-2 transition-all shadow-sm ${
            isSaved ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          <Save className="w-4 h-4" />
          {isSaved ? '¡Guardado!' : 'Guardar Cambios'}
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Configurador */}
        <aside className="w-1/2 bg-white border-r border-slate-200 overflow-y-auto flex flex-col z-10">
          
          <div className="flex border-b border-slate-200 bg-slate-50/50 sticky top-0 z-20 backdrop-blur-md">
            <button 
              onClick={() => setActiveTab('general')}
              className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'general' ? 'border-indigo-500 text-indigo-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
              <Type className="w-4 h-4" /> Textos
            </button>
            <button 
              onClick={() => setActiveTab('images')}
              className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'images' ? 'border-indigo-500 text-indigo-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
              <ImageIcon className="w-4 h-4" /> Fotos
            </button>
            <button 
              onClick={() => setActiveTab('steps')}
              className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'steps' ? 'border-indigo-500 text-indigo-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
              <ListTree className="w-4 h-4" /> Preguntas
            </button>
            <button 
              onClick={() => setActiveTab('hooks')}
              className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'hooks' ? 'border-indigo-500 text-indigo-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
              <Gift className="w-4 h-4" /> Regalos
            </button>
          </div>

          <div className="p-6 flex-1 overflow-y-auto">
            
            {activeTab === 'general' && (
              <div className="space-y-8 animate-fade-in">
                <section>
                  <h2 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-4">Pantalla de Bienvenida</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Título de la Barra Superior</label>
                      <input 
                        type="text" value={config.title || ''} onChange={e => setConfig({...config, title: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Subtítulo (Etiqueta amarilla)</label>
                      <input 
                        type="text" value={config.subtitle || ''} onChange={e => setConfig({...config, subtitle: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Encabezado</label>
                      <input 
                        type="text" value={config.welcomeHeading || ''} onChange={e => setConfig({...config, welcomeHeading: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Descripción</label>
                      <textarea 
                        value={config.welcomeDescription || ''} onChange={e => setConfig({...config, welcomeDescription: e.target.value})} rows={3}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                      />
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-4">Pantalla Final (Éxito)</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Encabezado Final</label>
                      <input 
                        type="text" value={config.reflectionHeading || ''} onChange={e => setConfig({...config, reflectionHeading: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Texto Principal</label>
                      <textarea 
                        value={config.reflectionText || ''} onChange={e => setConfig({...config, reflectionText: e.target.value})} rows={2}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Beneficio / Regalo (Se muestra destacado)</label>
                      <input 
                        type="text" value={config.reflectionBenefit || ''} onChange={e => setConfig({...config, reflectionBenefit: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-4">Landing Page Pública (Pre-Quiz)</h2>
                  <div className="space-y-4 bg-amber-50 border border-amber-100 p-5 rounded-2xl">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-amber-900 mb-1">Página de Captación</h3>
                        <p className="text-xs text-amber-700 mb-4">
                          Usá una Landing Page atractiva para enamorar a los prospectos antes de que comiencen a responder el Quiz.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-3">
                      <div>
                        <label className="block text-xs font-bold text-amber-900 mb-1">Destino del botón CTA (Slug del Quiz)</label>
                        <input 
                          type="text" 
                          value={config.landingCtaDestination !== undefined ? config.landingCtaDestination : slug} 
                          onChange={e => setConfig({...config, landingCtaDestination: e.target.value})}
                          placeholder={slug}
                          className="w-full bg-white border border-amber-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                        />
                        <p className="text-[10px] text-amber-700 mt-1 uppercase tracking-wider font-bold">
                          Por defecto apunta a este mismo Quiz ({slug}).
                        </p>
                      </div>
                      
                      <Link 
                        href={`/l/${slug === 'parejas' ? 'bariloche-parejas' : slug}`} 
                        target="_blank"
                        className="inline-flex justify-center px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-sm font-black uppercase tracking-wider rounded-xl hover:shadow-lg hover:shadow-amber-500/25 transition-all w-full mt-2"
                      >
                        Abrir Editor / Vista Previa de Landing
                      </Link>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'images' && (
              <div className="space-y-8 animate-fade-in">
                <section>
                  <h2 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" /> Imágenes de Fondo (URLs o Subir)
                  </h2>
                  <div className="space-y-4">
                    {[
                      { key: 'default', label: 'General / Bienvenida' },
                      { key: 'movie', label: 'Fondo Opción 1 (Ej: Película)' },
                      { key: 'car', label: 'Fondo Opción 2 (Ej: Transporte)' },
                      { key: 'calendar', label: 'Fondo Opción 3 (Ej: Fechas)' },
                      { key: 'contact', label: 'Captura de Contacto' },
                      { key: 'reflection', label: 'Pantalla Final (Éxito)' },
                    ].map((img) => (
                      <div key={img.key}>
                        <label className="block text-xs font-bold text-slate-600 mb-1">{img.label}</label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={config.images[img.key as keyof typeof config.images] || ''}
                            onChange={(e) => setConfig({
                              ...config, 
                              images: { ...config.images, [img.key]: e.target.value }
                            })}
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-xs"
                            placeholder="https://images.unsplash.com/..."
                          />
                          <div className="relative overflow-hidden group rounded-xl bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-colors flex items-center justify-center px-4 cursor-pointer">
                            <span className="text-xs font-bold text-indigo-600">Subir</span>
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={(e) => handleImageUpload(img.key, e)}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-4 leading-relaxed font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">
                    💡 Tip: Podés pegar una URL de Unsplash, o directamente hacer click en "Subir" para cargar una foto desde tu compu.
                  </p>
                </section>
              </div>
            )}

            {activeTab === 'steps' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-slate-500">Pasos configurados ({config.steps.length})</p>
                  <button onClick={addStep} className="flex items-center gap-1 text-xs font-bold bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-100">
                    <Plus className="w-4 h-4" /> Añadir Paso
                  </button>
                </div>
                
                {config.steps.map((step, idx) => {
                  const isExpanded = expandedStep === idx;
                  
                  return (
                    <div key={idx} className={`bg-white border transition-all duration-200 rounded-xl overflow-hidden ${isExpanded ? 'border-indigo-300 shadow-md ring-4 ring-indigo-50' : 'border-slate-200 shadow-sm hover:border-indigo-200'}`}>
                      {/* Compact Header */}
                      <div 
                        className={`p-4 flex items-center gap-4 cursor-pointer transition-colors ${isExpanded ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}`}
                        onClick={() => setExpandedStep(isExpanded ? null : idx)}
                      >
                        <div className={`w-8 h-8 rounded-full font-black flex items-center justify-center shrink-0 transition-colors ${isExpanded ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-600'}`}>
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-900 truncate">
                            {step.question || 'Nueva Pregunta'}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                            <span className="bg-slate-100 px-2 py-0.5 rounded-md font-medium">{step.id}</span>
                            <span className="truncate flex-1">
                              {step.type === 'multiple_choice' ? 'Múltiple' : step.type === 'pax_selector' ? 'Huéspedes' : step.type === 'date_picker' ? 'Fechas' : 'Contacto'}
                            </span>
                          </div>
                        </div>

                        {/* Controls (Up/Down/Delete/Expand) */}
                        <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                          <button 
                            onClick={() => moveStep(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => moveStep(idx, 'down')}
                            disabled={idx === config.steps.length - 1}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                          <div className="w-px h-6 bg-slate-200 mx-1"></div>
                          <button 
                            onClick={() => removeStep(idx)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setExpandedStep(isExpanded ? null : idx)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors ml-1"
                          >
                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Body */}
                      {isExpanded && (
                        <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-4 animate-fade-in-up">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">ID de la Pregunta</label>
                              <input 
                                type="text" 
                                value={step.id} 
                                onChange={e => {
                                  const newSteps = [...config.steps];
                                  newSteps[idx].id = e.target.value;
                                  setConfig({...config, steps: newSteps});
                                }}
                                className="w-full text-sm font-semibold text-slate-900 bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="ID (Ej: Pelicula)"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Tipo</label>
                              <select 
                                value={step.type}
                                onChange={e => {
                                  const newSteps = [...config.steps];
                                  newSteps[idx].type = e.target.value as any;
                                  setConfig({...config, steps: newSteps});
                                }}
                                className="w-full text-sm font-semibold text-slate-900 bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                              >
                                <option value="multiple_choice">Opciones Múltiples</option>
                                <option value="pax_selector">Selector de Personas</option>
                                <option value="date_picker">Selector de Fechas</option>
                                <option value="contact_form">Formulario de Contacto</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Texto de la Pregunta</label>
                            <input 
                              type="text" 
                              value={step.question} 
                              onChange={e => {
                                const newSteps = [...config.steps];
                                newSteps[idx].question = e.target.value;
                                setConfig({...config, steps: newSteps});
                              }}
                              className="w-full text-base font-bold text-slate-900 bg-white border border-slate-200 rounded-lg px-3 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
                              placeholder="Pregunta visible..."
                            />
                          </div>
                          
                          {step.type === 'multiple_choice' && (
                            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                              <div className="flex justify-between items-center mb-4">
                                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                                  Opciones ({step.options?.length || 0})
                                </span>
                                <button 
                                  onClick={() => {
                                    const newSteps = [...config.steps];
                                    if (!newSteps[idx].options) newSteps[idx].options = [];
                                    newSteps[idx].options!.push({ label: 'Nueva Opción', value: `opt_${Date.now()}` });
                                    setConfig({...config, steps: newSteps});
                                  }}
                                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 transition-colors flex items-center gap-1"
                                >
                                  <Plus className="w-3.5 h-3.5" /> Agregar Opción
                                </button>
                              </div>
                              <div className="space-y-2">
                                {step.options?.map((opt, optIdx) => (
                                  <div key={optIdx} className="flex gap-2 items-center">
                                    <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold shrink-0">
                                      {optIdx + 1}
                                    </div>
                                    <input 
                                      type="text" 
                                      value={opt.label}
                                      onChange={e => {
                                        const newSteps = [...config.steps];
                                        newSteps[idx].options![optIdx].label = e.target.value;
                                        newSteps[idx].options![optIdx].value = e.target.value.toLowerCase().replace(/\s+/g, '_');
                                        setConfig({...config, steps: newSteps});
                                      }}
                                      className="flex-1 text-sm font-medium bg-slate-50 border border-slate-200 hover:border-indigo-300 focus:bg-white rounded-lg px-3 py-2 focus:border-indigo-500 outline-none transition-colors"
                                      placeholder="Texto de la opción..."
                                    />
                                    <button 
                                      onClick={() => {
                                        const newSteps = [...config.steps];
                                        newSteps[idx].options!.splice(optIdx, 1);
                                        setConfig({...config, steps: newSteps});
                                      }}
                                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'hooks' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-slate-500">Regalos (Hooks) ({config.hooks?.length || 0})</p>
                  <button onClick={() => {
                    const newHooks = [...(config.hooks || [])];
                    newHooks.push({ id: `hook_${Date.now()}`, type: 'doc', title: 'Nuevo Regalo', description: '', url: '', icon: '🎁' });
                    setConfig({...config, hooks: newHooks});
                  }} className="flex items-center gap-1 text-xs font-bold bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-100">
                    <Plus className="w-4 h-4" /> Añadir Regalo
                  </button>
                </div>
                
                {config.hooks?.map((hook, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 relative group">
                    <button onClick={() => {
                      const newHooks = [...config.hooks!];
                      newHooks.splice(idx, 1);
                      setConfig({...config, hooks: newHooks});
                    }} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    
                    <div className="space-y-3 pr-8">
                      <div className="flex gap-2">
                        <select 
                          value={hook.type}
                          onChange={e => {
                            const newHooks = [...config.hooks!];
                            newHooks[idx].type = e.target.value as any;
                            setConfig({...config, hooks: newHooks});
                          }}
                          className="w-1/3 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg px-2 py-2 outline-none font-bold"
                        >
                          <option value="doc">Documento / PDF</option>
                          <option value="map">Mapa de Google</option>
                          <option value="link">Enlace Externo</option>
                        </select>
                        <input 
                          type="text" 
                          value={hook.icon} 
                          onChange={e => {
                            const newHooks = [...config.hooks!];
                            newHooks[idx].icon = e.target.value;
                            setConfig({...config, hooks: newHooks});
                          }}
                          className="w-16 text-center text-sm font-semibold text-slate-900 bg-white border border-slate-200 rounded-lg px-2 py-2 outline-none"
                          placeholder="Icono (Emoji)"
                        />
                      </div>
                      
                      <input 
                        type="text" 
                        value={hook.title} 
                        onChange={e => {
                          const newHooks = [...config.hooks!];
                          newHooks[idx].title = e.target.value;
                          setConfig({...config, hooks: newHooks});
                        }}
                        className="w-full text-sm font-semibold text-slate-900 bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none"
                        placeholder="Título del regalo (Ej: Guía Gastronómica)"
                      />
                      
                      <input 
                        type="text" 
                        value={hook.description} 
                        onChange={e => {
                          const newHooks = [...config.hooks!];
                          newHooks[idx].description = e.target.value;
                          setConfig({...config, hooks: newHooks});
                        }}
                        className="w-full text-xs text-slate-900 bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none"
                        placeholder="Descripción breve..."
                      />

                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={hook.url} 
                          onChange={e => {
                            const newHooks = [...config.hooks!];
                            newHooks[idx].url = e.target.value;
                            setConfig({...config, hooks: newHooks});
                          }}
                          className="flex-1 text-xs font-mono text-slate-900 bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none"
                          placeholder="https://... o cargá tu archivo PDF"
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById(`hook-pdf-upload-${idx}`)?.click()}
                          className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shrink-0"
                        >
                          {uploadingHookIdx === idx ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                          ) : (
                            <UploadCloud className="w-3.5 h-3.5 text-indigo-500" />
                          )}
                          <span>Subir PDF</span>
                        </button>
                        <input 
                          id={`hook-pdf-upload-${idx}`}
                          type="file"
                          accept=".pdf"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            
                            setUploadingHookIdx(idx);
                            const formData = new FormData();
                            formData.append('file', file);
                            
                            try {
                              const res = await fetch('/api/upload', { method: 'POST', body: formData });
                              const data = await res.json();
                              if (data.url) {
                                const newHooks = [...config.hooks!];
                                newHooks[idx].url = data.url;
                                setConfig({...config, hooks: newHooks});
                              } else {
                                alert(data.error || "Error al subir el archivo.");
                              }
                            } catch (err) {
                              alert("Hubo un problema al subir el archivo.");
                            } finally {
                              setUploadingHookIdx(null);
                            }
                          }}
                          className="hidden"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </aside>

        {/* Live Preview Pane */}
        <main className="w-1/2 bg-slate-100 flex flex-col items-center justify-center p-8 relative overflow-hidden">
          <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm border border-slate-200 px-3 py-1.5 rounded-full text-xs font-bold text-slate-500 shadow-sm flex items-center gap-1.5">
            <Layout className="w-3.5 h-3.5" /> Preview en Vivo
          </div>
          
          {/* Controles del Preview */}
          <div className="flex gap-2 mb-6">
            <button 
              onClick={() => setActivePreview(prev => Math.max(0, prev - 1))}
              className="bg-white border border-slate-200 shadow-sm text-slate-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
            >
              Anterior
            </button>
            <div className="bg-slate-200/50 text-slate-500 font-bold text-xs px-4 py-2 rounded-xl flex items-center">
              {activePreview === 0 ? 'Bienvenida' : activePreview === config.steps.length + 1 ? 'Final' : `Paso ${activePreview}`}
            </div>
            <button 
              onClick={() => setActivePreview(prev => Math.min(config.steps.length + 1, prev + 1))}
              className="bg-white border border-slate-200 shadow-sm text-slate-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
            >
              Siguiente
            </button>
          </div>

          <div className="w-[375px] h-[750px] bg-black rounded-[3rem] p-3 shadow-2xl ring-1 ring-slate-900/5">
            <div className="w-full h-full rounded-[2.25rem] overflow-hidden bg-zinc-950 relative border border-slate-800">
              
              <div 
                className="absolute inset-0 z-0 transition-all duration-500"
                style={{
                  backgroundImage: `linear-gradient(rgba(9, 9, 11, 0.85), rgba(9, 9, 11, 0.85)), url("${
                    activePreview === 0 ? config.images.default :
                    activePreview === config.steps.length + 1 ? config.images.reflection :
                    config.steps[activePreview - 1]?.bgImageKey ? (config.images[config.steps[activePreview - 1].bgImageKey as keyof typeof config.images] || config.images.default) : config.images.default
                  }")`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />

              <div className="relative z-10 flex flex-col h-full text-zinc-100">
                <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md px-4 py-3.5 flex items-center justify-between shrink-0">
                  <div className="flex items-center space-x-2">
                    <div className="bg-amber-400 text-zinc-950 p-1.5 rounded-xl font-bold text-xs tracking-wider flex items-center justify-center w-8 h-8">H</div>
                    <div>
                      <span className="font-bold text-sm tracking-tight text-zinc-200 truncate max-w-[150px] inline-block">{config.title}</span>
                      {activePreview === 0 && <span className="text-amber-400 text-xs font-bold block -mt-1 truncate">{config.subtitle}</span>}
                    </div>
                  </div>
                </header>

                <main className="flex-1 p-4 flex flex-col justify-center overflow-y-auto overflow-x-hidden">
                  
                  {activePreview === 0 && (
                    <div className="text-center animate-fade-in-up">
                      <h1 className="text-3xl font-black tracking-tight text-white mb-4">{config.welcomeHeading}</h1>
                      <p className="text-zinc-400 text-sm leading-relaxed max-w-sm mx-auto mb-8">
                        {config.welcomeDescription}
                      </p>
                      <div className="bg-white text-zinc-950 font-black py-4 rounded-xl text-sm flex items-center justify-center gap-2">
                        Comenzar <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  )}

                  {activePreview > 0 && activePreview <= config.steps.length && (
                    <div className="animate-fade-in-up w-full">
                      <h2 className="text-2xl font-black text-white mb-2 tracking-tight">
                        {config.steps[activePreview - 1].question}
                      </h2>
                      {config.steps[activePreview - 1].subtitle && (
                        <p className="text-zinc-400 font-medium mb-6 text-sm">
                          {config.steps[activePreview - 1].subtitle}
                        </p>
                      )}

                      {config.steps[activePreview - 1].type === 'multiple_choice' && (
                        <div className="space-y-3">
                          {config.steps[activePreview - 1].options?.map((opt, i) => (
                            <div key={i} className="w-full p-4 rounded-2xl bg-zinc-800/50 border border-zinc-700/50 text-left">
                              <div className="font-bold text-white text-sm">{opt.label}</div>
                              {opt.description && <div className="text-xs text-zinc-500 mt-1">{opt.description}</div>}
                            </div>
                          ))}
                        </div>
                      )}

                      {config.steps[activePreview - 1].type === 'date_picker' && (
                        <div className="space-y-4">
                          <div className="bg-zinc-800 border-2 border-zinc-700 rounded-xl p-4 text-zinc-400 text-sm font-medium">
                            [ Selector de Fecha: Llegada ]
                          </div>
                          <div className="bg-zinc-800 border-2 border-zinc-700 rounded-xl p-4 text-zinc-400 text-sm font-medium">
                            [ Selector de Fecha: Salida ]
                          </div>
                        </div>
                      )}

                      {config.steps[activePreview - 1].type === 'pax_selector' && (
                        <div className="space-y-3">
                          <div className="bg-zinc-800/80 border-2 border-zinc-700/50 rounded-2xl p-4 flex items-center justify-between">
                            <div className="text-white font-bold text-sm">Adultos</div>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-zinc-700/50 flex items-center justify-center text-zinc-300">-</div>
                              <span className="font-black text-white">2</span>
                              <div className="w-8 h-8 rounded-full bg-zinc-700/50 flex items-center justify-center text-zinc-300">+</div>
                            </div>
                          </div>
                          <div className="bg-zinc-800/80 border-2 border-zinc-700/50 rounded-2xl p-4 flex items-center justify-between">
                            <div>
                              <div className="text-white font-bold text-sm">Niños</div>
                              <div className="text-zinc-400 text-[10px]">Hasta 12 años</div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-zinc-700/50 flex items-center justify-center text-zinc-300">-</div>
                              <span className="font-black text-white">0</span>
                              <div className="w-8 h-8 rounded-full bg-zinc-700/50 flex items-center justify-center text-zinc-300">+</div>
                            </div>
                          </div>
                          <div className="bg-zinc-800/80 border-2 border-zinc-700/50 rounded-2xl p-4 flex items-center justify-between">
                            <div>
                              <div className="text-white font-bold text-sm">Bebés en cuna</div>
                              <div className="text-zinc-400 text-[10px]">De 0 a 2 años</div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-zinc-700/50 flex items-center justify-center text-zinc-300">-</div>
                              <span className="font-black text-white">0</span>
                              <div className="w-8 h-8 rounded-full bg-zinc-700/50 flex items-center justify-center text-zinc-300">+</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {config.steps[activePreview - 1].type === 'contact_form' && (
                        <div className="space-y-4">
                          <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 text-zinc-500 text-sm">Tu nombre completo</div>
                          <div className="flex gap-2">
                            <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 text-zinc-500 text-sm w-1/3">WhatsApp</div>
                            <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 text-zinc-500 text-sm flex-1">+54...</div>
                          </div>
                          <div className="w-full bg-amber-500 text-zinc-950 font-black py-4 px-8 rounded-xl flex items-center justify-center text-sm shadow-lg shadow-amber-500/20">
                            Generar Propuesta ✨
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activePreview === config.steps.length + 1 && (
                    <div className="text-center animate-fade-in-up">
                      <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
                        <span className="text-2xl">✓</span>
                      </div>
                      <h2 className="text-2xl font-black text-white mb-4 tracking-tight">
                        {config.reflectionHeading}
                      </h2>
                      <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 rounded-2xl p-5 mb-6 text-left">
                        <p className="text-sm text-zinc-300 font-medium leading-relaxed mb-4">
                          {config.reflectionText}
                        </p>
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex gap-3">
                          <span className="text-lg">🎁</span>
                          <div>
                            <h4 className="font-bold text-amber-400 text-xs mb-1">Beneficio Incluido</h4>
                            <p className="text-xs text-zinc-400">
                              {config.reflectionBenefit}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </main>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
