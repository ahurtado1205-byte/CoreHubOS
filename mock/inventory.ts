import { UnitType, Unit, RatePlan } from '../types/inventory';

export const mockUnitTypes: UnitType[] = [
  {
    "id": "ut_std",
    "name": "Standard Room",
    "base_price": 80,
    "max_pax": 2,
    "property_id": "prop_1",
    "description": "Standard Room with great amenities.",
    "amenities": [
      "Wi-Fi",
      "TV"
    ],
    "images": ["https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=2070"]
  },
  {
    "id": "ut_sup",
    "name": "Superior Room",
    "base_price": 120,
    "max_pax": 2,
    "property_id": "prop_1",
    "description": "Superior Room with great amenities.",
    "amenities": [
      "Wi-Fi",
      "TV"
    ],
    "images": ["https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=2074"]
  },
  {
    "id": "ut_dlx",
    "name": "Deluxe Room",
    "base_price": 180,
    "max_pax": 3,
    "property_id": "prop_1",
    "description": "Deluxe Room with great amenities.",
    "amenities": [
      "Wi-Fi",
      "TV"
    ],
    "images": ["https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=2070"]
  },
  {
    "id": "ut_ste",
    "name": "Suite",
    "base_price": 250,
    "max_pax": 4,
    "property_id": "prop_1",
    "description": "Suite with great amenities.",
    "amenities": [
      "Wi-Fi",
      "TV"
    ],
    "images": ["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=2070"]
  },
  {
    "id": "ut_fam",
    "name": "Family Room",
    "base_price": 200,
    "max_pax": 5,
    "property_id": "prop_1",
    "description": "Family Room with great amenities.",
    "amenities": [
      "Wi-Fi",
      "TV"
    ],
    "images": ["https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?q=80&w=2070"]
  },
  {
    "id": "ut_pst",
    "name": "Presidential Suite",
    "base_price": 500,
    "max_pax": 4,
    "property_id": "prop_1",
    "description": "Presidential Suite with great amenities.",
    "amenities": [
      "Wi-Fi",
      "TV"
    ],
    "images": ["https://images.unsplash.com/photo-1631049552057-403bc0f7a402?q=80&w=2070"]
  }
];

export const mockUnits: Unit[] = [
  {
    "id": "u_ut_std_1",
    "property_id": "prop_1",
    "unit_type_id": "ut_std",
    "name": "101",
    "status": "active",
    "housekeeping_status": "clean"
  },
  {
    "id": "u_ut_std_2",
    "property_id": "prop_1",
    "unit_type_id": "ut_std",
    "name": "102",
    "status": "active",
    "housekeeping_status": "clean"
  },
  {
    "id": "u_ut_std_3",
    "property_id": "prop_1",
    "unit_type_id": "ut_std",
    "name": "103",
    "status": "active",
    "housekeeping_status": "dirty"
  },
  {
    "id": "u_ut_std_4",
    "property_id": "prop_1",
    "unit_type_id": "ut_std",
    "name": "104",
    "status": "active",
    "housekeeping_status": "clean"
  },
  {
    "id": "u_ut_std_5",
    "property_id": "prop_1",
    "unit_type_id": "ut_std",
    "name": "105",
    "status": "active",
    "housekeeping_status": "clean"
  },
  {
    "id": "u_ut_std_6",
    "property_id": "prop_1",
    "unit_type_id": "ut_std",
    "name": "106",
    "status": "active",
    "housekeeping_status": "dirty"
  },
  {
    "id": "u_ut_std_7",
    "property_id": "prop_1",
    "unit_type_id": "ut_std",
    "name": "107",
    "status": "active",
    "housekeeping_status": "clean"
  },
  {
    "id": "u_ut_std_8",
    "property_id": "prop_1",
    "unit_type_id": "ut_std",
    "name": "108",
    "status": "active",
    "housekeeping_status": "clean"
  },
  {
    "id": "u_ut_std_9",
    "property_id": "prop_1",
    "unit_type_id": "ut_std",
    "name": "109",
    "status": "active",
    "housekeeping_status": "dirty"
  },
  {
    "id": "u_ut_std_10",
    "property_id": "prop_1",
    "unit_type_id": "ut_std",
    "name": "110",
    "status": "out_of_service",
    "housekeeping_status": "clean"
  },
  {
    "id": "u_ut_sup_1",
    "property_id": "prop_1",
    "unit_type_id": "ut_sup",
    "name": "201",
    "status": "active",
    "housekeeping_status": "clean"
  },
  {
    "id": "u_ut_sup_2",
    "property_id": "prop_1",
    "unit_type_id": "ut_sup",
    "name": "202",
    "status": "active",
    "housekeeping_status": "clean"
  },
  {
    "id": "u_ut_sup_3",
    "property_id": "prop_1",
    "unit_type_id": "ut_sup",
    "name": "203",
    "status": "active",
    "housekeeping_status": "dirty"
  },
  {
    "id": "u_ut_sup_4",
    "property_id": "prop_1",
    "unit_type_id": "ut_sup",
    "name": "204",
    "status": "active",
    "housekeeping_status": "clean"
  },
  {
    "id": "u_ut_sup_5",
    "property_id": "prop_1",
    "unit_type_id": "ut_sup",
    "name": "205",
    "status": "active",
    "housekeeping_status": "clean"
  },
  {
    "id": "u_ut_sup_6",
    "property_id": "prop_1",
    "unit_type_id": "ut_sup",
    "name": "206",
    "status": "active",
    "housekeeping_status": "dirty"
  },
  {
    "id": "u_ut_sup_7",
    "property_id": "prop_1",
    "unit_type_id": "ut_sup",
    "name": "207",
    "status": "active",
    "housekeeping_status": "clean"
  },
  {
    "id": "u_ut_sup_8",
    "property_id": "prop_1",
    "unit_type_id": "ut_sup",
    "name": "208",
    "status": "active",
    "housekeeping_status": "clean"
  },
  {
    "id": "u_ut_sup_9",
    "property_id": "prop_1",
    "unit_type_id": "ut_sup",
    "name": "209",
    "status": "active",
    "housekeeping_status": "dirty"
  },
  {
    "id": "u_ut_sup_10",
    "property_id": "prop_1",
    "unit_type_id": "ut_sup",
    "name": "210",
    "status": "out_of_service",
    "housekeeping_status": "clean"
  },
  {
    "id": "u_ut_dlx_1",
    "property_id": "prop_1",
    "unit_type_id": "ut_dlx",
    "name": "301",
    "status": "active",
    "housekeeping_status": "clean"
  },
  {
    "id": "u_ut_dlx_2",
    "property_id": "prop_1",
    "unit_type_id": "ut_dlx",
    "name": "302",
    "status": "active",
    "housekeeping_status": "clean"
  },
  {
    "id": "u_ut_dlx_3",
    "property_id": "prop_1",
    "unit_type_id": "ut_dlx",
    "name": "303",
    "status": "active",
    "housekeeping_status": "dirty"
  },
  {
    "id": "u_ut_dlx_4",
    "property_id": "prop_1",
    "unit_type_id": "ut_dlx",
    "name": "304",
    "status": "active",
    "housekeeping_status": "clean"
  },
  {
    "id": "u_ut_dlx_5",
    "property_id": "prop_1",
    "unit_type_id": "ut_dlx",
    "name": "305",
    "status": "active",
    "housekeeping_status": "clean"
  },
  {
    "id": "u_ut_dlx_6",
    "property_id": "prop_1",
    "unit_type_id": "ut_dlx",
    "name": "306",
    "status": "active",
    "housekeeping_status": "dirty"
  },
  {
    "id": "u_ut_dlx_7",
    "property_id": "prop_1",
    "unit_type_id": "ut_dlx",
    "name": "307",
    "status": "active",
    "housekeeping_status": "clean"
  },
  {
    "id": "u_ut_dlx_8",
    "property_id": "prop_1",
    "unit_type_id": "ut_dlx",
    "name": "308",
    "status": "active",
    "housekeeping_status": "clean"
  },
  {
    "id": "u_ut_dlx_9",
    "property_id": "prop_1",
    "unit_type_id": "ut_dlx",
    "name": "309",
    "status": "active",
    "housekeeping_status": "dirty"
  },
  {
    "id": "u_ut_dlx_10",
    "property_id": "prop_1",
    "unit_type_id": "ut_dlx",
    "name": "310",
    "status": "out_of_service",
    "housekeeping_status": "clean"
  },
  {
    "id": "u_ut_ste_1",
    "property_id": "prop_1",
    "unit_type_id": "ut_ste",
    "name": "401",
    "status": "active",
    "housekeeping_status": "clean"
  },
  {
    "id": "u_ut_ste_2",
    "property_id": "prop_1",
    "unit_type_id": "ut_ste",
    "name": "402",
    "status": "active",
    "housekeeping_status": "clean"
  },
  {
    "id": "u_ut_ste_3",
    "property_id": "prop_1",
    "unit_type_id": "ut_ste",
    "name": "403",
    "status": "active",
    "housekeeping_status": "dirty"
  },
  {
    "id": "u_ut_ste_4",
    "property_id": "prop_1",
    "unit_type_id": "ut_ste",
    "name": "404",
    "status": "active",
    "housekeeping_status": "clean"
  },
  {
    "id": "u_ut_ste_5",
    "property_id": "prop_1",
    "unit_type_id": "ut_ste",
    "name": "405",
    "status": "active",
    "housekeeping_status": "clean"
  },
  {
    "id": "u_ut_fam_1",
    "property_id": "prop_1",
    "unit_type_id": "ut_fam",
    "name": "501",
    "status": "active",
    "housekeeping_status": "clean"
  },
  {
    "id": "u_ut_fam_2",
    "property_id": "prop_1",
    "unit_type_id": "ut_fam",
    "name": "502",
    "status": "active",
    "housekeeping_status": "clean"
  },
  {
    "id": "u_ut_fam_3",
    "property_id": "prop_1",
    "unit_type_id": "ut_fam",
    "name": "503",
    "status": "active",
    "housekeeping_status": "dirty"
  },
  {
    "id": "u_ut_fam_4",
    "property_id": "prop_1",
    "unit_type_id": "ut_fam",
    "name": "504",
    "status": "active",
    "housekeeping_status": "clean"
  },
  {
    "id": "u_ut_fam_5",
    "property_id": "prop_1",
    "unit_type_id": "ut_fam",
    "name": "505",
    "status": "active",
    "housekeeping_status": "clean"
  },
  {
    "id": "u_ut_fam_6",
    "property_id": "prop_1",
    "unit_type_id": "ut_fam",
    "name": "506",
    "status": "active",
    "housekeeping_status": "dirty"
  },
  {
    "id": "u_ut_fam_7",
    "property_id": "prop_1",
    "unit_type_id": "ut_fam",
    "name": "507",
    "status": "active",
    "housekeeping_status": "clean"
  },
  {
    "id": "u_ut_fam_8",
    "property_id": "prop_1",
    "unit_type_id": "ut_fam",
    "name": "508",
    "status": "active",
    "housekeeping_status": "clean"
  },
  {
    "id": "u_ut_fam_9",
    "property_id": "prop_1",
    "unit_type_id": "ut_fam",
    "name": "509",
    "status": "active",
    "housekeeping_status": "dirty"
  },
  {
    "id": "u_ut_fam_10",
    "property_id": "prop_1",
    "unit_type_id": "ut_fam",
    "name": "510",
    "status": "out_of_service",
    "housekeeping_status": "clean"
  },
  {
    "id": "u_ut_pst_1",
    "property_id": "prop_1",
    "unit_type_id": "ut_pst",
    "name": "601",
    "status": "active",
    "housekeeping_status": "clean"
  },
  {
    "id": "u_ut_pst_2",
    "property_id": "prop_1",
    "unit_type_id": "ut_pst",
    "name": "602",
    "status": "active",
    "housekeeping_status": "clean"
  }
];

export const mockRatePlans: RatePlan[] = [
  { id: 'rp_1', property_id: '11111111-1111-1111-1111-111111111111', name: 'Tarifa EstÃ¡ndar', is_default: true, description: 'Tarifa base (Rack)' },
  { id: 'rp_2', property_id: '11111111-1111-1111-1111-111111111111', name: 'No Reembolsable', is_default: false, description: 'Descuento 10% por pago adelantado', parent_plan_id: 'rp_1', discount_type: 'percent', discount_value: 10 },
  { id: 'rp_3', property_id: '11111111-1111-1111-1111-111111111111', name: 'Larga EstadÃ­a (7+)', is_default: false, description: 'Descuento 15% para estancias largas', parent_plan_id: 'rp_1', discount_type: 'percent', discount_value: 15 },
  { id: 'rp_4', property_id: '11111111-1111-1111-1111-111111111111', name: 'Tarifa Corporativa', is_default: false, description: 'Descuento fijo de $20', parent_plan_id: 'rp_1', discount_type: 'fixed', discount_value: 20 }
];
export const mockRateRules = [
  { id: 'rr_eb_1', rate_plan_id: 'extra_bed', unit_type_id: 'ut_std', season_name: 'General', start_date: '2026-01-01', end_date: '2026-12-31', price: 20, min_nights: 1 },
  { id: 'rr_eb_2', rate_plan_id: 'extra_bed', unit_type_id: 'ut_fam', season_name: 'General', start_date: '2026-01-01', end_date: '2026-12-31', price: 30, min_nights: 1 },
  { id: 'rr_demo_1', rate_plan_id: 'rp_1', unit_type_id: 'ut_std', season_name: 'Tarifa General', start_date: '2026-01-01', end_date: '2026-12-31', price: 80, min_nights: 1 },
  { id: 'rr_demo_2', rate_plan_id: 'rp_1', unit_type_id: 'ut_sup', season_name: 'Tarifa General', start_date: '2026-01-01', end_date: '2026-12-31', price: 120, min_nights: 1 },
  { id: 'rr_demo_3', rate_plan_id: 'rp_1', unit_type_id: 'ut_dlx', season_name: 'Tarifa General', start_date: '2026-01-01', end_date: '2026-12-31', price: 180, min_nights: 1 },
  { id: 'rr_demo_4', rate_plan_id: 'rp_1', unit_type_id: 'ut_ste', season_name: 'Tarifa General', start_date: '2026-01-01', end_date: '2026-12-31', price: 250, min_nights: 2 },
  { id: 'rr_demo_5', rate_plan_id: 'rp_1', unit_type_id: 'ut_fam', season_name: 'Tarifa General', start_date: '2026-01-01', end_date: '2026-12-31', price: 200, min_nights: 2 },
  { id: 'rr_demo_6', rate_plan_id: 'rp_1', unit_type_id: 'ut_pst', season_name: 'Tarifa General', start_date: '2026-01-01', end_date: '2026-12-31', price: 500, min_nights: 3 }
];
export const mockDailyRates: any[] = [];
import { Promotion } from '../types';

export const mockPromotions: Promotion[] = [
  {
    id: 'promo_1',
    property_id: '11111111-1111-1111-1111-111111111111',
    code: 'VERANO2026',
    name: 'Especial Verano 2026',
    discount_type: 'percentage',
    discount_value: 15,
    valid_from: '2026-01-01',
    valid_until: '2026-03-31',
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'promo_2',
    property_id: '22222222-2222-2222-2222-222222222222',
    code: 'LASTMINUTE',
    name: 'Oferta Último Minuto',
    discount_type: 'fixed',
    discount_value: 50,
    valid_from: '2026-07-01',
    valid_until: '2026-07-31',
    min_nights: 3,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'promo_parejas20',
    property_id: '11111111-1111-1111-1111-111111111111',
    code: 'PAREJAS20',
    name: 'Escapada Romántica Parejas',
    discount_type: 'percentage',
    discount_value: 20,
    valid_from: '2026-01-01',
    valid_until: '2026-12-31',
    is_active: true,
    created_at: new Date().toISOString()
  }
];
