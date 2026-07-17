'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { usePMS } from '../context/PMSContext';
import { TopBar } from '../components/layout/TopBar';
import { Modal } from '../components/ui/Modal';
import { BookingForm } from '../components/bookings/BookingForm';
import { QuoteForm } from '../components/quotes/QuoteForm';
import { 
  Home as HomeIcon, 
  DoorOpen, 
  LogOut as LogOutIcon, 
  Zap, 
  Plus, 
  CheckCircle2, 
  FileText, 
  MessageCircle,
  Copy,
  Check,
  UserCheck,
  UserMinus,
  Clock,
  Cloud,
  Sun,
  CloudRain,
  CloudSnow,
  ChevronDown,
  ChevronUp,
  RefreshCw
} from 'lucide-react';
import { format, parseISO, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

function UpgradeDowngradeBadge({ booking, units, unitTypes }: { booking: any; units: any[]; unitTypes: any[] }) {
  if (!booking.room_id) return null;
  
  const room = units.find(u => u.id === booking.room_id);
  if (!room) return null;

  const reservedCategory = unitTypes.find(ut => ut.id === booking.unit_type_id);
  const assignedCategory = unitTypes.find(ut => ut.id === room.unit_type_id);

  if (!reservedCategory || !assignedCategory) return null;

  if (assignedCategory.base_price < reservedCategory.base_price) {
    return (
      <span className="inline-flex items-center gap-0.5 bg-rose-50 text-rose-700 border border-rose-200 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ml-1.5 shrink-0" title="Downgrade: Habitación de menor categoría asignada">
        ⚠️ Down
      </span>
    );
  }

  if (assignedCategory.base_price > reservedCategory.base_price) {
    const isUpsell = booking.upgrade_type === 'upsell';
    return (
      <span className={`inline-flex items-center gap-0.5 border text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ml-1.5 shrink-0 ${
        isUpsell 
          ? 'bg-amber-50 text-amber-700 border-amber-200' 
          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
      }`} title={isUpsell ? "Upgrade con cobro adicional (Upsell)" : "Upgrade de cortesía"}>
        {isUpsell ? '💎 Upsell' : '✨ Up'}
      </span>
    );
  }

  return null;
}

export default function HouseStatusDashboard() {
  const { bookings, units, payments, addQuote, quotes, unitTypes, properties, currentPropertyId } = usePMS();
  
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedBookingForEdit, setSelectedBookingForEdit] = useState<any | null>(null);
  


  // Time & Weather States
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [showForecast, setShowForecast] = useState(false);

  // Timezones configuration
  const [timezones, setTimezones] = useState([
    { name: 'Buenos Aires', tz: 'America/Argentina/Buenos_Aires', flag: '🇦🇷' },
    { name: 'Santiago', tz: 'America/Santiago', flag: '🇨🇱' },
    { name: 'São Paulo', tz: 'America/Sao_Paulo', flag: '🇧🇷' }
  ]);
  const [activeTzIdx, setActiveTzIdx] = useState<number | null>(null);
  const [isTzSelectorOpen, setIsTzSelectorOpen] = useState(false);

  const TZ_OPTIONS = [
    { name: 'Buenos Aires', tz: 'America/Argentina/Buenos_Aires', flag: '🇦🇷' },
    { name: 'Santiago', tz: 'America/Santiago', flag: '🇨🇱' },
    { name: 'São Paulo', tz: 'America/Sao_Paulo', flag: '🇧🇷' },
    { name: 'New York', tz: 'America/New_York', flag: '🇺🇸' },
    { name: 'Madrid', tz: 'Europe/Madrid', flag: '🇪🇸' },
    { name: 'México DF', tz: 'America/Mexico_City', flag: '🇲🇽' },
    { name: 'Bogotá', tz: 'America/Bogota', flag: '🇨🇴' },
    { name: 'Montevideo', tz: 'America/Montevideo', flag: '🇺🇾' },
    { name: 'Lima', tz: 'America/Lima', flag: '🇵🇪' }
  ];

  // Exchange rates configuration
  const [rates, setRates] = useState<Record<string, number>>({
    ARS: 915.00,
    CLP: 935.00,
    BRL: 5.45,
    USD: 1
  });
  const [ratesLoading, setRatesLoading] = useState(true);

  useEffect(() => {
    async function fetchRates() {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await res.json();
        if (data && data.rates) {
          setRates({
            ARS: data.rates.ARS || 915,
            CLP: data.rates.CLP || 935,
            BRL: data.rates.BRL || 5.45,
            USD: 1
          });
        }
        setRatesLoading(false);
      } catch (e) {
        console.error('Error fetching exchange rates:', e);
        setRatesLoading(false);
      }
    }
    fetchRates();
  }, []);

  const getTzTime = (tz: string) => {
    try {
      return new Intl.DateTimeFormat('es-AR', {
        timeZone: tz,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).format(currentTime || new Date());
    } catch (e) {
      return '--:--:--';
    }
  };

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Helper helper functions
  function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  // Basic House Status calculations
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  
  const stats = useMemo(() => {
    let checkInsToday = 0;
    let checkOutsToday = 0;
    let occupiedCount = 0;
    let stayOvers = 0;

    bookings.forEach(b => {
      if (b.booking_status === 'cancelled') return;
      
      const checkIn = b.check_in;
      const checkOut = b.check_out;

      if (checkIn === todayStr) {
        checkInsToday++;
      }
      if (checkOut === todayStr) {
        checkOutsToday++;
      }
      
      // Occupied today: check_in <= today < check_out
      if (checkIn <= todayStr && todayStr < checkOut) {
        occupiedCount++;
        if (checkIn !== todayStr) {
          stayOvers++;
        }
      }
    });

    const totalRooms = units.length || 1;
    const occupancyRate = Math.round((occupiedCount / totalRooms) * 100);

    return {
      checkInsToday,
      checkOutsToday,
      occupiedCount,
      stayOvers,
      occupancyRate,
      totalRooms
    };
  }, [bookings, units, todayStr]);

  // Check-ins of today (Ingresos)
  const incomingBookings = useMemo(() => {
    return bookings.filter(b => b.check_in === todayStr && b.booking_status !== 'cancelled');
  }, [bookings, todayStr]);

  // Check-outs of today (Egresos)
  const outgoingBookings = useMemo(() => {
    return bookings.filter(b => b.check_out === todayStr && b.booking_status !== 'cancelled');
  }, [bookings, todayStr]);

  // Overbooking checker logic
  const overbookingIssues = useMemo(() => {
    const issues: string[] = [];
    const roomBookings: Record<string, typeof bookings> = {};
    
    bookings.forEach(b => {
      if (b.booking_status === 'cancelled') return;
      if (!b.room_id) return;
      if (!roomBookings[b.room_id]) {
        roomBookings[b.room_id] = [];
      }
      roomBookings[b.room_id].push(b);
    });

    Object.entries(roomBookings).forEach(([roomId, list]) => {
      const room = units.find(u => u.id === roomId);
      const roomName = room ? room.name : `Habitación ${roomId}`;
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          const b1 = list[i];
          const b2 = list[j];
          const checkIn1 = startOfDay(parseISO(b1.check_in));
          const checkOut1 = startOfDay(parseISO(b1.check_out));
          const checkIn2 = startOfDay(parseISO(b2.check_in));
          const checkOut2 = startOfDay(parseISO(b2.check_out));

          if (checkIn1 < checkOut2 && checkOut1 > checkIn2) {
            issues.push(`Habitación ${roomName} reservada simultáneamente para ${b1.first_name} y ${b2.first_name}`);
          }
        }
      }
    });

    return issues;
  }, [bookings, units]);

  const funnyOversellPhrase = useMemo(() => {
    if (overbookingIssues.length === 0) return '';
    const phrases = [
      "🚨 ¡Alerta de sobreventa! Hay más gente reservada que camas libres. ¿Quién duerme en la reposera de la pileta?",
      "🚨 ¡Cuidado! Estamos vendiendo humo. Tenemos sobreventa. ¿Le cobramos extra por dormir en el pasillo?",
      "🚨 ¡Sobreventa detectada! Alguien va a tener que hacer cucharita con el conserje.",
      "🚨 ¡Houston, tenemos sobreventa! Más reservas que llaves. Que empiecen los juegos del hambre hotelera.",
      "🚨 ¡Ups! Ocupación mayor al 100%. A menos que hayamos inventado habitaciones invisibles, estamos al horno."
    ];
    const randomIndex = Math.floor(Math.random() * phrases.length);
    return phrases[randomIndex];
  }, [overbookingIssues]);



  // Dynamic Weather Data (Fetches real data from Open-Meteo)
  const activeProperty = useMemo(() => {
    return properties.find(p => p.id === currentPropertyId) || properties[0];
  }, [properties, currentPropertyId]);

  const propertyLocation = useMemo(() => {
    return activeProperty?.location || activeProperty?.address || 'Bariloche, AR';
  }, [activeProperty]);

  const [weatherRefreshCount, setWeatherRefreshCount] = useState(0);

  const [weatherToday, setWeatherToday] = useState({
    temp: 22,
    condition: 'Despejado',
    location: 'Bariloche, AR',
    wind: '12 km/h',
    humidity: '45%'
  });

  const [weatherForecast, setWeatherForecast] = useState<any[]>([
    { day: 'Mañana', temp: '24°C / 12°C', icon: <Sun className="w-4 h-4 text-amber-500" />, desc: 'Soleado' },
    { day: 'Domingo', temp: '20°C / 10°C', icon: <Cloud className="w-4 h-4 text-slate-400" />, desc: 'Parcialmente nublado' },
    { day: 'Lunes', temp: '16°C / 7°C', icon: <CloudRain className="w-4 h-4 text-indigo-400" />, desc: 'Llovizna' }
  ]);

  useEffect(() => {
    const getWeatherCodeMeta = (code: number) => {
      if (code === 0) return { desc: 'Despejado', icon: <Sun className="w-4 h-4 text-amber-500" /> };
      if (code >= 1 && code <= 3) return { desc: 'Nublado', icon: <Cloud className="w-4 h-4 text-slate-400" /> };
      if (code >= 45 && code <= 48) return { desc: 'Niebla', icon: <Cloud className="w-4 h-4 text-slate-500" /> };
      if (code >= 51 && code <= 67) return { desc: 'Llovizna', icon: <CloudRain className="w-4 h-4 text-indigo-400" /> };
      if (code >= 71 && code <= 77) return { desc: 'Nieve', icon: <Cloud className="w-4 h-4 text-blue-200" /> };
      if (code >= 80 && code <= 82) return { desc: 'Lluvia', icon: <CloudRain className="w-4 h-4 text-indigo-500" /> };
      return { desc: 'Tormenta', icon: <CloudRain className="w-4 h-4 text-indigo-600" /> };
    };

    async function fetchWeather() {
      try {
        const parts = propertyLocation.split(',').map(p => p.trim());
        const cityCandidates = parts.filter(p => {
          const isCountryCode = p.length <= 3 && /^[A-Z]+$/i.test(p);
          const isPostalCode = /^\d+$/.test(p) || p.length <= 4;
          const isStreet = p.toLowerCase().includes('av.') || p.toLowerCase().includes('calle') || p.toLowerCase().includes('km') || /\d/.test(p);
          return !isCountryCode && !isPostalCode && !isStreet;
        });
        const query = cityCandidates.length > 0 ? cityCandidates[0] : (parts[1] || parts[0]);

        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=es`);
        const geoData = await geoRes.json();
        
        let results = geoData.results;
        if (!results || results.length === 0) {
          const fallbackGeoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=Bariloche&count=1&language=es`);
          const fallbackGeoData = await fallbackGeoRes.json();
          results = fallbackGeoData.results;
        }

        if (!results || results.length === 0) return;
        const firstGeo = results[0];
        const latitude = firstGeo.latitude;
        const longitude = firstGeo.longitude;
        const name = firstGeo.name;
        const country_code = firstGeo.country_code;

        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`);
        const weatherData = await weatherRes.json();

        if (weatherData.current_weather) {
          const current = weatherData.current_weather;
          const meta = getWeatherCodeMeta(current.weathercode);
          const cCode = country_code ? String(country_code).toUpperCase() : '';
          setWeatherToday({
            temp: Math.round(current.temperature),
            condition: meta.desc,
            location: cCode ? `${name}, ${cCode}` : name,
            wind: `${Math.round(current.windspeed)} km/h`,
            humidity: '45%'
          });
        }

        if (weatherData.daily && weatherData.daily.time) {
          const days = ['Mañana', 'Pasado Mañana', 'Siguiente'];
          const newForecast = [];
          for (let i = 1; i <= 3; i++) {
            const tempMax = Math.round(weatherData.daily.temperature_2m_max[i]);
            const tempMin = Math.round(weatherData.daily.temperature_2m_min[i]);
            const wCode = weatherData.daily.weathercode[i];
            const meta = getWeatherCodeMeta(wCode);
            newForecast.push({
              day: days[i - 1],
              temp: `${tempMax}°C / ${tempMin}°C`,
              icon: meta.icon,
              desc: meta.desc
            });
          }
          setWeatherForecast(newForecast);
        }
      } catch (err) {
        console.error('Error fetching weather data:', err);
      }
    }
    fetchWeather();

    const interval = setInterval(fetchWeather, 10 * 60 * 1000); // 10 minutes refresh
    return () => clearInterval(interval);
  }, [propertyLocation, weatherRefreshCount]);

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden text-slate-700 font-sans">
      <TopBar />

      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* Top Header Card with elegant Clock, Date, Weather & Exchange Rates */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden border border-indigo-900/50">
          <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1542314831-c6a4d14faaf2?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay"></div>
          
          {/* Dashboard Title & Cool Clocks (Configurable Timezones) */}
          <div className="relative z-10 space-y-4 md:col-span-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🏨</span>
                <h2 className="text-2xl font-black tracking-tight text-white/95">Panel de Ocupación</h2>
              </div>
              <p className="text-indigo-200/80 text-xs mt-0.5 font-medium">Gestión integral y estado en tiempo real</p>
            </div>
            
            <div className="flex flex-col gap-3">
              {currentTime && (
                <div className="flex items-center gap-4 text-white">
                  {/* Day in BIG */}
                  <div className="flex items-center gap-2">
                    <span className="text-5xl font-black tracking-tighter text-white drop-shadow-sm leading-none">
                      {format(currentTime, 'dd')}
                    </span>
                    <div className="flex flex-col justify-center leading-none">
                      <span className="text-[10px] uppercase font-black text-indigo-300 tracking-wider">
                        {format(currentTime, 'EEEE', { locale: es })}
                      </span>
                      <span className="text-xs font-bold text-white/90 mt-0.5">
                        {format(currentTime, 'MMMM yyyy', { locale: es })}
                      </span>
                    </div>
                  </div>
                  
                  {/* Divider */}
                  <div className="h-8 w-px bg-white/20"></div>

                  {/* Time matching size */}
                  <div className="flex flex-col justify-center leading-none">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-indigo-300">Hora Local</span>
                    <span className="text-base font-bold tracking-tight text-white/90 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                      {format(currentTime, 'HH:mm:ss')}
                    </span>
                  </div>
                </div>
              )}

              {/* Configurable Clocks List */}
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-2 w-fit backdrop-blur-sm">
                <span className="text-[8px] font-bold text-indigo-350 uppercase tracking-wider px-1">HUSOS:</span>
                {timezones.map((tz, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setActiveTzIdx(idx);
                      setIsTzSelectorOpen(true);
                    }}
                    className="flex items-center gap-1.5 hover:bg-white/10 px-2 py-0.5 rounded transition-colors text-left"
                    title={`Click para cambiar huso de ${tz.name}`}
                  >
                    <span className="text-xs">{tz.flag}</span>
                    <div className="flex flex-col leading-none">
                      <span className="font-extrabold text-[9px] text-white/90">{tz.name}</span>
                      <span className="text-[10px] text-indigo-200 font-mono font-bold mt-0.5">{getTzTime(tz.tz)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Weather Widget */}
          <div className="relative z-10 bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 rounded-2xl p-4 flex flex-col justify-between space-y-2 backdrop-blur-md transition-all group">
            <div className="flex justify-between items-start">
              <a 
                href={`https://www.google.com/search?q=clima+${encodeURIComponent(weatherToday.location)}`}
                target="_blank" 
                rel="noopener noreferrer" 
                title="Hacé click para ver el pronóstico completo real en Google Clima"
                className="flex-1 mr-2"
              >
                <div>
                  <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider hover:text-indigo-200 transition-colors">Clima Real ↗</span>
                  <h4 className="text-xs font-black text-white hover:underline leading-tight">{weatherToday.location}</h4>
                </div>
              </a>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setWeatherRefreshCount(prev => prev + 1);
                  }}
                  className="p-1 hover:bg-white/10 rounded-lg text-indigo-300 hover:text-white transition-colors"
                  title="Actualizar clima en tiempo real"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-center gap-1 bg-indigo-500/20 px-2 py-0.5 rounded-lg border border-indigo-400/20">
                  <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
                  <span className="text-sm font-black text-white">{weatherToday.temp}°C</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center text-[10px] text-indigo-100/90 pt-0.5">
              <span>{weatherToday.condition}</span>
              <span>💨 {weatherToday.wind}</span>
            </div>

            <div className="pt-1.5 border-t border-white/10">
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowForecast(!showForecast);
                }} 
                className="w-full text-left text-[9px] font-bold text-indigo-350 hover:text-white transition-colors flex items-center justify-between"
              >
                <span>VER PRONÓSTICO 3 DÍAS</span>
                {showForecast ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {showForecast && (
                <div className="mt-2 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                  {weatherForecast.map((f, i) => (
                    <div key={i} className="flex items-center justify-between text-[10px] bg-white/5 p-1 rounded border border-white/5">
                      <span className="font-semibold text-indigo-100">{f.day}</span>
                      <div className="flex items-center gap-1 scale-90 origin-left">
                        {f.icon}
                        <span className="text-white/80">{f.desc}</span>
                      </div>
                      <span className="font-bold text-indigo-200">{f.temp}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Live Currency Exchange Widget */}
          <div className="relative z-10 bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between space-y-2 backdrop-blur-md">
            <div>
              <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">Cambio Real (USD)</span>
              <h4 className="text-xs font-black text-white leading-tight">Cotizaciones en Vivo</h4>
            </div>

            {ratesLoading ? (
              <div className="text-[11px] text-indigo-300 animate-pulse py-2">Cargando tasas...</div>
            ) : (
              <div className="grid grid-cols-3 gap-1.5 pt-1 text-center shrink-0">
                <div className="bg-white/5 border border-white/5 rounded-lg p-1">
                  <div className="text-[8px] font-bold text-indigo-300">🇦🇷 ARS</div>
                  <div className="text-xs font-black text-white mt-0.5">${Math.round(rates.ARS)}</div>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-lg p-1">
                  <div className="text-[8px] font-bold text-indigo-300">🇨🇱 CLP</div>
                  <div className="text-xs font-black text-white mt-0.5">${Math.round(rates.CLP)}</div>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-lg p-1">
                  <div className="text-[8px] font-bold text-indigo-300">🇧🇷 BRL</div>
                  <div className="text-xs font-black text-white mt-0.5">R${rates.BRL.toFixed(2)}</div>
                </div>
              </div>
            )}

            <div className="text-[8px] text-indigo-300/80 leading-none pt-1">
              Tasas de mercado oficial relativas a 1 USD en tiempo real.
            </div>
          </div>
        </div>

        {/* Action Panel Buttons */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
          <div>
            <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Operaciones Rápidas</span>
          </div>
          <div className="flex flex-wrap gap-2">

            <button 
              onClick={() => {
                setIsQuoteModalOpen(true);
              }}
              className="bg-white border border-slate-200 hover:bg-slate-50 font-bold text-xs px-3.5 py-2.5 rounded-xl text-slate-700 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-600" /> Crear Cotización
            </button>
            <button 
              onClick={() => {
                setSelectedBookingForEdit(null);
                setIsBookingModalOpen(true);
              }}
              className="bg-indigo-600 text-white hover:bg-indigo-705 font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Crear Reserva
            </button>
          </div>
        </div>

        {/* Overbooking warning alerts */}
        {overbookingIssues.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 shadow-sm animate-in slide-in-from-top-4 duration-200">
            <span className="text-xl">🚨</span>
            <div className="text-xs">
              <span className="font-bold text-red-900 block">{funnyOversellPhrase}</span>
              <details className="mt-1.5 text-[11px] text-red-700/80 cursor-pointer">
                <summary className="font-semibold outline-none hover:text-red-800">Ver detalles de la sobreventa ({overbookingIssues.length})</summary>
                <ul className="list-disc pl-4 mt-1 space-y-0.5">
                  {overbookingIssues.map((issue, idx) => (
                    <li key={idx}>{issue}</li>
                  ))}
                </ul>
              </details>
            </div>
          </div>
        )}

        {/* Operational Status (House Status Indicators) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Occupied Percentage */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Habitaciones Ocupadas</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-800">{stats.occupancyRate}%</span>
                <span className="text-xs text-slate-450 font-semibold">({stats.occupiedCount}/{stats.totalRooms})</span>
              </div>
              <div className="w-28 bg-slate-100 rounded-full h-1.5 mt-2">
                <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${stats.occupancyRate}%` }}></div>
              </div>
            </div>
            <div className="bg-indigo-50 p-3 rounded-xl">
              <HomeIcon className="w-6 h-6 text-indigo-600" />
            </div>
          </div>

          {/* Available Rooms count */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Habitaciones Disponibles</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-600">{stats.totalRooms - stats.occupiedCount}</span>
                <span className="text-xs text-slate-400 font-medium">de {stats.totalRooms} totales</span>
              </div>
              <span className="text-[10px] text-emerald-500 font-bold block mt-1.5">⚡ Libres para venta</span>
            </div>
            <div className="bg-emerald-50 p-3 rounded-xl">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
          </div>

          {/* Incoming bookings (Check-ins) */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Ingresos (Check-in)</span>
              <span className="text-3xl font-black text-slate-850">{stats.checkInsToday}</span>
              <span className="text-xs text-indigo-600 block font-bold flex items-center gap-1 mt-1.5">
                <UserCheck className="w-3.5 h-3.5" /> Entradas hoy
              </span>
            </div>
            <div className="bg-indigo-50 p-3 rounded-xl">
              <DoorOpen className="w-6 h-6 text-indigo-600" />
            </div>
          </div>

          {/* Outgoing bookings (Check-outs) */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Egresos (Check-out)</span>
              <span className="text-3xl font-black text-slate-850">{stats.checkOutsToday}</span>
              <span className="text-xs text-amber-600 block font-bold flex items-center gap-1 mt-1.5">
                <UserMinus className="w-3.5 h-3.5" /> Salidas hoy
              </span>
            </div>
            <div className="bg-amber-50 p-3 rounded-xl">
              <LogOutIcon className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </section>

        {/* Operational Check-in and Check-out Lists (Ingresos y Egresos) */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Ingresos (Check-ins de hoy) */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col space-y-4">
            <div className="flex justify-between items-center shrink-0">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                <span className="text-indigo-600">📥</span> Ingresos (Check-ins)
              </h3>
              <span className="text-[10px] font-bold text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded-full">{incomingBookings.length} programados</span>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[350px] pr-1">
              {incomingBookings.length > 0 ? (
                incomingBookings.map(b => {
                  const room = units.find(u => u.id === b.room_id);
                  return (
                    <div 
                      key={b.id} 
                      onClick={() => {
                        setSelectedBookingForEdit(b);
                        setIsBookingModalOpen(true);
                      }}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-205 hover:border-indigo-400 cursor-pointer transition-all flex items-center justify-between text-xs hover:shadow-sm"
                    >
                      <div>
                        <span className="font-bold text-slate-850 flex items-center flex-wrap gap-1">
                          {b.first_name} {b.last_name}
                          <UpgradeDowngradeBadge booking={b} units={units} unitTypes={unitTypes} />
                        </span>
                        <span className="text-[10px] text-slate-450 font-medium block mt-0.5">
                          Hab: {room ? room.name : 'Flotante'} • {b.pax} Pax
                        </span>
                      </div>
                      <span className="text-[9px] font-black uppercase bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
                        {b.booking_status === 'confirmed' ? 'Confirmado' : b.booking_status}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="h-32 flex flex-col items-center justify-center text-center text-slate-400 italic text-xs">
                  <span>Sin ingresos para hoy</span>
                </div>
              )}
            </div>
          </div>

          {/* Egresos (Check-outs de hoy) */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col space-y-4">
            <div className="flex justify-between items-center shrink-0">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                <span className="text-amber-500">📤</span> Egresos (Check-outs)
              </h3>
              <span className="text-[10px] font-bold text-amber-655 bg-amber-50 px-2 py-0.5 rounded-full">{outgoingBookings.length} programados</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[350px] pr-1">
              {outgoingBookings.length > 0 ? (
                outgoingBookings.map(b => {
                  const room = units.find(u => u.id === b.room_id);
                  return (
                    <div 
                      key={b.id} 
                      onClick={() => {
                        setSelectedBookingForEdit(b);
                        setIsBookingModalOpen(true);
                      }}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-205 hover:border-amber-400 cursor-pointer transition-all flex items-center justify-between text-xs hover:shadow-sm"
                    >
                      <div>
                        <span className="font-bold text-slate-850 flex items-center flex-wrap gap-1">
                          {b.first_name} {b.last_name}
                          <UpgradeDowngradeBadge booking={b} units={units} unitTypes={unitTypes} />
                        </span>
                        <span className="text-[10px] text-slate-450 font-medium block mt-0.5">
                          Hab: {room ? room.name : 'Flotante'} • {b.total_nights} Noches
                        </span>
                      </div>
                      <span className="text-[9px] font-black uppercase bg-amber-100 text-amber-800 px-2 py-1 rounded">
                        {b.booking_status === 'checked_in' ? 'En Casa' : b.booking_status}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="h-32 flex flex-col items-center justify-center text-center text-slate-400 italic text-xs">
                  <span>Sin egresos para hoy</span>
                </div>
              )}
            </div>
          </div>

          {/* Operaciones del Hotel & Links */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                <span>📋</span> Resumen de Campaña
              </h3>

              <div className="space-y-2.5">
                <div className="flex items-center gap-3 p-3 bg-indigo-50/40 border border-indigo-100 rounded-xl">
                  <span className="text-lg">📢</span>
                  <div className="text-xs">
                    <span className="font-bold text-indigo-900 block">Cotizaciones Pendientes</span>
                    <span className="text-slate-500 font-medium">Hay {quotes.filter(q => q.status === 'draft' || q.status === 'sent').length} cotizaciones activas hoy.</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-emerald-50/40 border border-emerald-100 rounded-xl">
                  <span className="text-lg">🛡️</span>
                  <div className="text-xs">
                    <span className="font-bold text-emerald-900 block">Pre Check-in Express</span>
                    <span className="text-slate-500 font-medium">{bookings.filter(b => b.pre_checkin_completed).length} huéspedes ya completaron su ficha.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation links */}
            <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-center">
              <Link href="/roomrack" className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors">
                🗓️ Room Rack
              </Link>
              <Link href="/crm" className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors">
                🎯 Pipeline CRM
              </Link>
            </div>
          </div>

        </section>
      </main>



      {/* Booking Form Modal */}
      {isBookingModalOpen && (
        <Modal 
          isOpen={isBookingModalOpen} 
          onClose={() => {
            setIsBookingModalOpen(false);
            setSelectedBookingForEdit(null);
          }} 
          title={selectedBookingForEdit ? "Editar Reserva" : "Nueva Reserva"}
        >
          <BookingForm 
            initialBooking={selectedBookingForEdit}
            onSuccess={() => {
              setIsBookingModalOpen(false);
              setSelectedBookingForEdit(null);
            }} 
            onCancel={() => {
              setIsBookingModalOpen(false);
              setSelectedBookingForEdit(null);
            }} 
          />
        </Modal>
      )}

      {/* Quote Form Modal */}
      {isQuoteModalOpen && (
        <Modal isOpen={isQuoteModalOpen} onClose={() => setIsQuoteModalOpen(false)} title="Nueva Cotización">
          <QuoteForm onSuccess={() => setIsQuoteModalOpen(false)} onCancel={() => setIsQuoteModalOpen(false)} />
        </Modal>
      )}
      {/* Timezone Selector Modal */}
      {isTzSelectorOpen && activeTzIdx !== null && (
        <Modal 
          isOpen={isTzSelectorOpen} 
          onClose={() => {
            setIsTzSelectorOpen(false);
            setActiveTzIdx(null);
          }} 
          title={`Configurar Huso Horario #${activeTzIdx + 1}`}
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-500">Selecciona una ciudad o región para configurar en este bloque de reloj del panel principal:</p>
            <div className="grid grid-cols-2 gap-2">
              {TZ_OPTIONS.map((opt) => (
                <button
                  key={opt.tz}
                  type="button"
                  onClick={() => {
                    setTimezones(prev => {
                      const copy = [...prev];
                      copy[activeTzIdx] = opt;
                      return copy;
                    });
                    setIsTzSelectorOpen(false);
                    setActiveTzIdx(null);
                  }}
                  className="flex items-center gap-2 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl p-3 text-left transition-all"
                >
                  <span className="text-xl">{opt.flag}</span>
                  <div className="flex flex-col leading-tight">
                    <span className="font-bold text-xs text-slate-800">{opt.name}</span>
                    <span className="text-[9px] text-slate-500 font-mono">{opt.tz}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
