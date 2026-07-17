export interface FolioLine {
  id: string;
  folioWindowId: string;
  lineType: 'charge' | 'payment' | 'discount' | 'adjustment' | 'reversal';
  serviceDate: string;
  postedAt: string;
  description: string;
  qty: number;
  unitAmountMinor: number;
  currency: string;
  taxCodeId?: string;
  grossMinor: number;
  status: 'posted' | 'voided' | 'reverted';
  sourceType: string;
  sourceId?: string;
  reversalOfLineId?: string;
}

export class LedgerEngine {
  // Post a new line into the ledger in an append-only fashion
  static postLine(
    lines: FolioLine[], 
    newLine: Omit<FolioLine, 'id' | 'postedAt' | 'status'>
  ): FolioLine[] {
    const line: FolioLine = {
      ...newLine,
      id: `fl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      postedAt: new Date().toISOString(),
      status: 'posted'
    };
    return [...lines, line];
  }

  // Void/revert an existing line by posting a matching opposite reversal line
  static revertLine(
    lines: FolioLine[], 
    lineIdToRevert: string, 
    reason: string
  ): FolioLine[] {
    const targetLine = lines.find(l => l.id === lineIdToRevert);
    if (!targetLine) throw new Error('Target ledger line not found');
    if (targetLine.status !== 'posted') throw new Error('Line is already voided or reverted');

    // Mark original line as reverted
    const updatedLines = lines.map(l => 
      l.id === lineIdToRevert ? { ...l, status: 'reverted' as const } : l
    );

    // Create opposite reversal line
    const reversalLine: FolioLine = {
      id: `fl_rev_${Date.now()}`,
      folioWindowId: targetLine.folioWindowId,
      lineType: 'reversal',
      serviceDate: new Date().toISOString().substring(0, 10),
      postedAt: new Date().toISOString(),
      description: `REVERSO: ${targetLine.description} (${reason})`,
      qty: targetLine.qty,
      unitAmountMinor: -targetLine.unitAmountMinor,
      currency: targetLine.currency,
      taxCodeId: targetLine.taxCodeId,
      grossMinor: -targetLine.grossMinor,
      status: 'posted',
      sourceType: 'ledger_adjustment',
      reversalOfLineId: targetLine.id
    };

    return [...updatedLines, reversalLine];
  }

  // Calculate folio balances from append-only lines
  static calculateTotals(lines: FolioLine[]) {
    const charges = lines
      .filter(l => ['charge', 'adjustment'].includes(l.lineType))
      .reduce((sum, l) => sum + l.grossMinor, 0);

    const discounts = lines
      .filter(l => l.lineType === 'discount')
      .reduce((sum, l) => sum + Math.abs(l.grossMinor), 0);

    const payments = lines
      .filter(l => l.lineType === 'payment')
      .reduce((sum, l) => sum + l.grossMinor, 0);

    const reversals = lines
      .filter(l => l.lineType === 'reversal')
      .reduce((sum, l) => sum + l.grossMinor, 0);

    const balance = (charges + reversals) - discounts - payments;

    return {
      chargesMinor: charges,
      discountsMinor: discounts,
      paymentsMinor: payments,
      reversalsMinor: reversals,
      balanceMinor: Math.max(0, balance)
    };
  }
}
