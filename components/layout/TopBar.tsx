'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Hexagon, Target, BookOpen, CalendarRange, Users, CircleDollarSign, BarChart3, Search, Bell, Building2, Settings, LogOut, LayoutTemplate, ListTree, Moon, Grid3X3, FileText, ChevronDown, HelpCircle, Menu, X, Sparkles } from 'lucide-react';
import { usePMS } from '../../context/PMSContext';
import { Modal } from '../ui/Modal';

export function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { properties, currentPropertyId, setCurrentPropertyId, searchQuery, setSearchQuery, logout, activities, currentUserProfile, bookings } = usePMS();
  
  const [isAppsOpen, setIsAppsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [helpTab, setHelpTab] = useState<'CRM' | 'PMS' | 'Embudos' | 'Admin'>('CRM');
  
  const appsRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (appsRef.current && !appsRef.current.contains(event.target as Node)) {
        setIsAppsOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExportAuditReport = () => {
    const csvRows = [
      ['Fecha', 'Tipo de Movimiento', 'Resultado', 'Descripcion'],
      ...(activities || []).map(act => [
        act.date ? new Date(act.date).toLocaleString() : 'N/D',
        act.type || 'Movimiento',
        act.result || 'completado',
        act.description || ''
      ])
    ];

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + csvRows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Reporte_Movimientos_Auditoria_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const primaryLinks = [
    { href: '/', icon: Target, label: 'CRM & Cotizaciones' },
    { href: '/bookings', icon: BookOpen, label: 'Reservas' },
    { href: '/roomrack', icon: CalendarRange, label: 'Roomrack' },
    { href: '/guests', icon: Users, label: 'Huéspedes' },
    { href: '/reports', icon: BarChart3, label: 'Reportes' },
  ];

  const appModules = [
    {
      category: 'Ventas & Marketing',
      items: [
        { href: '/funnels', icon: ListTree, label: 'Funnels', color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { href: '/landings', icon: LayoutTemplate, label: 'Landings', color: 'text-teal-500', bg: 'bg-teal-50' },
        { href: '/settings/inventory', icon: FileText, label: 'Plantillas', color: 'text-cyan-500', bg: 'bg-cyan-50' }, // Se asume que dentro hay tab de plantillas
      ]
    },
    {
      category: 'Revenue & Finanzas',
      items: [
        { href: '/settings/rates', icon: CircleDollarSign, label: 'Tarifas', color: 'text-indigo-500', bg: 'bg-indigo-50' },
        { href: '/billing', icon: CircleDollarSign, label: 'Facturación', color: 'text-blue-500', bg: 'bg-blue-50' },
      ]
    }
  ];

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3 shrink-0 flex items-center justify-between z-50 print-hidden relative">
      <div className="flex items-center gap-6">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          title="Menú de Módulos"
        >
          <Menu className="w-6 h-6" />
        </button>
        
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-1.5 rounded-lg">
            <Hexagon className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-bold text-xl text-slate-800 tracking-tight hidden sm:block">CoreHub OS</h1>
        </div>

        <div className="tour-property-selector flex items-center gap-2 bg-slate-50 border border-slate-200 pl-3 pr-2 py-1.5 rounded-lg shadow-sm">
          <Building2 className="w-4 h-4 text-slate-400" />
          {currentUserProfile && currentUserProfile.property_id ? (
            <span className="text-sm font-bold text-slate-900 pr-1 select-none">
              {properties.find(p => p.id === currentUserProfile.property_id)?.name || 'Mi Hotel'}
            </span>
          ) : (
            <select 
              value={currentPropertyId}
              onChange={(e) => setCurrentPropertyId(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-900 focus:outline-none cursor-pointer max-w-[120px] sm:max-w-none"
            >
              <option value="all">Todas las Propiedades</option>
              {properties.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
        </div>

      </div>
      
      <div className="flex items-center gap-3">
        <div className="tour-global-search relative hidden lg:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Buscar por ID, Nombre..." 
            value={searchQuery || ''}
            onChange={(e) => setSearchQuery?.(e.target.value)}
            className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-64"
          />
        </div>
        
        {/* App Launcher */}
        <div className="relative">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`p-2 rounded-full transition-colors flex items-center gap-1 cursor-pointer ${isMobileMenuOpen ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
            title="Módulos y Herramientas"
          >
            <Grid3X3 className="w-5 h-5" />
          </button>
        </div>

        <Link href="/night-audit" className="relative p-2 text-indigo-400 hover:text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-full transition-colors block" title="Auditoría Nocturna">
          <Moon className="w-5 h-5" />
        </Link>
        <button 
          onClick={() => setIsHelpOpen(true)}
          className="relative p-2 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors block" 
          title="Manual de Ayuda"
        >
          <HelpCircle className="w-5 h-5 text-indigo-500" />
        </button>
        <Link href="/settings" className="tour-settings-btn relative p-2 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors block" title="Configuración">
          <Settings className="w-5 h-5" />
        </Link>
        <div className="relative" ref={notificationsRef}>
          <button 
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className={`relative p-2 rounded-full transition-colors flex items-center justify-center ${isNotificationsOpen ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
            title="Actividad Reciente & Notificaciones"
          >
            <Bell className="w-5 h-5" />
            {(() => {
              const unassignedCount = (bookings || []).filter(b => !b.room_id && b.booking_status !== 'cancelled' && b.source === 'Motor de Reservas').length;
              if (unassignedCount > 0) {
                return (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-[10px] font-black text-white px-1.5 py-0.5 rounded-full border border-white animate-pulse">
                    {unassignedCount}
                  </span>
                );
              }
              if ((activities || []).length > 0) {
                return (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                );
              }
              return null;
            })()}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h3 className="font-black text-slate-800 text-sm">Notificaciones de Actividad</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Historial de movimientos</p>
                </div>
                <button 
                  onClick={handleExportAuditReport}
                  className="bg-white border border-slate-200 hover:bg-slate-50 text-indigo-600 px-2 py-1 rounded-lg text-[10px] font-black shadow-sm transition-colors"
                >
                  Exportar CSV
                </button>
              </div>
              <div className="p-2 divide-y divide-slate-100 max-h-[60vh] overflow-y-auto">
                {(() => {
                  const unassignedMotorBookings = (bookings || []).filter(b => !b.room_id && b.booking_status !== 'cancelled' && b.source === 'Motor de Reservas');
                  if (unassignedMotorBookings.length > 0) {
                    return (
                      <div className="pb-2 mb-2">
                        <div className="px-3 py-1.5 text-[9px] font-bold text-amber-600 uppercase tracking-widest bg-amber-50 rounded-lg mb-2">
                          Reservas sin Asignar del Motor ({unassignedMotorBookings.length})
                        </div>
                        <div className="space-y-1">
                          {unassignedMotorBookings.map(b => (
                            <Link
                              key={b.id}
                              href="/roomrack"
                              onClick={() => setIsNotificationsOpen(false)}
                              className="w-full p-2 text-left rounded-xl hover:bg-slate-50 border border-slate-100 bg-white shadow-sm flex items-center justify-between gap-2 transition-all hover:scale-[1.01] block"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="font-bold text-slate-850 truncate text-[11px]">{b.first_name} {b.last_name}</div>
                                <div className="text-[9px] text-slate-400">Desde: {b.check_in} al {b.check_out}</div>
                              </div>
                              <span className="text-[9px] font-black text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded uppercase tracking-wider">
                                Asignar
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {activities && activities.length > 0 ? (
                  [...activities]
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 5)
                    .map(act => (
                      <div key={act.id} className="p-3 text-xs hover:bg-slate-50 rounded-xl transition-colors">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-black text-indigo-600 uppercase text-[9px] tracking-wider bg-indigo-50 px-1.5 py-0.5 rounded">
                            {act.type || 'Sistema'}
                          </span>
                          <span className="text-[9px] text-slate-400 font-medium">
                            {act.date ? new Date(act.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                        <p className="text-slate-700 font-semibold leading-relaxed">{act.description}</p>
                      </div>
                    ))
                ) : (
                  <div className="p-6 text-center text-xs font-semibold text-slate-400">
                    No hay notificaciones recientes
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <button 
          onClick={() => {
            logout();
            router.push('/login');
          }}
          className="relative p-2 text-rose-400 hover:text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-full transition-colors block ml-2" 
          title="Cerrar Sesión"
        >
          <LogOut className="w-5 h-5" />
        </button>
        <div className="w-9 h-9 rounded-full bg-indigo-100 border-2 border-white shadow-sm flex items-center justify-center text-indigo-700 font-bold ml-2">
          CH
        </div>
      </div>

      {/* Help Modal with User Manual */}
      {isHelpOpen && (
        <Modal 
          isOpen={isHelpOpen} 
          onClose={() => setIsHelpOpen(false)} 
          title="Manual Completo de Usuario - CoreHub OS 📖"
        >
          <div className="space-y-6 text-sm text-slate-600 leading-relaxed pb-4">
            <div className="flex gap-2 border-b border-slate-200 pb-3 shrink-0 overflow-x-auto">
              {['CRM', 'PMS', 'Embudos', 'Admin'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setHelpTab(tab as any)}
                  className={`px-3 py-1.5 font-bold text-xs rounded-lg transition-colors ${
                    helpTab === tab 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab === 'CRM' ? '⚡ CRM' : tab === 'PMS' ? '🛎️ PMS' : tab === 'Embudos' ? '🚀 Embudos' : '⚙️ Admin'}
                </button>
              ))}
            </div>

            {helpTab === 'CRM' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <h4 className="font-black text-indigo-950 text-base">⚡ CRM, Cotizaciones y Comunicación</h4>
                <p className="text-xs text-slate-500">Optimiza tus ventas de alojamiento convirtiendo leads fríos en reservas confirmadas sin salir del sistema.</p>
                
                <div className="space-y-3">
                  <h5 className="font-bold text-slate-800">1. Pipeline Kanban e Interacciones</h5>
                  <p>Mueve las tarjetas vertical u horizontalmente a través de las etapas del embudo:</p>
                  <ul className="list-disc pl-5 space-y-1 text-xs">
                    <li><strong>Borrador:</strong> Cotización recién iniciada, ideal para cargar datos preliminares de estadía.</li>
                    <li><strong>Enviada:</strong> Propuesta enviada al cliente. El sistema activa un temporizador de vencimiento de 48 hs.</li>
                    <li><strong>Seguimiento:</strong> Oportunidad activa. Se destaca en color naranja si pasaron más de 3 días sin actividad.</li>
                    <li><strong>Pre-Reserva:</strong> La habitación queda reservada de forma temporal a la espera del pago de la seña.</li>
                    <li><strong>Reserva:</strong> Al soltar aquí, se abre el selector de habitaciones físicas para registrar el check-in en el Roomrack.</li>
                  </ul>
                  
                  <h5 className="font-bold text-slate-800">2. Plantillas de WhatsApp y Email Express</h5>
                  <p>Haz clic sobre la tarjeta de un lead para acceder a su ficha detallada. En la esquina superior derecha encontrarás los botones de envío rápido:</p>
                  <ul className="list-disc pl-5 space-y-1 text-xs">
                    <li><strong>WhatsApp Directo:</strong> Abre una pestaña oficial de WhatsApp Web con el texto formateado en caliente (nombre del huésped, fechas de estadía y monto exacto).</li>
                    <li><strong>Email Automático:</strong> Abre tu cliente de correo local con el asunto y el cuerpo del email completamente redactados.</li>
                  </ul>
                  
                  <h5 className="font-bold text-slate-800">3. Generación y Descarga de Documentos PDF</h5>
                  <p>Presiona el botón <strong>"Imprimir / PDF"</strong> dentro del formulario de cotización. Se abrirá una vista de impresión limpia. El sistema usará automáticamente el **ID de cotización como nombre de archivo** al guardarlo como PDF en tu dispositivo.</p>
                </div>
              </div>
            )}

            {helpTab === 'PMS' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <h4 className="font-black text-indigo-950 text-base">🛎️ PMS, Roomrack y Operación de Habitaciones</h4>
                <p className="text-xs text-slate-500">Administra el inventario físico de tu hotel, grillas de ocupación y estados de limpieza en tiempo real.</p>
                
                <div className="space-y-3">
                  <h5 className="font-bold text-slate-800">1. Gestión de Ocupación con Roomrack</h5>
                  <p>La pestaña **Roomrack** muestra el calendario visual de reservas asignadas a cada habitación:</p>
                  <ul className="list-disc pl-5 space-y-1 text-xs">
                    <li><strong>Asignación Rápida:</strong> Puedes arrastrar bloques de reserva verticalmente para reubicar al huésped en otra habitación compatible.</li>
                    <li><strong>Modificar Fechas:</strong> Estira o contrae los bordes de la barra de reserva en el calendario para alterar las noches de estadía de forma síncrona.</li>
                  </ul>

                  <h5 className="font-bold text-slate-800">2. Ficha de Huéspedes y Pre-Checkin Remoto</h5>
                  <p>Olvídate del check-in manual en recepción. Envía el link de pre-checkin al huésped por WhatsApp. Éste podrá rellenar sus datos (DNI, fecha de nacimiento y acompañantes) directamente desde su celular y la ficha se actualizará de forma transparente en tu panel de huéspedes.</p>

                  <h5 className="font-bold text-slate-800">3. Auditoría Nocturna (Night Audit)</h5>
                  <p>Al final de cada jornada operativa, presiona el botón **Luna 🌙** en la barra superior. Este proceso cierra la fecha hotelera actual, marca las reservas que no llegaron como No-Show, y genera de forma automática los reportes de ocupación y facturación diaria.</p>
                </div>
              </div>
            )}

            {helpTab === 'Embudos' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <h4 className="font-black text-indigo-950 text-base">🚀 Funnel de Captación y Motor de Reservas</h4>
                <p className="text-xs text-slate-500">Unifica campañas de marketing digital con el motor de reservas y el CRM de forma concatenada.</p>
                
                <div className="space-y-3">
                  <h5 className="font-bold text-slate-800">1. Embudo Visual de Conversión (Customer Journey)</h5>
                  <p>Muestra el pipeline digital en tiempo real: desde que un usuario entra por publicidad en redes, hasta que pasa por el Quiz, deja sus datos en el CRM y concreta la reserva. Si detonas la base de datos, el embudo irá a 0 de forma automática.</p>

                  <h5 className="font-bold text-slate-800">2. Creador Express de Campañas (Wizard de 1 Clic)</h5>
                  <p>Presiona **"Nueva Campaña Express"** para abrir el asistente unificado. Al ingresar un nombre y una oferta de descuento:</p>
                  <ul className="list-disc pl-5 space-y-1 text-xs">
                    <li>Se creará una **Landing Page** responsiva de captación (`/l/slug`).</li>
                    <li>Se configurará un **Quiz Funnel** interactivo de preguntas y respuestas (`/funnels/slug`).</li>
                    <li>Se inyectará el **cupón de descuento** de forma automática en el Motor de Reservas.</li>
                  </ul>

                  <h5 className="font-bold text-slate-800">3. Sincronización Estética en Cascada (Themes)</h5>
                  <p>El color de realce y la tipografía configurados en la sección de administración del hotel se heredarán dinámicamente tanto en la Landing Page, el Quiz, como en el Motor de reservas público.</p>
                </div>
              </div>
            )}

            {helpTab === 'Admin' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <h4 className="font-black text-indigo-950 text-base">⚙️ Sandbox de Base de Datos y Demo</h4>
                <p className="text-xs text-slate-500">Configuración global y herramientas para vaciar o poblar la base de datos local.</p>
                
                <div className="space-y-3">
                  <h5 className="font-bold text-slate-800">1. Cargar Demo Completo 🚀</h5>
                  <p>Usa este botón en **Configuración** para rellenar el sistema con datos de prueba realistas si deseas mostrar o bucear por todas las vistas. Este comando limpia residuos previos y sincroniza los datos oficiales con el backend.</p>

                  <h5 className="font-bold text-slate-800">2. Bomba Nuclear 💣 (Wipe de Base de Datos)</h5>
                  <p>Borra físicamente todas las cotizaciones, reservas, huéspedes, pagos y tareas. Limpia el embudo de conversión a 0 y borra las campañas creadas en el navegador. Ideal para dejar el software virgen y empezar a configurarlo con tu propio hotel real.</p>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
      {/* Backdrop Overlay for mobile drawer */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="lg:hidden fixed inset-0 bg-slate-900/40 z-45 animate-in fade-in duration-200"
        />
      )}

      {/* Left Collapsible Modules Sidebar */}
      <aside 
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
        className={`fixed left-0 top-0 bottom-0 bg-slate-900 border-r border-slate-800 text-slate-100 shadow-2xl flex flex-col z-50 transition-all duration-300 ease-in-out p-4
          ${isMobileMenuOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'}
          ${isSidebarHovered ? 'lg:w-64' : 'lg:w-16'}
        `}
      >
        {/* Header of Sidebar */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-850 mb-6 shrink-0 h-16 overflow-hidden">
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-indigo-600 p-2 rounded-xl shrink-0 flex items-center justify-center">
              <Hexagon className="w-5 h-5 text-white" />
            </div>
            <div className={`transition-all duration-350 whitespace-nowrap select-none ${isSidebarHovered || isMobileMenuOpen ? 'opacity-100 scale-100' : 'lg:opacity-0 lg:scale-95 pointer-events-none'}`}>
              <h2 className="font-black text-base text-white tracking-tight">CoreHub OS</h2>
              <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">Módulos</span>
            </div>
          </div>
          {/* Close button - visible only on mobile */}
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-850 hover:text-white transition-colors cursor-pointer"
            title="Cerrar Menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Scrollable Body */}
        <nav className="flex-1 space-y-2 overflow-y-auto pr-1 select-none scrollbar-none">
          {[
            { href: '/', icon: Target, label: 'CRM' },
            { href: '/roomrack', icon: CalendarRange, label: 'ROOMRACK' },
            { href: '/bookings', icon: BookOpen, label: 'RESERVAS' },
            { href: '/operations/housekeeping', icon: Sparkles, label: 'HSK' },
            { href: '/settings', icon: Settings, label: 'CONFIGURACION' }
          ].map(link => {
            const Icon = link.icon;
            const isActive = link.href === '/' 
              ? pathname === '/' 
              : pathname.startsWith(link.href);
            return (
              <Link 
                key={link.href}
                href={link.href} 
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-4 px-3 py-3 text-sm font-bold rounded-xl transition-all duration-200 group relative ${
                  isActive 
                    ? 'text-white bg-indigo-600 shadow-lg shadow-indigo-600/30' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-850'
                }`}
              >
                <div className="shrink-0 w-6 h-6 flex items-center justify-center">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-indigo-400 group-hover:text-indigo-350 transition-colors'}`} />
                </div>
                <span className={`transition-opacity duration-200 whitespace-nowrap ${isSidebarHovered || isMobileMenuOpen ? 'opacity-100' : 'lg:opacity-0 pointer-events-none'}`}>
                  {link.label}
                </span>
                
                {/* Tooltip on Hover when collapsed */}
                {!isSidebarHovered && !isMobileMenuOpen && (
                  <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-slate-950 border border-slate-800 text-white text-xs font-bold rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap z-55">
                    {link.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer of Sidebar */}
        <div className="pt-4 border-t border-slate-850 text-center shrink-0 overflow-hidden h-12 flex items-center justify-center">
          <span className={`text-[10px] font-bold text-slate-500 uppercase tracking-widest block transition-opacity duration-200 ${isSidebarHovered || isMobileMenuOpen ? 'opacity-100' : 'lg:opacity-0 pointer-events-none'}`}>
            CoreHub OS
          </span>
        </div>
      </aside>
    </header>
  );
}
