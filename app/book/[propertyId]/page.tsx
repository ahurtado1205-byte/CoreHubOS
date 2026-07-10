'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { usePMS } from '../../../context/PMSContext';
import { usePricing } from '../../../hooks/usePricing';
import { Calendar, Users, Tag, Search, User, Mail, Phone, ChevronRight, Check, FileText } from 'lucide-react';
import { format, addDays, parseISO, differenceInDays } from 'date-fns';
import { UnitType, RatePlan } from '../../../types/inventory';
import { themePresets } from '../../../lib/themeConfig';

export default function BookingEnginePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const propertyId = params.propertyId as string;
  const { properties, unitTypes, ratePlans, addBooking, addQuote, isInitialized, promotions, quotes, units, bookings } = usePMS();
  const { calculatePricingBreakdown } = usePricing();

  const property = properties.find(p => p.id === propertyId);
  const preset = themePresets[property?.theme_preset || 'cozy'] || themePresets.cozy;

  const [checkIn, setCheckIn] = useState<string>(searchParams.get('checkIn') || format(new Date(), 'yyyy-MM-dd'));
  const [checkOut, setCheckOut] = useState<string>(searchParams.get('checkOut') || format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [adults, setAdults] = useState<number>(parseInt(searchParams.get('adults') || '2', 10));
  const [children, setChildren] = useState<number>(parseInt(searchParams.get('children') || '0', 10));
  const [promoCode, setPromoCode] = useState<string>(searchParams.get('promo') || searchParams.get('code') || searchParams.get('promoCode') || '');

  // Find active promotion matching promoCode
  const activePromo = useMemo(() => {
    if (!promoCode) return null;
    const cleanCode = promoCode.trim().toUpperCase();
    return promotions.find(p => 
      p.property_id === propertyId && 
      p.code.toUpperCase() === cleanCode && 
      p.is_active &&
      new Date().toISOString().split('T')[0] >= p.valid_from &&
      new Date().toISOString().split('T')[0] <= p.valid_until
    ) || null;
  }, [promoCode, promotions, propertyId]);
  
  const [hasSearched, setHasSearched] = useState(!!searchParams.get('checkIn')); // Auto-search if params provided

  const [availableUnits, setAvailableUnits] = useState<UnitType[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<UnitType | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<RatePlan | null>(null);
  const [showRatePlansForUnit, setShowRatePlansForUnit] = useState<UnitType | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);

  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');

  const handleSearch = () => {
    const startIn = parseISO(checkIn);
    const endOut = parseISO(checkOut);

    // Filter unit types that have at least one free physical room for these dates
    const propUnitTypes = unitTypes.filter(ut => {
      if (ut.property_id !== propertyId) return false;

      // Find all physical rooms of this unit type
      const categoryRooms = units.filter(u => u.unit_type_id === ut.id);
      if (categoryRooms.length === 0) return false;

      // Check if there is at least one room without overlapping bookings
      const hasFreeRoom = categoryRooms.some(room => {
        const hasOverlap = bookings.some(b => {
          if (b.room_id !== room.id) return false;
          if (b.booking_status === 'cancelled') return false;
          const bIn = parseISO(b.check_in);
          const bOut = parseISO(b.check_out);
          return (startIn < bOut) && (endOut > bIn);
        });
        return !hasOverlap;
      });

      return hasFreeRoom;
    });

    setAvailableUnits(propUnitTypes);
    setHasSearched(true);
    setSelectedUnit(null);
    setSelectedPlan(null);
    setShowRatePlansForUnit(null);
  };

  // Auto-search on mount if params exist
  useEffect(() => {
    if (searchParams.get('checkIn')) {
      handleSearch();
    }
  }, []);

  const handleBookOrQuote = async (actionType: 'booking' | 'quote') => {
    const nameParts = guestName.trim().split(/\s+/);
    const firstName = nameParts[0] || 'Huésped';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Calculate nights
    const start = parseISO(checkIn);
    const end = parseISO(checkOut);
    const totalNights = Math.max(1, differenceInDays(end, start));
    
    // Calculate price
    const pricing = calculatePricingBreakdown(selectedUnit?.id || '', selectedPlan?.id || '', checkIn, checkOut, 0);
    
    let finalAmount = pricing.total;
    let discountVal = 0;
    let discountType: 'none' | 'percent' | 'fixed' = 'none';

    if (activePromo) {
      discountType = (activePromo.discount_type === 'percentage' || activePromo.discount_type === 'percent') ? 'percent' : 'fixed';
      discountVal = activePromo.discount_value;
      
      let discountAmount = 0;
      if (discountType === 'percent') {
        discountAmount = pricing.total * (activePromo.discount_value / 100);
      } else {
        discountAmount = activePromo.discount_value;
      }
      finalAmount = Math.max(0, pricing.total - discountAmount);
    }

    // Find a free physical room (unit) of the selected category for these dates to reserve in PMS
    const startIn = parseISO(checkIn);
    const endOut = parseISO(checkOut);
    const categoryRooms = units.filter(u => u.unit_type_id === selectedUnit?.id);
    const assignedRoom = categoryRooms.find(room => {
      // Must not have overlapping bookings
      const hasOverlap = bookings.some(b => {
        if (b.room_id !== room.id) return false;
        if (b.booking_status === 'cancelled') return false;
        const bIn = parseISO(b.check_in);
        const bOut = parseISO(b.check_out);
        return (startIn < bOut) && (endOut > bIn);
      });
      return !hasOverlap;
    });
    const assignedRoomId = assignedRoom ? assignedRoom.id : (categoryRooms[0]?.id || undefined);

    // Auto-link quote by email or phone match
    const cleanPhone = guestPhone.replace(/\D/g, '');
    const matchingQuote = quotes.find(q => {
      const qPhoneClean = q.phone ? q.phone.replace(/\D/g, '') : '';
      const emailMatches = guestEmail && q.email?.toLowerCase().trim() === guestEmail.toLowerCase().trim();
      const phoneMatches = cleanPhone && qPhoneClean && qPhoneClean.includes(cleanPhone);
      return q.status !== 'booked' && (emailMatches || phoneMatches);
    });

    if (actionType === 'booking') {
      const bookingPayload = {
        id: `b_motor_${Date.now()}`,
        property_id: propertyId,
        first_name: firstName,
        last_name: lastName,
        email: guestEmail,
        phone: guestPhone,
        check_in: checkIn,
        check_out: checkOut,
        booking_status: 'pre_booked' as const, // Ingrese como Pre-Reserva
        room_id: assignedRoomId, // Asigna habitación física y resta de inventario
        pax: adults + children,
        unit_type_id: selectedUnit?.id || '',
        rate_plan_id: selectedPlan?.id || '',
        total_nights: totalNights,
        subtotal: pricing.total,
        discount_type: discountType,
        discount_value: discountVal,
        total_amount: finalAmount,
        source: 'Motor de Reservas',
        notes: 'Reserva automática realizada a través del Motor de Reservas.', // Informacion en notes y no en el nombre
        quote_id: matchingQuote ? matchingQuote.id : undefined, // Bind to quote
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const res = await addBooking(bookingPayload);
      if (res) {
        alert('¡Reserva confirmada con éxito! Ya puedes verla en tu PMS.');
        setShowCheckout(false);
      } else {
        alert('Hubo un error al procesar tu reserva.');
      }
    } else {
      const quotePayload = {
        id: `q_motor_${Date.now()}`,
        property_id: propertyId,
        first_name: firstName,
        last_name: lastName,
        email: guestEmail,
        phone: guestPhone,
        check_in: checkIn,
        check_out: checkOut,
        pax: adults + children,
        rooms_count: 1,
        status: 'new' as const,
        unit_type_id: selectedUnit?.id || '',
        rate_plan_id: selectedPlan?.id || '',
        total_amount: finalAmount,
        source: 'Motor de Reservas',
        notes: 'Solicitud de cotización realizada a través del Motor de Reservas.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        total_nights: totalNights
      };

      const res = await addQuote(quotePayload);
      if (res) {
        alert('¡Solicitud de cotización enviada con éxito! Ya puedes verla en tu CRM.');
        setShowCheckout(false);
      } else {
        alert('Hubo un error al procesar tu solicitud.');
      }
    }
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-400 text-sm font-semibold">Cargando motor de reservas...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return <div className="p-8 text-center text-xl font-medium">Property not found.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 py-6 px-4 md:px-8 sticky top-0 z-40 bg-opacity-90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {property.booking_engine_logo && (
              <img src={property.booking_engine_logo} alt={property.name} className="h-10 w-auto object-contain rounded" />
            )}
            <div>
              <h1 className="text-2xl font-bold" style={{ color: property.booking_engine_color || '#312e81' }}>
                {property.name}
              </h1>
              <p className="text-sm text-slate-500">Book your perfect stay</p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero & Search */}
      <div className="text-white pt-12 pb-24 px-4 relative overflow-hidden" style={{ backgroundColor: property.booking_engine_color || '#312e81' }}>
        <div 
          className="absolute inset-0 opacity-20 bg-cover bg-center" 
          style={{ backgroundImage: `url('${property.booking_engine_hero || 'https://images.unsplash.com/photo-1542314831-c6a4d14faaf2?q=80&w=2000&auto=format&fit=crop'}')` }}
        ></div>
        <div className="max-w-6xl mx-auto relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-center">Find your next escape</h2>
          
          <div className="bg-white/10 backdrop-blur-md p-4 md:p-6 rounded-2xl border border-white/20 shadow-xl max-w-4xl mx-auto mt-8 flex flex-col md:flex-row gap-4 items-end">
            
            <div className="flex-1 w-full">
              <label className="block text-xs uppercase tracking-wider font-semibold text-indigo-100 mb-1">Check-In</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-200" />
                <input 
                  type="date" 
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                />
              </div>
            </div>

            <div className="flex-1 w-full">
              <label className="block text-xs uppercase tracking-wider font-semibold text-indigo-100 mb-1">Check-Out</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-200" />
                <input 
                  type="date" 
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                />
              </div>
            </div>

            <div className="w-full md:w-24">
              <label className="block text-xs uppercase tracking-wider font-semibold text-indigo-100 mb-1">Adults</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-200" />
                <input 
                  type="number" 
                  min="1"
                  value={adults}
                  onChange={(e) => setAdults(parseInt(e.target.value))}
                  className="w-full pl-10 pr-2 py-3 bg-white/20 border border-white/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
            </div>

            <div className="w-full md:w-32">
              <label className="block text-xs uppercase tracking-wider font-semibold text-indigo-100 mb-1">Promo Code</label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-200" />
                <input 
                  type="text" 
                  placeholder="Code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
            </div>

            <button 
              onClick={handleSearch}
              className="w-full md:w-auto px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Search className="w-5 h-5" />
              Search
            </button>

          </div>
        </div>
      </div>

      {/* Results */}
      {hasSearched && (
        <div className="max-w-6xl mx-auto px-4 -mt-10 relative z-20">
          {availableUnits.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-lg border border-slate-100">
              <p className="text-slate-500 text-lg">No availability found for your dates. Try adjusting your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableUnits.map(unit => {
                // Filter rate plans for this unit or general property rate plans
                const plans = ratePlans.filter(rp => rp.property_id === propertyId);
                
                return (
                  <div 
                    key={unit.id} 
                    onClick={() => setShowRatePlansForUnit(unit)}
                    className="bg-white rounded-2xl overflow-hidden shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col transition-all hover:-translate-y-1 hover:shadow-2xl cursor-pointer group"
                  >
                    <div className="h-56 bg-slate-200 relative overflow-hidden">
                      <img 
                        src={unit.images && unit.images.length > 0 ? unit.images[0] : `https://images.unsplash.com/photo-1578683010236-d716f9a3f461?q=80&w=800&auto=format&fit=crop&random=${unit.id}`} 
                        alt={unit.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      <div className="absolute bottom-4 left-4 right-4 text-white">
                        <h3 className="text-2xl font-bold mb-1">{unit.name}</h3>
                        <div className="flex items-center gap-3 text-sm opacity-90">
                           <span className="flex items-center gap-1"><Users className="w-4 h-4"/> Max {unit.max_pax}</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <p className="text-sm text-slate-500 mb-4 line-clamp-2">{unit.description}</p>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {unit.amenities?.slice(0, 3).map((am, i) => (
                          <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md border border-slate-200">
                            {am}
                          </span>
                        ))}
                        {unit.amenities?.length > 3 && (
                          <span className="text-xs bg-slate-50 text-slate-400 px-2 py-1 rounded-md border border-slate-100">
                            +{unit.amenities.length - 3} more
                          </span>
                        )}
                      </div>

                      <div className="mt-auto">
                        <div className="w-full py-3 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 group-hover:bg-indigo-600 group-hover:text-white">
                          Ver Tarifas <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Rate Plans Modal */}
      {showRatePlansForUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            
            <div className="relative h-48 sm:h-64 shrink-0">
               <img 
                 src={showRatePlansForUnit.images && showRatePlansForUnit.images.length > 0 ? showRatePlansForUnit.images[0] : `https://images.unsplash.com/photo-1578683010236-d716f9a3f461?q=80&w=800&auto=format&fit=crop&random=${showRatePlansForUnit.id}`} 
                 alt={showRatePlansForUnit.name}
                 className="w-full h-full object-cover"
               />
               <button 
                 onClick={() => setShowRatePlansForUnit(null)} 
                 className="absolute top-4 right-4 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors"
               >
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
               <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
               <div className="absolute bottom-6 left-6 text-white">
                 <h2 className="text-3xl font-black">{showRatePlansForUnit.name}</h2>
               </div>
            </div>

            <div className="p-6 overflow-y-auto bg-slate-50">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Selecciona tu tarifa</h3>
              
              <div className="space-y-4">
                {ratePlans.filter(rp => rp.property_id === propertyId).map(plan => {
                  const pricing = calculatePricingBreakdown(showRatePlansForUnit.id, plan.id, checkIn, checkOut, 0);
                  if (pricing.total === 0) return null;

                  return (
                    <div 
                      key={plan.id} 
                      onClick={() => {
                        setSelectedUnit(showRatePlansForUnit);
                        setSelectedPlan(plan);
                        setShowRatePlansForUnit(null);
                        setShowCheckout(true);
                      }}
                      className="bg-white border-2 border-transparent hover:border-indigo-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-slate-800 text-lg group-hover:text-indigo-600 transition-colors">{plan.name}</h4>
                          <p className="text-sm text-slate-500 mt-1">{plan.cancellation_policy || 'Standard cancellation policy'}</p>
                        </div>
                        <div className="text-right">
                          <span className="block text-2xl font-black text-emerald-600">${pricing.total.toFixed(2)}</span>
                          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total por {pricing.nights} noches</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && selectedUnit && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
            <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-2xl font-bold text-slate-800">Complete your booking</h2>
              <button onClick={() => setShowCheckout(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8">
              {/* Summary */}
              <div className="md:w-1/2 space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-indigo-900 uppercase tracking-wider mb-2">Stay Details</h3>
                  <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                    <p className="font-bold text-slate-800">{selectedUnit.name}</p>
                    <p className="text-sm text-slate-600 mb-3">{selectedPlan.name}</p>
                    <div className="flex justify-between text-sm text-slate-600 py-1 border-t border-indigo-100/50 mt-2 pt-2">
                      <span>Check-in</span>
                      <span className="font-medium text-slate-800">{format(parseISO(checkIn), 'MMM d, yyyy')}</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-600 py-1">
                      <span>Check-out</span>
                      <span className="font-medium text-slate-800">{format(parseISO(checkOut), 'MMM d, yyyy')}</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-600 py-1">
                      <span>Guests</span>
                      <span className="font-medium text-slate-800">{adults} Adults, {children} Children</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-indigo-900 uppercase tracking-wider mb-2">Price Summary</h3>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
                    {(() => {
                      const p = calculatePricingBreakdown(selectedUnit.id, selectedPlan.id, checkIn, checkOut, 0);
                      let finalTotal = p.total;
                      let discountAmount = 0;
                      
                      if (activePromo) {
                        if (activePromo.discount_type === 'percentage' || activePromo.discount_type === 'percent') {
                          discountAmount = p.total * (activePromo.discount_value / 100);
                        } else {
                          discountAmount = activePromo.discount_value;
                        }
                        finalTotal = Math.max(0, p.total - discountAmount);
                      }

                      return (
                        <>
                          <div className="flex justify-between text-sm text-slate-600">
                            <span>{p.nights} nights x ${p.nightlyAvg.toFixed(2)}</span>
                            <span>${p.baseTotal.toFixed(2)}</span>
                          </div>

                          {activePromo && (
                            <div className="flex justify-between text-sm text-emerald-600 font-bold">
                              <span>Promo ({activePromo.code} - {activePromo.discount_type === 'percentage' || activePromo.discount_type === 'percent' ? `${activePromo.discount_value}%` : `$${activePromo.discount_value}`})</span>
                              <span>-${discountAmount.toFixed(2)}</span>
                            </div>
                          )}

                          <div className="flex justify-between font-bold text-lg text-slate-800 pt-3 border-t border-slate-200 mt-2">
                            <span>Total</span>
                            <span className="text-emerald-600">${finalTotal.toFixed(2)}</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Form */}
              <div className="md:w-1/2 space-y-4">
                <h3 className="text-sm font-semibold text-indigo-900 uppercase tracking-wider mb-2">Guest Information</h3>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="email" 
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="tel" 
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="+1 234 567 890"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-4">
                  <button 
                    onClick={() => handleBookOrQuote('booking')}
                    disabled={!guestName || !guestEmail || !guestPhone}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-base shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    Confirmar Pre-Reserva 🔑
                  </button>

                  <button 
                    onClick={() => handleBookOrQuote('quote')}
                    disabled={!guestName || !guestEmail || !guestPhone}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-base shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <FileText className="w-5 h-5" />
                    Solicitar Cotización 📄
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating WhatsApp Button */}
      {(() => {
        const phone = property.phone || '+54 9 11 1234 5678';
        const message = property.website_whatsapp_message || '¡Hola! Me gustaría consultar disponibilidad.';
        return (
          <a 
            href={`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#128C7E] text-white p-4 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 group flex items-center justify-center animate-bounce animate-duration-3000"
            title="Contactanos por WhatsApp"
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
