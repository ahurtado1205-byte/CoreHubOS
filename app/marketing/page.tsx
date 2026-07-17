'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePMS } from '../../context/PMSContext';
import { TopBar } from '../../components/layout/TopBar';
import { ImageUpload } from '../../components/ui/ImageUpload';
import { themePresets } from '../../lib/themeConfig';
import { 
  Filter, Play, Edit3, Plus, Copy, Trash2, LayoutTemplate, 
  Megaphone, HelpCircle, UserCheck, FileSignature, KeyRound, MonitorDot, ChevronRight,
  Sparkles, CheckCircle, Percent, ArrowRight, X, BarChart3, TrendingUp, UploadCloud, Loader2,
  Globe, Palette, FileText, Share2, Clock, MapPin, Image as ImageIcon, Check, Save, Smartphone, Laptop
} from 'lucide-react';
import { defaultFunnelMapping, FunnelMapping, defaultFunnelConfig, LandingConfig, defaultLandingConfig } from '../../lib/funnelConfig';

export default function MarketingControlCenter() {
  const router = useRouter();
  const { 
    promotions, addPromotion, quotes, bookings, currentPropertyId, properties, updateProperty, ratePlans, bookingSources, templates, addActivity,
    funnels, landings, updateFunnels, updateLandings
  } = usePMS();

  const currentProperty = properties.find(p => p.id === currentPropertyId) || properties[0];

  // Tab State
  const [activeTab, setActiveTab] = useState<'landings' | 'website' | 'booking-engine'>('landings');

  // Stats filter dates
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // Wizard state
  const [showWizard, setShowWizard] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [discountValue, setDiscountValue] = useState('20');
  const [quizQuestion1, setQuizQuestion1] = useState('¿Con quién viajas en esta escapada? 👥');
  const [incentiveGuide, setIncentiveGuide] = useState('Guía de Lugares Secretos 🍷');
  const [giftUrl, setGiftUrl] = useState('https://images.unsplash.com/photo-1544645229-41710bd3c597?auto=format&fit=crop&q=80&w=2000');
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [uploadPdfError, setUploadPdfError] = useState('');

  // ----------------------------------------------------
  // WEBSITE EDITOR STATES
  // ----------------------------------------------------
  const [themePreset, setThemePreset] = useState<'cozy' | 'luxury' | 'minimalist' | 'tropical'>(
    currentProperty?.theme_preset || 'cozy'
  );
  const [logo, setLogo] = useState(currentProperty?.website_logo || currentProperty?.logo || '');
  const [heroTitle, setHeroTitle] = useState(currentProperty?.website_hero_title || '');
  const [heroSubtitle, setHeroSubtitle] = useState(currentProperty?.website_hero_subtitle || '');
  const [heroImage, setHeroImage] = useState(currentProperty?.website_hero_image || '');
  const [aboutTitle, setAboutTitle] = useState(currentProperty?.website_about_title || '');
  const [aboutText, setAboutText] = useState(currentProperty?.website_about_text || '');
  const [aboutImage, setAboutImage] = useState(currentProperty?.website_about_image || '');
  const [checkInTime, setCheckInTime] = useState(currentProperty?.website_check_in_time || '14:00');
  const [checkOutTime, setCheckOutTime] = useState(currentProperty?.website_check_out_time || '10:00');
  const [amenities, setAmenities] = useState(currentProperty?.website_amenities || '');
  const [address, setAddress] = useState(currentProperty?.address || '');
  const [phone, setPhone] = useState(currentProperty?.phone || '');
  const [email, setEmail] = useState(currentProperty?.email || '');
  const [whatsappMessage, setWhatsappMessage] = useState(currentProperty?.website_whatsapp_message || '¡Hola! Me gustaría consultar disponibilidad.');
  const [mapsUrl, setMapsUrl] = useState(currentProperty?.website_maps_url || '');
  const [footerText, setFooterText] = useState(currentProperty?.website_footer_text || '');
  const [instagram, setInstagram] = useState(currentProperty?.website_instagram || '');
  const [facebook, setFacebook] = useState(currentProperty?.website_facebook || '');

  // ----------------------------------------------------
  // BOOKING ENGINE STATES
  // ----------------------------------------------------
  const DEFAULT_FIELDS = {
    document_id: { enabled: true, required: true, label: 'Documento / Pasaporte' },
    dob: { enabled: true, required: true, label: 'Fecha de Nacimiento' },
    email: { enabled: true, required: true, label: 'Email' },
    nationality: { enabled: true, required: true, label: 'Nacionalidad' },
    phone: { enabled: true, required: false, label: 'Teléfono' },
    companions: { enabled: true, required: false, label: 'Acompañantes' }
  };
  const [engineColor, setEngineColor] = useState(currentProperty?.booking_engine_color || '#312e81');
  const [engineLogo, setEngineLogo] = useState(currentProperty?.booking_engine_logo || '');
  const [engineHero, setEngineHero] = useState(currentProperty?.booking_engine_hero || '');
  const [engineTerms, setEngineTerms] = useState(currentProperty?.terms_conditions || '');
  const [enginePolicy, setEnginePolicy] = useState(currentProperty?.cancellation_policy || '');
  const [preCheckinFields, setPreCheckinFields] = useState(
    currentProperty?.pre_checkin_fields || DEFAULT_FIELDS
  );

  // Sync / Load database logic
  useEffect(() => {
    if (currentProperty) {
      setThemePreset(currentProperty.theme_preset || 'cozy');
      setLogo(currentProperty.website_logo || currentProperty.logo || '');
      setHeroTitle(currentProperty.website_hero_title || '');
      setHeroSubtitle(currentProperty.website_hero_subtitle || '');
      setHeroImage(currentProperty.website_hero_image || '');
      setAboutTitle(currentProperty.website_about_title || '');
      setAboutText(currentProperty.website_about_text || '');
      setAboutImage(currentProperty.website_about_image || '');
      setCheckInTime(currentProperty.website_check_in_time || '14:00');
      setCheckOutTime(currentProperty.website_check_out_time || '10:00');
      setAmenities(currentProperty.website_amenities || '');
      setAddress(currentProperty.address || '');
      setPhone(currentProperty.phone || '');
      setEmail(currentProperty.email || '');
      setWhatsappMessage(currentProperty.website_whatsapp_message || '¡Hola! Me gustaría consultar disponibilidad.');
      setMapsUrl(currentProperty.website_maps_url || '');
      setFooterText(currentProperty.website_footer_text || '');
      setInstagram(currentProperty.website_instagram || '');
      setFacebook(currentProperty.website_facebook || '');

      setEngineColor(currentProperty.booking_engine_color || '#312e81');
      setEngineLogo(currentProperty.booking_engine_logo || '');
      setEngineHero(currentProperty.booking_engine_hero || '');
      setEngineTerms(currentProperty.terms_conditions || '');
      setEnginePolicy(currentProperty.cancellation_policy || '');
      setPreCheckinFields(currentProperty.pre_checkin_fields || DEFAULT_FIELDS);
    }
  }, [currentProperty]);

  // Local storage loads removed in favor of PMSContext database state
  useEffect(() => {}, []);

  const handleSaveWebsite = () => {
    if (!currentProperty) return;
    const selectedPreset = themePresets[themePreset];
    updateProperty({
      ...currentProperty,
      address,
      phone,
      email,
      website_logo: logo,
      website_hero_title: heroTitle,
      website_hero_subtitle: heroSubtitle,
      website_hero_image: heroImage,
      website_about_title: aboutTitle,
      website_about_text: aboutText,
      website_about_image: aboutImage,
      website_check_in_time: checkInTime,
      website_check_out_time: checkOutTime,
      website_amenities: amenities,
      website_maps_url: mapsUrl,
      website_footer_text: footerText,
      website_instagram: instagram,
      website_facebook: facebook,
      website_whatsapp_message: whatsappMessage,
      theme_preset: themePreset,
      booking_engine_color: selectedPreset.primaryColor
    });
    alert('¡Sitio Web guardado exitosamente!');
  };

  const handleSaveBookingEngine = () => {
    if (!currentProperty) return;
    updateProperty({
      ...currentProperty,
      booking_engine_color: engineColor,
      booking_engine_logo: engineLogo,
      booking_engine_hero: engineHero,
      terms_conditions: engineTerms,
      cancellation_policy: enginePolicy,
      pre_checkin_fields: preCheckinFields,
    });
    alert('¡Configuración del Motor guardada exitosamente!');
  };

  const handleDeleteFunnel = (slug: string) => {
    if (confirm(`¿Estás seguro de eliminar el embudo "${slug}"?`)) {
      const newFunnels = { ...funnels };
      delete newFunnels[slug];
      updateFunnels(newFunnels);

      const newLandings = { ...landings };
      delete newLandings[slug];
      updateLandings(newLandings);
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
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
      alert('Ya existe una campaña con este nombre.');
      return;
    }

    const resolvedPropertyId = currentPropertyId === 'all' ? (properties[0]?.id || '11111111-1111-1111-1111-111111111111') : currentPropertyId;

    const newPromo = {
      id: `p_campaign_${Date.now()}`,
      property_id: resolvedPropertyId,
      code: promoCode.trim().toUpperCase(),
      name: campaignName,
      discount_type: 'percent' as const,
      discount_value: Number(discountValue),
      valid_from: new Date().toISOString().split('T')[0],
      valid_until: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      is_active: true,
      created_at: new Date().toISOString()
    };
    addPromotion(newPromo);

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

    const nextFunnels = { ...funnels, [slug]: newQuizConfig };
    updateFunnels(nextFunnels);

    const nextLandings = { ...landings, [slug]: newLandingConfig };
    updateLandings(nextLandings);

    setCampaignName('');
    setPromoCode('');
    setDiscountValue('20');
    setShowWizard(false);

    alert(`¡Campaña "${campaignName}" lanzada con éxito!\n- Landing creada: /l/${slug}\n- Quiz creado: /funnels/${slug}\n- Cupón creado: ${promoCode.toUpperCase()}`);
  };

  // Compute metrics
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
  const isDemo = currentPropertyId === '11111111-1111-1111-1111-111111111111';

  const stats = {
    traffic: isDemo ? 340 + quizLeads.length * 4 : Math.max(quizLeads.length * 5, filteredQuotes.length * 3),
    quizCompleted: isDemo ? 85 + quizLeads.length : quizLeads.length,
    leads: isDemo ? quizLeads.length + 15 : filteredQuotes.length,
    sentQuotes: isDemo ? quizLeads.filter(q => q.status === 'follow_up' || q.status === 'sent').length + 8 : filteredQuotes.filter(q => q.status === 'follow_up' || q.status === 'sent').length,
    bookings: isDemo ? motorBookings.length + 3 : filteredBookings.length
  };

  const selectedPreset = themePresets[themePreset] || themePresets.cozy;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-700">
      <TopBar />

      <main className="flex-1 p-6 md:p-12 max-w-7xl mx-auto w-full space-y-8">
        
        {/* Module Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div>
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-2">
              <Megaphone className="w-8 h-8 text-indigo-600" />
              Canales de Venta y Web
            </h1>
            <p className="text-slate-500 font-medium text-sm mt-1">
              Controlá y personalizá tu sitio web público, las landings de venta con quiz integrado y la estética de tu motor de reservas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <a 
              href={`/w/${currentProperty?.id}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 px-5 py-3 rounded-2xl font-bold flex items-center gap-1.5 transition-all text-xs"
            >
              <Globe className="w-4 h-4 text-indigo-600" /> Ver Web Pública
            </a>
          </div>
        </div>

        {/* Tab Selector Tabs */}
        <div className="flex border-b border-slate-200 gap-1.5 bg-white p-1.5 rounded-2xl shadow-xs border">
          <button
            onClick={() => setActiveTab('landings')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-black transition-all ${
              activeTab === 'landings'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <LayoutTemplate className="w-4 h-4" />
            Landings y Quizzes
          </button>
 
          <button
            onClick={() => setActiveTab('website')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-black transition-all ${
              activeTab === 'website'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Globe className="w-4 h-4" />
            Editor Web
          </button>
 
          <button
            onClick={() => setActiveTab('booking-engine')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-black transition-all ${
              activeTab === 'booking-engine'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Palette className="w-4 h-4" />
            Motor de Reservas
          </button>
        </div>

        {/* ---------------------------------------------------- */}
        {/* TAB 1: LANDINGS & QUIZZES */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'landings' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Live Journey conversion graph */}
            <div className="bg-slate-900 rounded-3xl p-6 md:p-8 text-white border border-slate-800 shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent z-0"></div>
              
              <div className="relative z-10 space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">Embudo Unificado</span>
                    <h2 className="text-xl md:text-2xl font-black mt-2">Embudo de Conversión Comercial (Live Journey)</h2>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3">
                    <TrendingUp className="w-6 h-6 text-emerald-400" />
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider block">Conversión Final</span>
                      <span className="text-lg font-black">
                        {stats.traffic > 0 ? ((stats.bookings / stats.traffic) * 100).toFixed(1) : '0.0'}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Funnel Pipeline */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {[
                    { title: 'Atraer 📣', value: `${stats.traffic} Visitas`, desc: 'Tráfico de Landing Page' },
                    { title: 'Perfilar ⚡', value: `${stats.quizCompleted} Clics`, desc: 'Iniciaron el Quiz' },
                    { title: 'Capturar 🎯', value: `${stats.leads} Leads`, desc: 'Dejaron su WhatsApp' },
                    { title: 'Propuesta ✉️', value: `${stats.sentQuotes} Envíos`, desc: 'Cotizaciones Enviadas' },
                    { title: 'Reservar 🔑', value: `${stats.bookings} Ventas`, desc: 'Reservas Confirmadas' }
                  ].map((step, idx) => (
                    <div key={idx} className="relative flex flex-col justify-between bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-all">
                      <div>
                        <div className="flex justify-between items-center text-[10px] font-black text-white/30 mb-2">
                          <span>ETAPA 0{idx+1}</span>
                        </div>
                        <h3 className="text-xl font-black text-white tracking-tight">{step.value}</h3>
                        <span className="text-xs font-bold text-slate-300 block mt-1">{step.title}</span>
                        <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">{step.desc}</p>
                      </div>
                      {idx < 4 && (
                        <div className="hidden md:flex absolute top-1/2 -translate-y-1/2 -right-3.5 z-20 w-7 h-7 bg-slate-800 border border-slate-700/60 rounded-full items-center justify-center text-slate-400 shadow-md">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Landings and Quizzes list */}
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black text-slate-800">Páginas Landing y Quizzes Activos</h2>
                  <p className="text-slate-500 text-xs font-semibold">Configuración de páginas de destino con cuestionarios express y cupones de descuento.</p>
                </div>
                <Link 
                  href="/landings/nueva/edit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm flex items-center gap-1.5 text-xs"
                >
                  <Plus className="w-4 h-4" /> Nueva Landing + Quiz
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.entries(landings).map(([slug, config]) => {
                  return (
                    <div key={slug} className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden flex flex-col hover:border-indigo-300 transition-colors">
                      <div className="p-6 flex-1 space-y-4">
                        <div className="flex justify-between items-center">
                          <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-2xl border border-indigo-100">
                            <LayoutTemplate className="w-5 h-5" />
                          </div>
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">Activo</span>
                        </div>

                        <div>
                          <h3 className="font-bold text-slate-800 text-sm truncate">{config.hero?.title || 'Sin Título'}</h3>
                          <p className="text-xs text-slate-400 truncate mt-0.5">{config.hero?.subtitle || 'Sin Subtítulo'}</p>
                        </div>

                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-105 space-y-2 text-xs">
                          <div className="flex justify-between text-slate-500">
                            <span>Ruta Pública:</span>
                            <span className="font-bold text-slate-700 font-mono">/l/{slug}</span>
                          </div>
                          <div className="flex justify-between text-slate-500">
                            <span>Código Cupón:</span>
                            <span className="font-bold text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                              {config.bookingDirectPromoCode || 'Ninguno'}
                            </span>
                          </div>
                        </div>

                        <div className="pt-2">
                          <a 
                            href={`/l/${slug}`} 
                            target="_blank" 
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white text-center py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-95"
                          >
                            📣 Abrir Flujo Público
                          </a>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-between items-center">
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/l/${slug}`);
                            alert('Enlace copiado al portapapeles');
                          }}
                          className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-[10px] font-bold text-slate-600 rounded-lg flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" /> Copiar Link
                        </button>
                        
                        <div className="flex gap-1.5">
                          <Link 
                            href={`/landings/${slug}/edit`} 
                            className="text-[10px] font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white flex items-center gap-1"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> Configurar Todo
                          </Link>
                          <button 
                            onClick={() => handleDeleteFunnel(slug)}
                            className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg border border-slate-200 bg-white cursor-pointer"
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
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 3: WEBSITE EDITOR */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'website' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-200">
            {/* Form Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Estética general */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-lg font-black text-slate-800 mb-2 flex items-center gap-2">
                  <Palette className="w-5 h-5 text-indigo-500" />
                  Preseteo de Estética y Temas
                </h2>
                <p className="text-xs text-slate-400 mb-6 font-semibold">
                  Elegí el estilo de diseño de tu hotel. Modificará colores, tipografías y bordes en tu portal.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.values(themePresets).map((preset) => {
                    const isSelected = themePreset === preset.id;
                    return (
                      <button
                        type="button"
                        key={preset.id}
                        onClick={() => setThemePreset(preset.id as any)}
                        className={`text-left p-4 rounded-2xl border-2 transition-all flex flex-col justify-between h-36 ${
                          isSelected 
                            ? 'border-indigo-600 bg-indigo-50/20 shadow-sm' 
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between w-full">
                            <span className="font-bold text-sm text-slate-800">{preset.name}</span>
                            {isSelected && (
                              <span className="bg-indigo-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase">Activo</span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">{preset.description}</p>
                        </div>
                        
                        <div className="flex items-center justify-between w-full pt-3 border-t border-slate-100">
                          <div className="flex gap-1.5">
                            <span className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: preset.primaryColor }}></span>
                            <span className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: preset.secondaryColor }}></span>
                            <span className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: preset.backgroundColor }}></span>
                          </div>
                          <span className="text-[9px] font-black text-slate-450 uppercase">{preset.id}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Logo e Identidad */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                  <ImageIcon className="w-5 h-5 text-indigo-500" />
                  Identidad y Logotipo
                </h2>
                <ImageUpload 
                  label="Logo de la Web Pública"
                  value={logo}
                  onChange={setLogo}
                />
              </div>

              {/* Banner de Inicio (Hero) */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                  <Palette className="w-5 h-5 text-indigo-500" />
                  Sección Principal (Hero)
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase">Título Principal de la Web</label>
                    <input 
                      type="text" 
                      value={heroTitle}
                      onChange={(e) => setHeroTitle(e.target.value)}
                      placeholder={`Bienvenidos a ${currentProperty?.name}`}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:border-indigo-500 mt-1"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase">Subtítulo de Bienvenida</label>
                    <textarea 
                      value={heroSubtitle}
                      onChange={(e) => setHeroSubtitle(e.target.value)}
                      rows={2}
                      placeholder="Un entorno único diseñado para el relax total en familia..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:border-indigo-500 mt-1"
                    />
                  </div>

                  <ImageUpload 
                    label="Imagen de Fondo de Cabecera"
                    value={heroImage}
                    onChange={setHeroImage}
                  />
                </div>
              </div>

              {/* Sobre Nosotros */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-5 h-5 text-indigo-500" />
                  Sobre Nosotros & Propuesta
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase">Título de la Propuesta</label>
                    <input 
                      type="text" 
                      value={aboutTitle}
                      onChange={(e) => setAboutTitle(e.target.value)}
                      placeholder="Nuestra propuesta gastronómica y de descanso..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:border-indigo-500 mt-1"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase">Descripción / Historia</label>
                    <textarea 
                      value={aboutText}
                      onChange={(e) => setAboutText(e.target.value)}
                      rows={4}
                      placeholder="Ubicados frente al lago, ofrecemos una experiencia de desconexión absoluta con servicios premium..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:border-indigo-500 mt-1"
                    />
                  </div>

                  <ImageUpload 
                    label="Imagen de Acompañamiento"
                    value={aboutImage}
                    onChange={setAboutImage}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Check-in
                      </label>
                      <input 
                        type="text" 
                        value={checkInTime}
                        onChange={(e) => setCheckInTime(e.target.value)}
                        placeholder="14:00"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:border-indigo-500 mt-1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Check-out
                      </label>
                      <input 
                        type="text" 
                        value={checkOutTime}
                        onChange={(e) => setCheckOutTime(e.target.value)}
                        placeholder="10:00"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:border-indigo-500 mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Guardar cambios */}
              <div className="flex justify-end">
                <button
                  onClick={handleSaveWebsite}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-2xl shadow-md transition-colors flex items-center gap-1.5 text-xs"
                >
                  <Save className="w-4 h-4" /> Guardar Cambios del Sitio Web
                </button>
              </div>
            </div>

            {/* Dynamic Web Preview Panel */}
            <div className="lg:col-span-1">
              <div className="sticky top-6 rounded-3xl overflow-hidden border transition-all duration-300 shadow-lg"
                   style={{ 
                     borderColor: selectedPreset.primaryColor + '30',
                     backgroundColor: selectedPreset.backgroundColor,
                     borderRadius: selectedPreset.borderRadius === 'rounded-none' ? '0px' : selectedPreset.borderRadius === 'rounded-3xl' ? '24px' : '12px',
                     color: selectedPreset.textColor
                   }}>
                
                <div className="px-4 py-3 flex items-center justify-between border-b"
                     style={{ 
                       backgroundColor: selectedPreset.primaryColor,
                       borderColor: selectedPreset.secondaryColor + '30',
                       color: '#ffffff'
                     }}>
                  {logo ? (
                    <img src={logo} alt="Logo" className="h-5 object-contain" />
                  ) : (
                    <span className="text-[10px] font-black uppercase tracking-wider">{currentProperty?.name}</span>
                  )}
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-white/20"></span>
                    <span className="w-2 h-2 rounded-full bg-white/40"></span>
                  </div>
                </div>

                <div className="h-40 bg-cover bg-center relative" style={{ backgroundImage: `url('${heroImage || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=600&auto=format&fit=crop'}')` }}>
                  <div className="absolute inset-0 bg-black/60"></div>
                  <div className="absolute inset-0 flex flex-col justify-center px-4 text-center text-white">
                    <h3 className={`text-xs font-black truncate ${selectedPreset.fontTitle}`}>{heroTitle || currentProperty?.name}</h3>
                    <p className={`text-[9px] text-slate-350 mt-1 line-clamp-2 ${selectedPreset.fontBody}`}>{heroSubtitle || 'La escapada ideal de montaña.'}</p>
                  </div>
                </div>

                <div className="p-5 space-y-4 text-xs">
                  <div>
                    <h4 className="font-bold text-[10px] mb-1.5" style={{ color: selectedPreset.primaryColor }}>{aboutTitle || 'Nosotros'}</h4>
                    <div className="grid grid-cols-2 gap-2 mb-2 items-center">
                      <p className="line-clamp-3 text-[10px] text-slate-400 font-semibold leading-relaxed">{aboutText || 'Nuestra propuesta y hospitalidad frente al lago.'}</p>
                      <img src={aboutImage || 'https://images.unsplash.com/photo-1542314831-c6a4d14faaf2?q=80&w=200&auto=format&fit=crop'} className="h-12 w-full object-cover rounded-lg" alt="Thumbnail" />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      style={{ 
                        backgroundColor: selectedPreset.primaryColor,
                        color: '#ffffff',
                        borderRadius: selectedPreset.borderRadius === 'rounded-none' ? '0px' : '9999px'
                      }}
                      className="w-full py-2 text-center text-[10px] font-black uppercase tracking-wider shadow-sm"
                    >
                      Reservar Directo
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 4: BOOKING ENGINE */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'booking-engine' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-200">
            {/* Form Column */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Appearance config */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-1.5">
                  <Palette className="w-5 h-5 text-indigo-500" />
                  Apariencia del Motor
                </h2>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">Color Principal de Botones y Header</label>
                  <div className="flex items-center gap-2 mt-1.5">
                    <input 
                      type="color" 
                      value={engineColor}
                      onChange={(e) => setEngineColor(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200 p-0"
                    />
                    <input 
                      type="text" 
                      value={engineColor}
                      onChange={(e) => setEngineColor(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:border-indigo-500 uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ImageUpload 
                    label="Logotipo del Motor de Reservas"
                    value={engineLogo}
                    onChange={setEngineLogo}
                  />
                  <ImageUpload 
                    label="Banner Superior del Motor (Hero)"
                    value={engineHero}
                    onChange={setEngineHero}
                  />
                </div>
              </div>

              {/* Policies and terms */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-5 h-5 text-indigo-500" />
                  Políticas y Contrato
                </h2>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">Políticas de Cancelación Generales</label>
                  <textarea 
                    value={enginePolicy}
                    onChange={(e) => setEnginePolicy(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 mt-1.5"
                    placeholder="Cancelación sin cargo hasta 72hs previas al check-in..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">Términos y Condiciones del Hotel</label>
                  <textarea 
                    value={engineTerms}
                    onChange={(e) => setEngineTerms(e.target.value)}
                    rows={4}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 mt-1.5"
                    placeholder="Términos sobre depósitos de garantía, horarios de silencio y no-show..."
                  />
                </div>
              </div>

              {/* Pre Check-in Form customization */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-1.5 mb-2">
                  <UserCheck className="w-5 h-5 text-indigo-500" />
                  Campos del Pre-Checkin Digital
                </h2>
                <p className="text-xs text-slate-400 font-semibold mb-4 leading-relaxed">
                  Configurá qué datos solicitarás de manera digital al huésped para automatizar su ficha de ingreso antes de llegar.
                </p>

                <div className="divide-y divide-slate-100">
                  {Object.entries(preCheckinFields).map(([key, config]: [string, any]) => (
                    <div key={key} className="py-3 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">{config.label}</span>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={config.enabled}
                            onChange={(e) => setPreCheckinFields((prev: any) => {
                              const updated = {
                                ...prev,
                                [key]: { ...prev[key], enabled: e.target.checked }
                              };
                              if (!e.target.checked) updated[key].required = false;
                              return updated;
                            })}
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                          />
                          <span className="text-xs text-slate-500 font-bold">Solicitar</span>
                        </label>

                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={config.required}
                            disabled={!config.enabled}
                            onChange={(e) => setPreCheckinFields((prev: any) => ({
                              ...prev,
                              [key]: { ...prev[key], required: e.target.checked }
                            }))}
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 disabled:opacity-50"
                          />
                          <span className="text-xs text-slate-500 font-bold">Obligatorio</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Guardar cambios */}
              <div className="flex justify-end">
                <button
                  onClick={handleSaveBookingEngine}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-2xl shadow-md transition-colors flex items-center gap-1.5 text-xs"
                >
                  <Save className="w-4 h-4" /> Guardar Configuración del Motor
                </button>
              </div>
            </div>

            {/* Visual preview column */}
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-indigo-500" />
                  Previsualización de Reserva (Fase de Datos)
                </h3>
                
                <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-white">
                  <div className="p-4 text-white relative flex flex-col justify-end h-28" style={{ backgroundColor: engineColor }}>
                    {engineHero && <div className="absolute inset-0 opacity-20 bg-cover bg-center" style={{ backgroundImage: `url('${engineHero}')` }}></div>}
                    <div className="relative z-10">
                      {engineLogo ? (
                        <img src={engineLogo} alt="Logo" className="h-6 object-contain" />
                      ) : (
                        <div className="font-bold text-xs">{currentProperty?.name}</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-5 space-y-4">
                    <div className="text-[10px] bg-slate-50 p-2.5 rounded-lg border border-slate-105">
                      <span className="block font-bold text-slate-500 uppercase tracking-wider text-[8px]">Estadía Seleccionada</span>
                      <span className="font-bold text-slate-700">12 Abr al 19 Abr • 1 Habitación • 2 Pax</span>
                    </div>

                    <button className="w-full py-2.5 text-white font-bold text-xs rounded-xl shadow-xs" style={{ backgroundColor: engineColor }}>
                      Buscar Disponibilidad
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ---------------------------------------------------- */}
      {/* CAMPAIGN WIZARD MODAL */}
      {/* ---------------------------------------------------- */}
      {showWizard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-slate-100">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-3xl">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-black text-slate-800">Lanzador Express de Campaña</h2>
              </div>
              <button onClick={() => setShowWizard(false)} className="text-slate-400 hover:text-slate-600 bg-white p-1 rounded-full border border-slate-200 shadow-sm">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="px-6 py-2.5 bg-slate-900 border-b border-slate-800 text-white flex justify-between items-center text-[8px] font-black uppercase tracking-widest text-center select-none">
              <span className="text-indigo-400">1. Landing 📣</span>
              <span className="text-slate-600">➔</span>
              <span className="text-indigo-400">2. Quiz ⚡</span>
              <span className="text-slate-600">➔</span>
              <span className="text-indigo-400">3. Cupón 🔑</span>
              <span className="text-slate-600">➔</span>
              <span className="text-indigo-400">4. Motor 🛎️</span>
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
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-xs text-slate-900 font-bold"
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
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-xs uppercase text-slate-900 font-bold"
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
                      className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-xs text-slate-900 font-bold"
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
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-xs text-slate-900 font-bold"
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
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-xs text-slate-900 font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs uppercase tracking-wider font-bold text-slate-500">Incentivo Digital (PDF Link o Archivo) *</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    required
                    placeholder="Pegá link o cargá archivo..."
                    value={giftUrl}
                    onChange={(e) => setGiftUrl(e.target.value)}
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-xs text-slate-900 font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('pdf-file-upload-mkt')?.click()}
                    className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 px-4 py-3 rounded-xl text-[10px] font-black transition-colors flex items-center gap-1"
                  >
                    {isUploadingPdf ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                    ) : (
                      <UploadCloud className="w-3.5 h-3.5 text-slate-500" />
                    )}
                    <span>Subir PDF</span>
                  </button>
                  <input 
                    id="pdf-file-upload-mkt"
                    type="file"
                    accept=".pdf"
                    onChange={handlePdfUpload}
                    className="hidden"
                  />
                </div>
                {uploadPdfError && (
                  <p className="text-[10px] text-red-500 font-bold mt-1">{uploadPdfError}</p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button 
                  type="submit"
                  className="w-full py-3.5 bg-indigo-650 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 flex items-center justify-center gap-1.5 transition-all text-xs"
                >
                  Lanzar Campaña Completa <ArrowRight className="w-4 h-4" />
                </button>
                <p className="text-[9px] text-slate-400 text-center mt-3 font-semibold uppercase tracking-wider">
                  Crea automáticamente: Landing Page ➔ Quiz Cuestionario ➔ Código Promo ➔ Enlace Directo
                </p>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
