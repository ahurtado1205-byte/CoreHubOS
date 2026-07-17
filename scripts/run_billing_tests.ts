import { LedgerEngine, FolioLine } from '../lib/billing/ledger';
import { TaxEngine, TaxCode } from '../lib/billing/tax-engine';
import { AllocationEngine } from '../lib/billing/allocation';

console.log('🧪 Iniciando Suite de Pruebas Unitarias del Bounded Context de Billing...');

let testCount = 0;
let passCount = 0;

function assert(condition: boolean, message: string) {
  testCount++;
  if (condition) {
    passCount++;
    console.log(`✅ [PASS] ${message}`);
  } else {
    console.error(`❌ [FAIL] ${message}`);
  }
}

// 1. Test Ledger Engine Balance Calculations
try {
  let lines: FolioLine[] = [];
  
  // Post room charge: $120.00 (gross 12000 minor units)
  lines = LedgerEngine.postLine(lines, {
    folioWindowId: 'win_1',
    lineType: 'charge',
    serviceDate: '2026-07-10',
    description: 'Noche de Alojamiento',
    qty: 1,
    unitAmountMinor: 10000,
    currency: 'USD',
    taxCodeId: 'tax_iva_21',
    grossMinor: 12100, // $121.00 gross (incl. 21% IVA)
    sourceType: 'test'
  });

  // Post payment: $50.00
  lines = LedgerEngine.postLine(lines, {
    folioWindowId: 'win_1',
    lineType: 'payment',
    serviceDate: '2026-07-10',
    description: 'Abono Parcial Efectivo',
    qty: 1,
    unitAmountMinor: 5000,
    currency: 'USD',
    grossMinor: 5000,
    sourceType: 'test'
  });

  const totals = LedgerEngine.calculateTotals(lines);
  assert(totals.chargesMinor === 12100, 'Calcula correctamente los cargos brutos acumulados');
  assert(totals.paymentsMinor === 5000, 'Calcula correctamente los pagos acumulados');
  assert(totals.balanceMinor === 7100, 'Calcula el balance del folio restante ($71.00 USD)');

  // Revert room charge
  lines = LedgerEngine.revertLine(lines, lines[0].id, 'Error de posteo');
  const totalsPostReversal = LedgerEngine.calculateTotals(lines);
  assert(totalsPostReversal.balanceMinor === 0, 'Reversión balancea la cuenta a $0.00 USD (saldo no negativo)');
} catch (e: any) {
  console.error('Fallo en pruebas de Ledger Engine:', e);
}

// 2. Test Tax Engine Sequential Calculations
try {
  const baseAmount = 10000; // $100.00 base
  const taxCodes: TaxCode[] = [
    { id: 't1', code: 'IVA_21', name: 'IVA 21%', kind: 'iva', rate: 21, calculationOrder: 1 },
    { id: 't2', code: 'IIBB_3.5', name: 'Percepción IIBB 3.5%', kind: 'percepcion', rate: 3.5, calculationOrder: 2 }
  ];

  const results = TaxEngine.calculateTaxes(baseAmount, taxCodes);
  assert(results.length === 2, 'Calcula dos impuestos para la base imponible');
  assert(results[0].taxAmountMinor === 2100, 'Calcula 21% IVA correctamente ($21.00)');
  assert(results[1].taxAmountMinor === 350, 'Calcula percepción IIBB 3.5% correctamente ($3.50)');
} catch (e: any) {
  console.error('Fallo en pruebas de Tax Engine:', e);
}

// 3. Test Allocation Engine Distribution
try {
  const paymentAmount = 15000; // $150.00 payment
  const outstandingCharges = [
    { id: 'ch_1', grossMinor: 10000, allocatedMinor: 0 }, // $100.00 outstanding
    { id: 'ch_2', grossMinor: 8000, allocatedMinor: 2000 } // $60.00 outstanding
  ];

  const allocations = AllocationEngine.allocatePayment(paymentAmount, outstandingCharges);
  assert(allocations.length === 2, 'Distribuye el pago parcial entre los dos cargos outstanding');
  assert(allocations[0].amountAllocatedMinor === 10000, 'Asigna el 100% requerido al primer cargo ($100.00)');
  assert(allocations[1].amountAllocatedMinor === 5000, 'Asigna los $50.00 restantes al segundo cargo');
} catch (e: any) {
  console.error('Fallo en pruebas de Allocation Engine:', e);
}

console.log(`\n📊 Resumen del Test Suite: ${passCount}/${testCount} pruebas exitosas.`);
if (passCount === testCount) {
  console.log('🎉 TODAS LAS PRUEBAS UNITARIAS PASARON EXITOSAMENTE!');
  process.exit(0);
} else {
  console.error('❌ ALGUNAS PRUEBAS UNITARIAS FALLARON.');
  process.exit(1);
}
