import { usePMS } from '../context/PMSContext';
import { addDays, parseISO, format } from 'date-fns';
import { RatePlan } from '../types/inventory';

export function usePricing() {
  const { dailyRates, rateRules, ratePlans, unitTypes } = usePMS();

  const getBasePriceForDate = (date: string, planId: string, unitTypeId: string): number => {
    const manualOverride = dailyRates.find(r => r.date === date && r.unit_type_id === unitTypeId && r.rate_plan_id === planId);
    if (manualOverride) return manualOverride.price;

    const activeRule = rateRules.find(r => 
      r.unit_type_id === unitTypeId && 
      r.rate_plan_id === planId &&
      date >= r.start_date && date <= r.end_date
    );
    if (activeRule) return activeRule.price;

    if (planId === 'extra_bed') return 40; // Fallback so it works for all unit types without explicit rules

    const ut = unitTypes.find(u => u.id === unitTypeId);
    return ut?.base_price || 0;
  };

  const getPriceForPlanAndDate = (date: string, plan: RatePlan, unitTypeId: string): { price: number, isOverridden: boolean } => {
    const manualOverride = dailyRates.find(r => r.date === date && r.unit_type_id === unitTypeId && r.rate_plan_id === plan.id);
    if (manualOverride) return { price: manualOverride.price, isOverridden: true };

    if (!plan.parent_plan_id) {
      return { price: getBasePriceForDate(date, plan.id, unitTypeId), isOverridden: false };
    }

    const activeRule = rateRules.find(r => 
      r.unit_type_id === unitTypeId && 
      r.rate_plan_id === plan.id &&
      date >= r.start_date && date <= r.end_date
    );
    if (activeRule) return { price: activeRule.price, isOverridden: false };

    const parentPlan = ratePlans.find(p => p.id === plan.parent_plan_id);
    if (!parentPlan) return { price: 0, isOverridden: false };

    const parentPriceResult = getPriceForPlanAndDate(date, parentPlan, unitTypeId);
    let cascadedPrice = parentPriceResult.price;

    if (plan.discount_value) {
      if (plan.discount_type === 'percent') {
        cascadedPrice = cascadedPrice * (1 - plan.discount_value / 100);
      } else {
        cascadedPrice = Math.max(0, cascadedPrice - plan.discount_value);
      }
    }
    return { price: Math.round(cascadedPrice), isOverridden: false };
  };

  const calculateTotal = (unitTypeId: string, ratePlanId: string, checkIn: string, checkOut: string, extraBedsCount: number = 0): number => {
    if (!unitTypeId || !ratePlanId || !checkIn || !checkOut) return 0;
    
    const plan = ratePlans.find(p => p.id === ratePlanId);
    if (!plan) return 0;

    let total = 0;
    const start = parseISO(checkIn);
    const end = parseISO(checkOut);
    
    // Calculate nights difference
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (nights <= 0) return 0;

    for (let i = 0; i < nights; i++) {
      const currentDate = format(addDays(start, i), 'yyyy-MM-dd');
      const { price: basePrice } = getPriceForPlanAndDate(currentDate, plan, unitTypeId);
      const { price: extraBedPrice } = getPriceForPlanAndDate(currentDate, { id: 'extra_bed' } as any, unitTypeId);
      total += basePrice + (extraBedPrice * extraBedsCount);
    }

    return total;
  };

  const calculatePricingBreakdown = (unitTypeId: string, ratePlanId: string, checkIn: string, checkOut: string, extraBedsCount: number = 0) => {
    if (!unitTypeId || !ratePlanId || !checkIn || !checkOut) {
      return { total: 0, baseTotal: 0, extraBedTotal: 0, nights: 0, nightlyAvg: 0, extraBedNightlyAvg: 0 };
    }
    
    const plan = ratePlans.find(p => p.id === ratePlanId);
    if (!plan) return { total: 0, baseTotal: 0, extraBedTotal: 0, nights: 0, nightlyAvg: 0, extraBedNightlyAvg: 0 };

    let baseTotal = 0;
    let extraBedTotal = 0;
    
    const start = parseISO(checkIn);
    const end = parseISO(checkOut);
    
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (nights <= 0) return { total: 0, baseTotal: 0, extraBedTotal: 0, nights: 0, nightlyAvg: 0, extraBedNightlyAvg: 0 };

    for (let i = 0; i < nights; i++) {
      const currentDate = format(addDays(start, i), 'yyyy-MM-dd');
      const { price: basePrice } = getPriceForPlanAndDate(currentDate, plan, unitTypeId);
      const { price: extraBedPrice } = getPriceForPlanAndDate(currentDate, { id: 'extra_bed' } as any, unitTypeId);
      baseTotal += basePrice;
      extraBedTotal += (extraBedPrice * extraBedsCount);
    }

    return {
      nights,
      baseTotal,
      extraBedTotal,
      total: baseTotal + extraBedTotal,
      nightlyAvg: nights > 0 ? baseTotal / nights : 0,
      extraBedNightlyAvg: nights > 0 && extraBedsCount > 0 ? (extraBedTotal / extraBedsCount) / nights : 0
    };
  };

  return {
    getPriceForPlanAndDate,
    calculateTotal,
    calculatePricingBreakdown
  };
}
