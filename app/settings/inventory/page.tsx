'use client';

import { useState } from 'react';
import { UnitType, Unit } from '../../../types/inventory';
import { Hexagon, Settings, Plus, Edit2, AlertTriangle, CheckCircle, XCircle, CalendarRange, LayoutDashboard, MessageSquare, Trash2, BookOpen, BarChart3, CircleDollarSign, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { usePMS } from '../../../context/PMSContext';
import { TopBar } from '@/components/layout/TopBar';
import { Modal } from '@/components/ui/Modal';
import { ImageUpload } from '@/components/ui/ImageUpload';

export default function InventorySettings() {
  const { 
    properties, currentPropertyId, addProperty, updateProperty, deleteProperty,
    units, unitTypes, templates, addTemplate, updateTemplate, deleteTemplate,
    addUnit, updateUnit, deleteUnit,
    addUnitType, updateUnitType, deleteUnitType,
    bookingColors, updateBookingColor, deleteBookingColor, bookings,
    bookingSources, addSource, deleteSource
  } = usePMS();
  
  const [activeTab, setActiveTab] = useState<'properties' | 'types' | 'units' | 'colors' | 'templates' | 'sources'>('properties');
  const [newSource, setNewSource] = useState('');
  const [newEmoji, setNewEmoji] = useState('📌');

  const sourceEmojis: Record<string, string> = {
    'WhatsApp': '💬', 'Email': '📧', 'Teléfono': '📞', 'Instagram': '📸',
    'Booking.com': '🏨', 'Web': '🌐', 'Walk-in': '🚶', 'Airbnb': '🏠',
    'Facebook': '📘', 'Referido': '🤝', 'Agencia': '🏢', 'Directo': '✈️'
  };

  const getEmoji = (s: string) => sourceEmojis[s] || '📌';

  // Property State
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const [propertyForm, setPropertyForm] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    website: ''
  });

  const handleOpenPropertyModal = (property?: any) => {
    if (property) {
      setEditingPropertyId(property.id);
      setPropertyForm({
        name: property.name,
        address: property.address || '',
        phone: property.phone || '',
        email: property.email || '',
        website: property.website || ''
      });
    } else {
      setEditingPropertyId(null);
      setPropertyForm({ name: '', address: '', phone: '', email: '', website: '' });
    }
    setIsPropertyModalOpen(true);
  };

  const handlePropertySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyForm.name) return;
    
    if (editingPropertyId) {
      updateProperty({
        id: editingPropertyId,
        ...propertyForm
      } as any);
    } else {
      await addProperty(propertyForm);
    }
    setIsPropertyModalOpen(false);
  };

  // Unit Type State
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [typeForm, setTypeForm] = useState<Partial<UnitType>>({
    name: '',
    description: '',
    base_price: 0,
    max_pax: 2
  });

  // Unit State
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [isBulkCreate, setIsBulkCreate] = useState(false);
  const [unitForm, setUnitForm] = useState<Partial<Unit>>({
    name: '',
    unit_type_id: unitTypes[0]?.id || '',
    status: 'active',
    notes: ''
  });
  const [bulkUnitForm, setBulkUnitForm] = useState({
    prefix: '',
    startNumber: 1,
    quantity: 5,
    unit_type_id: unitTypes[0]?.id || '',
    status: 'active' as const
  });

  // Color State
  const [newColorKey, setNewColorKey] = useState('');
  const [newColorLabel, setNewColorLabel] = useState('');
  const [newColorClass, setNewColorClass] = useState('bg-emerald-500 text-white border-emerald-600');

  const handleAddColor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColorKey || !newColorLabel) return;
    const cleanKey = newColorKey.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    updateBookingColor(cleanKey, { label: newColorLabel, colorClass: newColorClass });
    setNewColorKey('');
    setNewColorLabel('');
  };

  const handleDeleteColor = (statusKey: string) => {
    const isUsed = bookings.some(b => b.booking_status === statusKey);
    if (isUsed) {
      alert(`No se puede eliminar el estado "${statusKey}" porque hay reservas activas que lo están usando. Cambiales el estado antes de eliminarlo.`);
      return;
    }
    if (confirm(`¿Estás seguro de eliminar el estado "${statusKey}"?`)) {
      deleteBookingColor(statusKey);
    }
  };

  // Template State
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [templateForm, setTemplateForm] = useState<any>({
    name: '',
    type: 'whatsapp',
    subject: '',
    content: ''
  });

  const handleOpenTemplateModal = (template?: any) => {
    if (template) {
      setEditingTemplateId(template.id);
      setTemplateForm({
        name: template.name,
        type: template.type,
        subject: template.subject || '',
        content: template.content || ''
      });
    } else {
      setEditingTemplateId(null);
      setTemplateForm({ name: '', type: 'whatsapp', subject: '', content: '' });
    }
    setIsTemplateModalOpen(true);
  };

  const handleTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateForm.name || !templateForm.content) return;
    
    if (editingTemplateId) {
      updateTemplate({
        id: editingTemplateId,
        ...templateForm
      } as any);
    } else {
      addTemplate({
        id: `tpl_${Date.now()}`,
        ...templateForm
      } as any);
    }
    setIsTemplateModalOpen(false);
  };

  // Type Handlers
  const handleOpenTypeModal = (type?: UnitType) => {
    if (type) {
      setEditingTypeId(type.id);
      setTypeForm(type);
    } else {
      setEditingTypeId(null);
      setTypeForm({
        name: '',
        description: '',
        base_price: 0,
        max_pax: 2
      });
    }
    setIsTypeModalOpen(true);
  };

  const handleTypeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeForm.name) return;

    if (editingTypeId) {
      await updateUnitType({
        id: editingTypeId,
        property_id: currentPropertyId === 'all' ? properties[0]?.id : currentPropertyId,
        name: typeForm.name,
        description: typeForm.description || '',
        base_price: Number(typeForm.base_price) || 0,
        max_pax: Number(typeForm.max_pax),
        amenities: typeForm.amenities || [],
        images: typeForm.images || []
      });
    } else {
      await addUnitType({
        property_id: currentPropertyId === 'all' ? properties[0]?.id : currentPropertyId,
        name: typeForm.name,
        description: typeForm.description || '',
        base_price: Number(typeForm.base_price) || 0,
        max_pax: Number(typeForm.max_pax),
        amenities: typeForm.amenities || [],
        images: typeForm.images || []
      });
    }
    setIsTypeModalOpen(false);
  };

  // Unit Handlers
  const handleOpenUnitModal = (unit?: Unit) => {
    setIsBulkCreate(false);
    if (unit) {
      setEditingUnitId(unit.id);
      setUnitForm(unit);
    } else {
      setEditingUnitId(null);
      setUnitForm({
        name: '',
        unit_type_id: unitTypes[0]?.id || '',
        status: 'active',
        housekeeping_status: 'clean',
        notes: ''
      });
    }
    setIsUnitModalOpen(true);
  };

  const handleUnitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isBulkCreate) {
      if (!bulkUnitForm.prefix || !bulkUnitForm.quantity || !bulkUnitForm.unit_type_id) return;
      
      const propId = currentPropertyId === 'all' ? properties[0]?.id : currentPropertyId;
      
      const promises = [];
      for (let i = 0; i < bulkUnitForm.quantity; i++) {
        const num = bulkUnitForm.startNumber + i;
        promises.push(addUnit({
          property_id: propId,
          unit_type_id: bulkUnitForm.unit_type_id,
          name: `${bulkUnitForm.prefix}${num}`,
          status: bulkUnitForm.status
        }));
      }
      await Promise.all(promises);
    } else {
      if (!unitForm.name || !unitForm.unit_type_id) return;
      
      const propId = currentPropertyId === 'all' ? properties[0]?.id : currentPropertyId;

      if (editingUnitId) {
        await updateUnit({
          id: editingUnitId,
          property_id: propId,
          unit_type_id: unitForm.unit_type_id,
          name: unitForm.name,
          status: unitForm.status as any,
          housekeeping_status: unitForm.housekeeping_status,
          notes: unitForm.notes
        });
      } else {
        await addUnit({
          property_id: propId,
          unit_type_id: unitForm.unit_type_id,
          name: unitForm.name,
          status: unitForm.status as any,
          housekeeping_status: unitForm.housekeeping_status,
          notes: unitForm.notes
        });
      }
    }
    setIsUnitModalOpen(false);
  };

  const inputClass = "w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white";

  return (
    <div className="flex flex-col h-screen bg-slate-100 overflow-hidden">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 shrink-0 flex items-center justify-between z-10">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <Hexagon className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-xl text-slate-800 tracking-tight">CoreHub OS</h1>
          </Link>
          <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg overflow-x-auto">
            <Link href="/" className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 rounded-md transition-colors whitespace-nowrap">
              <LayoutDashboard className="w-4 h-4" /> Cotizaciones
            </Link>
            <Link href="/bookings" className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 rounded-md transition-colors whitespace-nowrap">
              <BookOpen className="w-4 h-4" /> Reservas
            </Link>
            <Link href="/roomrack" className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 rounded-md transition-colors whitespace-nowrap">
              <CalendarRange className="w-4 h-4" /> Roomrack
            </Link>
            <Link href="/rates" className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 rounded-md transition-colors whitespace-nowrap">
              <CircleDollarSign className="w-4 h-4" /> Tarifas
            </Link>
            <Link href="/reports" className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 rounded-md transition-colors whitespace-nowrap">
              <BarChart3 className="w-4 h-4" /> Reportes
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs shadow-sm ml-2">
            AH
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full">
        <div className="mb-8 flex items-center gap-4">
          <Link href="/settings" className="w-12 h-12 rounded-xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center hover:bg-slate-100 hover:text-slate-700 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <Settings className="w-6 h-6 text-indigo-600" />
              Configuración de Inventario
            </h2>
            <p className="text-slate-500 text-sm mt-1">Gestiona los tipos de habitaciones y el estado de las unidades.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-slate-200">
          <button 
            onClick={() => setActiveTab('properties')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'properties' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Propiedades
          </button>
          <button 
            onClick={() => setActiveTab('types')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'types' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Categorías de Habitaciones
          </button>
          <button 
            onClick={() => setActiveTab('units')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'units' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Unidades Físicas
          </button>
          <button 
            onClick={() => setActiveTab('colors')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'colors' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Colores de Reservas
          </button>
          <button 
            onClick={() => setActiveTab('templates')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'templates' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <MessageSquare className="w-4 h-4" /> Plantillas
          </button>
          <button 
            onClick={() => setActiveTab('sources')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'sources' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Canales de Origen
          </button>
        </div>

        {/* Content */}
        {activeTab === 'properties' ? (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button 
                onClick={() => handleOpenPropertyModal()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm flex items-center gap-2 transition-all"
              >
                <Plus className="w-4 h-4" /> Nueva Propiedad
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {properties.map(property => (
                <div key={property.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-800 text-lg">{property.name}</h3>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleOpenPropertyModal(property)} className="text-slate-400 hover:text-indigo-600 p-1"><Edit2 className="w-4 h-4" /></button>
                      <button 
                        onClick={() => {
                          if(window.confirm(`¿Seguro que deseas eliminar la propiedad "${property.name}"?`)) {
                            deleteProperty(property.id);
                          }
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1"
                        title="Eliminar Propiedad"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-sm text-slate-600 space-y-1">
                    {property.address && <p>📍 {property.address}</p>}
                    {property.phone && <p>📞 {property.phone}</p>}
                    {property.email && <p>✉️ {property.email}</p>}
                    {property.website && <p>🌐 {property.website}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === 'types' ? (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button 
                onClick={() => handleOpenTypeModal()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm flex items-center gap-2 transition-all"
              >
                <Plus className="w-4 h-4" /> Nuevo Tipo
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {unitTypes.map(type => (
                <div key={type.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-800 text-lg">{type.name}</h3>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleOpenTypeModal(type)} className="text-slate-400 hover:text-indigo-600 p-1"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => deleteUnitType(type.id)} className="text-slate-400 hover:text-rose-600 p-1"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 mb-4 h-10">{type.description}</p>
                  
                  <div className="flex justify-end pt-4 border-t border-slate-100">
                    <div className="text-sm text-right">
                      <span className="text-slate-400 block text-xs">Capacidad</span>
                      <span className="font-medium text-slate-700">Hasta {type.max_pax} pax</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === 'colors' ? (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6">
              <h3 className="font-bold text-slate-800 text-lg mb-4">Agregar Nuevo Estado</h3>
              <form onSubmit={handleAddColor} className="flex gap-4 items-end mb-8 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">ID Único (ej. vip)</label>
                  <input type="text" value={newColorKey} onChange={e => setNewColorKey(e.target.value)} placeholder="nuevo_estado" className="w-full border border-slate-300 rounded px-3 py-2 text-sm font-bold text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" required />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Etiqueta Visible</label>
                  <input type="text" value={newColorLabel} onChange={e => setNewColorLabel(e.target.value)} placeholder="Ej. VIP Confirmado" className="w-full border border-slate-300 rounded px-3 py-2 text-sm font-bold text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" required />
                </div>
                <div className="w-1/3">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Color (Vibrante)</label>
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg shadow-sm border ${newColorClass}`}></div>
                    <select value={newColorClass} onChange={e => setNewColorClass(e.target.value)} className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm bg-white text-slate-900 font-semibold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none">
                      <option className="text-slate-900 bg-white" value="bg-emerald-500 text-white border-emerald-600">Verde Intenso</option>
                      <option className="text-slate-900 bg-white" value="bg-green-500 text-white border-green-600">Verde Claro</option>
                      <option className="text-slate-900 bg-white" value="bg-lime-500 text-white border-lime-600">Lima</option>
                      <option className="text-slate-900 bg-white" value="bg-amber-500 text-white border-amber-600">Ámbar (Naranja)</option>
                      <option className="text-slate-900 bg-white" value="bg-orange-500 text-white border-orange-600">Naranja Intenso</option>
                      <option className="text-slate-900 bg-white" value="bg-rose-500 text-white border-rose-600">Rojo Rosado</option>
                      <option className="text-slate-900 bg-white" value="bg-red-500 text-white border-red-600">Rojo Intenso</option>
                      <option className="text-slate-900 bg-white" value="bg-indigo-500 text-white border-indigo-600">Índigo (Azul Oscuro)</option>
                      <option className="text-slate-900 bg-white" value="bg-blue-500 text-white border-blue-600">Azul</option>
                      <option className="text-slate-900 bg-white" value="bg-sky-500 text-white border-sky-600">Celeste (Sky)</option>
                      <option className="text-slate-900 bg-white" value="bg-cyan-500 text-white border-cyan-600">Cian</option>
                      <option className="text-slate-900 bg-white" value="bg-fuchsia-500 text-white border-fuchsia-600">Fucsia</option>
                      <option className="text-slate-900 bg-white" value="bg-purple-500 text-white border-purple-600">Púrpura</option>
                      <option className="text-slate-900 bg-white" value="bg-slate-500 text-white border-slate-600">Gris Oscuro (Slate)</option>
                      <option className="text-slate-900 bg-white" value="bg-slate-800 text-white border-slate-900">Negro (Dark Slate)</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-bold shadow-sm transition-colors whitespace-nowrap h-[38px] flex items-center">
                  <Plus className="w-4 h-4 mr-2" /> Agregar
                </button>
              </form>

              <h3 className="font-bold text-slate-800 text-lg mb-4">Estados Existentes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(bookingColors).map(([statusKey, config]) => (
                  <div key={statusKey} className="flex gap-4 items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Estado: {statusKey}</label>
                      <input 
                        type="text" 
                        value={config.label}
                        onChange={e => updateBookingColor(statusKey, { ...config, label: e.target.value })}
                        className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm font-bold text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div className="w-1/2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Color</label>
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded border shadow-sm shrink-0 ${config.colorClass}`}></div>
                        <select 
                          value={config.colorClass}
                          onChange={e => updateBookingColor(statusKey, { ...config, colorClass: e.target.value })}
                          className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm bg-white text-slate-900 font-semibold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                        >
                          <option className="text-slate-900 bg-white" value="bg-emerald-500 text-white border-emerald-600">Verde Intenso</option>
                          <option className="text-slate-900 bg-white" value="bg-green-500 text-white border-green-600">Verde Claro</option>
                          <option className="text-slate-900 bg-white" value="bg-lime-500 text-white border-lime-600">Lima</option>
                          <option className="text-slate-900 bg-white" value="bg-amber-500 text-white border-amber-600">Ámbar (Naranja)</option>
                          <option className="text-slate-900 bg-white" value="bg-orange-500 text-white border-orange-600">Naranja Intenso</option>
                          <option className="text-slate-900 bg-white" value="bg-rose-500 text-white border-rose-600">Rojo Rosado</option>
                          <option className="text-slate-900 bg-white" value="bg-red-500 text-white border-red-600">Rojo Intenso</option>
                          <option className="text-slate-900 bg-white" value="bg-indigo-500 text-white border-indigo-600">Índigo (Azul Oscuro)</option>
                          <option className="text-slate-900 bg-white" value="bg-blue-500 text-white border-blue-600">Azul</option>
                          <option className="text-slate-900 bg-white" value="bg-sky-500 text-white border-sky-600">Celeste (Sky)</option>
                          <option className="text-slate-900 bg-white" value="bg-cyan-500 text-white border-cyan-600">Cian</option>
                          <option className="text-slate-900 bg-white" value="bg-fuchsia-500 text-white border-fuchsia-600">Fucsia</option>
                          <option className="text-slate-900 bg-white" value="bg-purple-500 text-white border-purple-600">Púrpura</option>
                          <option className="text-slate-900 bg-white" value="bg-slate-500 text-white border-slate-600">Gris Oscuro (Slate)</option>
                          <option className="text-slate-900 bg-white" value="bg-slate-800 text-white border-slate-900">Negro (Dark Slate)</option>
                          <option className="text-slate-900 bg-white" value="bg-emerald-100 text-emerald-800 border border-emerald-200">Verde Pastel</option>
                          <option className="text-slate-900 bg-white" value="bg-amber-100 text-amber-800 border border-amber-200">Naranja Pastel</option>
                          <option className="text-slate-900 bg-white" value="bg-indigo-100 text-indigo-800 border border-indigo-200">Azul Pastel</option>
                          <option className="text-slate-900 bg-white" value="bg-rose-100 text-rose-800 border border-rose-200">Rojo Pastel</option>
                          <option className="text-slate-900 bg-white" value="bg-slate-100 text-slate-800 border border-slate-300">Gris Pastel</option>
                        </select>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDeleteColor(statusKey)}
                      className="text-slate-400 hover:text-rose-600 p-2 mt-4 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Eliminar Estado"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : activeTab === 'templates' ? (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button 
                onClick={() => handleOpenTemplateModal()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm flex items-center gap-2 transition-all"
              >
                <Plus className="w-4 h-4" /> Nueva Plantilla
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map(template => (
                <div key={template.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                      {template.name}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold ${template.type === 'whatsapp' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                        {template.type}
                      </span>
                    </h3>
                    <div className="flex gap-2">
                      <button onClick={() => handleOpenTemplateModal(template)} className="text-slate-400 hover:text-indigo-600 p-1"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => { if(confirm('¿Eliminar plantilla?')) deleteTemplate(template.id); }} className="text-slate-400 hover:text-rose-600 p-1"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  {template.subject && <p className="text-xs font-semibold text-slate-600 mb-2">Asunto: {template.subject}</p>}
                  <p className="text-sm text-slate-500 flex-1 whitespace-pre-wrap">{template.content}</p>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === 'units' ? (
          <div className="space-y-4">
             <div className="flex justify-end">
              <button 
                onClick={() => handleOpenUnitModal()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm flex items-center gap-2 transition-all"
              >
                <Plus className="w-4 h-4" /> Nueva Unidad
              </button>
            </div>
            
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold tracking-wider">
                    <th className="p-4">Unidad</th>
                    <th className="p-4">Tipo</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {units.map(unit => {
                    const unitType = unitTypes.find(t => t.id === unit.unit_type_id);
                    return (
                      <tr key={unit.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                        <td className="p-4 font-bold text-slate-700">{unit.name}</td>
                        <td className="p-4 text-slate-500">{unitType?.name}</td>
                        <td className="p-4">
                          {unit.status === 'active' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                              <CheckCircle className="w-3.5 h-3.5" /> Activa
                            </span>
                          )}
                          {unit.status === 'out_of_order' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700" title={unit.notes}>
                              <XCircle className="w-3.5 h-3.5" /> Out of Order
                            </span>
                          )}
                          {unit.status === 'out_of_service' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700" title={unit.notes}>
                              <AlertTriangle className="w-3.5 h-3.5" /> Out of Service
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                           <button onClick={() => handleOpenUnitModal(unit)} className="text-indigo-600 hover:text-indigo-800 font-medium text-xs underline mr-3">Editar</button>
                           <button onClick={() => deleteUnit(unit.id)} className="text-rose-600 hover:text-rose-800 font-medium text-xs underline">Eliminar</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6">
              <h3 className="font-bold text-slate-800 text-lg mb-2">Canales de Origen de Reservas</h3>
              <p className="text-sm text-slate-500 mb-6">Personalizá los canales que aparecen al crear reservas y cotizaciones.</p>

              {/* Current sources */}
              <div className="flex flex-wrap gap-2 mb-6">
                {bookingSources.map(s => (
                  <div
                    key={s}
                    className="flex items-center gap-1.5 pl-3 pr-1 py-1.5 bg-slate-100 border border-slate-200 rounded-full group hover:border-rose-300 hover:bg-rose-50 transition-all"
                  >
                    <span className="text-base">{getEmoji(s)}</span>
                    <span className="text-sm font-bold text-slate-700 group-hover:text-rose-700">{s}</span>
                    <button
                      onClick={() => deleteSource(s)}
                      className="w-5 h-5 rounded-full bg-slate-200 hover:bg-rose-500 text-slate-500 hover:text-white flex items-center justify-center transition-all ml-0.5"
                      title="Eliminar canal"
                    >
                      <span className="text-xs">×</span>
                    </button>
                  </div>
                ))}
              </div>

              {/* Add new source */}
              <div className="flex flex-col gap-3 border-t border-slate-100 pt-5">
                <label className="block text-xs font-bold text-slate-500 uppercase">Seleccionar Emoji & Nombre</label>
                <div className="flex gap-2 flex-wrap mb-2">
                  {['💬','📧','📞','📸','🏨','🌐','🚶','🏠','📘','🤝','🏢','✈️','📌','⭐','🎯'].map(e => (
                    <button
                      key={e}
                      onClick={() => setNewEmoji(e)}
                      className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all border ${
                        newEmoji === e ? 'bg-indigo-100 border-indigo-400 scale-110 shadow-sm' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ej: Facebook, TikTok, Agencia..."
                    value={newSource}
                    onChange={e => setNewSource(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && newSource.trim()) {
                        addSource(newSource.trim());
                        setNewSource('');
                      }
                    }}
                    className="flex-1 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-850 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                  <button
                    onClick={() => {
                      if (newSource.trim()) {
                        addSource(newSource.trim());
                        setNewSource('');
                      }
                    }}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all flex items-center gap-2 shadow-sm"
                  >
                    Agregar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Type Modal */}
      <Modal isOpen={isTypeModalOpen} onClose={() => setIsTypeModalOpen(false)} title={editingTypeId ? "Editar Tipo de Habitación" : "Nuevo Tipo de Habitación"}>
        <form onSubmit={handleTypeSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Nombre *</label>
            <input required type="text" value={typeForm.name || ''} onChange={e => setTypeForm({...typeForm, name: e.target.value})} className={inputClass} placeholder="Ej: Habitación Doble" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Descripción</label>
            <textarea value={typeForm.description || ''} onChange={e => setTypeForm({...typeForm, description: e.target.value})} className={inputClass} rows={2} />
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Capacidad Max. (Pax) *</label>
              <input required type="number" min="1" value={typeForm.max_pax ?? ''} onChange={e => setTypeForm({...typeForm, max_pax: Number(e.target.value)})} className={inputClass} />
            </div>
            <div>
              <ImageUpload
                label="Foto Principal de la Habitación"
                value={typeForm.images?.[0] || ''}
                onChange={(url) => setTypeForm({ ...typeForm, images: [url] })}
              />
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setIsTypeModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold">Guardar</button>
          </div>
        </form>
      </Modal>

      {/* Unit Modal */}
      <Modal isOpen={isUnitModalOpen} onClose={() => setIsUnitModalOpen(false)} title={editingUnitId ? "Editar Unidad Física" : "Nueva Unidad Física"}>
        <form onSubmit={handleUnitSubmit} className="space-y-4">
          
          {!editingUnitId && (
            <div className="flex gap-4 border-b border-slate-200 pb-2 mb-4">
              <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                <input type="radio" checked={!isBulkCreate} onChange={() => setIsBulkCreate(false)} className="text-indigo-600 focus:ring-indigo-500" />
                Creación Individual
              </label>
              <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                <input type="radio" checked={isBulkCreate} onChange={() => setIsBulkCreate(true)} className="text-indigo-600 focus:ring-indigo-500" />
                Creación Múltiple (Lote)
              </label>
            </div>
          )}

          {isBulkCreate && !editingUnitId ? (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Prefijo (opcional)</label>
                  <input type="text" value={bulkUnitForm.prefix} onChange={e => setBulkUnitForm({...bulkUnitForm, prefix: e.target.value})} className={inputClass} placeholder="Ej: Piso 1 - " />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Número Inicial</label>
                  <input required type="number" min="1" value={bulkUnitForm.startNumber} onChange={e => setBulkUnitForm({...bulkUnitForm, startNumber: Number(e.target.value)})} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Cantidad</label>
                  <input required type="number" min="1" value={bulkUnitForm.quantity} onChange={e => setBulkUnitForm({...bulkUnitForm, quantity: Number(e.target.value)})} className={inputClass} />
                </div>
              </div>
              
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-xs text-slate-600">
                Se crearán las unidades: <strong>{bulkUnitForm.prefix}{bulkUnitForm.startNumber}</strong> hasta <strong>{bulkUnitForm.prefix}{bulkUnitForm.startNumber + bulkUnitForm.quantity - 1}</strong>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Tipo de Habitación</label>
                  <select required value={bulkUnitForm.unit_type_id} onChange={e => setBulkUnitForm({...bulkUnitForm, unit_type_id: e.target.value})} className={inputClass}>
                    {unitTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Estado</label>
                  <select required value={bulkUnitForm.status} onChange={e => setBulkUnitForm({...bulkUnitForm, status: e.target.value as any})} className={inputClass}>
                    <option value="active">Activa (Disponible)</option>
                  </select>
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Nombre / Número de Habitación</label>
                <input required type="text" value={unitForm.name || ''} onChange={e => setUnitForm({...unitForm, name: e.target.value})} className={inputClass} placeholder="Ej: 101" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Tipo de Habitación</label>
                  <select required value={unitForm.unit_type_id || ''} onChange={e => setUnitForm({...unitForm, unit_type_id: e.target.value})} className={inputClass}>
                    {unitTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Estado Físico</label>
                  <select required value={unitForm.status || 'active'} onChange={e => setUnitForm({...unitForm, status: e.target.value as any})} className={inputClass}>
                    <option value="active">Activa (Disponible)</option>
                    <option value="out_of_order">Out of Order</option>
                    <option value="out_of_service">Out of Service</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Limpieza (HSK)</label>
                  <select required value={unitForm.housekeeping_status || 'clean'} onChange={e => setUnitForm({...unitForm, housekeeping_status: e.target.value as any})} className={inputClass}>
                    <option value="clean">Limpia (Clean)</option>
                    <option value="dirty">Sucia (Dirty)</option>
                    <option value="cleaning">En Limpieza (Cleaning)</option>
                    <option value="inspected">Inspeccionada (Inspected)</option>
                  </select>
                </div>
              </div>
              {unitForm.status !== 'active' && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Motivo (OOO/OOS)</label>
                  <input type="text" value={unitForm.notes || ''} onChange={e => setUnitForm({...unitForm, notes: e.target.value})} className={inputClass} placeholder="Ej: Problemas de plomería" />
                </div>
              )}
            </>
          )}

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setIsUnitModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold">Guardar</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isPropertyModalOpen} onClose={() => setIsPropertyModalOpen(false)} title={editingPropertyId ? "Editar Propiedad" : "Nueva Propiedad"}>
        <form onSubmit={handlePropertySubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Nombre de la Propiedad *</label>
            <input required type="text" value={propertyForm.name} onChange={e => setPropertyForm({...propertyForm, name: e.target.value})} className={inputClass} placeholder="Ej: Hotel Flow" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Dirección</label>
            <input type="text" value={propertyForm.address} onChange={e => setPropertyForm({...propertyForm, address: e.target.value})} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Teléfono</label>
              <input type="text" value={propertyForm.phone} onChange={e => setPropertyForm({...propertyForm, phone: e.target.value})} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
              <input type="email" value={propertyForm.email} onChange={e => setPropertyForm({...propertyForm, email: e.target.value})} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Sitio Web</label>
            <input type="url" value={propertyForm.website} onChange={e => setPropertyForm({...propertyForm, website: e.target.value})} className={inputClass} placeholder="https://" />
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setIsPropertyModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold">
              {editingPropertyId ? 'Guardar Cambios' : 'Crear Propiedad'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Template Modal */}
      <Modal isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)} title={editingTemplateId ? "Editar Plantilla" : "Nueva Plantilla"}>
        <form onSubmit={handleTemplateSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Nombre de Plantilla</label>
            <input required type="text" value={templateForm.name} onChange={e => setTemplateForm({...templateForm, name: e.target.value})} className={inputClass} placeholder="Ej: Confirmación de Reserva" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Tipo</label>
            <select value={templateForm.type} onChange={e => setTemplateForm({...templateForm, type: e.target.value})} className={inputClass}>
              <option value="whatsapp">WhatsApp</option>
              <option value="email">Correo Electrónico (Email)</option>
            </select>
          </div>
          {templateForm.type === 'email' && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Asunto (Opcional)</label>
              <input type="text" value={templateForm.subject} onChange={e => setTemplateForm({...templateForm, subject: e.target.value})} className={inputClass} placeholder="Asunto del correo..." />
            </div>
          )}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Contenido (Mensaje)</label>
            <textarea required value={templateForm.content} onChange={e => setTemplateForm({...templateForm, content: e.target.value})} className={inputClass} rows={6} placeholder="Escribe el mensaje..." />
            <p className="text-xs text-slate-500 mt-1">Puedes usar variables de entorno que el sistema reemplazará automáticamente.</p>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setIsTemplateModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold">Guardar</button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
