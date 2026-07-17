export interface AllocationResult {
  chargeId: string;
  amountAllocatedMinor: number;
}

export class AllocationEngine {
  // Allocate a payment amount across a list of unpaid or partially paid charges
  static allocatePayment(
    paymentAmountMinor: number,
    charges: { id: string; grossMinor: number; allocatedMinor: number }[]
  ): AllocationResult[] {
    let remainingPayment = paymentAmountMinor;
    const allocations: AllocationResult[] = [];

    for (const charge of charges) {
      if (remainingPayment <= 0) break;

      const outstandingAmount = charge.grossMinor - charge.allocatedMinor;
      if (outstandingAmount <= 0) continue;

      const toAllocate = Math.min(remainingPayment, outstandingAmount);
      allocations.push({
        chargeId: charge.id,
        amountAllocatedMinor: toAllocate
      });

      remainingPayment -= toAllocate;
    }

    return allocations;
  }
}
