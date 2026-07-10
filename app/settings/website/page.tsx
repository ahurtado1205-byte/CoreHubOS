'use client';

import React, { useState } from 'react';
import { usePMS } from '../../../context/PMSContext';
import { ArrowLeft, Save, Globe, Palette, FileText, Share2, Sparkles, Clock, MapPin, Image } from 'lucide-react';
import Link from 'next/link';
import { TopBar } from '../../../components/layout/TopBar';
import { ImageUpload } from '../../../components/ui/ImageUpload';
import { themePresets } from '../../../lib/themeConfig';

export default function WebsiteSettingsPage() {
  const { properties, currentPropertyId, updateProperty } = usePMS();
  
  const currentProperty = properties.find(p => p.id === currentPropertyId);

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

  if (!currentProperty) {
    return <div className="p-8">No hay propiedad seleccionada</div>;
  }

  const handleSave = () => {
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

  const selectedPreset = themePresets[themePreset] || themePresets.cozy;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <TopBar />
      
      <main className="flex-1 overflow-y-auto p-6 lg:p-12">
        <div className="max-w-6xl mx-auto">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link href="/settings" className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-black text-slate-800">Editor del Sitio Web</h1>
                <p className="text-sm font-medium text-slate-500 mt-1">Configurá absolutamente todos los aspectos visuales y textuales de tu web pública.</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <a 
                href={`/w/${currentProperty.id}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm"
              >
                <Globe className="w-4 h-4" />
                Ver Web Pública
              </a>
              <button 
                onClick={handleSave}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-md transition-colors"
              >
                <Save className="w-4 h-4" />
                Guardar Cambios
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Formulario */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Promo link helper */}
              <div className="bg-gradient-to-r from-indigo-50 to-indigo-100/50 rounded-2xl border border-indigo-100 p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <h3 className="font-black text-slate-800 text-sm flex items-center gap-1.5">¿Querés sumar promociones en tu web? 🎁</h3>
                  <p className="text-xs text-slate-500 font-semibold max-w-md leading-relaxed">Las promociones de tu web se crean automáticamente al lanzar campañas express en el gestor de embudos.</p>
                </div>
                <Link 
                  href="/funnels"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-sm transition-colors block shrink-0"
                >
                  Ir a Campañas Express 🚀
                </Link>
              </div>

              {/* Selector de Temas y Estética */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-lg font-black text-slate-800 mb-2 flex items-center gap-2">
                  <Palette className="w-5 h-5 text-indigo-500" />
                  Estética y Temas Predeterminados
                </h2>
                <p className="text-xs text-slate-500 mb-6 font-medium leading-relaxed">
                  Elegí el estilo de diseño general. Esto cambiará colores, bordes y fuentes de tu web, motor de reservas y cotizador.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.values(themePresets).map((preset) => {
                    const isSelected = themePreset === preset.id;
                    return (
                      <button
                        type="button"
                        key={preset.id}
                        onClick={() => setThemePreset(preset.id as any)}
                        className={`text-left p-4 rounded-2xl border-2 transition-all flex flex-col justify-between h-40 ${
                          isSelected 
                            ? 'border-indigo-600 bg-indigo-50/30 ring-4 ring-indigo-500/10' 
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="w-full">
                          <div className="flex items-center justify-between w-full">
                            <span className="font-black text-sm text-slate-800">{preset.name}</span>
                            {isSelected && (
                              <span className="bg-indigo-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Activo</span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-2 font-semibold line-clamp-2 leading-relaxed">{preset.description}</p>
                        </div>
                        
                        <div className="flex items-center justify-between w-full pt-3 border-t border-slate-100">
                          <div className="flex gap-1.5">
                            <span className="w-4 h-4 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: preset.primaryColor }}></span>
                            <span className="w-4 h-4 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: preset.secondaryColor }}></span>
                            <span className="w-4 h-4 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: preset.backgroundColor }}></span>
                          </div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-md">{preset.id}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Identidad de la Marca */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Image className="w-5 h-5 text-indigo-500" />
                  Identidad y Logotipo
                </h2>
                <ImageUpload 
                  label="Logotipo de la Propiedad"
                  value={logo}
                  onChange={setLogo}
                />
              </div>

              {/* Hero Header Customization */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Palette className="w-5 h-5 text-indigo-500" />
                  Sección Principal (Hero)
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Título de Bienvenida</label>
                    <input 
                      type="text" 
                      value={heroTitle}
                      onChange={(e) => setHeroTitle(e.target.value)}
                      placeholder={`Bienvenidos a ${currentProperty.name}`}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Subtítulo de Bienvenida</label>
                    <textarea 
                      value={heroSubtitle}
                      onChange={(e) => setHeroSubtitle(e.target.value)}
                      rows={2}
                      placeholder="Un lugar pensado para tu descanso y desconexión total."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <ImageUpload 
                    label="Imagen de Fondo (Hero Banner)"
                    value={heroImage}
                    onChange={setHeroImage}
                  />
                </div>
              </div>

              {/* About Us section */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-500" />
                  Sobre Nosotros & Propuesta
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Título de la Sección</label>
                    <input 
                      type="text" 
                      value={aboutTitle}
                      onChange={(e) => setAboutTitle(e.target.value)}
                      placeholder="Nuestra Propuesta / La Experiencia"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Texto de la Propuesta</label>
                    <textarea 
                      value={aboutText}
                      onChange={(e) => setAboutText(e.target.value)}
                      rows={4}
                      placeholder="Contá qué hace única a tu propiedad, el entorno, la gastronomía, o las experiencias exclusivas..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <ImageUpload 
                    label="Imagen de Acompañamiento (Sección Nosotros)"
                    value={aboutImage}
                    onChange={setAboutImage}
                  />

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-slate-400" /> Check-in (Hora)
                      </label>
                      <input 
                        type="text" 
                        value={checkInTime}
                        onChange={(e) => setCheckInTime(e.target.value)}
                        placeholder="14:00"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-slate-400" /> Check-out (Hora)
                      </label>
                      <input 
                        type="text" 
                        value={checkOutTime}
                        onChange={(e) => setCheckOutTime(e.target.value)}
                        placeholder="10:00"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Services & Contact */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-500" />
                  Servicios y Amenities
                </h2>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Amenities de la Propiedad</label>
                  <p className="text-xs text-slate-400 mb-2 font-medium">Ingresá los servicios separados por comas de la propiedad. Ej: Wi-Fi 📶, Piscina 🏊, Desayuno 🍳</p>
                  <input 
                    type="text" 
                    value={amenities}
                    onChange={(e) => setAmenities(e.target.value)}
                    placeholder="Wi-Fi, Estacionamiento, Desayuno, Piscina, Spa"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Ubicación y Contacto */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-indigo-500" />
                  Información de Contacto y Redes
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Dirección</label>
                    <input 
                      type="text" 
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Ej: Av. Bustillo Km 12.5, Bariloche"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Teléfono Público</label>
                    <input 
                      type="tel" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+54 9 294 4123456"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Email Público</label>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="contacto@hotelflow.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Link de Google Maps o Coordenadas</label>
                    <input 
                      type="url" 
                      value={mapsUrl}
                      onChange={(e) => setMapsUrl(e.target.value)}
                      placeholder="https://maps.google.com/?q=..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Link Instagram (Opcional)</label>
                    <input 
                      type="url" 
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="https://instagram.com/mihotel"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Link Facebook (Opcional)</label>
                    <input 
                      type="url" 
                      value={facebook}
                      onChange={(e) => setFacebook(e.target.value)}
                      placeholder="https://facebook.com/mihotel"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1">Texto de Copyright / Pie de Página (Footer)</label>
                    <input 
                      type="text" 
                      value={footerText}
                      onChange={(e) => setFooterText(e.target.value)}
                      placeholder={`© ${new Date().getFullYear()} ${currentProperty.name}. Todos los derechos reservados.`}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1">Mensaje Predefinido de WhatsApp 💬</label>
                    <input 
                      type="text" 
                      value={whatsappMessage}
                      onChange={(e) => setWhatsappMessage(e.target.value)}
                      placeholder="¡Hola! Me gustaría consultar disponibilidad."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Columna Lateral de Vista Previa Dinámica */}
            <div className="lg:col-span-1">
              <div className="sticky top-6 rounded-3xl overflow-hidden border transition-all duration-350 shadow-xl"
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
                    <img src={logo} alt="Logo Preview" className="h-6 object-contain" />
                  ) : (
                    <span className="text-xs font-black uppercase tracking-wider">{currentProperty.name}</span>
                  )}
                  <div className="flex gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-white/20"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-white/40"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-white/60"></span>
                  </div>
                </div>
                
                {/* Visual Preview Banner */}
                <div className="h-44 bg-cover bg-center relative" style={{ backgroundImage: `url('${heroImage || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=600&auto=format&fit=crop'}')` }}>
                  <div className="absolute inset-0 bg-black/60"></div>
                  <div className="absolute inset-0 flex flex-col justify-center px-4 text-center text-white">
                    <h3 className={`text-sm font-black truncate ${selectedPreset.fontTitle}`}>{heroTitle || currentProperty.name}</h3>
                    <p className={`text-[10px] text-slate-300 mt-1 line-clamp-2 ${selectedPreset.fontBody}`}>{heroSubtitle || 'Un refugio único pensado para tu relax.'}</p>
                  </div>
                </div>

                <div className="p-5 space-y-4 text-xs">
                  <div>
                    <h4 className="font-black text-slate-900 mb-1 text-[11px]" style={{ color: selectedPreset.primaryColor }}>{aboutTitle || 'Propuesta'}</h4>
                    <div className="grid grid-cols-2 gap-2 mb-2 items-center">
                      <p className="line-clamp-3 leading-relaxed text-[10px] font-semibold text-slate-500">{aboutText || 'Descripción del entorno natural.'}</p>
                      <img src={aboutImage || 'https://images.unsplash.com/photo-1542314831-c6a4d14faaf2?q=80&w=200&auto=format&fit=crop'} className="h-14 w-full object-cover rounded-lg" alt="About thumbnail" />
                    </div>
                    <div className="flex justify-between text-[10px] font-black text-slate-400">
                      <span>🚪 In: {checkInTime}</span>
                      <span>🔑 Out: {checkOutTime}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-black text-slate-900 mb-1.5 text-[11px]" style={{ color: selectedPreset.primaryColor }}>Amenities:</h4>
                    <div className="flex flex-wrap gap-1">
                      {(amenities || 'Wi-Fi, Piscina, Desayuno').split(',').map((a, i) => (
                        <span key={i} className="px-2 py-1 rounded text-[10px] truncate font-bold shadow-sm"
                              style={{ 
                                backgroundColor: selectedPreset.secondaryColor + '15',
                                color: selectedPreset.accentColor,
                                borderRadius: selectedPreset.borderRadius === 'rounded-none' ? '0px' : '8px'
                              }}>
                          {a.trim()}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200/60 text-[10px] space-y-1.5 font-bold text-slate-500">
                    <div>📍 {address || 'Calle y Ubicación, Bariloche'}</div>
                    <div>📞 {phone || '+54 9 294 4123456'}</div>
                    <div>✉️ {email || 'contacto@hotel.com'}</div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      style={{ 
                        backgroundColor: selectedPreset.primaryColor,
                        color: '#ffffff',
                        borderRadius: selectedPreset.borderRadius === 'rounded-none' ? '0px' : '9999px'
                      }}
                      className="w-full py-2.5 text-center text-xs font-black shadow-md uppercase tracking-wider"
                    >
                      Reservar Directo
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}
