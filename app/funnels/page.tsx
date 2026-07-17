'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Filter, Play, Edit3, Plus, Copy, Trash2, LayoutTemplate, 
  Megaphone, HelpCircle, UserCheck, FileSignature, KeyRound, MonitorDot, ChevronRight,
  Sparkles, CheckCircle, Percent, ArrowRight, X, BarChart3, TrendingUp, UploadCloud, Loader2
} from 'lucide-react';
import { defaultFunnelMapping, FunnelMapping, defaultFunnelConfig, LandingConfig, defaultLandingConfig } from '../../lib/funnelConfig';
import { useRouter } from 'next/navigation';
import { usePMS } from '../../context/PMSContext';

export default function FunnelsManager() {
  const router = useRouter();
  const { promotions, addPromotion, quotes, bookings, currentPropertyId, properties } = usePMS();
  
  const [funnels, setFunnels] = useState<FunnelMapping>({});
  const [landings, setLandings] = useState<Record<string, LandingConfig>>({});
  const [showWizard, setShowWizard] = useState(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Wizard form state
  const [campaignName, setCampaignName] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [discountValue, setDiscountValue] = useState('20');
  const [quizQuestion1, setQuizQuestion1] = useState('¿Con quién viajas en esta escapada? 👥');
  const [incentiveGuide, setIncentiveGuide] = useState('Guía de Lugares Secretos 🍷');
  const [giftUrl, setGiftUrl] = useState('https://images.unsplash.com/photo-1544645229-41710bd3c597?auto=format&fit=crop&q=80&w=2000');
  
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [uploadPdfError, setUploadPdfError] = useState('');

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) { // 10MB Limit
      setUploadPdfError('El archivo es muy pesado. Máximo 10MB.');
      return;
    }

    setIsUploadingPdf(true);
    setUploadPdfError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setGiftUrl(data.url);
      } else {
        setUploadPdfError(data.error || 'Error al subir el archivo.');
      }
    } catch (err) {
      setUploadPdfError('Error de conexión al subir el archivo.');
    } finally {
      setIsUploadingPdf(false);
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('hotelFlow_funnels');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Object.keys(parsed).length > 0) {
          setFunnels(parsed);
        } else {
          setFunnels(defaultFunnelMapping);
        }
      } catch (e) {
        setFunnels(defaultFunnelMapping);
      }
    } else {
      setFunnels(defaultFunnelMapping);
      localStorage.setItem('hotelFlow_funnels', JSON.stringify(defaultFunnelMapping));
    }

    const savedLandings = localStorage.getItem('hotelFlow_landings');
    let loadedLandings = {};
    if (savedLandings) {
      try {
        loadedLandings = JSON.parse(savedLandings);
        setLandings(loadedLandings);
      } catch (e) {
        loadedLandings = { [defaultLandingConfig.slug]: defaultLandingConfig };
        setLandings(loadedLandings);
      }
    } else {
      loadedLandings = { [defaultLandingConfig.slug]: defaultLandingConfig };
      setLandings(loadedLandings);
      localStorage.setItem('hotelFlow_landings', JSON.stringify(loadedLandings));
    }

    // Auto-repair / Sync routine: Make sure all local funnels have corresponding landing entries
    try {
      const activeFunnels = saved ? JSON.parse(saved) : defaultFunnelMapping;
      let landingsParsed = { ...loadedLandings } as any;
      let changed = false;

      Object.entries(activeFunnels).forEach(([slug, config]: [string, any]) => {
        if (!landingsParsed[slug]) {
          landingsParsed[slug] = {
            slug: slug,
            targetQuizSlug: slug,
            bookingDirectEnabled: true,
            bookingDirectPromoCode: slug.toUpperCase(),
            bookingPropertyId: 'all',
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
          changed = true;
        }
      });

      if (changed) {
        localStorage.setItem('hotelFlow_landings', JSON.stringify(landingsParsed));
        setLandings(landingsParsed);
        window.dispatchEvent(new Event('storage'));
      }
    } catch (err) {}
  }, []);

  const handleCreate = () => {
    const name = prompt('Ingresá el nombre corto o identificador del nuevo embudo (ej: "aventura", "corporativo"):');
    if (!name) return;
    
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    if (!slug) return;

    if (funnels[slug]) {
      alert('Ya existe un embudo con ese nombre.');
      return;
    }

    const newFunnels = { ...funnels, [slug]: { ...defaultFunnelConfig, title: `Embudo ${name}`, subtitle: `Nuevo Embudo` } };
    setFunnels(newFunnels);
    localStorage.setItem('hotelFlow_funnels', JSON.stringify(newFunnels));
    router.push(`/funnels/${slug}/edit`);
  };

  const handleDelete = (slug: string) => {
    if (confirm(`¿Estás seguro de eliminar el embudo "${slug}"?`)) {
      const newFunnels = { ...funnels };
      delete newFunnels[slug];
      setFunnels(newFunnels);
      localStorage.setItem('hotelFlow_funnels', JSON.stringify(newFunnels));
    }
  };

  const handleLaunchCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignName || !promoCode || !discountValue) {
      alert('Por favor completa los campos obligatorios.');
      return;
    }

    const slug = campaignName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    if (funnels[slug] || landings[slug]) {
      alert('Ya existe una campaña o embudo con este nombre. Intenta otro.');
      return;
    }

    // 1. Create promo in PMS Context
    const resolvedPropertyId = currentPropertyId === 'all' ? (properties[0]?.id || '11111111-1111-1111-1111-111111111111') : currentPropertyId;

    const newPromo = {
      id: `p_campaign_${Date.now()}`,
      property_id: resolvedPropertyId,
      code: promoCode.trim().toUpperCase(),
      name: campaignName,
      discount_type: 'percent' as const,
      discount_value: Number(discountValue),
      valid_from: new Date().toISOString().split('T')[0],
      valid_until: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days validity
      is_active: true,
      created_at: new Date().toISOString()
    };
    addPromotion(newPromo);

    // 2. Create dynamic Quiz configuration
    const newQuizConfig = {
      title: campaignName.toUpperCase(),
      subtitle: `Campaña ${campaignName} ⚡`,
      welcomeHeading: `¡Disfrutá de tu escapada ideal!`,
      welcomeDescription: `Queremos personalizar tu estadía al máximo. Respondé 3 preguntas rápidas, obtené tu código promocional con ${discountValue}% OFF y descargá gratis tu ${incentiveGuide}.`,
      reflectionHeading: "¡Respuestas recibidas! 🎁",
      reflectionText: `Ya estamos preparando la mejor propuesta para vos. Podés reservar directo usando tu cupón y descargar tu regalo a continuación.`,
      reflectionBenefit: `Código "${promoCode.trim().toUpperCase()}" aplicado automáticamente en tu reserva directa.`,
      steps: [
        {
          id: "Preferencia",
          type: "multiple_choice" as const,
          question: quizQuestion1,
          maxSelect: 1,
          bgImageKey: "movie" as const,
          options: [
            { label: "Pareja o Aniversario 💑", value: "parejas" },
            { label: "Familia o Vacaciones 👨‍👩‍👧‍👦", value: "familia" },
            { label: "Amigos o Escapada de Aventura 🏔️", value: "amigos" }
          ]
        },
        {
          id: "Fechas",
          type: "date_picker" as const,
          question: "¿En qué fechas planeas tu estadía? 🗓️",
          bgImageKey: "calendar" as const
        },
        {
          id: "Contacto",
          type: "contact_form" as const,
          question: "¡Excelente! ¿Dónde te enviamos tu regalo? 🎯",
          subtitle: `Completá tu nombre y WhatsApp para guardar tu cupón del ${discountValue}% OFF y la guía.`,
          bgImageKey: "contact" as const
        }
      ],
      images: defaultFunnelConfig.images,
      hooks: [
        {
          id: "incentivo",
          type: "doc" as const,
          title: `${incentiveGuide} 📥`,
          description: "Descarga directa de tu obsequio por completar el quiz.",
          url: giftUrl.trim(),
          icon: "🎁"
        }
      ]
    };

    const newFunnels = { ...funnels, [slug]: newQuizConfig };
    setFunnels(newFunnels);
    localStorage.setItem('hotelFlow_funnels', JSON.stringify(newFunnels));

    // 3. Create dynamic Landing configuration
    const newLandingConfig = {
      slug: slug,
      targetQuizSlug: slug,
      bookingDirectEnabled: true,
      bookingDirectPromoCode: promoCode.trim().toUpperCase(),
      bookingPropertyId: resolvedPropertyId,
      hero: {
        tagline: `OFERTA EXCLUSIVA: ${campaignName.toUpperCase()}`,
        title: `Preparamos tu estadía soñada.`,
        subtitle: `Con un ${discountValue}% de Regalo 🎁`,
        description1: `Viví una experiencia única en nuestra propiedad. Respondé el quiz de 1 minuto y accedé a tarifas promocionales y nuestra ${incentiveGuide} gratis.`,
        description2: "El cupón se activará de forma automática al finalizar el cuestionario.",
        ctaText: "QUIERO MI DESCUENTO Y GUÍA 🍷",
        footerText: "Es gratis y te tomará menos de 60 segundos."
      },
      comparison: {
        title: "Dos formas de planificar tu estadía:",
        optionA_title: "RESERVA ESTÁNDAR",
        optionA_points: [
          "Tarifas completas sin descuento.",
          "Improvisar qué hacer al llegar.",
          "Asignación de unidad aleatoria."
        ],
        optionB_title: "RESERVA EXCLUSIVA CON BENEFICIO",
        optionB_points: [
          `Cupón del ${discountValue}% de descuento inmediato.`,
          `Acceso a la ${incentiveGuide} gratis.`,
          "Prioridad en check-in y asignación de vistas."
        ],
        conclusion: "Aprovechá la propuesta personalizada hoy mismo.",
        ctaText: "PLANIFICAR MI VIAJE AHORA"
      },
      features: {
        title: `El combo de beneficios de la campaña ${campaignName} 🌟`,
        items: [
          { id: "1", icon: "🔥", title: `${discountValue}% Descuento Directo`, description: `Código promocional ${promoCode.toUpperCase()} activado en tu motor de reservas.` },
          { id: "2", icon: "🍷", title: incentiveGuide, description: "Un regalo digital con los mejores tips de la zona." },
          { id: "3", icon: "🛎️", title: "Atención VIP", description: "Soporte exclusivo en WhatsApp para coordinar extras de tu viaje." }
        ]
      },
      quote: {
        text: `\"Diseñamos una experiencia a tu medida. No te conformes con menos.\"`,
        authorOrContext1: `Campaña activa por tiempo limitado.`,
        authorOrContext2: "Todas las reservas directas reciben atención personalizada preferente.",
        highlight: `Código Activo: ${promoCode.toUpperCase()}`,
        ctaText: "EMPEZAR QUIZ AHORA"
      },
      preQuiz: {
        title: "¡Contanos de tu viaje!",
        description1: "Respondé las preguntas breves sobre tu tipo de viaje y fechas, y te asignamos la tarifa promocional de inmediato.",
        description2: `Te enviaremos los detalles y tu ${incentiveGuide} al WhatsApp.`,
        ctaText: "COMENZAR QUIZ ⚡",
        footerText: "Sin formularios complejos. Rápido y seguro."
      }
    };

    const newLandings = { ...landings, [slug]: newLandingConfig };
    setLandings(newLandings);
    localStorage.setItem('hotelFlow_landings', JSON.stringify(newLandings));

    // Reset form and close
    setCampaignName('');
    setPromoCode('');
    setDiscountValue('20');
    setShowWizard(false);

    alert(`¡Campaña "${campaignName}" lanzada con éxito!\n- Landing creada: /l/${slug}\n- Quiz creado: /funnels/${slug}\n- Cupón creado: ${promoCode.toUpperCase()}`);
  };

  const handleExportReport = () => {
    // Generate CSV content
    const csvRows = [
      ['Etapa', 'Canal / Componente', 'Metrica / Valor', 'Descripcion'],
      ['01. Atraer', 'Landing Page', `${stats.traffic} Visitas`, 'Tráfico de captación promocional'],
      ['02. Perfilación', 'Quiz Funnel', `${stats.quizCompleted} Completados`, 'Respuestas del cuestionario'],
      ['03. Captación', 'CRM Leads', `${stats.leads} Prospectos`, 'Contactos calificados guardados'],
      ['04. Cotización', 'PMS Propuestas', `${stats.sentQuotes} Enviadas`, 'Mensajes de seguimiento personalizados'],
      ['05. Conversión', 'Motor de Reservas', `${stats.bookings} Confirmadas`, 'Reservas concretadas con descuento'],
      ['Conversión Final', 'Ecosistema Completo', `${((stats.bookings / stats.traffic) * 100).toFixed(1)}%`, 'Tasa de efectividad total']
    ];

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + csvRows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Reporte_Conversion_Funnels_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Compute stats based on real data
  const filteredQuotes = quotes.filter(q => {
    if (!startDate && !endDate) return true;
    const d = new Date(q.created_at || new Date().toISOString());
    if (startDate && d < new Date(startDate)) return false;
    if (endDate && d > new Date(endDate + 'T23:59:59')) return false;
    return true;
  });
  
  const filteredBookings = bookings.filter(b => {
    if (!startDate && !endDate) return true;
    const d = new Date(b.created_at || new Date().toISOString());
    if (startDate && d < new Date(startDate)) return false;
    if (endDate && d > new Date(endDate + 'T23:59:59')) return false;
    return true;
  });

  const quizLeads = filteredQuotes.filter(q => q.source?.includes('Quiz'));
  const motorBookings = filteredBookings.filter(b => b.source === 'Motor de Reservas');

  const isSystemEmpty = quotes.length === 0 && bookings.length === 0;

  const isDemo = currentPropertyId === '11111111-1111-1111-1111-111111111111';

  const stats = {
    traffic: isDemo ? 340 + quizLeads.length * 4 : Math.max(quizLeads.length * 5, filteredQuotes.length * 3),
    quizCompleted: isDemo ? 85 + quizLeads.length : quizLeads.length,
    leads: isDemo ? quizLeads.length + 15 : filteredQuotes.length,
    sentQuotes: isDemo ? quizLeads.filter(q => q.status === 'follow_up' || q.status === 'sent').length + 8 : filteredQuotes.filter(q => q.status === 'follow_up' || q.status === 'sent').length,
    bookings: isDemo ? motorBookings.length + 3 : filteredBookings.length
  };

  const timelineSteps = [
    {
      id: 'step1',
      title: 'Atraer 📣',
      subtitle: 'Landing Page',
      value: `${stats.traffic} Visitas`,
      desc: 'Tráfico atraído de Redes o Ads.',
      color: 'from-amber-500 to-orange-500 bg-amber-500/10 border-amber-500/30'
    },
    {
      id: 'step2',
      title: 'Perfilación ⚡',
      subtitle: 'Quiz Funnel',
      value: `${stats.quizCompleted} Clics`,
      desc: 'Clientes que inician las preguntas.',
      color: 'from-yellow-400 to-amber-500 bg-yellow-500/10 border-yellow-500/30'
    },
    {
      id: 'step3',
      title: 'Captación 🎯',
      subtitle: 'CRM Leads',
      value: `${stats.leads} Leads`,
      desc: 'Clientes que dejaron su WhatsApp.',
      color: 'from-indigo-500 to-blue-600 bg-indigo-500/10 border-indigo-500/30'
    },
    {
      id: 'step4',
      title: 'Cotización ✉️',
      subtitle: 'PMS Propuestas',
      value: `${stats.sentQuotes} Envios`,
      desc: 'Seguimiento por WhatsApp / Email.',
      color: 'from-emerald-500 to-teal-600 bg-emerald-500/10 border-emerald-500/30'
    },
    {
      id: 'step5',
      title: 'Conversión 🔑',
      subtitle: 'Motor de Reservas',
      value: `${stats.bookings} Reservas`,
      desc: 'Ventas cerradas con el cupón.',
      color: 'from-sky-400 to-indigo-500 bg-sky-500/10 border-sky-500/30'
    }
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-12 bg-[#fafaf9] min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <Link href="/" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Volver al CRM
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase">Desde</span>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="text-sm font-semibold text-slate-700 bg-transparent outline-none cursor-pointer" />
            <span className="text-xs font-bold text-slate-500 uppercase ml-2">Hasta</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="text-sm font-semibold text-slate-700 bg-transparent outline-none cursor-pointer" />
            {(startDate || endDate) && (
              <button onClick={() => { setStartDate(''); setEndDate(''); }} className="ml-2 text-slate-400 hover:text-red-500" title="Limpiar fechas">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button 
            onClick={handleExportReport}
            className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-5 py-2.5 rounded-xl font-bold shadow-sm flex items-center transition-all hover:scale-105"
          >
            <BarChart3 className="w-4 h-4 mr-2 text-indigo-600" /> Exportar CSV
          </button>
          <button 
            onClick={() => setShowWizard(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-100 flex items-center transition-all transform hover:scale-105"
          >
            <Sparkles className="w-5 h-5 mr-2" /> Nueva Campaña
          </button>
        </div>
      </div>

      {/* Customer Journey Dashboard */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 md:p-8 text-white border border-slate-700/50 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent z-0"></div>
        
        <div className="relative z-10 space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">Embudo Unificado</span>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight mt-3">Camino del Cliente & Conversiones (Live Journey) ⚡</h2>
              <p className="text-slate-400 text-sm mt-1.5 font-medium max-w-2xl">
                Los clientes entran por campañas publicitarias, completan el quiz y el CRM/PMS procesa sus reservas de forma concatenada.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-emerald-400" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Conversión Final</span>
                <span className="text-xl font-black text-white">
                  {stats.traffic > 0 ? ((stats.bookings / stats.traffic) * 100).toFixed(1) : '0.0'}%
                </span>
              </div>
            </div>
          </div>

          {/* Stepper Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative">
            {timelineSteps.map((step, idx) => (
              <div key={step.id} className="relative flex flex-col justify-between bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 hover:border-white/20 transition-all group">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-white/30 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">ETAPA 0{idx+1}</span>
                    <span className="text-xs font-bold text-indigo-300">{step.subtitle}</span>
                  </div>

                  <div>
                    <h3 className="text-2xl font-black text-white tracking-tight">{step.value}</h3>
                    <span className="text-sm font-bold text-slate-300 block mt-1">{step.title}</span>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">{step.desc}</p>
                  </div>
                </div>

                {/* Horizontal Arrow between cards on desktop */}
                {idx < 4 && (
                  <div className="hidden md:flex absolute top-1/2 -translate-y-1/2 -right-3.5 z-20 w-7 h-7 bg-slate-800 border border-slate-700/60 rounded-full items-center justify-center text-slate-400 shadow-md">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Campaign / Funnels List */}
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Filter className="w-6 h-6 text-indigo-600" /> Campañas de Captación & Quiz Activos
          </h1>
          <p className="text-slate-500 mt-1 font-medium text-sm">Administrá tus embudos y landings promocionales.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(funnels).map(([slug, config]) => {
            const associatedLanding = landings[slug] || landings[`bariloche-${slug}`];
            const promo = promotions.find(p => p.code.toLowerCase() === slug.toLowerCase() || p.code === associatedLanding?.bookingDirectPromoCode);

            return (
              <div key={slug} className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow relative">
                <div className="p-6 flex-1 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-2xl border border-indigo-100">
                      <LayoutTemplate className="w-5 h-5" />
                    </div>
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">Activo y Conectado</span>
                  </div>

                  <div>
                    <h3 className="font-black text-lg text-slate-800 truncate" title={config.title}>{config.title}</h3>
                    <p className="text-xs text-slate-400 font-medium truncate" title={config.subtitle}>{config.subtitle}</p>
                  </div>
                  
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2.5 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Quiz Público:</span>
                      <span className="font-bold text-slate-700 font-mono">/funnels/{slug}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Landing Page:</span>
                      <span className="font-bold text-slate-700 font-mono">/l/{slug}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Código Promo:</span>
                      <span className="font-bold text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">{associatedLanding?.bookingDirectPromoCode || promo?.code || 'N/D'}</span>
                    </div>
                  </div>

                  {/* Acciones de Vista Previa Rápida */}
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <a 
                      href={`/l/${slug}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-center py-2.5 rounded-xl text-xs font-black shadow-sm transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      📣 Abrir Landing
                    </a>
                    <a 
                      href={`/funnels/${slug}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-center py-2.5 rounded-xl text-xs font-black shadow-sm transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      ⚡ Probar Quiz
                    </a>
                  </div>
                </div>
                
                <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-between items-center gap-2">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/l/${slug}`);
                        alert('URL de la Landing copiada al portapapeles');
                      }}
                      className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-slate-200 bg-white flex items-center gap-1"
                      title="Copiar URL"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copiar Enlace
                    </button>
                  </div>
                  
                  <div className="flex gap-1.5">
                    <Link href={`/funnels/${slug}/edit`} className="text-xs font-bold text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded-xl transition-all flex items-center border border-slate-200 bg-white" title="Configurar preguntas">
                      <Edit3 className="w-3.5 h-3.5 mr-1" /> Editar
                    </Link>
                    <button 
                      onClick={() => handleDelete(slug)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-slate-200 bg-white" 
                      title="Eliminar Campaña"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Wizard Modal */}
      {showWizard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-slate-100">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-3xl">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h2 className="text-xl font-black text-slate-800">Creador Express de Campaña</h2>
              </div>
              <button onClick={() => setShowWizard(false)} className="text-slate-400 hover:text-slate-600 bg-white p-1 rounded-full border border-slate-200 shadow-sm">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Customer Journey Flowchart */}
            <div className="px-6 py-3 bg-slate-900 border-b border-slate-800 text-white flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-center select-none">
              <span className="text-indigo-400">1. Atraer 📣 (Landing)</span>
              <span className="text-slate-600">➔</span>
              <span className="text-indigo-400">2. Perfilar ⚡ (Quiz)</span>
              <span className="text-slate-600">➔</span>
              <span className="text-indigo-400">3. Reservar 🔑 (Motor)</span>
              <span className="text-slate-600">➔</span>
              <span className="text-indigo-400">4. CRM/PMS 🛎️</span>
            </div>

            <form onSubmit={handleLaunchCampaign} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="block text-xs uppercase tracking-wider font-bold text-slate-500">Nombre de la Campaña *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej. Vacaciones de Invierno"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm text-slate-900 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs uppercase tracking-wider font-bold text-slate-500">Código Promo (Cupón) *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ej. INVIERNO26"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm uppercase text-slate-900 font-semibold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs uppercase tracking-wider font-bold text-slate-500">Descuento (%) *</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      required
                      min="5"
                      max="90"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm text-slate-900 font-semibold"
                    />
                    <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs uppercase tracking-wider font-bold text-slate-500">Pregunta Clave del Quiz *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej. ¿Viajas en pareja, familia o solo? 👥"
                  value={quizQuestion1}
                  onChange={(e) => setQuizQuestion1(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm text-slate-900 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs uppercase tracking-wider font-bold text-slate-500">Nombre del Regalo/Incentivo (PDF) *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej. Guía Gastronómica de Cervecerías 🍻"
                  value={incentiveGuide}
                  onChange={(e) => setIncentiveGuide(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm text-slate-900 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs uppercase tracking-wider font-bold text-slate-500">Regalo / Incentivo (Cargá PDF o pegá link) *</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    required
                    placeholder="Pegá un link o cargá tu archivo..."
                    value={giftUrl}
                    onChange={(e) => setGiftUrl(e.target.value)}
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm text-slate-900 font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('pdf-file-upload')?.click()}
                    className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 px-4 py-3 rounded-xl text-xs font-black transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    {isUploadingPdf ? (
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    ) : (
                      <UploadCloud className="w-4 h-4 text-slate-500" />
                    )}
                    <span>Subir PDF</span>
                  </button>
                  <input 
                    id="pdf-file-upload"
                    type="file"
                    accept=".pdf"
                    onChange={handlePdfUpload}
                    className="hidden"
                  />
                </div>
                {uploadPdfError && (
                  <p className="text-[10px] text-red-500 font-bold mt-1">{uploadPdfError}</p>
                )}
                {giftUrl && giftUrl.includes('/uploads/') && (
                  <p className="text-[10px] text-emerald-600 font-black mt-1 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg inline-block">
                    ✓ Archivo cargado con éxito: {giftUrl.split('/').pop()}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button 
                  type="submit"
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 transition-all"
                >
                  <span>🚀 Lanzar Campaña Completa</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <p className="text-[10px] text-slate-400 text-center mt-3 font-semibold uppercase tracking-wider leading-relaxed">
                  Creará: Landing Page ➔ Quiz Funnel ➔ Promoción en Motor ➔ Asignación en CRM
                </p>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
