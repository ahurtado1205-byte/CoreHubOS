import { Quote } from '../types';
import { addDays, format } from 'date-fns';

const today = new Date();

export const mockQuotes: Quote[] = [
  {
    id: 'q_1',
    property_id: '11111111-1111-1111-1111-111111111111',
    confirmation_id: 'COT-A1B2',
    first_name: 'Roberto',
    last_name: 'Sánchez',
    email: 'roberto@example.com',
    phone: '5491156789012',
    check_in: format(addDays(today, 10), 'yyyy-MM-dd'),
    check_out: format(addDays(today, 15), 'yyyy-MM-dd'),
    pax: 3,
    extra_beds: 1,
    unit_type_id: 'ut_std', // Standard
    rate_plan_id: 'rp_2', // No Reembolsable (-10%)
    total_amount: 360, // 5 nights x ($80 - 10%) = $360. Extra bed is $0 in the mock rules currently unless specified. Let's say we set an extra bed price in the mock, or we just put a fake amount here. The calculateBreakdown will compute it on the fly in the UI! Wait, in the UI calculateBreakdown looks at rateRules for 'extra_bed'. Since I didn't add an extra_bed rule, extra bed is $0. I should probably add an extra bed rule in gen_demo.js? Actually, the quote just needs extra_beds. The breakdown will recalculate. If extra_bed price is 0, it won't show > 0.
    // Let's hardcode a total_amount lower than RACK. RACK for 5 nights = 400.
    status: 'draft',
    source: 'Website',
    expiration_date: format(addDays(today, 2), 'yyyy-MM-dd'),
    options: [{ currency: 'USD' }]
  },
  {
    id: 'q_2',
    property_id: '11111111-1111-1111-1111-111111111111',
    confirmation_id: 'COT-C3D4',
    first_name: 'Laura',
    last_name: 'Gómez',
    email: 'laura@example.com',
    phone: '5491122334455',
    check_in: format(addDays(today, 20), 'yyyy-MM-dd'),
    check_out: format(addDays(today, 27), 'yyyy-MM-dd'),
    pax: 4,
    extra_beds: 2,
    unit_type_id: 'ut_fam', // Family
    rate_plan_id: 'rp_3', // Larga Estadia (-15%)
    total_amount: 1190, // Calculated on the fly anyway for RACK vs Total.
    status: 'sent',
    source: 'Quiz Funnel: IG Ad',
    expiration_date: format(addDays(today, 5), 'yyyy-MM-dd'),
    options: [{ currency: 'USD' }]
  }
];
