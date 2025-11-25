import { creationReport } from "../services/report.service.js";
import { prisma } from "../config/prismaClient.js";
import { logAction } from "../services/log.service.js";

// ===========================
// GENERAR REPORTE PDF
// ===========================
export async function generarReporteClinico(req, res, next) {
  try {
    const { evaluacion_id } = req.params;

    // Obtener datos de evaluación, paciente y resultado IA
    const evaluacion = await prisma.evaluacion_clinica.findUnique({
      where: { id_evaluacion: Number(evaluacion_id) },
      include: {
        paciente: true,
        resultado_ia: true,
      },
    });

    if (!evaluacion) {
      return res.status(404).json({ message: "Evaluación no encontrada" });
    }

    const paciente = evaluacion.paciente;
    const resultado = await prisma.resultado_ia.findFirst({
      where: { evaluacion_id: Number(evaluacion_id) },
    });

    if (!resultado) {
      return res.status(404).json({ message: "Resultado IA no encontrado" });
    }

    const urlPDF = await creationReport(paciente, evaluacion, resultado);

    // Guardar registro en BD
    await prisma.reporte_clinico.create({
      data: {
        resultado_id: resultado.id_resultado,
        archivo_pdf_url: urlPDF,
        descripcion: `Reporte IA generado el ${new Date().toLocaleDateString()}`,
      },
    });

    res.status(201).json({
      message: "Reporte generado y almacenado correctamente.",
      url: urlPDF,
    });

    await logAction({
      usuario_id: req.user?.userId || null,
      accion_nombre: "generar_reporte_pdf",
      descripcion: `Generación de reporte PDF para evaluación ID ${evaluacion_id}`,
      origen: "reporte.controller",
      ip: req.ip,
      user_agent: req.headers["user-agent"],
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
}
