const fs = require('fs');

const generateInventory = () => {
  const unitTypes = [
    { id: 'ut_std', name: 'Standard Room', base_price: 80, max_pax: 2 },
    { id: 'ut_sup', name: 'Superior Room', base_price: 120, max_pax: 2 },
    { id: 'ut_dlx', name: 'Deluxe Room', base_price: 180, max_pax: 3 },
    { id: 'ut_ste', name: 'Suite', base_price: 250, max_pax: 4 },
    { id: 'ut_fam', name: 'Family Room', base_price: 200, max_pax: 5 },
    { id: 'ut_pst', name: 'Presidential Suite', base_price: 500, max_pax: 4 }
  ];

  let units = [];
  unitTypes.forEach((ut, idx) => {
    const count = ut.id === 'ut_pst' ? 2 : ut.id === 'ut_ste' ? 5 : 10;
    const floor = (idx + 1);
    for (let i = 1; i <= count; i++) {
      const num = floor * 100 + i;
      units.push({
        id: `u_${ut.id}_${i}`,
        property_id: 'prop_1',
        unit_type_id: ut.id,
        name: `${num}`,
        status: i % 10 === 0 ? 'out_of_service' : 'active',
        housekeeping_status: i % 3 === 0 ? 'dirty' : 'clean'
      });
    }
  });

  const content = `import { UnitType, Unit, RatePlan } from '../types/inventory';

export const mockUnitTypes: UnitType[] = ${JSON.stringify(unitTypes.map(ut => ({
  ...ut, property_id: 'prop_1', description: ut.name + ' with great amenities.', amenities: ['Wi-Fi', 'TV']
})), null, 2)};

export const mockUnits: Unit[] = ${JSON.stringify(units, null, 2)};

export const mockRatePlans: RatePlan[] = [
  { id: 'rp_1', property_id: 'prop_1', name: 'Tarifa Estándar', is_default: true, description: 'Tarifa base (Rack)' },
  { id: 'rp_2', property_id: 'prop_1', name: 'No Reembolsable', is_default: false, description: 'Descuento 10% por pago adelantado', parent_plan_id: 'rp_1', discount_type: 'percent', discount_value: 10 },
  { id: 'rp_3', property_id: 'prop_1', name: 'Larga Estadía (7+)', is_default: false, description: 'Descuento 15% para estancias largas', parent_plan_id: 'rp_1', discount_type: 'percent', discount_value: 15 },
  { id: 'rp_4', property_id: 'prop_1', name: 'Tarifa Corporativa', is_default: false, description: 'Descuento fijo de $20', parent_plan_id: 'rp_1', discount_type: 'fixed', discount_value: 20 }
];
export const mockRateRules = [
  { id: 'rr_demo_1', rate_plan_id: 'rp_1', unit_type_id: 'ut_std', season_name: 'Tarifa General', start_date: '2026-01-01', end_date: '2026-12-31', price: 80, min_nights: 1 },
  { id: 'rr_demo_2', rate_plan_id: 'rp_1', unit_type_id: 'ut_sup', season_name: 'Tarifa General', start_date: '2026-01-01', end_date: '2026-12-31', price: 120, min_nights: 1 },
  { id: 'rr_demo_3', rate_plan_id: 'rp_1', unit_type_id: 'ut_dlx', season_name: 'Tarifa General', start_date: '2026-01-01', end_date: '2026-12-31', price: 180, min_nights: 1 },
  { id: 'rr_demo_4', rate_plan_id: 'rp_1', unit_type_id: 'ut_ste', season_name: 'Tarifa General', start_date: '2026-01-01', end_date: '2026-12-31', price: 250, min_nights: 2 },
  { id: 'rr_demo_5', rate_plan_id: 'rp_1', unit_type_id: 'ut_fam', season_name: 'Tarifa General', start_date: '2026-01-01', end_date: '2026-12-31', price: 200, min_nights: 2 },
  { id: 'rr_demo_6', rate_plan_id: 'rp_1', unit_type_id: 'ut_pst', season_name: 'Tarifa General', start_date: '2026-01-01', end_date: '2026-12-31', price: 500, min_nights: 3 }
];
export const mockDailyRates = [];
`;
  fs.writeFileSync('./mock/inventory.ts', content);
  return { unitTypes, units };
};

const generateBookings = (unitTypes, units) => {
  const statuses = ['confirmed', 'deposit_paid', 'pending_payment', 'checked_in', 'checked_out'];
  const sources = ['Booking.com', 'WhatsApp', 'Email', 'Web', 'Directo'];
  let bookings = [];
  
  const today = new Date();
  
  for (let i = 0; i < 150; i++) {
    const unit = units[Math.floor(Math.random() * units.length)];
    const ut = unitTypes.find(u => u.id === unit.unit_type_id);
    
    // random start date between -10 and +30 days from today
    const startOffset = Math.floor(Math.random() * 40) - 10;
    const nights = Math.floor(Math.random() * 5) + 1;
    
    const checkIn = new Date(today);
    checkIn.setDate(today.getDate() + startOffset);
    
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkIn.getDate() + nights);
    
    bookings.push({
      id: `b_demo_${i}`,
      property_id: 'prop_1',
      confirmation_id: 'RES-DM' + i,
      created_at: new Date(today.getTime() - Math.random() * 10000000000).toISOString(),
      first_name: 'Demo',
      last_name: 'Guest ' + i,
      email: 'guest' + i + '@demo.com',
      phone: '123456789',
      nationality: 'Demo',
      source: sources[Math.floor(Math.random() * sources.length)],
      unit_type_id: unit.unit_type_id,
      room_id: unit.id,
      check_in: checkIn.toISOString().split('T')[0],
      check_out: checkOut.toISOString().split('T')[0],
      booking_status: statuses[Math.floor(Math.random() * statuses.length)],
      nightly_rate: ut.base_price,
      total_nights: nights,
      subtotal: ut.base_price * nights,
      discount_type: 'none',
      discount_value: 0,
      total_amount: ut.base_price * nights,
      pax: Math.floor(Math.random() * ut.max_pax) + 1
    });
  }
  
  const content = `import { Booking } from '../types';

export const mockBookings: Booking[] = ${JSON.stringify(bookings, null, 2)};
`;
  fs.writeFileSync('./mock/bookings.ts', content);
};

const { unitTypes, units } = generateInventory();
generateBookings(unitTypes, units);
console.log('Demo data generated successfully!');
