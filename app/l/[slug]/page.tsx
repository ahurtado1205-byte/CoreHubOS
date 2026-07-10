'use client';

import React, { useEffect, useState } from 'react';
import { Gift, Map, Home, Check } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { defaultLandingConfig, LandingConfig } from '../../../lib/funnelConfig';
import { usePMS } from '../../../context/PMSContext';
import { themePresets } from '../../../lib/themeConfig';

export default function DynamicLandingPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;
  const { properties } = usePMS();
  const [config, setConfig] = useState<LandingConfig | null>(null);

  const property = properties?.[0] || { theme_preset: 'cozy' };
  const preset = themePresets[property.theme_preset || 'cozy'] || themePresets.cozy;

  useEffect(() => {
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
    
    // Fallback to default if it matches
    if (slug === defaultLandingConfig.slug || slug === 'parejas') {
      setConfig(defaultLandingConfig);
    } else {
      // Create a dynamic default for new ones
      setConfig({
        ...defaultLandingConfig,
        slug: slug,
        targetQuizSlug: slug
      });
    }
  }, [slug]);

  if (!config) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  const handleStartQuiz = () => {
    router.push(`/funnels/${config.targetQuizSlug}`);
  };

  const handleGoToBooking = () => {
    const propId = config.bookingPropertyId || '11111111-1111-1111-1111-111111111111';
    const promo = config.bookingDirectPromoCode || '';
    router.push(`/book/${propId}?promoCode=${promo}`);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-amber-500/30">
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
            className="text-zinc-950 font-bold text-xl px-12 py-5 rounded-full transition-all transform hover:scale-105 flex items-center gap-3"
            style={{ backgroundColor: preset.secondaryColor, color: '#111827', boxShadow: `0 10px 40px ${preset.secondaryColor}40` }}
          >
            {config.hero.ctaText}
          </button>
          
          {config.bookingDirectEnabled && (
            <button 
              onClick={handleGoToBooking}
              className="bg-zinc-900 border border-zinc-800 text-white font-bold text-xl px-12 py-5 rounded-full transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
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
        <p className="text-zinc-600 text-sm mb-24 animate-fade-in" style={{ animationDelay: '600ms' }}>{config.hero.footerText}</p>

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
            <h3 className="text-zinc-500 text-xl font-bold tracking-widest mb-8">{config.comparison.optionA_title}</h3>
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
            className="text-zinc-950 font-bold text-lg px-10 py-4 rounded-full transition-all hover:scale-105"
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
          className="text-zinc-950 font-bold text-xl px-12 py-5 rounded-full transition-all hover:scale-105"
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
            className="text-white font-bold text-2xl px-16 py-6 rounded-full transition-all transform hover:scale-105"
            style={{ backgroundColor: preset.secondaryColor, color: '#fff', boxShadow: `0 10px 40px ${preset.secondaryColor}40` }}
          >
            {config.preQuiz.ctaText}
          </button>
          
          {config.bookingDirectEnabled && (
            <button 
              onClick={handleGoToBooking}
              className="bg-zinc-900 border border-zinc-800 text-white font-bold text-2xl px-16 py-6 rounded-full transition-all transform hover:scale-105 shadow-lg flex items-center gap-3"
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
        <p className="text-zinc-600">{config.preQuiz.footerText}</p>
      </section>
    </div>
  );
}
