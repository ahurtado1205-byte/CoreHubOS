'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { usePMS } from '../../context/PMSContext';
import { TopBar } from '../../components/layout/TopBar';
import { Modal } from '../../components/ui/Modal';
import { BookingForm } from '../../components/bookings/BookingForm';
import { BillingService } from '../../services/billingService';
import { 
  CircleDollarSign, FileText, TrendingUp, AlertCircle, Search, 
  Download, Plus, ShieldAlert, Receipt, ArrowLeft,
  CreditCard
} from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';

function BillingDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingIdParam = searchParams.get('bookingId');

  const { bookings, properties, currentPropertyId, updateBooking } = usePMS();

  const [activeTab, setActiveTab] = useState<'folios' | 'close' | 'settings'>('folios');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [taxProfile, setTaxProfile] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pms_tax_profile');
      if (saved) return JSON.parse(saved);
    }
    return {
      countryCode: 'AR',
      vatCondition: 'responsable_inscripto',
      arcaEnabled: true,
      pointOfSale: 1
    };
  });

  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(bookingIdParam);
  const [folioDetails, setFolioDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [dailyReport, setDailyReport] = useState<any>(null);

  const [selectedEntryIds, setSelectedEntryIds] = useState<string[]>([]);
  const [billingWindows, setBillingWindows] = useState<string[]>(['1', '2']);

  // Modals state
  const [isChargeModalOpen, setIsChargeModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  // Form states
  const [chargeForm, setChargeForm] = useState({
    entryType: 'extra_charge' as any,
    description: '',
    unitAmount: 0,
    quantity: 1,
    serviceDate: new Date().toISOString().substring(0, 10)
  });

  const [paymentMethods, setPaymentMethods] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pms_payment_methods');
      if (saved) return JSON.parse(saved);
    }
    return ['EFT (Efectivo)', 'Transferencia Bancaria', 'Tarjeta de Crédito', 'Tarjeta de Débito', 'Mercado Pago (QR)', 'Mercado Pago (Point)'];
  });
  const [customMethodName, setCustomMethodName] = useState('');
  const [showCustomMethodInput, setShowCustomMethodInput] = useState(false);

  const [paymentForm, setPaymentForm] = useState({
    provider: 'EFT (Efectivo)',
    methodType: 'cash',
    amount: 0,
    currency: 'USD',
    externalReference: ''
  });

  const [invoiceForm, setInvoiceForm] = useState({
    mode: 'fiscal' as any,
    documentClass: 'B' as any,
    pointOfSale: 1
  });

  // Load details whenever selected booking changes
  const loadFolio = async (bId: string) => {
    setLoading(true);
    try {
      const activeProperty = properties.find(p => p.id === currentPropertyId) || properties[0];
      const folio = await BillingService.getFolioByReservation(bId, activeProperty.id);
      const details = await BillingService.getFolioDetails(folio.id);
      setFolioDetails(details);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedBookingId) {
      loadFolio(selectedBookingId);
    }
  }, [selectedBookingId, currentPropertyId]);

  useEffect(() => {
    async function loadDailyReport() {
      const activeProperty = properties.find(p => p.id === currentPropertyId) || properties[0];
      const report = await BillingService.getDailyCloseReport(activeProperty.id);
      setDailyReport(report);
    }
    loadDailyReport();
  }, [currentPropertyId, folioDetails]);

  // Sync state if query parameter changes
  useEffect(() => {
    if (bookingIdParam) {
      setSelectedBookingId(bookingIdParam);
    }
  }, [bookingIdParam]);

  const activeBooking = useMemo(() => {
    return bookings.find(b => b.id === selectedBookingId);
  }, [bookings, selectedBookingId]);

  const handleAddCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folioDetails) return;
    try {
      await BillingService.addCharge({
        version: folioDetails.version,
        idempotencyKey: `charge_${Date.now()}`,
        folioId: folioDetails.id,
        entryType: chargeForm.entryType,
        sourceType: 'reception',
        serviceDate: chargeForm.serviceDate,
        description: chargeForm.description,
        quantity: Number(chargeForm.quantity),
        unitAmount: Number(chargeForm.unitAmount),
        metadata: {}
      });
      setIsChargeModalOpen(false);
      setChargeForm({
        entryType: 'extra_charge',
        description: '',
        unitAmount: 0,
        quantity: 1,
        serviceDate: new Date().toISOString().substring(0, 10)
      });
      loadFolio(selectedBookingId!);
      alert('¡Cargo agregado con éxito!');
    } catch (err: any) {
      alert(err.message || 'Error al agregar cargo');
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folioDetails) return;
    try {
      let finalProvider = paymentForm.provider;
      if (showCustomMethodInput && customMethodName.trim()) {
        finalProvider = customMethodName.trim();
        if (!paymentMethods.includes(finalProvider)) {
          const updatedMethods = [...paymentMethods, finalProvider];
          setPaymentMethods(updatedMethods);
          localStorage.setItem('pms_payment_methods', JSON.stringify(updatedMethods));
        }
      }

      await BillingService.addPayment({
        version: folioDetails.version,
        idempotencyKey: `pay_${Date.now()}`,
        folioId: folioDetails.id,
        provider: finalProvider,
        methodType: finalProvider.toLowerCase().includes('transfer') ? 'transfer' : (finalProvider.toLowerCase().includes('efectivo') || finalProvider.toLowerCase().includes('eft') ? 'cash' : 'card'),
        money: {
          amount: Number(paymentForm.amount),
          currency: paymentForm.currency,
          exchangeRate: 1
        },
        externalReference: paymentForm.externalReference || undefined,
        capture: true
      });
      setIsPaymentModalOpen(false);
      setShowCustomMethodInput(false);
      setCustomMethodName('');
      setPaymentForm({
        provider: paymentMethods[0] || 'EFT (Efectivo)',
        methodType: 'cash',
        amount: 0,
        currency: 'USD',
        externalReference: ''
      });
      loadFolio(selectedBookingId!);
      alert('¡Cobro registrado exitosamente!');
    } catch (err: any) {
      alert(err.message || 'Error al procesar cobro');
    }
  };

  const handleIssueInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folioDetails) return;
    try {
      await BillingService.issueInvoice({
        version: folioDetails.version,
        idempotencyKey: `inv_${Date.now()}`,
        invoiceId: folioDetails.id,
        mode: invoiceForm.mode,
        documentClass: invoiceForm.mode === 'fiscal' ? invoiceForm.documentClass : undefined,
        pointOfSale: Number(invoiceForm.pointOfSale)
      });
      setIsInvoiceModalOpen(false);
      loadFolio(selectedBookingId!);
      alert('¡Factura emitida correctamente!');
    } catch (err: any) {
      alert(err.message || 'Error al emitir factura');
    }
  };

  const handleAdvanceBilling = async () => {
    if (!folioDetails || !activeBooking) return;
    try {
      const start = parseISO(activeBooking.check_in);
      const end = parseISO(activeBooking.check_out);
      const nights = Math.max(1, differenceInDays(end, start));
      const rate = activeBooking.nightly_rate || 120;
      
      const postedRoomCharges = (folioDetails.entries || []).filter((e: any) => e.entry_type === 'room_charge');
      const nightsRemaining = nights - postedRoomCharges.length;

      if (nightsRemaining <= 0) {
        alert("ℹ️ Todas las noches de estadía ya han sido facturadas en este folio.");
        return;
      }

      await BillingService.addCharge({
        version: folioDetails.version,
        idempotencyKey: `adv_charge_${Date.now()}`,
        folioId: folioDetails.id,
        entryType: 'room_charge',
        sourceType: 'reception',
        serviceDate: activeBooking.check_in,
        description: `Cargo Adelantado - ${nightsRemaining} noches @ $${rate}/noche`,
        quantity: nightsRemaining,
        unitAmount: rate,
        metadata: { is_advance: true }
      });

      loadFolio(selectedBookingId!);
      alert(`¡Facturación adelantada completada para ${nightsRemaining} noches!`);
    } catch (err: any) {
      alert(err.message || 'Error al facturar noches adelantadas');
    }
  };

  const handleCheckOut = async () => {
    if (!folioDetails || !activeBooking) return;
    if (folioDetails.totals.balance > 0) {
      alert(`🚨 CHECK-OUT BLOQUEADO: El huésped posee un saldo pendiente de $${folioDetails.totals.balance} USD. Registra el cobro antes de proceder.`);
      return;
    }
    
    try {
      const updated = {
        ...activeBooking,
        booking_status: 'checked_out'
      };
      await updateBooking(updated);
      loadFolio(selectedBookingId!);
      alert("🎉 ¡Check-Out completado con éxito! El estado de la habitación y reserva ha sido actualizado.");
    } catch (e: any) {
      alert("Error al procesar el Check-Out");
    }
  };

  // Export structural simulation for Libro IVA Digital (AFIP Argentina)
  const handleExportLibroIva = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Fecha,Tipo Comprobante,Punto Venta,Numero,DNI Cliente,Razon Social,Neto Gravado,IVA,Total\n"
      + `${new Date().toLocaleDateString()},Factura B,0001,00001542,30123456,${activeBooking?.first_name || 'Consumidor'} ${activeBooking?.last_name || 'Final'},${(folioDetails?.totals.charges / 1.21).toFixed(2)},${(folioDetails?.totals.charges - folioDetails?.totals.charges / 1.21).toFixed(2)},${folioDetails?.totals.charges}`;
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Libro_IVA_Digital_${new Date().toISOString().substring(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans">
      <TopBar />

      <main className="flex-1 overflow-y-auto p-6 flex flex-col max-w-[1400px] mx-auto w-full space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex justify-between items-center shrink-0 border-b border-slate-200">
          <div className="flex gap-4">
            <button 
              className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'folios' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              onClick={() => {
                setActiveTab('folios');
                setSelectedBookingId(null);
                setFolioDetails(null);
              }}
            >
              💼 Folios y Caja
            </button>
            <button 
              className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'close' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              onClick={() => setActiveTab('close')}
            >
              📊 Cierre Diario
            </button>
            <button 
              className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'settings' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              onClick={() => setActiveTab('settings')}
            >
              ⚙️ Configuración Fiscal
            </button>
          </div>

          {selectedBookingId && (
            <button
              onClick={() => {
                setSelectedBookingId(null);
                setFolioDetails(null);
                router.push('/billing');
              }}
              className="mb-2 text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Volver a la Lista
            </button>
          )}
        </div>

        {activeTab === 'folios' ? (
          !selectedBookingId ? (
            /* LIST OF ACTIVE RESERVATIONS */
            <div className="space-y-4 flex-1 flex flex-col">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Buscar Folio por Reserva</h2>
                <p className="text-slate-500 text-xs mt-0.5">Selecciona un huésped para gestionar sus consumos, facturas y pagos.</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col">
                <div className="overflow-y-auto flex-1">
                  <table className="w-full text-left text-xs text-slate-655">
                    <thead className="bg-slate-50 text-slate-500 font-bold sticky top-0 border-b border-slate-200 z-10 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-6 py-4">Pasajero Titular</th>
                        <th className="px-6 py-4">Habitación</th>
                        <th className="px-6 py-4 text-center">Fechas</th>
                        <th className="px-6 py-4 text-center">Estado</th>
                        <th className="px-6 py-4 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {bookings.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-bold">
                            No hay reservas activas en este momento.
                          </td>
                        </tr>
                      ) : (
                        bookings.map(b => (
                          <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-extrabold text-slate-800 text-sm">{b.first_name} {b.last_name}</div>
                              <div className="text-[10px] text-slate-500 mt-0.5">ID: {b.confirmation_id || b.id}</div>
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-700">
                              {b.room_id ? `Habitación ${b.room_id}` : 'Sin habitación asignada'}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {format(parseISO(b.check_in), 'dd MMM')} al {format(parseISO(b.check_out), 'dd MMM yyyy')}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                b.booking_status === 'checked_in' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                b.booking_status === 'checked_out' ? 'bg-slate-100 text-slate-800 border border-slate-200' :
                                'bg-indigo-100 text-indigo-800 border border-indigo-200'
                              }`}>
                                {b.booking_status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => setSelectedBookingId(b.id)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs transition-colors"
                              >
                                Ver Caja
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* DETAILED FOLIO / CASH REGISTER VIRTUAL TERMINAL */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 items-start">
              
              {/* Left & Middle Column: Folio list of charges and entries */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Visual Alert Red Flag for Check-out locks */}
                {folioDetails?.totals.balance > 0 && (
                  <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3 text-rose-800 shadow-sm animate-in fade-in duration-200">
                    <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-black text-sm uppercase tracking-tight">Check-out Bloqueado</h4>
                      <p className="text-xs text-rose-700 mt-0.5 font-medium">
                        Esta reserva posee un **saldo pendiente de ${folioDetails.totals.balance} USD**. De acuerdo con las políticas del establecimiento, no se puede autorizar el egreso físico del pasajero sin saldar su cuenta.
                      </p>
                    </div>
                  </div>
                )}

                {/* Folio Header Info */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-650 uppercase tracking-widest block mb-0.5">Folio N° #{folioDetails?.folio_number || '...'}</span>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">{activeBooking?.first_name} {activeBooking?.last_name}</h3>
                    <p className="text-xs text-slate-500 font-semibold mt-1">
                      Habitación: {activeBooking?.room_id ? `N° ${activeBooking.room_id}` : 'No asignada'} • 
                      Estadía: {activeBooking ? `${format(parseISO(activeBooking.check_in), 'dd/MM')} al ${format(parseISO(activeBooking.check_out), 'dd/MM')}` : ''}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setIsBookingModalOpen(true)}
                      className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                      title="Ver o editar los detalles de la reserva asociada"
                    >
                      🔎 Ver Reserva
                    </button>
                    <button
                      onClick={handleAdvanceBilling}
                      className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                      title="Facturar noches restantes de la estadía por adelantado"
                    >
                      ⚡ Facturar Adelantado
                    </button>
                    <button
                      onClick={() => setIsChargeModalOpen(true)}
                      className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Plus className="w-4 h-4 text-indigo-500" /> Cargar Extra
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                      title="Imprimir preforma / estado de cuenta del pasajero"
                    >
                      🖨️ Imprimir Proforma
                    </button>
                    <button
                      onClick={() => {
                        const initialIds = folioDetails?.entries
                          .filter((e: any) => Number(e.gross_amount) > 0)
                          .map((e: any) => e.id) || [];
                        setSelectedEntryIds(initialIds);

                        const sum = folioDetails?.entries
                          .filter((e: any) => initialIds.includes(e.id))
                          .reduce((s: number, e: any) => s + Number(e.gross_amount), 0) || 0;

                        setPaymentForm(prev => ({
                          ...prev,
                          amount: sum
                        }));
                        setIsPaymentModalOpen(true);
                      }}
                      className="bg-indigo-650 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <CreditCard className="w-4 h-4" /> Registrar Cobro
                    </button>
                    <button
                      onClick={handleCheckOut}
                      className={`font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm ${
                        folioDetails?.totals.balance > 0 
                          ? 'bg-rose-50 border border-rose-200 text-rose-700 cursor-not-allowed hover:bg-rose-100'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                      title={folioDetails?.totals.balance > 0 ? "Check-out bloqueado por saldo pendiente" : "Realizar check-out oficial de la propiedad"}
                    >
                      🚪 Check-Out
                    </button>
                  </div>
                </div>

                {/* Entry List Table */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Desglose de Cargos y Ajustes</span>
                      <p className="text-[11px] text-slate-400 font-medium">Visualiza las noches de hospedaje, extras y traslada cargos entre folios.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {billingWindows.length < 4 && (
                        <button
                          onClick={() => {
                            const nextNum = billingWindows.length + 1;
                            setBillingWindows([...billingWindows, String(nextNum)]);
                          }}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-750 border border-indigo-200 font-extrabold text-[10px] uppercase px-2.5 py-1 rounded-xl transition-all"
                        >
                          ➕ Agregar Ventana
                        </button>
                      )}
                      <span className="text-[10px] bg-slate-200/60 text-slate-600 px-2 py-0.5 rounded font-black font-mono">VER. #{folioDetails?.version}</span>
                    </div>
                  </div>

                  <div className={`grid grid-cols-1 gap-4 pt-4 ${
                    billingWindows.length === 1 ? 'grid-cols-1' :
                    billingWindows.length === 2 ? 'md:grid-cols-2' :
                    billingWindows.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2 xl:grid-cols-4'
                  }`}>
                    {billingWindows.map((wId, idx) => {
                      const windowDefs: Record<string, { title: string; desc: string; color: string; badge: string }> = {
                        '1': { title: 'Ventana 1: Alojamiento', desc: 'Estadía y tarifas base', color: 'bg-indigo-50/40 border border-slate-200/80', badge: 'bg-indigo-50 text-indigo-755 border border-indigo-100/50' },
                        '2': { title: 'Ventana 2: Consumos', desc: 'Extras, bar y amenities', color: 'bg-slate-50/50 border border-slate-200/80', badge: 'bg-emerald-50 text-emerald-755 border border-emerald-100/50' },
                        '3': { title: 'Ventana 3: Eventos', desc: 'Salones y cuentas B2B', color: 'bg-purple-50/40 border border-purple-200/80', badge: 'bg-purple-50 text-purple-755 border border-purple-100/50' },
                        '4': { title: 'Ventana 4: Ajustes', desc: 'Reversiones y descuentos', color: 'bg-rose-50/40 border border-rose-200/80', badge: 'bg-rose-50 text-rose-755 border border-rose-100/50' }
                      };
                      const def = windowDefs[wId] || { title: `Ventana ${wId}`, desc: 'Otros cargos', color: 'bg-slate-50 border border-slate-200', badge: 'bg-slate-100 text-slate-700' };
                      const entries = (folioDetails?.entries || []).filter((e: any) => (e.window_id || '1') === wId);
                      const windowTotal = entries.reduce((s: number, e: any) => s + Number(e.gross_amount), 0);

                      return (
                        <div key={wId} className={`${def.color} rounded-2xl p-4 space-y-3 flex flex-col`}>
                          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                            <div>
                              <h5 className="font-extrabold text-slate-850 text-[11px] flex items-center gap-1.5">
                                <span>📁 {def.title}</span>
                              </h5>
                              <p className="text-[9px] text-slate-400">{def.desc}</p>
                            </div>
                            <span className={`${def.badge} px-2 py-0.5 rounded-lg text-[10px] font-black`}>
                              ${windowTotal.toFixed(2)}
                            </span>
                          </div>

                          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 flex-1">
                            {entries.length === 0 ? (
                              <div className="text-center py-8 text-[10px] text-slate-400 font-bold italic bg-white border border-slate-100 rounded-xl">
                                Vacío
                              </div>
                            ) : (
                              entries.map((entry: any) => (
                                <div key={entry.id} className="bg-white border border-slate-200 rounded-xl p-2.5 flex justify-between items-center hover:shadow-xs transition-all">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    {idx > 0 && (
                                      <button
                                        title={`Mover a Ventana ${billingWindows[idx - 1]}`}
                                        onClick={() => {
                                          const updatedEntries = folioDetails.entries.map((ent: any) => 
                                            ent.id === entry.id ? { ...ent, window_id: billingWindows[idx - 1] } : ent
                                          );
                                          setFolioDetails({ ...folioDetails, entries: updatedEntries });
                                        }}
                                        className="p-1 hover:bg-slate-100 text-slate-400 hover:text-indigo-650 rounded border border-slate-200 bg-slate-50 transition-all text-[9px] font-black shrink-0"
                                      >
                                        ⬅
                                      </button>
                                    )}
                                    <div className="space-y-0.5 min-w-0">
                                      <div className="flex items-center gap-1">
                                        <span className="bg-slate-50 text-slate-600 text-[7px] font-black uppercase tracking-wider px-1 py-0.2 rounded border border-slate-200">
                                          {entry.entry_type}
                                        </span>
                                      </div>
                                      <h6 className="font-bold text-slate-800 text-[10px] truncate" title={entry.description}>{entry.description}</h6>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                    <div className="font-black text-[10px] text-slate-800">${Number(entry.gross_amount).toFixed(2)}</div>
                                    {idx < billingWindows.length - 1 && (
                                      <button
                                        title={`Mover a Ventana ${billingWindows[idx + 1]}`}
                                        onClick={() => {
                                          const updatedEntries = folioDetails.entries.map((ent: any) => 
                                            ent.id === entry.id ? { ...ent, window_id: billingWindows[idx + 1] } : ent
                                          );
                                          setFolioDetails({ ...folioDetails, entries: updatedEntries });
                                        }}
                                        className="p-1 hover:bg-slate-100 text-slate-400 hover:text-indigo-650 rounded border border-slate-200 bg-slate-50 transition-all text-[9px] font-black shrink-0"
                                      >
                                        ➡
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Payments Table */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-4 bg-slate-50 border-b border-slate-200">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Historial de Cobros</span>
                  </div>

                  <table className="w-full text-left text-xs text-slate-655">
                    <thead className="bg-slate-50 text-[10px] text-slate-400 font-bold border-b border-slate-200 uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-3">Fecha</th>
                        <th className="px-6 py-3">Proveedor</th>
                        <th className="px-6 py-3 text-center">Método</th>
                        <th className="px-6 py-3 text-center">Referencia</th>
                        <th className="px-6 py-3 text-right">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {folioDetails?.payments.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-bold">
                            No se han registrado cobros.
                          </td>
                        </tr>
                      ) : (
                        folioDetails?.payments.map((p: any) => (
                          <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">{format(parseISO(p.created_at), 'dd/MM/yyyy HH:mm')}</td>
                            <td className="px-6 py-4 font-bold text-slate-850 uppercase">{p.provider}</td>
                            <td className="px-6 py-4 text-center">
                              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-black text-[9px] uppercase">
                                {p.method_type}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center text-slate-400">{p.external_reference || '-'}</td>
                            <td className="px-6 py-4 text-right font-extrabold text-emerald-600">${Number(p.amount).toFixed(2)} {p.currency_code}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

              </div>

              {/* Right Column: Calculations & Billing Invoices emission */}
              <div className="space-y-6">
                
                {/* Total box card */}
                <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <CircleDollarSign className="w-24 h-24" />
                  </div>

                  <span className="text-[9px] font-black text-indigo-350 uppercase tracking-widest block mb-2">Estado Financiero</span>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm text-indigo-200/90 font-medium">
                      <span>Cargos Brutos:</span>
                      <span className="font-bold">${folioDetails?.totals.charges.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-indigo-200/90 font-medium">
                      <span>Descuentos y Créditos:</span>
                      <span className="font-bold">-${folioDetails?.totals.discounts.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-indigo-200/90 font-medium">
                      <span>Pagos Registrados:</span>
                      <span className="font-bold">-${folioDetails?.totals.payments.toFixed(2)}</span>
                    </div>
                    
                    <div className="border-t border-white/10 pt-3 flex justify-between items-end">
                      <div>
                        <span className="text-[9px] font-black text-indigo-350 uppercase tracking-widest block mb-0.5">Saldo Pendiente</span>
                        <span className="text-3xl font-black">${folioDetails?.totals.balance.toFixed(2)}</span>
                      </div>
                      <span className="text-xs font-black text-indigo-200 bg-white/10 px-2 py-0.5 rounded uppercase">
                        {folioDetails?.totals.currency}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Fiscal Documents Invoices panel */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <h4 className="text-slate-800 font-black text-sm flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-indigo-500" />
                    Emisión de Facturas y Comprobantes
                  </h4>
                  
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Emite facturas fiscales autorizadas por ARCA (AFIP) o comprobantes comerciales de proforma.
                  </p>

                  <div className="space-y-2 pt-2">
                    <button
                      onClick={() => setIsInvoiceModalOpen(true)}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" /> Emitir Factura / Proforma
                    </button>
                    <button
                      onClick={handleExportLibroIva}
                      className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Download className="w-4 h-4" /> Exportar Libro IVA Digital (AFIP)
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )
        ) : activeTab === 'close' ? (
          /* DAILY CLOSE REPORTS */
          <div className="space-y-6 flex-1">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Cierre de Caja y Conciliación Diario</h2>
              <p className="text-slate-500 text-xs mt-0.5">Resumen consolidado de ingresos según las operaciones registradas hoy.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Efectivo en Caja</span>
                <p className="text-2xl font-black text-slate-800">${dailyReport?.totalsByProvider.cash.toLocaleString() || '0'} USD</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Mercado Pago</span>
                <p className="text-2xl font-black text-slate-800">${dailyReport?.totalsByProvider.mercadopago.toLocaleString() || '0'} USD</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Stripe</span>
                <p className="text-2xl font-black text-slate-800">${dailyReport?.totalsByProvider.stripe.toLocaleString() || '0'} USD</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Transferencias</span>
                <p className="text-2xl font-black text-slate-800">${dailyReport?.totalsByProvider.bank_transfer.toLocaleString() || '0'} USD</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-black text-slate-850 text-base">Cierre Impositivo Diario</h3>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Este panel resume la totalidad de comprobantes de facturas emitidas hoy para su conciliación con los reportes de cobros.
              </p>

              <div className="flex justify-between items-center bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold">
                <span className="text-slate-500">Cantidad de Comprobantes hoy:</span>
                <span className="text-slate-800">{dailyReport?.invoicesIssuedCount || 0}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold">
                <span className="text-slate-500">Total Facturado Bruto:</span>
                <span className="text-slate-800">${dailyReport?.revenueTotal.toLocaleString() || '0'} USD</span>
              </div>
            </div>
          </div>
        ) : (
          /* CONFIGURACIÓN FISCAL */
          <div className="space-y-6 flex-1">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Configuración Fiscal de la Propiedad</h2>
              <p className="text-slate-500 text-xs mt-0.5">Define las reglas impositivas, punto de venta y adapters autorizados para facturación.</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 max-w-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">País Emisor</label>
                  <select
                    value={taxProfile.countryCode}
                    onChange={e => setTaxProfile({...taxProfile, countryCode: e.target.value})}
                    className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs focus:border-indigo-500 outline-none font-medium"
                  >
                    <option value="AR">Argentina (Default)</option>
                    <option value="CL">Chile</option>
                    <option value="BR">Brasil</option>
                    <option value="UY">Uruguay</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Condición Frente al IVA</label>
                  <select
                    value={taxProfile.vatCondition}
                    onChange={e => setTaxProfile({...taxProfile, vatCondition: e.target.value})}
                    className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs focus:border-indigo-555 outline-none font-medium"
                  >
                    <option value="responsable_inscripto">Responsable Inscripto</option>
                    <option value="monotributo">Monotributo</option>
                    <option value="exento">Exento</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Punto de Venta Homologado</label>
                  <input 
                    type="number"
                    value={taxProfile.pointOfSale}
                    onChange={e => setTaxProfile({...taxProfile, pointOfSale: Number(e.target.value)})}
                    className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs focus:border-indigo-500 outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Conexión ARCA (AFIP)</label>
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={taxProfile.arcaEnabled}
                      onChange={e => setTaxProfile({...taxProfile, arcaEnabled: e.target.checked})}
                      className="w-4 h-4 rounded text-indigo-650 focus:ring-indigo-500 border-slate-300"
                    />
                    <span className="text-xs text-slate-650 font-bold">Habilitar Factura Electrónica</span>
                  </label>
                </div>
              </div>

              <button
                onClick={() => {
                  localStorage.setItem('pms_tax_profile', JSON.stringify(taxProfile));
                  alert('¡Configuración fiscal de la propiedad guardada exitosamente!');
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-sm transition-colors"
              >
                Guardar Configuración
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Charge Modal */}
      {isChargeModalOpen && (
        <Modal isOpen={isChargeModalOpen} onClose={() => setIsChargeModalOpen(false)} title="Cargar Consumo Extra al Folio">
          <form onSubmit={handleAddCharge} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Tipo de Cargo</label>
              <select
                value={chargeForm.entryType}
                onChange={e => setChargeForm({ ...chargeForm, entryType: e.target.value as any })}
                className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs focus:border-indigo-500 outline-none"
              >
                <option value="extra_charge">Cargo Extra (Minibar / Restauración / Spa)</option>
                <option value="room_charge">Cargo de Habitación (Noches)</option>
                <option value="discount">Descuento Especial</option>
                <option value="adjustment">Ajuste Manual</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Descripción / Concepto</label>
              <input 
                type="text" required
                value={chargeForm.description}
                onChange={e => setChargeForm({ ...chargeForm, description: e.target.value })}
                placeholder="Ej: Consumo Minibar Coca Cola + Papas"
                className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs focus:border-indigo-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Monto Unitario (USD)</label>
                <input 
                  type="number" required min="0" step="any"
                  value={chargeForm.unitAmount || ''}
                  onChange={e => setChargeForm({ ...chargeForm, unitAmount: Number(e.target.value) })}
                  className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Cantidad</label>
                <input 
                  type="number" required min="1"
                  value={chargeForm.quantity}
                  onChange={e => setChargeForm({ ...chargeForm, quantity: Number(e.target.value) })}
                  className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs focus:border-indigo-500 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-sm transition-colors"
            >
              Confirmar y Agregar Cargo
            </button>
          </form>
        </Modal>
      )}

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Registrar Cobro / Recibo de Pago">
          <form onSubmit={handleAddPayment} className="space-y-4">
             <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Método de Pago / Pasarela</label>
              <select
                value={showCustomMethodInput ? 'custom' : paymentForm.provider}
                onChange={e => {
                  const val = e.target.value;
                  if (val === 'custom') {
                    setShowCustomMethodInput(true);
                  } else {
                    setShowCustomMethodInput(false);
                    setPaymentForm({ 
                      ...paymentForm, 
                      provider: val
                    });
                  }
                }}
                className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs focus:border-indigo-500 outline-none"
              >
                {paymentMethods.map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
                <option value="custom">✏️ Otro (Personalizado...)</option>
              </select>
            </div>

            {showCustomMethodInput && (
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Nombre del Método Personalizado</label>
                <input 
                  type="text" required
                  value={customMethodName}
                  onChange={e => setCustomMethodName(e.target.value)}
                  placeholder="Ej: EFT, Transferencia Galicia, Tarjeta Mastercard"
                  className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs focus:border-indigo-500 outline-none"
                />
              </div>
            )}

            {/* Checklist of consumption entries to include in this payment */}
            <div className="space-y-2 border-t border-slate-100 pt-4">
              <label className="block text-xs font-bold text-slate-500 mb-1">Seleccionar consumos a incluir en este cobro:</label>
              <div className="max-h-40 overflow-y-auto space-y-1.5 bg-slate-50 border border-slate-200 p-3 rounded-2xl">
                {folioDetails?.entries.map((entry: any) => {
                  const isChecked = selectedEntryIds.includes(entry.id);
                  return (
                    <label key={entry.id} className="flex items-center justify-between text-xs cursor-pointer p-1 rounded hover:bg-slate-100/50 transition-colors">
                      <span className="flex items-center gap-2">
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            let updatedIds = [...selectedEntryIds];
                            if (e.target.checked) {
                              updatedIds.push(entry.id);
                            } else {
                              updatedIds = updatedIds.filter(id => id !== entry.id);
                            }
                            setSelectedEntryIds(updatedIds);
                            
                            // Dynamic amount calculation
                            const sum = folioDetails?.entries
                              .filter((ent: any) => updatedIds.includes(ent.id))
                              .reduce((s: number, ent: any) => s + Number(ent.gross_amount), 0) || 0;
                            setPaymentForm(prev => ({ ...prev, amount: sum }));
                          }}
                          className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                        />
                        <span className="font-semibold text-slate-700">{entry.description}</span>
                      </span>
                      <span className="font-extrabold text-slate-800">${Number(entry.gross_amount).toFixed(2)}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Monto a Cobrar</label>
                <input 
                  type="number" required min="0.01" step="any"
                  value={paymentForm.amount || ''}
                  onChange={e => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                  className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Moneda</label>
                <select
                  value={paymentForm.currency}
                  onChange={e => setPaymentForm({ ...paymentForm, currency: e.target.value })}
                  className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs focus:border-indigo-500 outline-none"
                >
                  <option value="USD">USD</option>
                  <option value="ARS">ARS</option>
                  <option value="CLP">CLP</option>
                  <option value="BRL">BRL</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Referencia / Comprobante Externo</label>
              <input 
                type="text"
                value={paymentForm.externalReference}
                onChange={e => setPaymentForm({ ...paymentForm, externalReference: e.target.value })}
                placeholder="Ej: N° Transacción o Código Aprobación"
                className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs focus:border-indigo-500 outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-sm transition-colors"
            >
              Registrar Cobro
            </button>
          </form>
        </Modal>
      )}

      {/* Invoice Modal */}
      {isInvoiceModalOpen && (
        <Modal isOpen={isInvoiceModalOpen} onClose={() => setIsInvoiceModalOpen(false)} title="Emitir Factura / Comprobante">
          <form onSubmit={handleIssueInvoice} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Tipo de Emisión</label>
              <select
                value={invoiceForm.mode}
                onChange={e => setInvoiceForm({ ...invoiceForm, mode: e.target.value as any })}
                className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs focus:border-indigo-500 outline-none"
              >
                <option value="fiscal">Factura Fiscal Electrónica (ARCA/AFIP)</option>
                <option value="proforma">Proforma Comercial (Sin validez fiscal)</option>
              </select>
            </div>

            {invoiceForm.mode === 'fiscal' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Clase de Documento</label>
                  <select
                    value={invoiceForm.documentClass}
                    onChange={e => setInvoiceForm({ ...invoiceForm, documentClass: e.target.value as any })}
                    className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs focus:border-indigo-500 outline-none"
                  >
                    <option value="A">Factura A (Inscripto)</option>
                    <option value="B">Factura B (Consumidor Final)</option>
                    <option value="C">Factura C (Monotributo)</option>
                    <option value="E">Factura E (Exportación)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Punto de Venta</label>
                  <input 
                    type="number" required min="1"
                    value={invoiceForm.pointOfSale}
                    onChange={e => setInvoiceForm({ ...invoiceForm, pointOfSale: Number(e.target.value) })}
                    className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-indigo-650 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-sm transition-colors"
            >
              Confirmar y Emitir Comprobante
            </button>
          </form>
        </Modal>
      )}

      {isBookingModalOpen && activeBooking && (
        <Modal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          title="Detalle de Reserva"
          size="4xl"
        >
          <BookingForm
            initialBooking={activeBooking}
            onSuccess={() => {
              setIsBookingModalOpen(false);
              loadFolio(selectedBookingId!);
            }}
            onCancel={() => setIsBookingModalOpen(false)}
          />
        </Modal>
      )}

    </div>
  );
}

export default function BillingDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500 text-sm font-bold animate-pulse">Cargando módulo de facturación...</div>
      </div>
    }>
      <BillingDashboardContent />
    </Suspense>
  );
}
