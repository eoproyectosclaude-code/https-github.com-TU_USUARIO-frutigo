import PDFDocument from 'pdfkit';

export interface ReceiptLine {
  name: string;
  unit: string;
  quantity: number;
  unitPriceUsd: number;
  subtotalUsd: number;
}

export interface ReceiptData {
  reference: string;
  createdAt: string | Date;
  segment: string;
  status: string;
  deliveryType: string;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  lines: ReceiptLine[];
  subtotalUsd: number;
  loyaltyDiscountUsd: number;
  buyerFeeUsd: number;
  deliveryUsd: number;
  taxUsd: number;
  pointsRedeemed: number;
  loyaltyCreditUsd: number;
  referralCreditUsd: number;
  totalUsd: number;
}

const C = { green: '#333D1C', orange: '#D9A404', ink: '#11203A', slate: '#64748B', line: '#E2E8F0' };
const UNIT: Record<string, string> = { KG: '1 kg', HALF_QUINTAL: '½ quintal', QUINTAL: '1 quintal' };
const money = (n: number) => `$${n.toFixed(2)}`;
const fmtDate = (d: string | Date) =>
  new Date(d).toLocaleString('es-PA', { dateStyle: 'medium', timeStyle: 'short' });

/** Construye el recibo del pedido como PDF (buffer). */
export function buildOrderReceiptPdf(data: ReceiptData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 48 });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageW = doc.page.width;
    const left = doc.page.margins.left;
    const right = pageW - doc.page.margins.right;

    // Encabezado
    doc.rect(0, 0, pageW, 90).fill(C.green);
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(26).text('FRUTI', left, 30, { continued: true });
    doc.fillColor(C.orange).text('GO');
    doc.fillColor('#E6F4EC').font('Helvetica').fontSize(11).text('Del campo a tu puerta', left, 62);
    doc.fillColor('#F2C707').font('Helvetica-Bold').fontSize(12).text('RECIBO', left, 30, { width: right - left, align: 'right' });
    doc.fillColor('#E6F4EC').font('Helvetica').fontSize(10).text(data.reference, left, 50, { width: right - left, align: 'right' });

    let y = 116;
    doc.fillColor(C.slate).font('Helvetica').fontSize(9);
    doc.text(`Fecha: ${fmtDate(data.createdAt)}`, left, y);
    doc.text(`Estado: ${data.status}`, left, y, { width: right - left, align: 'right' });
    y += 14;
    doc.text(`Segmento: ${data.segment}   ·   Entrega: ${data.deliveryType}`, left, y);
    if (data.paymentMethod) {
      doc.text(`Pago: ${data.paymentMethod} (${data.paymentStatus ?? '—'})`, left, y, { width: right - left, align: 'right' });
    }
    y += 24;

    // Tabla
    doc.fillColor(C.slate).font('Helvetica-Bold').fontSize(9);
    doc.text('PRODUCTO', left, y, { width: 230 });
    doc.text('UNIDAD', left + 230, y, { width: 110 });
    doc.text('CANT.', left + 340, y, { width: 50, align: 'right' });
    doc.text('SUBTOTAL', left + 390, y, { width: right - left - 390, align: 'right' });
    y += 14;
    doc.moveTo(left, y).lineTo(right, y).strokeColor(C.line).stroke();
    y += 8;

    doc.font('Helvetica').fontSize(10);
    for (const l of data.lines) {
      doc.fillColor(C.ink).text(l.name, left, y, { width: 230 });
      doc.fillColor(C.slate).text(UNIT[l.unit] ?? l.unit, left + 230, y, { width: 110 });
      doc.fillColor(C.ink).text(String(l.quantity), left + 340, y, { width: 50, align: 'right' });
      doc.text(money(l.subtotalUsd), left + 390, y, { width: right - left - 390, align: 'right' });
      y += 18;
    }

    y += 6;
    doc.moveTo(left, y).lineTo(right, y).strokeColor(C.line).stroke();
    y += 12;

    // Totales
    const totalRow = (label: string, value: string, opts?: { bold?: boolean; color?: string }) => {
      doc
        .fillColor(opts?.color ?? (opts?.bold ? C.ink : C.slate))
        .font(opts?.bold ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(opts?.bold ? 13 : 10)
        .text(label, left + 250, y, { width: 140 });
      doc
        .fillColor(opts?.color ?? C.ink)
        .font(opts?.bold ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(opts?.bold ? 13 : 10)
        .text(value, left + 390, y, { width: right - left - 390, align: 'right' });
      y += opts?.bold ? 22 : 16;
    };

    totalRow('Subtotal', money(data.subtotalUsd));
    if (data.loyaltyDiscountUsd > 0) totalRow('Descuento nivel', `- ${money(data.loyaltyDiscountUsd)}`, { color: '#6B8E23' });
    totalRow('Comisión', money(data.buyerFeeUsd));
    totalRow('Envío', data.deliveryUsd === 0 ? 'Gratis' : money(data.deliveryUsd));
    totalRow('ITBMS', money(data.taxUsd));
    if (data.loyaltyCreditUsd > 0) totalRow(`Canje (${data.pointsRedeemed} pts)`, `- ${money(data.loyaltyCreditUsd)}`, { color: '#6B8E23' });
    if (data.referralCreditUsd > 0) totalRow('Crédito referidos', `- ${money(data.referralCreditUsd)}`, { color: '#6B8E23' });
    doc.moveTo(left + 250, y).lineTo(right, y).strokeColor(C.line).stroke();
    y += 8;
    totalRow('TOTAL', money(data.totalUsd), { bold: true, color: C.orange });

    doc
      .fillColor(C.slate)
      .font('Helvetica')
      .fontSize(8)
      .text('Gracias por tu compra · FRUTI GO · frutigo.pa · Documento generado electrónicamente', left, doc.page.height - 60, {
        width: right - left,
        align: 'center',
      });

    doc.end();
  });
}
