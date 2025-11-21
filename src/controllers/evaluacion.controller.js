import { prisma } from "../config/prismaClient.js";
import { aiClient } from "../utils/aiClient.js";

export async function createEvaluacion(req, res, next) {
  try {
    const data = req.body;

    // Crear paciente
    const paciente = await prisma.paciente.create({
      data: {
        usuario: { connect: { id_usuario: data.usuario_id } },
        edad: data.edad,
        sexo: data.sexo,

        fecha_nacimiento: data.fecha_nacimiento
          ? new Date(data.fecha_nacimiento)
          : null,
        telefono: data.telefono,
        email: data.email,
        nombre_completo: data.nombre_completo,
      },
    });

    // Crear evaluación vinculada
    const evaluacion = await prisma.evaluacion_clinica.create({
      data: {
        paciente: { connect: { id_paciente: paciente.id_paciente } },
        usuario: { connect: { id_usuario: data.usuario_id } },
        presion_sistolica: Number(data.presion_sistolica),
        presion_diastolica: Number(data.presion_diastolica),
        colesterol_total: Number(data.colesterol_total),
        colesterol_hdl: Number(data.colesterol_hdl),
        colesterol_ldl: Number(data.colesterol_ldl),
        glucosa: Number(data.glucosa),
        fumador: data.tabaquismo,
        consumo_alcohol: data.consumo_alcohol,
        actividad_fisica: data.actividad_fisica,
        antecedentes_familiares: data.antecedentes_familiares,
        peso_kg: Number(data.peso_kg),
        altura_cm: Number(data.altura_cm),
        imc: Number(data.imc),
        sintomas: data.sintomas,
      },
    });

    // Llamar al servicio de IA
    const aiResult = await aiClient.analizarEvaluacion({
      paciente_id: paciente.id_paciente,
      edad: data.edad,
      sexo: data.sexo,
      presion_sistolica: data.presion_sistolica,
      presion_diastolica: data.presion_diastolica,
      colesterol_total: data.colesterol_total,
      colesterol_ldl: data.colesterol_ldl,
      colesterol_hdl: data.colesterol_hdl,
      glucosa: data.glucosa,
      peso_kg: data.peso_kg,
      altura_cm: data.altura_cm,
      fumador: data.tabaquismo,
      consumo_alcohol: data.consumo_alcohol,
      actividad_fisica: data.actividad_fisica,
      antecedentes_familiares: data.antecedentes_familiares,
      sintomas: data.sintomas,
    });

    // Determinar nivel de riesgo
    let nivelriesgo = "Riesgo Bajo";
    if (aiResult.riesgo_general > 70) nivelriesgo = "Riesgo Alto";
    else if (aiResult.riesgo_general > 50) nivelriesgo = "Riesgo Moderado";

    // Guardar resultado
    const resultado = await prisma.resultado_ia.create({
      data: {
        evaluacion_id: evaluacion.id_evaluacion,
        riesgo_estimado: aiResult.riesgo_general || null,
        nivel_riesgo: nivelriesgo,
        modelo_version: aiResult.modelo_version || null,
        enfermedades_detectadas: aiResult.probabilidades_enfermedades || null,
      },
    });

    res.status(201).json({ paciente, evaluacion, resultado });
  } catch (err) {
    next(err);
  }
}

// ==========================================
// Lista de evaluaciones por paciente
// ==========================================
export async function listaEvaluacionesPorPaciente(req, res, next) {
  const id = Number(req.params.id);
  try {
    const evaluaciones = await prisma.$queryRaw`
      SELECT 
        e.created_at AS "Fecha",
        p.edad,
        e.imc,
        e.presion_sistolica || '/' || e.presion_diastolica AS "PA",
        r.nivel_riesgo
      FROM data.paciente p
      INNER JOIN data.evaluacion_clinica e ON p.id_paciente = e.paciente_id
      INNER JOIN data.resultado_ia r ON r.evaluacion_id = e.id_evaluacion
      WHERE p.id_paciente = ${id}
      ORDER BY e.created_at DESC
    `;
    res.status(200).json(evaluaciones);
  } catch (err) {
    next(err);
  }
}
