'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight, ChevronRight, CheckCircle2, CalendarDays, ExternalLink } from 'lucide-react';
import { usePMS } from '../../../context/PMSContext';
import { defaultFunnelConfig, FunnelConfig, FunnelStep } from '../../../lib/funnelConfig';
import { themePresets } from '../../../lib/themeConfig';
import { useParams } from 'next/navigation';

export default function DynamicFunnel() {
  const params = useParams();
  const slug = (params?.slug as string) || 'parejas';
  const { addQuote, properties, funnels } = usePMS();
  const property = properties?.[0] || { theme_preset: 'cozy' };
  const preset = themePresets[property.theme_preset || 'cozy'] || themePresets.cozy;
  
  const [config, setConfig] = useState<FunnelConfig>(defaultFunnelConfig);
  const [currentStepIndex, setCurrentStepIndex] = useState(0); 
  // 0 = Welcome
  // 1 to config.steps.length = Dynamic steps
  // config.steps.length + 1 = Reflection
  
  const [answers, setAnswers] = useState<Record<string, any>>({});

  useEffect(() => {
    if (funnels && funnels[slug]) {
      const loadedConfig = funnels[slug];
      if (!loadedConfig.steps) loadedConfig.steps = defaultFunnelConfig.steps;
      setConfig(loadedConfig);
    }
  }, [slug, funnels]);

  const goToNext = () => setCurrentStepIndex(prev => prev + 1);
  const goBack = () => setCurrentStepIndex(prev => Math.max(0, prev - 1));

  const handleMultipleChoice = (step: FunnelStep, value: string) => {
    const maxSelect = step.maxSelect || 1;
    if (maxSelect === 1) {
      setAnswers(prev => ({ ...prev, [step.id]: value }));
      goToNext();
    } else {
      setAnswers(prev => {
        const current = prev[step.id] || [];
        if (current.includes(value)) {
          return { ...prev, [step.id]: current.filter((v: string) => v !== value) };
        }
        if (current.length < maxSelect) {
          return { ...prev, [step.id]: [...current, value] };
        }
        return prev;
      });
    }
  };

  const handleFinish = async () => {
    let vipTag = 'general';
    if (slug === 'parejas' || answers['Preferencia'] === 'parejas') vipTag = 'parejas';
    else if (slug === 'familia' || answers['Preferencia'] === 'familia') vipTag = 'familia';
    else if (slug === 'amigos' || answers['Preferencia'] === 'amigos') vipTag = 'amigos';

    let notes = `[LEAD DE FUNNEL]\nVIP_TAG: ${vipTag}\n`;
    config.steps.forEach(step => {
      const ans = answers[step.id];
      let val = '';
      if (Array.isArray(ans)) val = ans.join(', ');
      else if (typeof ans === 'object' && ans !== null) {
        if (ans.arrival && ans.departure) val = `Del ${ans.arrival} al ${ans.departure}`;
        else if (ans.name) val = `${ans.name} (${ans.channel}: ${ans.value})`;
        else if (ans.adults !== undefined || ans.children !== undefined || ans.babies !== undefined) {
           val = `${ans.adults || 0} Adultos, ${ans.children || 0} Niños, ${ans.babies || 0} Bebés en cuna`;
        }
      } else {
        val = ans?.toString() || 'No respondido';
      }
      notes += `${step.id}: ${val}\n`;
    });

    const contactAns = answers['Contacto'] || {};
    const datesAns = answers['Fechas'] || {};
    
    // Buscar paso de pax si existe
    const paxStep = config.steps.find(s => s.type === 'pax_selector');
    const paxAns = paxStep ? answers[paxStep.id] : {};
    const paxAdults = paxAns?.adults || 2;
    const paxChildren = paxAns?.children || 0;

    const propertyId = properties?.[0]?.id || '11111111-1111-1111-1111-111111111111';

    const newQuote = {
      id: crypto.randomUUID(),
      property_id: propertyId,
      first_name: contactAns.name?.split(' ')[0] || 'Visitante',
      last_name: contactAns.name?.split(' ').slice(1).join(' ') || '',
      phone: contactAns.channel === 'WhatsApp' ? contactAns.value : '',
      email: contactAns.channel === 'Email' ? contactAns.value : '',
      check_in: datesAns.arrival || '2024-12-01',
      check_out: datesAns.departure || '2024-12-07',
      pax: paxAdults + paxChildren,
      extra_beds: 0, // Babies typically don't count for extra beds if in crib, or we can handle it differently.
      status: 'draft' as const,
      total_amount: 0,
      source: `Quiz Funnel: ${slug}`,
      notes: notes,
      internal_notes: notes,
      options: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      await addQuote(newQuote);
      goToNext(); // Go to reflection
    } catch (error) {
      alert("Hubo un error al guardar los datos.");
    }
  };

  // --- RENDERERS ---
  const renderWelcome = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-xl mx-auto w-full relative z-10 text-center animate-fade-in">
      <div className="text-white text-sm font-black px-4 py-1.5 rounded-full mb-8 shadow-sm border" style={{ backgroundColor: `${preset.secondaryColor}20`, borderColor: `${preset.secondaryColor}40` }}>
        {config.subtitle}
      </div>
      
      <h1 className="text-4xl sm:text-6xl font-black text-white mb-6 leading-[1.1] tracking-tight">
        {config.welcomeHeading}
      </h1>
      
      <p className="text-lg text-zinc-300 mb-12 font-medium leading-relaxed max-w-md">
        {config.welcomeDescription}
      </p>

      <button
        onClick={goToNext}
        className="group text-white font-black py-5 px-10 rounded-2xl flex items-center gap-3 transition-all transform hover:scale-105 w-full sm:w-auto justify-center"
        style={{ backgroundColor: preset.secondaryColor, color: '#fff', boxShadow: `0 10px 30px ${preset.secondaryColor}40` }}
      >
        <span>Comenzar</span>
        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );

  const renderReflection = () => {
    // Generate Booking Engine URL with params
    const propertyId = properties?.[0]?.id || '11111111-1111-1111-1111-111111111111';
    
    const datesAns = answers['Fechas'] || {};
    const paxStep = config.steps.find(s => s.type === 'pax_selector');
    const paxAns = paxStep ? answers[paxStep.id] : {};
    const paxAdults = paxAns?.adults || 2;
    const paxChildren = paxAns?.children || 0;
    const paxBabies = paxAns?.babies || 0;
    
    const urlParams = new URLSearchParams();
    if (datesAns.arrival) urlParams.append('checkIn', datesAns.arrival);
    if (datesAns.departure) urlParams.append('checkOut', datesAns.departure);
    if (paxAdults > 0) urlParams.append('adults', paxAdults.toString());
    if (paxChildren > 0) urlParams.append('children', paxChildren.toString());
    if (paxBabies > 0) urlParams.append('babies', paxBabies.toString());
    
    // Auto-integrate promotions
    if (slug === 'parejas') {
      urlParams.append('promoCode', 'PAREJAS20');
    } else {
      urlParams.append('promoCode', 'LASTMINUTE');
    }
    
    const bookingEngineUrl = `/book/${propertyId}?${urlParams.toString()}`;

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-2xl mx-auto w-full relative z-10 text-center animate-fade-in">
        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 border border-emerald-500/30">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </div>

        <h2 className="text-4xl font-black text-white mb-4 tracking-tight">
          {config.reflectionHeading}
        </h2>

        <p className="text-lg text-zinc-300 font-medium leading-relaxed mb-8 max-w-lg mx-auto">
          {config.reflectionText}
        </p>

        {/* Hooks / Regalos */}
        {config.hooks && config.hooks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mb-10">
            {config.hooks.map(hook => (
              <a 
                key={hook.id}
                href={hook.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 hover:border-amber-500/50 hover:bg-zinc-800/80 rounded-2xl p-5 flex items-start gap-4 text-left transition-all group shadow-xl"
              >
                <div className="bg-amber-500/20 p-3 rounded-xl shrink-0 group-hover:scale-110 transition-transform flex items-center justify-center w-12 h-12">
                  <span className="text-2xl">{hook.icon}</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-amber-400 mb-1 flex items-center justify-between">
                    {hook.title}
                    <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                  </h4>
                  <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
                    {hook.description}
                  </p>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 rounded-2xl p-6 mb-10 w-full shadow-2xl max-w-xl mx-auto">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-4 text-left">
              <div className="bg-amber-500/20 p-2 rounded-lg shrink-0">
                <span className="text-xl">🎁</span>
              </div>
              <div>
                <h4 className="font-bold text-amber-400 mb-1">Beneficio Incluido</h4>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {config.reflectionBenefit}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* CTA Motor de Reservas */}
        <a 
          href={bookingEngineUrl}
          className="group relative text-zinc-950 font-black py-5 px-10 rounded-2xl flex items-center justify-center gap-3 transition-all transform hover:scale-105 w-full sm:w-auto overflow-hidden"
          style={{ backgroundColor: preset.secondaryColor, color: '#fff', boxShadow: `0 10px 40px ${preset.secondaryColor}50` }}
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
          <CalendarDays className="w-6 h-6 relative z-10" />
          <span className="relative z-10 text-lg">Ver Habitaciones Disponibles</span>
          <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
        </a>
        <p className="text-xs text-zinc-500 mt-4 font-medium uppercase tracking-wider">Tus fechas y preferencias ya están aplicadas</p>
      </div>
    );
  };

  const renderDynamicStep = (step: FunnelStep) => {
    const ans = answers[step.id];

    return (
      <div className="flex-1 flex flex-col justify-center p-6 sm:p-12 w-full max-w-3xl mx-auto relative z-10 animate-fade-in-up">
        {currentStepIndex > 0 && (
          <button onClick={goBack} className="text-zinc-400 hover:text-white font-medium text-sm flex items-center gap-1 mb-8 self-start bg-black/20 px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/5 transition-all">
            <ChevronRight className="w-4 h-4 rotate-180" />
            Atrás
          </button>
        )}

        <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/50 rounded-3xl p-6 sm:p-10 shadow-2xl">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-3 tracking-tight">{step.question}</h2>
          {step.subtitle && <p className="text-zinc-400 font-medium mb-8 text-lg">{step.subtitle}</p>}
          
          {step.type === 'multiple_choice' && (
            <div className="space-y-4">
              {step.options?.map((opt, i) => {
                const isSelected = step.maxSelect === 1 
                  ? ans === opt.value 
                  : (ans || []).includes(opt.value);
                
                return (
                   <button
                    key={i}
                    onClick={() => handleMultipleChoice(step, opt.value)}
                    className="w-full p-5 rounded-2xl border text-left transition-all bg-zinc-800/50 hover:bg-zinc-700/50"
                    style={isSelected ? { borderColor: preset.secondaryColor, backgroundColor: `${preset.secondaryColor}15`, boxShadow: `0 0 15px ${preset.secondaryColor}20` } : { borderColor: 'rgba(63, 63, 70, 0.5)' }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-lg mb-1" style={isSelected ? { color: preset.secondaryColor } : { color: '#fff' }}>
                          {opt.label}
                        </div>
                        {opt.description && (
                          <div className={`text-sm ${isSelected ? 'text-zinc-300' : 'text-zinc-500'}`}>
                            {opt.description}
                          </div>
                        )}
                      </div>
                      {isSelected && <CheckCircle2 className="w-6 h-6 shrink-0" style={{ color: preset.secondaryColor }} />}
                    </div>
                  </button>
                );
              })}

              {step.maxSelect && step.maxSelect > 1 && (
                <button
                  disabled={!(ans && ans.length > 0)}
                  onClick={goToNext}
                  className="w-full mt-6 text-white font-black py-4 px-8 rounded-xl flex items-center justify-center gap-2 transition-all disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed"
                  style={!(ans && ans.length > 0) ? {} : { backgroundColor: preset.secondaryColor, color: '#fff' }}
                >
                  Continuar <ArrowRight className="w-5 h-5" />
                </button>
              )}
            </div>
          )}

          {step.type === 'date_picker' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-zinc-400 font-bold text-sm ml-1">Llegada</label>
                  <input 
                    type="date" 
                    className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-amber-500 transition-colors font-medium"
                    value={ans?.arrival || ''}
                    onChange={e => setAnswers(prev => ({ ...prev, [step.id]: { ...prev[step.id], arrival: e.target.value } }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-zinc-400 font-bold text-sm ml-1">Salida</label>
                  <input 
                    type="date" 
                    className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-amber-500 transition-colors font-medium"
                    value={ans?.departure || ''}
                    onChange={e => setAnswers(prev => ({ ...prev, [step.id]: { ...prev[step.id], departure: e.target.value } }))}
                  />
                </div>
              </div>
              <button
                disabled={!(ans?.arrival && ans?.departure)}
                onClick={goToNext}
                className="w-full text-white font-black py-4 px-8 rounded-xl flex items-center justify-center gap-2 transition-all disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed"
                style={(ans?.arrival && ans?.departure) ? { backgroundColor: preset.secondaryColor, color: '#fff' } : undefined}
              >
                Continuar <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
 
          {step.type === 'pax_selector' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-zinc-800/80 border-2 border-zinc-700/50 rounded-2xl px-6 py-5 flex items-center justify-between">
                  <div>
                    <div className="text-white font-bold text-xl mb-1">Adultos</div>
                  </div>
                  <div className="flex items-center gap-5">
                    <button onClick={() => setAnswers(prev => ({ ...prev, [step.id]: { ...prev[step.id], adults: Math.max(1, (ans?.adults || 1) - 1) } }))} className="w-12 h-12 rounded-full bg-zinc-700/50 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-600 transition-colors font-bold text-2xl">-</button>
                    <span className="text-2xl font-black text-white w-6 text-center">{ans?.adults || 1}</span>
                    <button onClick={() => setAnswers(prev => ({ ...prev, [step.id]: { ...prev[step.id], adults: (ans?.adults || 1) + 1 } }))} className="w-12 h-12 rounded-full bg-zinc-700/50 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-600 transition-colors font-bold text-2xl">+</button>
                  </div>
                </div>
 
                <div className="bg-zinc-800/80 border-2 border-zinc-700/50 rounded-2xl px-6 py-5 flex items-center justify-between">
                  <div>
                    <div className="text-white font-bold text-xl mb-1">Niños</div>
                    <div className="text-zinc-400 text-sm font-medium">Hasta 12 años</div>
                  </div>
                  <div className="flex items-center gap-5">
                    <button onClick={() => setAnswers(prev => ({ ...prev, [step.id]: { ...prev[step.id], children: Math.max(0, (ans?.children || 0) - 1) } }))} className="w-12 h-12 rounded-full bg-zinc-700/50 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-600 transition-colors font-bold text-2xl">-</button>
                    <span className="text-2xl font-black text-white w-6 text-center">{ans?.children || 0}</span>
                    <button onClick={() => setAnswers(prev => ({ ...prev, [step.id]: { ...prev[step.id], children: (ans?.children || 0) + 1 } }))} className="w-12 h-12 rounded-full bg-zinc-700/50 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-600 transition-colors font-bold text-2xl">+</button>
                  </div>
                </div>
 
                <div className="bg-zinc-800/80 border-2 border-zinc-700/50 rounded-2xl px-6 py-5 flex items-center justify-between">
                  <div>
                    <div className="text-white font-bold text-xl mb-1">Bebés en cuna</div>
                    <div className="text-zinc-400 text-sm font-medium">De 0 a 2 años</div>
                  </div>
                  <div className="flex items-center gap-5">
                    <button onClick={() => setAnswers(prev => ({ ...prev, [step.id]: { ...prev[step.id], babies: Math.max(0, (ans?.babies || 0) - 1) } }))} className="w-12 h-12 rounded-full bg-zinc-700/50 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-600 transition-colors font-bold text-2xl">-</button>
                    <span className="text-2xl font-black text-white w-6 text-center">{ans?.babies || 0}</span>
                    <button onClick={() => setAnswers(prev => ({ ...prev, [step.id]: { ...prev[step.id], babies: (ans?.babies || 0) + 1 } }))} className="w-12 h-12 rounded-full bg-zinc-700/50 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-600 transition-colors font-bold text-2xl">+</button>
                  </div>
                </div>
              </div>
              <button
                onClick={goToNext}
                className="w-full text-white font-black py-4 px-8 rounded-xl flex items-center justify-center gap-2 transition-all"
                style={{ backgroundColor: preset.secondaryColor, color: '#fff' }}
              >
                Continuar <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {step.type === 'contact_form' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Tu nombre completo"
                  className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-4 text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 focus:bg-zinc-800 transition-all font-medium"
                  value={ans?.name || ''}
                  onChange={e => setAnswers(prev => ({ ...prev, [step.id]: { ...prev[step.id], name: e.target.value } }))}
                />
                <div className="flex gap-2">
                  <select 
                    className="bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-amber-500 transition-all font-medium outline-none"
                    value={ans?.channel || 'WhatsApp'}
                    onChange={e => setAnswers(prev => ({ ...prev, [step.id]: { ...prev[step.id], channel: e.target.value || 'WhatsApp' } }))}
                  >
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Email">Email</option>
                  </select>
                  <input
                    type={ans?.channel === 'Email' ? 'email' : 'tel'}
                    placeholder={ans?.channel === 'Email' ? "tu@email.com" : "+54 9 11 1234 5678"}
                    className="flex-1 bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-4 text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 focus:bg-zinc-800 transition-all font-medium"
                    value={ans?.value || ''}
                    onChange={e => setAnswers(prev => ({ ...prev, [step.id]: { ...prev[step.id], channel: prev[step.id]?.channel || 'WhatsApp', value: e.target.value } }))}
                  />
                </div>
              </div>
              <button
                disabled={!(ans?.name && ans?.value)}
                onClick={handleFinish}
                className="w-full text-zinc-950 font-black py-4 px-8 rounded-xl flex items-center justify-center gap-2 transition-all disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed"
                style={!(ans?.name && ans?.value) ? {} : { backgroundColor: preset.secondaryColor, color: '#fff', boxShadow: `0 10px 30px ${preset.secondaryColor}40` }}
              >
                Generar Propuesta Personalizada ✨
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // --- BACKGROUND & LAYOUT ---
  let bgKey: keyof FunnelConfig['images'] = 'default';
  if (currentStepIndex === 0) bgKey = 'default';
  else if (currentStepIndex === config.steps.length + 1) bgKey = 'reflection';
  else {
    const currentStep = config.steps[currentStepIndex - 1];
    if (currentStep?.bgImageKey) bgKey = currentStep.bgImageKey;
  }
  const bgImage = config.images[bgKey] || config.images.default;

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col font-sans selection:bg-amber-500/30">
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900/80 to-zinc-950 z-10" />
        <img 
          src={bgImage} 
          alt="Background" 
          className="w-full h-full object-cover opacity-20 scale-105 transform origin-center animate-subtle-zoom"
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent z-20" />
      </div>

      <header className="relative z-10 p-6 sm:p-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="text-xl font-black text-white tracking-tighter flex items-center gap-2">
            <span className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-zinc-950">H</span>
            {config.title}
          </div>
          {currentStepIndex > 0 && currentStepIndex <= config.steps.length && (
            <div className="text-sm font-bold text-zinc-500 tracking-widest bg-zinc-900/50 px-4 py-2 rounded-full border border-zinc-800/50 backdrop-blur-md">
              PASO {currentStepIndex} DE {config.steps.length}
            </div>
          )}
        </div>
      </header>

      {currentStepIndex === 0 && renderWelcome()}
      {currentStepIndex > 0 && currentStepIndex <= config.steps.length && renderDynamicStep(config.steps[currentStepIndex - 1])}
      {currentStepIndex === config.steps.length + 1 && renderReflection()}
    </div>
  );
}
