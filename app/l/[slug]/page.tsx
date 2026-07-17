'use client';

import React, { useEffect, useState } from 'react';
import { Gift, Map, Home, Check, X, ArrowRight, ChevronRight, CheckCircle2, CalendarDays, ExternalLink } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { defaultLandingConfig, LandingConfig, FunnelConfig, FunnelStep, defaultFunnelConfig } from '../../../lib/funnelConfig';
import { usePMS } from '../../../context/PMSContext';
import { themePresets } from '../../../lib/themeConfig';

export default function DynamicLandingPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;
  const { properties, landings, funnels, addQuote, isInitialized } = usePMS();
  const [config, setConfig] = useState<LandingConfig | null>(null);

  // Quiz/Funnel States
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [funnelConfig, setFunnelConfig] = useState<FunnelConfig | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0); 
  const [answers, setAnswers] = useState<Record<string, any>>({});

  const property = properties?.[0] || { theme_preset: 'cozy' };
  const preset = themePresets[property.theme_preset || 'cozy'] || themePresets.cozy;

  useEffect(() => {
    // 1. If database is loaded, use database values as primary source of truth
    if (isInitialized && landings && landings[slug]) {
      setConfig(landings[slug]);
      return;
    }

    // 2. Try localStorage first as an instantaneous loading state while db initializes
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hotelFlow_landings');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed[slug]) {
            setConfig(parsed[slug]);
            return;
          }
        } catch (e) {}
      }
    }
    
    // 3. Fallback to default if database is initialized but slug is not found
    if (isInitialized) {
      if (slug === defaultLandingConfig.slug || slug === 'parejas') {
        setConfig(defaultLandingConfig);
      } else if (slug) {
        // Create a dynamic default for new ones
        setConfig({
          ...defaultLandingConfig,
          slug: slug,
          targetQuizSlug: slug
        });
      }
    }
  }, [slug, landings, isInitialized]);

  useEffect(() => {
    if (config) {
      const targetSlug = config.targetQuizSlug || slug || 'parejas';
      
      // 1. If database is loaded, use database funnels as primary source of truth
      if (isInitialized && funnels && funnels[targetSlug]) {
        setFunnelConfig(funnels[targetSlug]);
        return;
      }

      // 2. Try localStorage fallback while loading
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('hotelFlow_funnels');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed[targetSlug]) {
              setFunnelConfig(parsed[targetSlug]);
              return;
            }
          } catch (e) {}
        }
      }

      // 3. Absolute fallback
      if (funnels && funnels[targetSlug]) {
        setFunnelConfig(funnels[targetSlug]);
      } else {
        setFunnelConfig(defaultFunnelConfig);
      }
    }
  }, [config, funnels, slug, isInitialized]);

  if (!config) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  const handleStartQuiz = () => {
    setCurrentStepIndex(0);
    setAnswers({});
    setIsQuizOpen(true);
  };

  const handleGoToBooking = () => {
    const propId = config.bookingPropertyId || '11111111-1111-1111-1111-111111111111';
    const promo = config.bookingDirectPromoCode || '';
    router.push(`/book/${propId}?promoCode=${promo}`);
  };

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
    if (!funnelConfig) return;
    let vipTag = 'general';
    const targetSlug = config?.targetQuizSlug || slug || 'parejas';
    if (targetSlug === 'parejas' || answers['Preferencia'] === 'parejas') vipTag = 'parejas';
    else if (targetSlug === 'familia' || answers['Preferencia'] === 'familia') vipTag = 'familia';
    else if (targetSlug === 'amigos' || answers['Preferencia'] === 'amigos') vipTag = 'amigos';

    let notes = `[LEAD DE FUNNEL EN LA LANDING]\nVIP_TAG: ${vipTag}\n`;
    funnelConfig.steps.forEach(step => {
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
    
    const paxStep = funnelConfig.steps.find(s => s.type === 'pax_selector');
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
      extra_beds: 0,
      status: 'draft' as const,
      total_amount: 0,
      source: `Quiz Inline Landing: ${slug}`,
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

  const renderQuizModal = () => {
    if (!isQuizOpen || !funnelConfig) return null;

    const currentStep = currentStepIndex > 0 && currentStepIndex <= funnelConfig.steps.length 
      ? funnelConfig.steps[currentStepIndex - 1] 
      : null;

    const isReflection = currentStepIndex === funnelConfig.steps.length + 1;
    const isWelcome = currentStepIndex === 0;

    const handleClose = () => {
      setIsQuizOpen(false);
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/95 backdrop-blur-md transition-all overflow-y-auto">
        <div className="absolute top-6 right-6 z-55">
          <button 
            onClick={handleClose}
            className="p-3 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-full transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="w-full max-w-2xl bg-zinc-900/95 border border-zinc-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative my-8">
          {/* Progress bar */}
          {!isWelcome && !isReflection && (
            <div className="w-full bg-zinc-800 h-1.5 rounded-full mb-8 overflow-hidden">
              <div 
                className="h-full transition-all duration-300"
                style={{ 
                  width: `${(currentStepIndex / funnelConfig.steps.length) * 100}%`,
                  backgroundColor: preset.secondaryColor 
                }}
              />
            </div>
          )}

          {isWelcome && (
            <div className="text-center py-6 animate-fade-in">
              <div className="inline-block text-sm font-black px-4 py-1.5 rounded-full mb-6 border" style={{ backgroundColor: `${preset.secondaryColor}20`, borderColor: `${preset.secondaryColor}40`, color: preset.secondaryColor }}>
                {funnelConfig.subtitle}
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-white mb-6 leading-tight">
                {funnelConfig.welcomeHeading}
              </h2>
              <p className="text-base sm:text-lg text-zinc-300 mb-10 leading-relaxed max-w-md mx-auto">
                {funnelConfig.welcomeDescription}
              </p>
              <button
                onClick={goToNext}
                className="group font-black py-4 px-10 rounded-2xl flex items-center gap-3 transition-all transform hover:scale-105 mx-auto text-zinc-950 font-bold cursor-pointer"
                style={{ backgroundColor: preset.secondaryColor, color: '#111827', boxShadow: `0 10px 30px ${preset.secondaryColor}40` }}
              >
                <span>Comenzar</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}

          {currentStep && (
            <div className="animate-fade-in">
              {currentStepIndex > 1 && (
                <button 
                  onClick={goBack} 
                  className="text-zinc-400 hover:text-white font-medium text-xs flex items-center gap-1 mb-6 bg-zinc-800 px-3 py-1.5 rounded-full border border-zinc-700/50 transition-all cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                  Atrás
                </button>
              )}

              <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight">
                {currentStep.question}
              </h2>
              {currentStep.subtitle && (
                <p className="text-zinc-400 text-sm font-medium mb-6">
                  {currentStep.subtitle}
                </p>
              )}

              {/* Multiple Choice step */}
              {currentStep.type === 'multiple_choice' && (
                <div className="space-y-3">
                  {currentStep.options?.map((opt, i) => {
                    const ans = answers[currentStep.id];
                    const isSelected = currentStep.maxSelect === 1 
                      ? ans === opt.value 
                      : (ans || []).includes(opt.value);

                    return (
                      <button
                        key={i}
                        onClick={() => handleMultipleChoice(currentStep, opt.value)}
                        className="w-full p-4 rounded-xl border text-left transition-all bg-zinc-800/40 hover:bg-zinc-850 cursor-pointer"
                        style={isSelected ? { borderColor: preset.secondaryColor, backgroundColor: `${preset.secondaryColor}10` } : { borderColor: 'rgba(63, 63, 70, 0.4)' }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-bold text-base" style={isSelected ? { color: preset.secondaryColor } : { color: '#fff' }}>
                              {opt.label}
                            </div>
                            {opt.description && (
                              <div className="text-xs text-zinc-500 mt-0.5">
                                {opt.description}
                              </div>
                            )}
                          </div>
                          {isSelected && <Check className="w-5 h-5 shrink-0" style={{ color: preset.secondaryColor }} />}
                        </div>
                      </button>
                    );
                  })}

                  {currentStep.maxSelect && currentStep.maxSelect > 1 && (
                    <button
                      disabled={!(answers[currentStep.id] && answers[currentStep.id].length > 0)}
                      onClick={goToNext}
                      className="w-full mt-4 font-black py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all disabled:bg-zinc-800 disabled:text-zinc-650 disabled:cursor-not-allowed font-bold cursor-pointer"
                      style={!(answers[currentStep.id] && answers[currentStep.id].length > 0) ? {} : { backgroundColor: preset.secondaryColor, color: '#111827' }}
                    >
                      Continuar <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}

              {/* Date picker step */}
              {currentStep.type === 'date_picker' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-zinc-400 font-bold text-xs ml-1">Llegada</label>
                      <input 
                        type="date" 
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors font-medium text-sm"
                        value={answers[currentStep.id]?.arrival || ''}
                        onChange={e => setAnswers(prev => ({ ...prev, [currentStep.id]: { ...prev[currentStep.id], arrival: e.target.value } }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-zinc-400 font-bold text-xs ml-1">Salida</label>
                      <input 
                        type="date" 
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors font-medium text-sm"
                        value={answers[currentStep.id]?.departure || ''}
                        onChange={e => setAnswers(prev => ({ ...prev, [currentStep.id]: { ...prev[currentStep.id], departure: e.target.value } }))}
                      />
                    </div>
                  </div>
                  <button
                    disabled={!(answers[currentStep.id]?.arrival && answers[currentStep.id]?.departure)}
                    onClick={goToNext}
                    className="w-full text-zinc-950 font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all disabled:bg-zinc-800 disabled:text-zinc-650 disabled:cursor-not-allowed cursor-pointer"
                    style={(answers[currentStep.id]?.arrival && answers[currentStep.id]?.departure) ? { backgroundColor: preset.secondaryColor, color: '#111827' } : undefined}
                  >
                    Continuar <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Pax selector step */}
              {currentStep.type === 'pax_selector' && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="bg-zinc-850 border border-zinc-800 rounded-xl px-5 py-4 flex items-center justify-between">
                      <div className="text-white font-bold text-base">Adultos</div>
                      <div className="flex items-center gap-4">
                        <button onClick={() => setAnswers(prev => ({ ...prev, [currentStep.id]: { ...prev[currentStep.id], adults: Math.max(1, (prev[currentStep.id]?.adults || 1) - 1) } }))} className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-white font-bold text-xl hover:bg-zinc-600 cursor-pointer">-</button>
                        <span className="text-lg font-black text-white w-4 text-center">{answers[currentStep.id]?.adults || 1}</span>
                        <button onClick={() => setAnswers(prev => ({ ...prev, [currentStep.id]: { ...prev[currentStep.id], adults: (prev[currentStep.id]?.adults || 1) + 1 } }))} className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-white font-bold text-xl hover:bg-zinc-600 cursor-pointer">+</button>
                      </div>
                    </div>
                    <div className="bg-zinc-850 border border-zinc-800 rounded-xl px-5 py-4 flex items-center justify-between">
                      <div>
                        <div className="text-white font-bold text-base">Niños</div>
                        <div className="text-zinc-500 text-xs font-medium">Hasta 12 años</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <button onClick={() => setAnswers(prev => ({ ...prev, [currentStep.id]: { ...prev[currentStep.id], children: Math.max(0, (prev[currentStep.id]?.children || 0) - 1) } }))} className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-white font-bold text-xl hover:bg-zinc-600 cursor-pointer">-</button>
                        <span className="text-lg font-black text-white w-4 text-center">{answers[currentStep.id]?.children || 0}</span>
                        <button onClick={() => setAnswers(prev => ({ ...prev, [currentStep.id]: { ...prev[currentStep.id], children: (prev[currentStep.id]?.children || 0) + 1 } }))} className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-white font-bold text-xl hover:bg-zinc-600 cursor-pointer">+</button>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={goToNext}
                    className="w-full text-zinc-950 font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                    style={{ backgroundColor: preset.secondaryColor, color: '#111827' }}
                  >
                    Continuar <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Contact form step */}
              {currentStep.type === 'contact_form' && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Tu nombre completo"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3.5 text-white placeholder:text-zinc-500 text-sm font-medium focus:outline-none focus:border-amber-500"
                      value={answers[currentStep.id]?.name || ''}
                      onChange={e => setAnswers(prev => ({ ...prev, [currentStep.id]: { ...prev[currentStep.id], name: e.target.value } }))}
                    />
                    <div className="flex gap-2">
                      <select 
                        className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-3.5 text-white font-medium outline-none text-sm"
                        value={answers[currentStep.id]?.channel || 'WhatsApp'}
                        onChange={e => setAnswers(prev => ({ ...prev, [currentStep.id]: { ...prev[currentStep.id], channel: e.target.value } }))}
                      >
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="Email">Email</option>
                      </select>
                      <input
                        type={answers[currentStep.id]?.channel === 'Email' ? 'email' : 'tel'}
                        placeholder={answers[currentStep.id]?.channel === 'Email' ? "tu@email.com" : "+54 9 11 1234 5678"}
                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3.5 text-white placeholder:text-zinc-500 text-sm font-medium focus:outline-none focus:border-amber-500"
                        value={answers[currentStep.id]?.value || ''}
                        onChange={e => setAnswers(prev => ({ ...prev, [currentStep.id]: { ...prev[currentStep.id], channel: prev[currentStep.id]?.channel || 'WhatsApp', value: e.target.value } }))}
                      />
                    </div>
                  </div>
                  <button
                    disabled={!(answers[currentStep.id]?.name && answers[currentStep.id]?.value)}
                    onClick={handleFinish}
                    className="w-full text-zinc-950 font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all disabled:bg-zinc-800 disabled:text-zinc-655 disabled:cursor-not-allowed cursor-pointer"
                    style={!(answers[currentStep.id]?.name && answers[currentStep.id]?.value) ? {} : { backgroundColor: preset.secondaryColor, color: '#111827', boxShadow: `0 10px 30px ${preset.secondaryColor}40` }}
                  >
                    Generar Propuesta Personalizada ✨
                  </button>
                </div>
              )}
            </div>
          )}

          {isReflection && (
            <div className="text-center py-6 animate-fade-in">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 border border-emerald-500/20 mx-auto">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>

              <h2 className="text-2xl sm:text-4xl font-black text-white mb-4 tracking-tight">
                {funnelConfig.reflectionHeading}
              </h2>

              <p className="text-sm sm:text-base text-zinc-300 font-medium leading-relaxed mb-6 max-w-md mx-auto">
                {funnelConfig.reflectionText}
              </p>

              {/* Benefit Box */}
              <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-5 mb-8 w-full max-w-md mx-auto">
                <div className="flex items-start gap-3.5 text-left">
                  <span className="text-2xl">🎁</span>
                  <div>
                    <h4 className="font-bold text-amber-400 text-sm mb-0.5">Beneficio Especial</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {funnelConfig.reflectionBenefit}
                    </p>
                  </div>
                </div>
              </div>

              {/* Direct Booking Link */}
              {(() => {
                const propertyId = properties?.[0]?.id || '11111111-1111-1111-1111-111111111111';
                const datesAns = answers['Fechas'] || {};
                const paxStep = funnelConfig.steps.find(s => s.type === 'pax_selector');
                const paxAns = paxStep ? answers[paxStep.id] : {};
                const paxAdults = paxAns?.adults || 2;
                const paxChildren = paxAns?.children || 0;
                
                const urlParams = new URLSearchParams();
                if (datesAns.arrival) urlParams.append('checkIn', datesAns.arrival);
                if (datesAns.departure) urlParams.append('checkOut', datesAns.departure);
                if (paxAdults > 0) urlParams.append('adults', paxAdults.toString());
                if (paxChildren > 0) urlParams.append('children', paxChildren.toString());
                
                const promo = config?.bookingDirectPromoCode || '';
                if (promo) urlParams.append('promoCode', promo);

                const bookingEngineUrl = `/book/${propertyId}?${urlParams.toString()}`;

                return (
                  <a 
                    href={bookingEngineUrl}
                    className="inline-flex items-center justify-center gap-2 font-black py-4 px-8 rounded-2xl transition-all transform hover:scale-105 text-zinc-950 font-bold cursor-pointer"
                    style={{ backgroundColor: preset.secondaryColor, color: '#111827', boxShadow: `0 10px 30px ${preset.secondaryColor}40` }}
                  >
                    <CalendarDays className="w-5 h-5" />
                    <span>Ver Habitaciones Disponibles</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                );
              })()}
              <p className="text-[10px] text-zinc-500 mt-3 font-medium uppercase tracking-wider">Fechas y preferencias aplicadas automáticamente</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-amber-500/30 font-bold">
      {/* Hero Section */}
      <section className="min-h-screen flex flex-col justify-center items-center text-center p-6 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-zinc-950 -z-10" />
        
        {config.hero.tagline && (
          <div className="inline-block px-4 py-2 rounded-full border text-xs font-bold tracking-widest mb-12 animate-fade-in" style={{ color: preset.secondaryColor, borderColor: `${preset.secondaryColor}40` }}>
            {config.hero.tagline}
          </div>
        )}
        
        <h1 className="text-5xl md:text-7xl font-bold mb-4 tracking-tight animate-fade-in" style={{ animationDelay: '100ms' }}>
          {config.hero.title}
        </h1>
        <h2 className="text-5xl md:text-7xl font-bold mb-12 flex items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: '200ms', color: preset.secondaryColor }}>
          {config.hero.subtitle} <span className="animate-pulse">❤️</span>
        </h2>
        
        <p className="text-xl md:text-2xl text-zinc-300 max-w-3xl mb-4 leading-relaxed font-medium animate-fade-in" style={{ animationDelay: '300ms' }}>
          {config.hero.description1}
        </p>
        <p className="text-lg text-zinc-500 max-w-2xl mb-12 animate-fade-in" style={{ animationDelay: '400ms' }}>
          {config.hero.description2}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-6 items-center animate-fade-in" style={{ animationDelay: '500ms' }}>
          <button 
            onClick={handleStartQuiz}
            className="text-zinc-950 font-bold text-xl px-12 py-5 rounded-full transition-all transform hover:scale-105 flex items-center gap-3 cursor-pointer"
            style={{ backgroundColor: preset.secondaryColor, color: '#111827', boxShadow: `0 10px 40px ${preset.secondaryColor}40` }}
          >
            {config.hero.ctaText}
          </button>
          
          {config.bookingDirectEnabled && (
            <button 
              onClick={handleGoToBooking}
              className="bg-zinc-900 border border-zinc-800 text-white font-bold text-xl px-12 py-5 rounded-full transition-all transform hover:scale-105 shadow-lg flex items-center gap-2 cursor-pointer"
              style={{ borderColor: `${preset.secondaryColor}40` }}
            >
              <span>🔑 Reservar Directo</span>
              {config.bookingDirectPromoCode && (
                <span className="text-xs px-2.5 py-1 rounded-md border" style={{ backgroundColor: `${preset.secondaryColor}20`, borderColor: `${preset.secondaryColor}40`, color: preset.secondaryColor }}>
                  {config.bookingDirectPromoCode}
                </span>
              )}
            </button>
          )}
        </div>
        <p className="text-zinc-650 text-sm mb-24 animate-fade-in" style={{ animationDelay: '600ms' }}>{config.hero.footerText}</p>
 
        <div className="flex flex-wrap justify-center gap-8 md:gap-16 text-zinc-400 text-sm font-medium animate-fade-in" style={{ animationDelay: '700ms' }}>
          <div className="flex items-center gap-2"><Gift className="w-5 h-5" style={{ color: preset.secondaryColor }} /> Guía gratuita</div>
          <div className="flex items-center gap-2"><Map className="w-5 h-5" style={{ color: preset.secondaryColor }} /> Recomendaciones personalizadas</div>
          <div className="flex items-center gap-2"><Home className="w-5 h-5" style={{ color: preset.secondaryColor }} /> Alojamientos según fechas</div>
        </div>
      </section>
 
      {/* Opción A vs B */}
      <section className="py-32 px-6 max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-20">{config.comparison.title}</h2>
        
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-zinc-900/50 border border-zinc-800 p-12 rounded-3xl hover:border-zinc-700 transition-colors">
            <h3 className="text-zinc-550 text-xl font-bold tracking-widest mb-8">{config.comparison.optionA_title}</h3>
            <ul className="space-y-6 text-zinc-400 text-lg">
              {config.comparison.optionA_points.map((point, i) => (
                <li key={i}>• {point}</li>
              ))}
            </ul>
          </div>
          
          <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 p-12 rounded-3xl relative overflow-hidden transition-colors border" style={{ borderColor: `${preset.secondaryColor}50`, boxShadow: `0 0 50px -15px ${preset.secondaryColor}30` }}>
            <h3 className="text-xl font-bold tracking-widest mb-8" style={{ color: preset.secondaryColor }}>{config.comparison.optionB_title}</h3>
            <ul className="space-y-6 text-white text-lg">
              {config.comparison.optionB_points.map((point, i) => (
                <li key={i} className="flex gap-3">
                  <Check className="w-6 h-6 shrink-0" style={{ color: preset.secondaryColor }} /> {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
 
        <div className="text-center">
          <p className="text-2xl text-zinc-300 mb-8">{config.comparison.conclusion}</p>
          <button 
            onClick={handleStartQuiz}
            className="text-zinc-950 font-bold text-lg px-10 py-4 rounded-full transition-all hover:scale-105 cursor-pointer"
            style={{ backgroundColor: preset.secondaryColor, color: '#111827' }}
          >
            {config.comparison.ctaText}
          </button>
        </div>
      </section>
 
      {/* Mapa del tesoro */}
      <section className="py-32 px-6 max-w-6xl mx-auto bg-zinc-950">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-20 max-w-3xl mx-auto leading-tight">
          {config.features.title}
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {config.features.items.map(item => (
            <div key={item.id} className="bg-zinc-900 p-8 rounded-3xl hover:bg-zinc-800/80 transition-colors">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <span style={{ color: preset.secondaryColor }}>{item.icon}</span> {item.title}
              </h3>
              <p className="text-zinc-400 text-lg leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </section>
 
      {/* Quote */}
      <section className="py-40 px-6 max-w-4xl mx-auto text-center">
        <h2 
          className="text-4xl md:text-5xl font-serif font-italic text-amber-100 mb-12 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: config.quote.text }}
        />
        <div className="text-xl text-zinc-400 space-y-4 mb-16 font-medium max-w-2xl mx-auto">
          <p>{config.quote.authorOrContext1}</p>
          <p>{config.quote.authorOrContext2}</p>
          <p className="font-bold text-2xl pt-4" style={{ color: preset.secondaryColor }}>{config.quote.highlight}</p>
        </div>
        <button 
          onClick={handleStartQuiz}
          className="text-zinc-950 font-bold text-xl px-12 py-5 rounded-full transition-all hover:scale-105 cursor-pointer"
          style={{ backgroundColor: preset.secondaryColor, color: '#111827', boxShadow: `0 10px 30px ${preset.secondaryColor}30` }}
        >
          {config.quote.ctaText}
        </button>
      </section>
 
      {/* Start Quiz */}
      <section className="min-h-[80vh] flex flex-col justify-center items-center text-center px-6">
        <h2 className="text-5xl font-bold mb-8">{config.preQuiz.title}</h2>
        <div className="text-xl text-zinc-400 max-w-3xl space-y-4 mb-16 leading-relaxed">
          <p>{config.preQuiz.description1}</p>
          <p className="text-white">{config.preQuiz.description2}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-6 items-center">
          <button 
            onClick={handleStartQuiz}
            className="text-white font-bold text-2xl px-16 py-6 rounded-full transition-all transform hover:scale-105 cursor-pointer"
            style={{ backgroundColor: preset.secondaryColor, color: '#fff', boxShadow: `0 10px 40px ${preset.secondaryColor}40` }}
          >
            {config.preQuiz.ctaText}
          </button>
          
          {config.bookingDirectEnabled && (
            <button 
              onClick={handleGoToBooking}
              className="bg-zinc-900 border border-zinc-800 text-white font-bold text-2xl px-16 py-6 rounded-full transition-all transform hover:scale-105 shadow-lg flex items-center gap-3 cursor-pointer"
            >
              <span>🔑 Reservar Directo</span>
              {config.bookingDirectPromoCode && (
                <span className="text-xs px-2.5 py-1 rounded-md border" style={{ backgroundColor: `${preset.secondaryColor}20`, borderColor: `${preset.secondaryColor}40`, color: preset.secondaryColor }}>
                  {config.bookingDirectPromoCode}
                </span>
              )}
            </button>
          )}
        </div>
        <p className="text-zinc-650">{config.preQuiz.footerText}</p>
      </section>

      {renderQuizModal()}
    </div>
  );
}
