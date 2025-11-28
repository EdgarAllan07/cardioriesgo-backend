import { creationReport } from "../services/report.service.js";
import { prisma } from "../config/prismaClient.js";
import { logAction } from "../services/log.service.js";
import { createEvaluacion } from "../controllers/evaluacion.controller.js";
import { crearEvaluacionInterna } from "../services/evaluacion.service.js";

// ===========================
// OBTENER REPORTE POR ID
// ===========================
export async function getReporteById(req, res, next) {
  try {
    const { reportId } = req.params;

    // Buscar el reporte con todas las relaciones necesarias
    const reporte = await prisma.reporte_clinico.findUnique({
      where: { id_reporte: Number(reportId) },
      include: {
        resultado_ia: {
          include: {
            evaluacion_clinica: {
              include: {
                paciente: true,
              },
            },
          },
        },
      },
    });

    if (!reporte) {
      return res.status(404).json({ message: "Reporte no encontrado" });
    }

    // Verificar que existan las relaciones necesarias
    if (
      !reporte.resultado_ia ||
      !reporte.resultado_ia.evaluacion_clinica ||
      !reporte.resultado_ia.evaluacion_clinica.paciente
    ) {
      return res.status(404).json({ message: "Datos del reporte incompletos" });
    }

    const resultado = reporte.resultado_ia;
    const evaluacion = resultado.evaluacion_clinica;
    const paciente = evaluacion.paciente;

    // Parsear enfermedades detectadas desde JSON
    let enfermedades = [];
    if (resultado.enfermedades_detectadas) {
      try {
        const enfermedadesData =
          typeof resultado.enfermedades_detectadas === "string"
            ? JSON.parse(resultado.enfermedades_detectadas)
            : resultado.enfermedades_detectadas;

        // Convertir el formato de enfermedades al esperado
        if (Array.isArray(enfermedadesData)) {
          // El AI devuelve: { enfermedad, probabilidad, nivel }
          // Necesitamos: { nombre, probabilidad }
          enfermedades = enfermedadesData.map((item) => ({
            nombre: item.enfermedad || item.nombre || "Desconocida",
            probabilidad: item.probabilidad
              ? typeof item.probabilidad === "number" && item.probabilidad > 1
                ? item.probabilidad / 100 // Convertir de porcentaje a decimal
                : parseFloat(item.probabilidad)
              : 0,
          }));
        } else if (typeof enfermedadesData === "object") {
          // Si es un objeto, convertirlo a array
          enfermedades = Object.entries(enfermedadesData).map(
            ([nombre, probabilidad]) => ({
              nombre,
              probabilidad:
                typeof probabilidad === "number"
                  ? probabilidad
                  : parseFloat(probabilidad),
            })
          );
        }
      } catch (error) {
        console.error("Error parsing enfermedades_detectadas:", error);
        enfermedades = [];
      }
    }

    // Construir la respuesta según el formato esperado
    const response = {
      id_reporte: reporte.id_reporte,
      id_paciente: paciente.id_paciente,
      nombre_completo: paciente.nombre_completo,
      fecha_reporte: reporte.created_at
        ? reporte.created_at.toISOString().split("T")[0]
        : null,
      edad: paciente.edad,
      sexo: paciente.sexo,
      email: paciente.email,
      telefono: paciente.telefono,
      imc: evaluacion.imc ? parseFloat(evaluacion.imc) : null,
      presion_sistolica: evaluacion.presion_sistolica,
      presion_diastolica: evaluacion.presion_diastolica,
      colesterol_total: evaluacion.colesterol_total
        ? parseFloat(evaluacion.colesterol_total)
        : null,
      colesterol_ldl: evaluacion.colesterol_ldl
        ? parseFloat(evaluacion.colesterol_ldl)
        : null,
      colesterol_hdl: evaluacion.colesterol_hdl
        ? parseFloat(evaluacion.colesterol_hdl)
        : null,
      glucosa: evaluacion.glucosa ? parseFloat(evaluacion.glucosa) : null,
      tabaquismo: evaluacion.fumador,
      consumo_alcohol: evaluacion.consumo_alcohol,
      actividad_fisica: evaluacion.actividad_fisica,
      antecedentes_familiares: evaluacion.antecedentes_familiares,
      sintomas: evaluacion.sintomas,
      puntuacion_riesgo: resultado.riesgo_estimado
        ? parseFloat(resultado.riesgo_estimado)
        : null,
      enfermedades: enfermedades,
      url_pdf: reporte.archivo_pdf_url,
    };

    res.status(200).json(response);

    // Registrar la acción en el log
    await logAction({
      usuario_id: req.user?.userId || null,
      accion_nombre: "consultar_reporte",
      descripcion: `Consulta de reporte ID ${reportId}`,
      origen: "reporte.controller",
      ip: req.ip,
      user_agent: req.headers["user-agent"],
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
}

// ===========================
// OBTENER REPORTES POR PACIENTE
// ===========================
export async function getReportesByPaciente(req, res, next) {
  try {
    const { patientId } = req.params;

    // Buscar todos los reportes del paciente
    const reportes = await prisma.reporte_clinico.findMany({
      where: {
        resultado_ia: {
          evaluacion_clinica: {
            paciente_id: Number(patientId),
          },
        },
      },
      include: {
        resultado_ia: {
          select: {
            riesgo_estimado: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    // Transformar los datos al formato esperado
    const data = reportes.map((reporte) => ({
      id_reporte: reporte.id_reporte,
      fecha_reporte: reporte.created_at
        ? reporte.created_at.toISOString().split("T")[0]
        : null,
      puntuacion_riesgo: reporte.resultado_ia?.riesgo_estimado
        ? parseFloat(reporte.resultado_ia.riesgo_estimado)
        : null,
      url_pdf: reporte.archivo_pdf_url,
    }));

    res.status(200).json({
      data: data,
      total: data.length,
    });

    // Registrar la acción en el log
    await logAction({
      usuario_id: req.user?.userId || null,
      accion_nombre: "consultar_reportes_paciente",
      descripcion: `Consulta de reportes del paciente ID ${patientId}`,
      origen: "reporte.controller",
      ip: req.ip,
      user_agent: req.headers["user-agent"],
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
}

// ===========================
// GENERAR REPORTE PDF
// ===========================
export async function generarReporteClinico(req, res, next) {
  try {
    const response = await crearEvaluacionInterna(req.body, req.user);
    const evaluacion_id = response.evaluacion.id_evaluacion;
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
      paciente_id: paciente.id_paciente,
      evaluacion_id: evaluacion.id_evaluacion,
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
