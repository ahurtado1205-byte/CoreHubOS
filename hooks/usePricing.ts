import { usePMS } from '../context/PMSContext';
import { RatePlan } from '../types/inventory';
import { 
  getPriceForPlanAndDate as engineGetPrice,
  calculatePricingBreakdown as engineCalculateBreakdown,
  PricingEngineParams
} from '../lib/pricingEngine';

export function usePricing() {
  const { dailyRates, rateRules, ratePlans, unitTypes } = usePMS();

  const getEngineParams = (): PricingEngineParams => ({
    dailyRates,
    rateRules,
    ratePlans,
    unitTypes
  });

  const getPriceForPlanAndDate = (date: string, plan: RatePlan, unitTypeId: string) => {
    return engineGetPrice(date, plan.id, unitTypeId, getEngineParams());
  };

  const calculateTotal = (
    unitTypeId: string,
    ratePlanId: string,
    checkIn: string,
    checkOut: string,
    extraBedsCount: number = 0,
    adultsCount: number = 2,
    childrenCount: number = 0,
    childrenAges: number[] = []
  ): number => {
    const breakdown = engineCalculateBreakdown({
      unitTypeId,
      ratePlanId,
      checkIn,
      checkOut,
      adultsCount,
      childrenCount,
      childrenAges,
      extraBedsCount
    }, getEngineParams());
    return breakdown.total;
  };

  const calculatePricingBreakdown = (
    unitTypeId: string,
    ratePlanId: string,
    checkIn: string,
    checkOut: string,
    extraBedsCount: number = 0,
    adultsCount: number = 2,
    childrenCount: number = 0,
    childrenAges: number[] = []
  ) => {
    return engineCalculateBreakdown({
      unitTypeId,
      ratePlanId,
      checkIn,
      checkOut,
      adultsCount,
      childrenCount,
      childrenAges,
      extraBedsCount
    }, getEngineParams());
  };

  return {
    getPriceForPlanAndDate,
    calculateTotal,
    calculatePricingBreakdown
  };
}
