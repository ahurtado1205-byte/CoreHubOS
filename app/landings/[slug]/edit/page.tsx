'use client';

import React, { useState, useEffect } from 'react';
import { defaultLandingConfig, LandingConfig, FunnelConfig, defaultFunnelConfig } from '../../../../lib/funnelConfig';
import { Save, ArrowLeft, LayoutTemplate, SplitSquareHorizontal, FileText, Quote as QuoteIcon, ArrowRight, FileSignature } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { usePMS } from '../../../../context/PMSContext';

export default function LandingEditor() {
  const router = useRouter();
  const params = useParams();
  const slugParam = (params?.slug as string) || 'nueva';
  
  const { landings, updateLandings, funnels, updateFunnels, saveStatus } = usePMS();
  const [config, setConfig] = useState<LandingConfig>(defaultLandingConfig);
  const [funnelConfig, setFunnelConfig] = useState<FunnelConfig>(defaultFunnelConfig);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'hero' | 'comparison' | 'features' | 'quote' | 'preQuiz' | 'quiz'>('hero');
  const [slug, setSlug] = useState(slugParam === 'nueva' ? 'mi-landing' : slugParam);

  useEffect(() => {
    if (slugParam !== 'nueva') {
      if (landings && landings[slugParam]) {
        setConfig(landings[slugParam]);
      } else {
        const saved = localStorage.getItem('hotelFlow_landings');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed[slugParam]) {
              setConfig(parsed[slugParam]);
            }
          } catch (e) {}
        }
      }
      
      // Load corresponding funnel configuration
      if (funnels && funnels[slugParam]) {
        setFunnelConfig(funnels[slugParam]);
      } else if (landings && landings[slugParam]?.targetQuizSlug && funnels && funnels[landings[slugParam].targetQuizSlug]) {
        setFunnelConfig(funnels[landings[slugParam].targetQuizSlug]);
      }
    }
  }, [slugParam, landings, funnels]);

  const handleSave = () => {
    const targetSlug = slug || slugParam;
    const nextLandingConfig = { 
      ...config, 
      slug: targetSlug,
      targetQuizSlug: targetSlug
    };

    const saved = localStorage.getItem('hotelFlow_landings');
    let parsed = { [targetSlug]: nextLandingConfig };
    if (saved) {
      try { parsed = { ...JSON.parse(saved), [targetSlug]: nextLandingConfig }; } catch (e) {}
    }
    localStorage.setItem('hotelFlow_landings', JSON.stringify(parsed));
    
    // Save Landing to context
    updateLandings({
      ...landings,
      [targetSlug]: nextLandingConfig
    });

    // Save Funnel Config to context (aligning with same slug)
    const nextFunnelConfig = {
      ...funnelConfig,
      title: targetSlug.toUpperCase(),
      subtitle: `Quiz ${targetSlug}`,
      welcomeHeading: funnelConfig.welcomeHeading || `¡Disfrutá de tu escapada ideal!`,
      welcomeDescription: funnelConfig.welcomeDescription || `Respondé unas preguntas y obtené tu tarifa promocional.`,
      reflectionHeading: funnelConfig.reflectionHeading || "¡Respuestas recibidas! 🎁",
      reflectionText: funnelConfig.reflectionText || `Ya estamos preparando la mejor propuesta para vos.`,
      reflectionBenefit: funnelConfig.reflectionBenefit || `Código aplicado automáticamente en tu reserva directa.`,
      steps: funnelConfig.steps || defaultFunnelConfig.steps,
      hooks: funnelConfig.hooks || defaultFunnelConfig.hooks,
      images: funnelConfig.images || defaultFunnelConfig.images
    };

    updateFunnels({
      ...funnels,
      [targetSlug]: nextFunnelConfig
    });

    // Save Funnel Config to localStorage for immediate reflection
    const savedFunnels = localStorage.getItem('hotelFlow_funnels');
    let parsedFunnels = { [targetSlug]: nextFunnelConfig };
    if (savedFunnels) {
      try { parsedFunnels = { ...JSON.parse(savedFunnels), [targetSlug]: nextFunnelConfig }; } catch (e) {}
    }
    localStorage.setItem('hotelFlow_funnels', JSON.stringify(parsedFunnels));

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
    
    if (slugParam === 'nueva') {
      router.push(`/landings/${targetSlug}/edit`);
    }
  };

  const updateConfig = (section: keyof LandingConfig, key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        [key]: value
      }
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/landings" className="text-slate-400 hover:text-slate-600 transition-colors bg-slate-100 p-2 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-800">Editor de Landing Page</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-slate-500 font-medium">/l/</span>
              <input 
                type="text" 
                value={slug}
                onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                className="bg-slate-100 border border-slate-200 rounded px-2 py-0.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 w-48"
                placeholder="slug-de-la-landing"
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            href={`/l/${slug}`} 
            target="_blank"
            className="px-5 py-2 text-sm font-bold rounded-xl flex items-center gap-2 bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
          >
            Ver Landing
            <ArrowRight className="w-4 h-4" />
          </Link>
          {saveStatus === 'saving' && (
            <span className="text-xs text-amber-600 font-bold animate-pulse">
              ☁️ Guardando en la nube...
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="text-xs text-red-600 font-bold">
              ❌ Error al guardar (revisa la consola)
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-xs text-emerald-600 font-bold">
              ✅ Sincronizado con la nube
            </span>
          )}
          <button 
            onClick={handleSave}
            className={`px-5 py-2 text-sm font-bold rounded-xl flex items-center gap-2 transition-all shadow-sm ${
              saveStatus === 'saving' ? 'bg-amber-500 text-white' :
              saveStatus === 'error' ? 'bg-red-600 text-white' :
              isSaved ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            <Save className="w-4 h-4" />
            {saveStatus === 'saving' ? 'Guardando...' : isSaved ? '¡Guardado!' : 'Guardar Cambios'}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Nav */}
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
          <nav className="p-4 space-y-2">
            {[
              { id: 'hero', icon: LayoutTemplate, label: 'Sección Hero' },
              { id: 'comparison', icon: SplitSquareHorizontal, label: 'Opción A vs B' },
              { id: 'features', icon: FileText, label: 'Mapa del Tesoro' },
              { id: 'quote', icon: QuoteIcon, label: 'Frase Final' },
              { id: 'preQuiz', icon: LayoutTemplate, label: 'Llamado a la Acción' },
              { id: 'quiz', icon: FileSignature, label: 'Configuración Quiz' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeTab === tab.id 
                    ? 'bg-indigo-50 text-indigo-700' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-8 bg-slate-50">
          <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            
            {activeTab === 'hero' && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="text-lg font-black text-slate-800 mb-6 border-b border-slate-100 pb-4">Sección Principal (Hero)</h2>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Tagline (Etiqueta superior)</label>
                  <input type="text" value={config.hero.tagline} onChange={e => updateConfig('hero', 'tagline', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Título Principal</label>
                  <input type="text" value={config.hero.title} onChange={e => updateConfig('hero', 'title', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-xl font-bold" />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Subtítulo Destacado</label>
                  <input type="text" value={config.hero.subtitle} onChange={e => updateConfig('hero', 'subtitle', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-amber-600 focus:ring-2 focus:ring-indigo-500 outline-none text-xl font-bold" />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Descripción 1</label>
                  <textarea value={config.hero.description1} onChange={e => updateConfig('hero', 'description1', e.target.value)} rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none resize-none" />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Descripción 2</label>
                  <textarea value={config.hero.description2} onChange={e => updateConfig('hero', 'description2', e.target.value)} rows={2} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none resize-none" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Texto del Botón CTA</label>
                    <input type="text" value={config.hero.ctaText} onChange={e => updateConfig('hero', 'ctaText', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none font-bold" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Texto al pie del botón</label>
                    <input type="text" value={config.hero.footerText} onChange={e => updateConfig('hero', 'footerText', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'comparison' && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="text-lg font-black text-slate-800 mb-6 border-b border-slate-100 pb-4">Opción A vs Opción B</h2>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Título de la sección</label>
                  <input type="text" value={config.comparison.title} onChange={e => updateConfig('comparison', 'title', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-xl font-bold" />
                </div>
                
                <div className="grid grid-cols-2 gap-8 mt-8">
                  {/* Option A */}
                  <div className="space-y-4 p-4 border border-slate-200 rounded-xl bg-slate-50/50">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Título A (Malo)</label>
                      <input type="text" value={config.comparison.optionA_title} onChange={e => updateConfig('comparison', 'optionA_title', e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none font-bold" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Puntos (uno por línea)</label>
                      <textarea 
                        value={config.comparison.optionA_points.join('\n')} 
                        onChange={e => updateConfig('comparison', 'optionA_points', e.target.value.split('\n'))} 
                        rows={6} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none resize-none" 
                      />
                    </div>
                  </div>
                  
                  {/* Option B */}
                  <div className="space-y-4 p-4 border border-amber-200 rounded-xl bg-amber-50/30">
                    <div>
                      <label className="block text-xs font-bold text-amber-700 mb-1">Título B (Bueno)</label>
                      <input type="text" value={config.comparison.optionB_title} onChange={e => updateConfig('comparison', 'optionB_title', e.target.value)} className="w-full bg-white border border-amber-200 rounded-lg px-3 py-2 text-sm outline-none font-bold text-amber-600" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-amber-700 mb-1">Puntos (uno por línea)</label>
                      <textarea 
                        value={config.comparison.optionB_points.join('\n')} 
                        onChange={e => updateConfig('comparison', 'optionB_points', e.target.value.split('\n'))} 
                        rows={6} className="w-full bg-white border border-amber-200 rounded-lg px-3 py-2 text-sm outline-none resize-none" 
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-slate-100">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Conclusión</label>
                    <input type="text" value={config.comparison.conclusion} onChange={e => updateConfig('comparison', 'conclusion', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Texto del Botón CTA</label>
                    <input type="text" value={config.comparison.ctaText} onChange={e => updateConfig('comparison', 'ctaText', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 outline-none font-bold" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'features' && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="text-lg font-black text-slate-800 mb-6 border-b border-slate-100 pb-4">Características (El Mapa del Tesoro)</h2>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Título de la sección</label>
                  <input type="text" value={config.features.title} onChange={e => updateConfig('features', 'title', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-xl font-bold" />
                </div>
                
                <div className="space-y-4 mt-8">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Tarjetas de Beneficios</label>
                  {config.features.items.map((item, i) => (
                    <div key={item.id} className="flex gap-4 p-4 border border-slate-200 rounded-xl bg-slate-50 items-start">
                      <div className="w-16">
                        <input type="text" value={item.icon} onChange={e => {
                          const newItems = [...config.features.items];
                          newItems[i].icon = e.target.value;
                          updateConfig('features', 'items', newItems);
                        }} className="w-full text-center bg-white border border-slate-200 rounded-lg px-2 py-2 text-xl outline-none" placeholder="Icono" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <input type="text" value={item.title} onChange={e => {
                          const newItems = [...config.features.items];
                          newItems[i].title = e.target.value;
                          updateConfig('features', 'items', newItems);
                        }} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none font-bold" placeholder="Título" />
                        <input type="text" value={item.description} onChange={e => {
                          const newItems = [...config.features.items];
                          newItems[i].description = e.target.value;
                          updateConfig('features', 'items', newItems);
                        }} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" placeholder="Descripción" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'quote' && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="text-lg font-black text-slate-800 mb-6 border-b border-slate-100 pb-4">Frase y Reflexión</h2>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Frase Destacada</label>
                  <textarea value={config.quote.text} onChange={e => updateConfig('quote', 'text', e.target.value)} rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-amber-600 font-serif italic text-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none" />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Contexto Párrafo 1</label>
                  <input type="text" value={config.quote.authorOrContext1} onChange={e => updateConfig('quote', 'authorOrContext1', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 outline-none" />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Contexto Párrafo 2</label>
                  <input type="text" value={config.quote.authorOrContext2} onChange={e => updateConfig('quote', 'authorOrContext2', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 outline-none" />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Texto Final Resaltado</label>
                  <input type="text" value={config.quote.highlight} onChange={e => updateConfig('quote', 'highlight', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 outline-none font-bold" />
                </div>
                
                <div className="pt-4 border-t border-slate-100">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Texto del Botón CTA</label>
                  <input type="text" value={config.quote.ctaText} onChange={e => updateConfig('quote', 'ctaText', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 outline-none font-bold" />
                </div>
              </div>
            )}

            {activeTab === 'preQuiz' && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="text-lg font-black text-slate-800 mb-6 border-b border-slate-100 pb-4">Llamado a la Acción (Pre-Quiz)</h2>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Título de Cierre</label>
                  <input type="text" value={config.preQuiz.title} onChange={e => updateConfig('preQuiz', 'title', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-xl font-bold" />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Descripción 1</label>
                  <textarea value={config.preQuiz.description1} onChange={e => updateConfig('preQuiz', 'description1', e.target.value)} rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 outline-none resize-none" />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Descripción 2 (Resaltada)</label>
                  <input type="text" value={config.preQuiz.description2} onChange={e => updateConfig('preQuiz', 'description2', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 outline-none" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Texto del Botón CTA Final</label>
                    <input type="text" value={config.preQuiz.ctaText} onChange={e => updateConfig('preQuiz', 'ctaText', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 outline-none font-bold" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Aclaración / Anti-Spam</label>
                    <input type="text" value={config.preQuiz.footerText} onChange={e => updateConfig('preQuiz', 'footerText', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 outline-none" />
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-200">
                  <h3 className="text-sm font-bold text-indigo-900 mb-2">¿A qué Quiz debe llevar este botón?</h3>
                  <p className="text-xs text-slate-500 mb-4">Ingresá el slug del funnel que querés que se abra cuando el usuario haga clic en empezar.</p>
                  <input type="text" value={config.targetQuizSlug} onChange={e => setConfig({...config, targetQuizSlug: e.target.value})} className="w-full max-w-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm" placeholder="ej: parejas" />
                </div>

                <div className="mt-8 pt-8 border-t border-slate-200 space-y-4">
                  <h3 className="text-sm font-bold text-indigo-900">Configuración de Motor de Reservas</h3>
                  
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      id="bookingDirectEnabled" 
                      checked={config.bookingDirectEnabled || false} 
                      onChange={e => setConfig({...config, bookingDirectEnabled: e.target.checked})} 
                      className="w-5 h-5 accent-indigo-600 border-slate-300 rounded"
                    />
                    <label htmlFor="bookingDirectEnabled" className="text-sm font-bold text-slate-700">Permitir ir directamente al Motor de Reservas</label>
                  </div>

                  {config.bookingDirectEnabled && (
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">CÓDIGO Promocional (Promo Code)</label>
                        <input 
                          type="text" 
                          value={config.bookingDirectPromoCode || ''} 
                          onChange={e => setConfig({...config, bookingDirectPromoCode: e.target.value.toUpperCase().replace(/\s+/g, '')})} 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none font-mono font-bold" 
                          placeholder="Ej: PAREJAS20"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">ID de Propiedad para Reservas</label>
                        <input 
                          type="text" 
                          value={config.bookingPropertyId || ''} 
                          onChange={e => setConfig({...config, bookingPropertyId: e.target.value})} 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-xs" 
                          placeholder="Ej: 11111111-1111..."
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'quiz' && (
              <div className="space-y-6 animate-fade-in text-xs font-semibold">
                <h2 className="text-lg font-black text-slate-800 mb-6 border-b border-slate-100 pb-4">Configuración del Quiz Integrado</h2>
                
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-indigo-900">1. Pantalla de Bienvenida del Quiz</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Título de Bienvenida</label>
                      <input 
                        type="text" 
                        value={funnelConfig.welcomeHeading || ''} 
                        onChange={e => setFunnelConfig(prev => ({ ...prev, welcomeHeading: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Descripción de Bienvenida</label>
                      <input 
                        type="text" 
                        value={funnelConfig.welcomeDescription || ''} 
                        onChange={e => setFunnelConfig(prev => ({ ...prev, welcomeDescription: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none" 
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-slate-200">
                  <h3 className="text-sm font-black text-indigo-900">2. Pregunta de Filtro/Preferencia</h3>
                  <p className="text-xs text-slate-400 font-medium">Es la primera pregunta del Quiz (ej: "¿Con quién viajas?" o "¿Qué buscas en tu viaje?").</p>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">La Pregunta</label>
                    <input 
                      type="text" 
                      value={funnelConfig.steps?.[0]?.question || ''} 
                      onChange={e => {
                        const steps = [...(funnelConfig.steps || [])];
                        if (steps[0]) {
                          steps[0] = { ...steps[0], question: e.target.value };
                        }
                        setFunnelConfig(prev => ({ ...prev, steps }));
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none" 
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-500">Opciones de Respuesta (Configurá hasta 3)</label>
                    {(funnelConfig.steps?.[0]?.options || [
                      { label: "Pareja o Aniversario 💑", value: "parejas", description: "" },
                      { label: "Familia o Vacaciones 👨‍👩‍👧‍👦", value: "familia", description: "" },
                      { label: "Amigos o Aventura 🏔️", value: "amigos", description: "" }
                    ]).map((opt, idx) => (
                      <div key={idx} className="flex gap-2 items-center bg-slate-50 p-3 rounded-xl border border-slate-105">
                        <span className="text-xs font-bold text-slate-400 w-6">#{idx + 1}</span>
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-slate-450 block mb-0.5">Etiqueta visible</label>
                            <input 
                              type="text" 
                              placeholder="Ej: Pareja 💑" 
                              value={opt.label || ''} 
                              onChange={e => {
                                const steps = [...(funnelConfig.steps || defaultFunnelConfig.steps)];
                                if (!steps[0].options) steps[0].options = [];
                                if (!steps[0].options[idx]) steps[0].options[idx] = { label: '', value: '' };
                                steps[0].options[idx] = { ...steps[0].options[idx], label: e.target.value };
                                setFunnelConfig(prev => ({ ...prev, steps }));
                              }}
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-450 block mb-0.5">Valor (slug)</label>
                            <input 
                              type="text" 
                              placeholder="Ej: parejas" 
                              value={opt.value || ''} 
                              onChange={e => {
                                const steps = [...(funnelConfig.steps || defaultFunnelConfig.steps)];
                                if (!steps[0].options) steps[0].options = [];
                                if (!steps[0].options[idx]) steps[0].options[idx] = { label: '', value: '' };
                                steps[0].options[idx] = { ...steps[0].options[idx], value: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') };
                                setFunnelConfig(prev => ({ ...prev, steps }));
                              }}
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-slate-200">
                  <h3 className="text-sm font-black text-indigo-900">3. Regalo / Incentivo (PDF o Guía)</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Nombre del Regalo (ej: Guía de Lugares Secretos 🍷)</label>
                      <input 
                        type="text" 
                        value={funnelConfig.hooks?.[0]?.title || ''} 
                        onChange={e => {
                          const hooks = [...(funnelConfig.hooks || defaultFunnelConfig.hooks || [])];
                          if (!hooks[0]) hooks[0] = { id: 'incentivo', type: 'doc', title: '', description: '', url: '', icon: '🎁' };
                          hooks[0] = { ...hooks[0], title: e.target.value };
                          setFunnelConfig(prev => ({ ...prev, hooks }));
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Enlace / URL de Descarga</label>
                      <input 
                        type="text" 
                        value={funnelConfig.hooks?.[0]?.url || ''} 
                        onChange={e => {
                          const hooks = [...(funnelConfig.hooks || defaultFunnelConfig.hooks || [])];
                          if (!hooks[0]) hooks[0] = { id: 'incentivo', type: 'doc', title: '', description: '', url: '', icon: '🎁' };
                          hooks[0] = { ...hooks[0], url: e.target.value };
                          setFunnelConfig(prev => ({ ...prev, hooks }));
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none" 
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-slate-200">
                  <h3 className="text-sm font-black text-indigo-900">4. Pantalla Final (Éxito)</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Título de Éxito</label>
                      <input 
                        type="text" 
                        value={funnelConfig.reflectionHeading || ''} 
                        onChange={e => setFunnelConfig(prev => ({ ...prev, reflectionHeading: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Texto Descriptivo Final</label>
                      <input 
                        type="text" 
                        value={funnelConfig.reflectionText || ''} 
                        onChange={e => setFunnelConfig(prev => ({ ...prev, reflectionText: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Aclaración del Beneficio (ej: Código de descuento aplicado)</label>
                    <input 
                      type="text" 
                      value={funnelConfig.reflectionBenefit || ''} 
                      onChange={e => setFunnelConfig(prev => ({ ...prev, reflectionBenefit: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none" 
                    />
                  </div>
                </div>
              </div>
            )}
            
          </div>
        </main>
      </div>
    </div>
  );
}
