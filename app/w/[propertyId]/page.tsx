'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePMS } from '../../../context/PMSContext';
import { CalendarRange, Phone, Mail, MapPin, CheckCircle, ArrowRight } from 'lucide-react';
import { themePresets } from '../../../lib/themeConfig';

const reviews = [
  {
    id: 1,
    name: "Valeria Gómez",
    rating: 5,
    comment: "¡Excelente atención y las instalaciones son impecables! Ideal para relajarse y desconectar de la ciudad.",
    date: "Hace 2 semanas",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop"
  },
  {
    id: 2,
    name: "Juan Manuel Ortiz",
    rating: 5,
    comment: "El entorno es único y la habitación súper confortable. El personal estuvo atento en todo momento. ¡Volveremos!",
    date: "Hace 1 mes",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop"
  },
  {
    id: 3,
    name: "Sofía Rodríguez",
    rating: 5,
    comment: "La mejor experiencia de hospedaje. Las amenidades y la vista son increíbles. Súper recomendable el desayuno.",
    date: "Hace 3 días",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150&auto=format&fit=crop"
  }
];

export default function PublicHotelWebsite() {
  const params = useParams();
  const router = useRouter();
  const { properties, unitTypes, isInitialized } = usePMS();
  const propertyId = params.propertyId as string;

  const [landings, setLandings] = React.useState<Record<string, any>>({});
  const [activeReviewIdx, setActiveReviewIdx] = React.useState(0);
  
  React.useEffect(() => {
    const loadLandings = () => {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('hotelFlow_landings');
        if (saved) {
          try {
            setLandings(JSON.parse(saved));
          } catch (e) {}
        }
      }
    };
    
    loadLandings();
    
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', loadLandings);
      return () => window.removeEventListener('storage', loadLandings);
    }
  }, []);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setActiveReviewIdx((prev) => (prev + 1) % reviews.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-400 text-sm font-semibold">Cargando sitio web del hotel...</p>
        </div>
      </div>
    );
  }

  const property = properties.find(p => p.id === propertyId);

  if (!property) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-black">Propiedad no encontrada</h1>
          <p className="text-slate-400">Verificá que el ID sea correcto.</p>
        </div>
      </div>
    );
  }

  // Fetch selected theme configuration
  const preset = themePresets[property.theme_preset || 'cozy'] || themePresets.cozy;

  // Fallbacks
  const websiteLogo = property.website_logo || property.logo || '';
  const heroTitle = property.website_hero_title || `Bienvenidos a ${property.name}`;
  const heroSubtitle = property.website_hero_subtitle || 'Un lugar pensado para tu descanso y desconexión total.';
  const heroImage = property.website_hero_image || property.booking_engine_hero || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2000&auto=format&fit=crop';
  
  const aboutTitle = property.website_about_title || 'Nuestra Propuesta';
  const aboutText = property.website_about_text || 'Ofrecemos una experiencia única combinando el máximo confort con la belleza natural de nuestro entorno. Cada rincón está diseñado para brindar paz, intimidad y momentos memorables a nuestros huéspedes.';
  const aboutImage = property.website_about_image || 'https://images.unsplash.com/photo-1542314831-c6a4d14faaf2?q=80&w=1200&auto=format&fit=crop';
  
  const checkInTime = property.website_check_in_time || '14:00';
  const checkOutTime = property.website_check_out_time || '10:00';
  
  const amenitiesList = property.website_amenities 
    ? property.website_amenities.split(',').map(a => a.trim()).filter(Boolean)
    : ['Desayuno Incluido 🍳', 'Wi-Fi de Alta Velocidad 📶', 'Estacionamiento Gratuito 🚗', 'Atención Personalizada 🛎️', 'Piscina / Solárium 🏊', 'Vistas Panorámicas 🏔️'];

  const mapsLink = property.website_maps_url || `https://maps.google.com/?q=${encodeURIComponent(property.address || property.name)}`;
  const footerCopyright = property.website_footer_text || `© ${new Date().getFullYear()} ${property.name}. Todos los derechos reservados.`;

  const themeColor = preset.primaryColor;
  const secondaryColor = preset.secondaryColor;
  const radiusClass = preset.borderRadius === 'rounded-none' ? 'rounded-none' : preset.borderRadius === 'rounded-3xl' ? 'rounded-3xl' : 'rounded-xl';
  const buttonRadiusClass = preset.borderRadius === 'rounded-none' ? 'rounded-none' : 'rounded-full';

  const handleBookRedirect = () => {
    router.push(`/book/${propertyId}`);
  };

  return (
    <div className={`min-h-screen font-sans antialiased selection:bg-indigo-500/30 ${preset.fontBody}`}
         style={{ backgroundColor: preset.backgroundColor, color: preset.textColor }}>
      
      {/* Header / Navbar */}
      <header className={`sticky top-0 z-50 backdrop-blur-md transition-all ${preset.headerBg}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {websiteLogo ? (
              <img src={websiteLogo} alt="Logo" className="h-10 object-contain" />
            ) : (
              <span className={`font-black text-2xl tracking-tight ${preset.fontTitle}`} style={{ color: themeColor }}>{property.name}</span>
            )}
          </div>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-black text-slate-600">
            <a href="#about" className="hover:text-slate-900 transition-colors">Sobre Nosotros</a>
            <a href="#amenities" className="hover:text-slate-900 transition-colors">Servicios</a>
            {Object.keys(landings).length > 0 && (
              <a href="#promotions" className="hover:text-indigo-600 font-extrabold transition-colors">Promociones 🎁</a>
            )}
            <a href="#rooms" className="hover:text-slate-900 transition-colors">Habitaciones</a>
            <a href="#contact" className="hover:text-slate-900 transition-colors">Contacto</a>
          </nav>

          <button 
            onClick={handleBookRedirect}
            style={{ backgroundColor: themeColor }}
            className={`text-white px-6 py-2.5 text-sm font-black shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-2 ${buttonRadiusClass}`}
          >
            <CalendarRange className="w-4 h-4" />
            Reservar Ahora
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-[85vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImage} 
            alt="Hero background" 
            className="w-full h-full object-cover scale-105 filter brightness-[0.4]"
          />
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto text-center px-6 space-y-6 text-white">
          <h1 className={`text-4xl md:text-6xl font-black tracking-tight leading-none drop-shadow-md ${preset.fontTitle}`}>
            {heroTitle}
          </h1>
          <p className="text-lg md:text-2xl text-slate-200 drop-shadow max-w-2xl mx-auto font-semibold">
            {heroSubtitle}
          </p>
          <div className="pt-6">
            <button 
              onClick={handleBookRedirect}
              style={{ backgroundColor: themeColor }}
              className={`text-white px-10 py-4 text-lg font-black shadow-lg hover:scale-105 active:scale-95 transition-all inline-flex items-center gap-3 ${buttonRadiusClass}`}
            >
              Consultar Disponibilidad
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-6 max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <h2 className={`text-3xl md:text-4xl font-black tracking-tight ${preset.fontTitle}`} style={{ color: themeColor }}>{aboutTitle}</h2>
          <p className="text-slate-600 text-lg leading-relaxed font-semibold">
            {aboutText}
          </p>
          <div className="pt-4 grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
              <CheckCircle className="w-5 h-5" style={{ color: secondaryColor }} /> Check-in: {checkInTime}
            </div>
            <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
              <CheckCircle className="w-5 h-5" style={{ color: secondaryColor }} /> Check-out: {checkOutTime}
            </div>
          </div>
        </div>
        <div className={`overflow-hidden shadow-xl aspect-video md:aspect-square ${radiusClass}`}>
          <img 
            src={aboutImage} 
            alt={aboutTitle} 
            className="w-full h-full object-cover"
          />
        </div>
      </section>

      {/* Amenities Section */}
      <section id="amenities" className="py-20 bg-slate-100/50 px-6 border-y border-slate-200/40">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className={`text-3xl font-black tracking-tight mb-4 ${preset.fontTitle}`} style={{ color: themeColor }}>Servicios & Amenities</h2>
          <p className="text-slate-500 max-w-lg mx-auto font-semibold mb-12">Todo lo necesario para que disfrutes tu estadía de principio a fin.</p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {amenitiesList.map((amenity, idx) => (
              <div key={idx} className={`p-6 bg-white font-bold text-slate-800 text-lg flex items-center justify-center hover:scale-[1.02] transition-transform ${preset.cardStyle}`}>
                {amenity}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews Carousel Section */}
      <section className="py-20 px-6 max-w-4xl mx-auto text-center overflow-hidden">
        <h2 className={`text-3xl font-black tracking-tight mb-4 ${preset.fontTitle}`} style={{ color: themeColor }}>Lo que dicen nuestros huéspedes</h2>
        <p className="text-slate-500 max-w-lg mx-auto font-semibold mb-12">Experiencias reales de quienes ya nos visitaron.</p>

        <div className={`relative bg-white border border-slate-100 p-8 md:p-12 shadow-md max-w-2xl mx-auto min-h-[220px] flex flex-col justify-between transition-all duration-500 ${preset.cardStyle}`}>
          <div className="flex justify-center gap-1 text-amber-400 mb-4">
            {Array.from({ length: reviews[activeReviewIdx].rating }).map((_, i) => (
              <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>

          <p className="text-slate-600 text-base md:text-lg italic leading-relaxed font-semibold mb-6">
            "{reviews[activeReviewIdx].comment}"
          </p>

          <div className="flex items-center justify-center gap-3">
            <img 
              src={reviews[activeReviewIdx].avatar} 
              alt={reviews[activeReviewIdx].name} 
              className="w-10 h-10 rounded-full object-cover border border-slate-100"
            />
            <div className="text-left font-bold">
              <h4 className="text-slate-800 text-sm">{reviews[activeReviewIdx].name}</h4>
              <span className="text-[10px] text-slate-400 font-bold block">{reviews[activeReviewIdx].date}</span>
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-1.5 mt-8">
            {reviews.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveReviewIdx(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  idx === activeReviewIdx 
                    ? 'w-6' 
                    : 'bg-slate-200 hover:bg-slate-350'
                }`}
                style={{ backgroundColor: idx === activeReviewIdx ? themeColor : undefined }}
                title={`Ir a reseña ${idx + 1}`}
              ></button>
            ))}
          </div>
        </div>
      </section>

      {/* Promociones & Ofertas Especiales (Campaign Landings Linkage) */}
      {(() => {
        const activePropertyLandings = Object.entries(landings).filter(([_, config]) => {
          if (properties.length <= 1) return true; // Si es mono-propiedad o base limpia, muestra todas
          return !config.bookingPropertyId || config.bookingPropertyId === propertyId || config.bookingPropertyId === 'all';
        });

        if (activePropertyLandings.length === 0) return null;

        return (
          <section id="promotions" className="py-20 px-6 max-w-6xl mx-auto border-b border-slate-200/40">
            <div className="text-center mb-16">
              <h2 className={`text-3xl font-black tracking-tight mb-4 ${preset.fontTitle}`} style={{ color: themeColor }}>Promociones & Beneficios Exclusivos 🎁</h2>
              <p className="text-slate-500 max-w-lg mx-auto font-semibold">Participá de nuestros cuestionarios breves y obtené tarifas con descuento y regalos al instante.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 justify-center">
              {activePropertyLandings.map(([slug, config]) => (
                <div key={slug} className={`overflow-hidden flex flex-col justify-between p-6 bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 border border-indigo-800/50 shadow-xl ${radiusClass} text-white hover:scale-[1.01] transition-transform`}>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300 bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-500/30">Campaña Activa</span>
                    <span className="text-sm font-black text-amber-400">🎁 Beneficio Disponible</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tight">{config.hero?.title || config.slug}</h3>
                    <p className="text-sm font-bold text-indigo-200 mt-1">{config.hero?.subtitle}</p>
                    <p className="text-xs text-slate-300 mt-3 leading-relaxed font-semibold">
                      {config.hero?.description1 || "Respondé unas breves preguntas sobre tu viaje y accedé a un beneficio único en tu reserva."}
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10 mt-6 flex items-center justify-between gap-4">
                  <div className="text-xs text-slate-400 font-semibold">
                    {config.hero?.footerText || "Toma menos de 60 segundos."}
                  </div>
                  <button
                    onClick={() => router.push(`/l/${slug}`)}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-5 py-2.5 text-xs font-black rounded-full shadow-md hover:scale-105 active:scale-95 transition-all inline-flex items-center gap-2"
                  >
                    {config.hero?.ctaText || "Obtener Descuento ⚡"}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
        );
      })()}

      {/* Rooms Showcase */}
      <section id="rooms" className="py-20 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className={`text-3xl font-black tracking-tight mb-4 ${preset.fontTitle}`} style={{ color: themeColor }}>Nuestras Habitaciones</h2>
          <p className="text-slate-500 max-w-lg mx-auto font-semibold">Categorías diseñadas para adaptarse al viaje que imaginás.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {unitTypes.map(ut => (
            <div key={ut.id} className={`overflow-hidden flex flex-col hover:shadow-lg transition-all ${preset.cardStyle}`}>
              <div className="h-48 bg-slate-200 relative">
                <img 
                  src={ut.images?.[0] || "https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=800&auto=format&fit=crop"} 
                  alt={ut.name} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className={`text-xl font-black text-slate-800 mb-2`}>{ut.name}</h3>
                  <p className="text-sm font-semibold text-slate-500 mb-4">Capacidad: {ut.max_pax} pasajeros</p>
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <button 
                    onClick={handleBookRedirect}
                    style={{ backgroundColor: themeColor }}
                    className={`w-full text-white py-2.5 text-xs font-black shadow-sm hover:scale-[1.01] transition-transform ${buttonRadiusClass}`}
                  >
                    Ver Disponibilidad
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 text-white px-6" style={{ backgroundColor: themeColor }}>
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12">
          <div className="space-y-6">
            <h2 className={`text-3xl font-black tracking-tight ${preset.fontTitle}`}>Contacto & Ubicación</h2>
            <p className="text-white/80 leading-relaxed font-semibold">¿Tenés alguna consulta o querés realizar un requerimiento especial? Ponete en contacto con nuestro equipo.</p>
            
            <div className="space-y-4 pt-4 text-sm font-black text-white/90">
              {property.address && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-white shrink-0" />
                  <span>{property.address}</span>
                </div>
              )}
              {property.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-white shrink-0" />
                  <span>{property.phone}</span>
                </div>
              )}
              {property.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-white shrink-0" />
                  <span>{property.email}</span>
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-6">
              {property.website_instagram && (
                <a href={property.website_instagram} target="_blank" rel="noopener noreferrer" className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white" title="Instagram">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </a>
              )}
              {property.website_facebook && (
                <a href={property.website_facebook} target="_blank" rel="noopener noreferrer" className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white" title="Facebook">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1V12h3v3h-3v6.8c4.56-.93 8-4.96 8-9.8z"/>
                  </svg>
                </a>
              )}
            </div>
          </div>

          <div className={`overflow-hidden h-80 bg-zinc-950 flex items-center justify-center relative border border-white/10 ${radiusClass}`}>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-800 via-zinc-950 to-zinc-950 opacity-50 z-0"></div>
            <div className="relative z-10 text-center space-y-2 px-6">
              <MapPin className="w-12 h-12 text-white/80 mx-auto" />
              <h4 className="font-bold text-lg">Mapa de Ubicación</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">Vení a visitarnos y disfrutá de un entorno increíble.</p>
              <a 
                href={mapsLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block mt-4 text-xs font-black text-white hover:underline"
              >
                Abrir en Google Maps
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-500 py-8 px-6 border-t border-slate-900 text-center md:text-left">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <span>{footerCopyright}</span>
          <span>Desarrollado con ❤️ por HotelFlow CRM</span>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      {(() => {
        const phone = property.phone || '+54 9 11 1234 5678';
        const message = property.website_whatsapp_message || '¡Hola! Me gustaría consultar disponibilidad.';
        return (
          <a 
            href={`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#128C7E] text-white p-4 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 group flex items-center justify-center animate-bounce"
            title="Contactanos por WhatsApp"
            style={{ animationDuration: '3s' }}
          >
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.703 1.456h.004c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </a>
        );
      })()}

    </div>
  );
}
