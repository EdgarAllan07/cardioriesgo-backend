import { prisma } from "../config/prismaClient.js";
import { aiClient } from "../utils/aiClient.js";
import { logAction } from "../services/log.service.js";

export async function crearEvaluacionInterna(data, usuarioContexto) {
  // Verificar si ya existe un paciente con el mismo email
  let paciente = null;

  if (data.email) {
    paciente = await prisma.paciente.findFirst({
      where: {
        email: data.email,
        usuario_id: data.usuario_id, // Asegurar que pertenece al mismo médico
      },
    });
  }

  // Si no existe, crear nuevo paciente
  if (!paciente) {
    paciente = await prisma.paciente.create({
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
    console.log(
      `✅ Nuevo paciente creado: ${paciente.nombre_completo} (ID: ${paciente.id_paciente})`
    );
  } else {
    // Actualizar datos del paciente existente con la nueva información
    paciente = await prisma.paciente.update({
      where: { id_paciente: paciente.id_paciente },
      data: {
        edad: data.edad,
        sexo: data.sexo,
        fecha_nacimiento: data.fecha_nacimiento
          ? new Date(data.fecha_nacimiento)
          : null,
        telefono: data.telefono,
        nombre_completo: data.nombre_completo,
      },
    });
    console.log(
      `♻️  Paciente existente reutilizado: ${paciente.nombre_completo} (ID: ${paciente.id_paciente})`
    );
  }

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

  let nivelriesgo = "Riesgo Bajo";
  if (aiResult.riesgo_general > 70) nivelriesgo = "Riesgo Alto";
  else if (aiResult.riesgo_general > 50) nivelriesgo = "Riesgo Moderado";

  const resultado = await prisma.resultado_ia.create({
    data: {
      evaluacion_id: evaluacion.id_evaluacion,
      riesgo_estimado: aiResult.riesgo_general || null,
      nivel_riesgo: nivelriesgo,
      modelo_version: aiResult.modelo_version || null,
      enfermedades_detectadas: aiResult.probabilidades_enfermedades || null,
    },
  });

  return { paciente, evaluacion, resultado };
}
