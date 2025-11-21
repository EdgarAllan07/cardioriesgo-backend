import PDFDocument from 'pdfkit';
import fs from 'fs';
export function generateSimpleReport(patient, resultado, outPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(outPath);
    doc.pipe(stream);
    doc.fontSize(20).text('Informe de Evaluación de Riesgo', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Paciente: ${patient?.nombre || ''}`);
    doc.text(`Riesgo estimado: ${resultado?.riesgo_estimado || 'N/A'}%`);
    doc.end();
    stream.on('finish', () => resolve(outPath));
    stream.on('error', reject);
  });
}

