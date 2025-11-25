import { prisma } from "../config/prismaClient.js";
import { logAction } from "../services/log.service.js";
export async function header(req, res, next) {
  const id = Number(req.params.id);
  try {
    const users = await prisma.$queryRaw`
    WITH

total_pacientes AS (
  SELECT COUNT(DISTINCT e.paciente_id) AS total_pacientes
  FROM evaluacion_clinica e
  WHERE e.usuario_id = ${id}
),

pacientes_mes_actual AS (
  SELECT COUNT(DISTINCT e.paciente_id) AS total_mes_actual
  FROM evaluacion_clinica e
  WHERE e.usuario_id = ${id}
    AND DATE_TRUNC('month', e.created_at) = DATE_TRUNC('month', CURRENT_DATE)
),

pacientes_mes_anterior AS (
  SELECT COUNT(DISTINCT e.paciente_id) AS total_mes_anterior
  FROM evaluacion_clinica e
  WHERE e.usuario_id = ${id}
    AND DATE_TRUNC('month', e.created_at) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
),

total_evaluaciones AS (
  SELECT COUNT(*) AS total_evaluaciones
  FROM evaluacion_clinica e
  WHERE e.usuario_id = ${id}
),

evaluaciones_mes_actual AS (
  SELECT COUNT(*) AS total_mes_actual
  FROM evaluacion_clinica e
  WHERE e.usuario_id = ${id}
    AND DATE_TRUNC('month', e.created_at) = DATE_TRUNC('month', CURRENT_DATE)
),

evaluaciones_mes_anterior AS (
  SELECT COUNT(*) AS total_mes_anterior
  FROM evaluacion_clinica e
  WHERE e.usuario_id = ${id}
    AND DATE_TRUNC('month', e.created_at) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
),

pacientes_alto_riesgo AS (
  SELECT COUNT(DISTINCT e.paciente_id) AS pacientes_alto_riesgo
  FROM evaluacion_clinica e
  JOIN resultado_ia r ON r.evaluacion_id = e.id_evaluacion
  WHERE e.usuario_id = ${id}
    AND r.nivel_riesgo = 'Alto'
),

alto_riesgo_mes_actual AS (
  SELECT COUNT(DISTINCT e.paciente_id) AS total_mes_actual
  FROM evaluacion_clinica e
  JOIN resultado_ia r ON r.evaluacion_id = e.id_evaluacion
  WHERE e.usuario_id = ${id}
    AND r.nivel_riesgo = 'Alto'
    AND DATE_TRUNC('month', r.created_at) = DATE_TRUNC('month', CURRENT_DATE)
),

alto_riesgo_mes_anterior AS (
  SELECT COUNT(DISTINCT e.paciente_id) AS total_mes_anterior
  FROM evaluacion_clinica e
  JOIN resultado_ia r ON r.evaluacion_id = e.id_evaluacion
  WHERE e.usuario_id = ${id}
    AND r.nivel_riesgo = 'Alto'
    AND DATE_TRUNC('month', r.created_at) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
),
puntaje_promedio AS (
  SELECT ROUND(AVG(r.riesgo_estimado), 2) AS puntaje_riesgo_promedio
  FROM resultado_ia r
  JOIN evaluacion_clinica e ON e.id_evaluacion = r.evaluacion_id
  WHERE e.usuario_id = ${id}
)

SELECT
  tp.total_pacientes,
  te.total_evaluaciones,
  ar.pacientes_alto_riesgo,
  pp.puntaje_riesgo_promedio,

  ROUND(
    ((pm.total_mes_actual::DECIMAL - pa.total_mes_anterior::DECIMAL) / NULLIF(pa.total_mes_anterior, 0)) * 100,
    2
  ) AS crecimiento_pacientes,

  ROUND(
    ((em.total_mes_actual::DECIMAL - ea.total_mes_anterior::DECIMAL) / NULLIF(ea.total_mes_anterior, 0)) * 100,
    2
  ) AS crecimiento_evaluaciones,

  ROUND(
    ((hrm.total_mes_actual::DECIMAL - hra.total_mes_anterior::DECIMAL) / NULLIF(hra.total_mes_anterior, 0)) * 100,
    2
  ) AS crecimiento_alto_riesgo

FROM total_pacientes tp
CROSS JOIN total_evaluaciones te
CROSS JOIN pacientes_alto_riesgo ar
CROSS JOIN puntaje_promedio pp
CROSS JOIN pacientes_mes_actual pm
CROSS JOIN pacientes_mes_anterior pa
CROSS JOIN evaluaciones_mes_actual em
CROSS JOIN evaluaciones_mes_anterior ea
CROSS JOIN alto_riesgo_mes_actual hrm
CROSS JOIN alto_riesgo_mes_anterior hra;

    `;
    const cleanData = users.map((row) => {
      const cleaned = {};
      for (const key in row) {
        const value = row[key];
        cleaned[key] = typeof value === "bigint" ? Number(value) : value;
      }
      return cleaned;
    });

    res.json(cleanData);

    await logAction({
      usuario_id: req.user?.userId || null,
      accion_nombre: "ver_dashboard_header",
      descripcion: `Visualización del header del dashboard para usuario ID ${id}`,
      origen: "dashboard.controller",
      ip: req.ip,
      user_agent: req.headers["user-agent"],
    });
  } catch (err) {
    next(err);
  }
}

export async function pacienteAltoRiesgo(req, res, next) {
  const id = Number(req.params.id);
  try {
    const users = await prisma.$queryRaw`
    SELECT 
    p.id_paciente,
    p.nombre_completo,
    r.riesgo_estimado 
    FROM resultado_ia r 
    INNER JOIN evaluacion_clinica e
    on e.id_evaluacion =  r.evaluacion_id
    INNER JOIN paciente p 
    on p.id_paciente = e.paciente_id
    INNER JOIN usuario u
    on p.usuario_id = u.id_usuario
    WHERE u.id_usuario = ${id}
    order by r.riesgo_estimado asc
    limit 3
    `;
    res.json(users);

    await logAction({
      usuario_id: req.user?.userId || null,
      accion_nombre: "ver_pacientes_alto_riesgo",
      descripcion: `Visualización de pacientes de alto riesgo para usuario ID ${id}`,
      origen: "dashboard.controller",
      ip: req.ip,
      user_agent: req.headers["user-agent"],
    });
  } catch (err) {
    next(err);
  }
}

export async function ultimaEvaluacionesPacientes(req, res, next) {
  try {
    const id = Number(req.params.id);
    const users = await prisma.$queryRaw`
    SELECT p.nombre_completo,
    p.id_paciente,
    p.edad,
    p.sexo,
    to_char(e.created_at,'YYYY-MM-DD'),
    r.nivel_riesgo
    FROM paciente p
    INNER JOIN evaluacion_clinica e
    ON p.id_paciente = e.paciente_id
    INNER JOIN resultado_ia r
    on r.evaluacion_id = e.id_evaluacion
    INNER JOIN usuario u
    ON u.id_usuario = p.usuario_id
    WHERE u.id_usuario = ${id}
    order by p.created_at desc
    limit 4
    `;
    res.json(users);
  } catch (err) {
    next(err);
  }
}

export async function ultimaEvaluacionesRealizadas(req, res, next) {
  const id = Number(req.params.id);
  try {
    const users = await prisma.$queryRaw`
 SELECT 
  p.id_paciente,
  p.nombre_completo,
  to_char( e.created_at, 'DD-MM-YYYY'),
  r.nivel_riesgo
 FROM evaluacion_clinica e
 INNER JOIN paciente p 
 ON p.id_paciente = e.paciente_id
 INNER JOIN usuario u
 ON u.id_usuario = p.usuario_id
 INNER JOIN resultado_ia  r 
 on e.id_evaluacion = r.evaluacion_id
 where u.id_usuario = ${id}
  order by e.created_at desc 
  limit 2
    `;
    res.json(users);
  } catch (err) {
    next(err);
  }
}
