export interface TaxCode {
  id: string;
  code: string;
  name: string;
  kind: 'iva' | 'percepcion' | 'retencion' | 'municipal' | 'other';
  rate: number; // e.g. 21 for 21% IVA, or absolute amount depending on calculation
  calculationOrder: number;
}

export interface TaxCalculationResult {
  baseAmountMinor: number;
  taxAmountMinor: number;
  taxCode: string;
}

export class TaxEngine {
  // Sequentially calculate tax lines based on tax codes and base amount
  static calculateTaxes(
    baseAmountMinor: number,
    taxCodes: TaxCode[]
  ): TaxCalculationResult[] {
    // Sort by calculation order
    const sortedCodes = [...taxCodes].sort((a, b) => a.calculationOrder - b.calculationOrder);
    let currentBase = baseAmountMinor;
    const results: TaxCalculationResult[] = [];

    for (const code of sortedCodes) {
      let taxAmount = 0;
      if (code.kind === 'iva') {
        taxAmount = Math.round(currentBase * (code.rate / 100));
      } else if (code.kind === 'percepcion' || code.kind === 'municipal') {
        taxAmount = Math.round(currentBase * (code.rate / 100));
      } else {
        // Flat fees or fallback
        taxAmount = Math.round(code.rate * 100); // rate specified in standard currency units
      }

      results.push({
        baseAmountMinor: currentBase,
        taxAmountMinor: taxAmount,
        taxCode: code.code
      });

      // Cascading taxation if applicable (usually municipal/percepciones don't compound, but let's allow it if needed)
    }

    return results;
  }
}
