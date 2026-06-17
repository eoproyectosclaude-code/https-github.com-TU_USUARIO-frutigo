import PDFDocument from 'pdfkit';

export interface ManifestData {
  manifestRef: string;
  reference: string;
  issuedAt: string;
  vessel: { name: string; imo: string; flag: string; agent: string };
  port: string;
  deliveryWindow: { start: string | Date; end: string | Date };
  legalBasis: string;
  items: { product: string; unit: string; quantity: number }[];
  totalItems: number;
}

const COLORS = {
  green: '#0F3D2E',
  orange: '#F26419',
  ink: '#11203A',
  slate: '#64748B',
  line: '#E2E8F0',
};

const UNIT_LABEL: Record<string, string> = {
  KG: '1 kg',
  HALF_QUINTAL: '½ quintal (23 kg)',
  QUINTAL: '1 quintal (46 kg)',
};

const fmtDate = (d: string | Date) =>
  new Date(d).toLocaleString('es-PA', { dateStyle: 'medium', timeStyle: 'short' });

/**
 * Construye el manifiesto digital como PDF (buffer).
 * Documento de una página, listo para presentar en puerto o enviar a la naviera.
 */
export function buildManifestPdf(data: ManifestData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 48 });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageW = doc.page.width;
    const left = doc.page.margins.left;
    const right = pageW - doc.page.margins.right;

    // Encabezado de marca
    doc.rect(0, 0, pageW, 90).fill(COLORS.green);
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(26).text('FRUTI', left, 30, { continued: true });
    doc.fillColor(COLORS.orange).text('GO');
    doc
      .fillColor('#E6F4EC')
      .font('Helvetica')
      .fontSize(11)
      .text('Ship Provisioning · Canal de Panamá', left, 62);
    doc
      .fillColor('#F6C615')
      .font('Helvetica-Bold')
      .fontSize(12)
      .text('MANIFIESTO DIGITAL', left, 30, { width: right - left, align: 'right' });
    doc.fillColor('#E6F4EC').font('Helvetica').fontSize(10).text(data.manifestRef, left, 50, {
      width: right - left,
      align: 'right',
    });

    doc.moveDown(4);
    let y = 120;

    // Datos del documento
    doc.fillColor(COLORS.slate).font('Helvetica').fontSize(9);
    doc.text(`Pedido: ${data.reference}`, left, y);
    doc.text(`Emitido: ${fmtDate(data.issuedAt)}`, left, y, { width: right - left, align: 'right' });
    y += 24;

    const row = (label: string, value: string) => {
      doc.fillColor(COLORS.slate).font('Helvetica').fontSize(10).text(label, left, y, { width: 150 });
      doc.fillColor(COLORS.ink).font('Helvetica-Bold').fontSize(10).text(value, left + 150, y, {
        width: right - left - 150,
      });
      y += 20;
    };

    doc.fillColor(COLORS.ink).font('Helvetica-Bold').fontSize(13).text('Datos del buque', left, y);
    y += 22;
    row('Buque', `${data.vessel.name}  (IMO ${data.vessel.imo})`);
    row('Bandera', data.vessel.flag);
    row('Agente / naviera', data.vessel.agent);
    row('Puerto', data.port);
    row('Ventana de entrega', `${fmtDate(data.deliveryWindow.start)}  →  ${fmtDate(data.deliveryWindow.end)}`);

    y += 8;
    doc.moveTo(left, y).lineTo(right, y).strokeColor(COLORS.line).stroke();
    y += 16;

    // Tabla de ítems
    doc.fillColor(COLORS.ink).font('Helvetica-Bold').fontSize(13).text(`Artículos (${data.totalItems})`, left, y);
    y += 24;
    doc.fillColor(COLORS.slate).font('Helvetica-Bold').fontSize(9);
    doc.text('PRODUCTO', left, y, { width: 280 });
    doc.text('UNIDAD', left + 280, y, { width: 150 });
    doc.text('CANT.', left + 430, y, { width: right - left - 430, align: 'right' });
    y += 16;
    doc.moveTo(left, y).lineTo(right, y).strokeColor(COLORS.line).stroke();
    y += 8;

    doc.font('Helvetica').fontSize(10).fillColor(COLORS.ink);
    for (const it of data.items) {
      doc.fillColor(COLORS.ink).text(it.product, left, y, { width: 280 });
      doc.fillColor(COLORS.slate).text(UNIT_LABEL[it.unit] ?? it.unit, left + 280, y, { width: 150 });
      doc.fillColor(COLORS.ink).font('Helvetica-Bold').text(String(it.quantity), left + 430, y, {
        width: right - left - 430,
        align: 'right',
      });
      doc.font('Helvetica');
      y += 18;
    }

    y += 12;
    // Sello de exención
    doc.rect(left, y, right - left, 54).fill('#EEF7F1');
    doc.fillColor('#1B7A4B').font('Helvetica-Bold').fontSize(11).text('✓ Exento de ITBMS', left + 14, y + 12);
    doc.fillColor(COLORS.slate).font('Helvetica').fontSize(9).text(data.legalBasis, left + 14, y + 30, {
      width: right - left - 28,
    });

    // Pie
    doc
      .fillColor(COLORS.slate)
      .font('Helvetica')
      .fontSize(8)
      .text(
        'FRUTI GO · frutigo.pa · Documento generado electrónicamente · Confidencial',
        left,
        doc.page.height - 60,
        { width: right - left, align: 'center' },
      );

    doc.end();
  });
}
