import { addDays, parseISO, format } from 'date-fns';

export interface ChildPricingRule {
  id: string;
  min_age: number;
  max_age: number;
  type: 'percentage' | 'fixed' | 'free';
  value: number; // e.g. 50 for 50%, or 20 for $20 USD
}

export interface PricingEngineParams {
  dailyRates: any[];
  rateRules: any[];
  ratePlans: any[];
  unitTypes: any[];
}

export function getBasePriceForDate(
  date: string,
  planId: string,
  unitTypeId: string,
  params: PricingEngineParams
): number {
  const manualOverride = params.dailyRates.find(
    r => r.date === date && r.unit_type_id === unitTypeId && r.rate_plan_id === planId
  );
  if (manualOverride) return manualOverride.price;

  const activeRule = params.rateRules.find(
    r =>
      r.unit_type_id === unitTypeId &&
      r.rate_plan_id === planId &&
      date >= r.start_date &&
      date <= r.end_date
  );
  if (activeRule) return activeRule.price;

  if (planId === 'extra_bed') return 40;

  const ut = params.unitTypes.find(u => u.id === unitTypeId);
  return ut?.base_price || 0;
}

export function getPriceForPlanAndDate(
  date: string,
  planId: string,
  unitTypeId: string,
  params: PricingEngineParams
): { price: number; isOverridden: boolean } {
  const manualOverride = params.dailyRates.find(
    r => r.date === date && r.unit_type_id === unitTypeId && r.rate_plan_id === planId
  );
  if (manualOverride) return { price: manualOverride.price, isOverridden: true };

  let plan = params.ratePlans.find(p => p.id === planId);
  if (!plan && (planId === 'standard' || planId === 'non_refundable' || planId === 'standard_rate')) {
    plan = {
      id: planId,
      name: planId === 'non_refundable' ? 'Tarifa No Reembolsable' : 'Tarifa Estándar',
      discount_type: planId === 'non_refundable' ? 'percent' : undefined,
      discount_value: planId === 'non_refundable' ? 10 : undefined
    };
  }
  if (!plan) {
    return { price: getBasePriceForDate(date, planId, unitTypeId, params), isOverridden: false };
  }

  if (!plan.parent_plan_id) {
    return { price: getBasePriceForDate(date, plan.id, unitTypeId, params), isOverridden: false };
  }

  const activeRule = params.rateRules.find(
    r =>
      r.unit_type_id === unitTypeId &&
      r.rate_plan_id === plan.id &&
      date >= r.start_date &&
      date <= r.end_date
  );
  if (activeRule) return { price: activeRule.price, isOverridden: false };

  const parentPlan = params.ratePlans.find(p => p.id === plan.parent_plan_id);
  if (!parentPlan) return { price: 0, isOverridden: false };

  const parentPriceResult = getPriceForPlanAndDate(date, parentPlan.id, unitTypeId, params);
  let cascadedPrice = parentPriceResult.price;

  if (plan.discount_value) {
    if (plan.discount_type === 'percent') {
      cascadedPrice = cascadedPrice * (1 - plan.discount_value / 100);
    } else {
      cascadedPrice = Math.max(0, cascadedPrice - plan.discount_value);
    }
  }
  return { price: Math.round(cascadedPrice), isOverridden: false };
}

export interface CalculatePricingBreakdownParams {
  unitTypeId: string;
  ratePlanId: string;
  checkIn: string;
  checkOut: string;
  adultsCount: number;
  childrenCount: number;
  childrenAges?: number[];
  extraBedsCount?: number;
}

export interface PricingBreakdownResult {
  nights: number;
  baseTotal: number;
  adultsTotal: number;
  childrenTotal: number;
  extraBedTotal: number;
  total: number;
  nightlyAvg: number;
  extraBedNightlyAvg: number;
  hasChildPricingWarning: boolean;
}

export function calculatePricingBreakdown(
  calcParams: CalculatePricingBreakdownParams,
  engineParams: PricingEngineParams
): PricingBreakdownResult {
  const {
    unitTypeId,
    ratePlanId,
    checkIn,
    checkOut,
    adultsCount,
    childrenCount,
    childrenAges = [],
    extraBedsCount = 0
  } = calcParams;

  const result: PricingBreakdownResult = {
    nights: 0,
    baseTotal: 0,
    adultsTotal: 0,
    childrenTotal: 0,
    extraBedTotal: 0,
    total: 0,
    nightlyAvg: 0,
    extraBedNightlyAvg: 0,
    hasChildPricingWarning: false
  };

  if (!unitTypeId || !ratePlanId || !checkIn || !checkOut) {
    return result;
  }

  let plan = engineParams.ratePlans.find(p => p.id === ratePlanId);
  if (!plan && (ratePlanId === 'standard' || ratePlanId === 'non_refundable' || ratePlanId === 'standard_rate')) {
    plan = {
      id: ratePlanId,
      name: ratePlanId === 'non_refundable' ? 'Tarifa No Reembolsable' : 'Tarifa Estándar',
      discount_type: ratePlanId === 'non_refundable' ? 'percent' : undefined,
      discount_value: ratePlanId === 'non_refundable' ? 10 : undefined
    };
  }
  if (!plan) return result;

  const start = parseISO(checkIn);
  const end = parseISO(checkOut);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return result;
  }

  const diffTime = Math.abs(end.getTime() - start.getTime());
  const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (nights <= 0) return result;
  result.nights = nights;

  // Resolve child pricing rules from the rate plan if configured
  // Support both child_pricing single rule and child_pricing_rules array formats
  const childRules: ChildPricingRule[] = plan.child_pricing_rules || [];
  if (plan.child_pricing && plan.child_pricing.enabled) {
    childRules.push({
      id: 'default_child_pricing',
      min_age: plan.child_pricing.min_age || 0,
      max_age: plan.child_pricing.max_age || 17,
      type: plan.child_pricing.type,
      value: plan.child_pricing.value
    });
  }

  const hasConfiguredRules = childRules.length > 0;
  result.hasChildPricingWarning = childrenCount > 0 && !hasConfiguredRules;

  for (let i = 0; i < nights; i++) {
    const currentDate = format(addDays(start, i), 'yyyy-MM-dd');
    const { price: dailyBase } = getPriceForPlanAndDate(currentDate, plan.id, unitTypeId, engineParams);
    const { price: extraBedPrice } = getPriceForPlanAndDate(currentDate, 'extra_bed', unitTypeId, engineParams);

    // Adults price (usually daily base covers the base capacity, extra adults might add supplement.
    // By default here we sum the dailyBase as the room rate)
    result.baseTotal += dailyBase;
    result.adultsTotal += dailyBase;

    // Children price calculation based on configured rules
    let dailyChildrenCost = 0;
    if (childrenCount > 0) {
      for (let c = 0; c < childrenCount; c++) {
        const age = childrenAges[c] !== undefined ? childrenAges[c] : 8; // Default age 8 if not specified
        const rule = childRules.find(r => age >= r.min_age && age <= r.max_age);
        if (rule) {
          if (rule.type === 'percentage') {
            dailyChildrenCost += (dailyBase * (rule.value / 100));
          } else if (rule.type === 'fixed') {
            dailyChildrenCost += rule.value;
          }
          // type === 'free' adds 0 cost
        } else {
          // If no rule matches or exists, children are free (0 cost) but triggers warning
          dailyChildrenCost += 0;
        }
      }
    }

    result.childrenTotal += dailyChildrenCost;
    result.extraBedTotal += (extraBedPrice * extraBedsCount);
  }

  result.total = result.baseTotal + result.childrenTotal + result.extraBedTotal;
  if (result.total === 0) {
    const ut = engineParams.unitTypes.find(u => u.id === unitTypeId);
    const fallbackPrice = ut?.base_price || 120; // Default fallback to $120/night if unit type is 0/undefined
    result.baseTotal = fallbackPrice * nights;
    result.adultsTotal = fallbackPrice * nights;
    result.total = fallbackPrice * nights;
    result.nightlyAvg = fallbackPrice;
  } else {
    result.nightlyAvg = nights > 0 ? result.baseTotal / nights : 0;
  }
  result.extraBedNightlyAvg = nights > 0 && extraBedsCount > 0 ? (result.extraBedTotal / extraBedsCount) / nights : 0;

  return result;
}
