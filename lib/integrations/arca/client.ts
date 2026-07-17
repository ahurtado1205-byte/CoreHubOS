export interface ArcaInvoiceConfig {
  documentClass: 'A' | 'B' | 'C' | 'E' | 'T';
  receiverVatCondition: string;
  receiverDocNumber: string;
  netAmountMinor: number;
  taxAmountMinor: number;
  grandTotalMinor: number;
  pointOfSale: number;
}

export class ArcaFiscalAdapter {
  // Simulate WSFEv1 / WSMTXCA fiscal authorization call to ARCA
  static async requestCAE(config: ArcaInvoiceConfig) {
    console.log('[ARCA fiscal integration] Requesting CAE for document class:', config.documentClass);
    await new Promise(resolve => setTimeout(resolve, 500));

    // Simulate CAE timeout or success
    const cae = `${Math.floor(10000000000000 + Math.random() * 90000000000000)}`;
    const caeDueDate = new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString().substring(0, 10);
    const invoiceNumber = Math.floor(1000 + Math.random() * 9000);

    return {
      cae,
      caeDueDate,
      invoiceNumber,
      pointOfSale: config.pointOfSale,
      documentClass: config.documentClass,
      qrPayload: `https://www.afip.gob.ar/fe/qr/?p=${Buffer.from(JSON.stringify({
        ver: 1,
        fecha: new Date().toISOString().substring(0, 10),
        cuit: 30112223334,
        ptoVta: config.pointOfSale,
        tipoCmp: config.documentClass === 'A' ? 1 : 6,
        nroCmp: invoiceNumber,
        importe: (config.grandTotalMinor / 100).toFixed(2),
        moneda: 'PES',
        ctz: 1,
        codAut: cae
      })).toString('base64')}`
    };
  }

  // Simulate consult request for CAE timeouts
  static async consultInvoice(pointOfSale: number, invoiceNumber: number, documentClass: string) {
    console.log(`[ARCA consult] FECompConsultar for POS ${pointOfSale} No ${invoiceNumber}`);
    return {
      exists: true,
      cae: `704170${Math.floor(10000000 + Math.random() * 90000000)}`,
      caeDueDate: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString().substring(0, 10)
    };
  }
}
