import { prisma } from "../config/prismaClient.js";
import { logAction } from "../services/log.service.js";
export async function createPaciente(req, res, next) {
  try {
    const data = req.body;
    const paciente = await prisma.paciente.create({ data });
    res.status(201).json(paciente);

    await logAction({
      usuario_id: req.user?.userId || null,
      accion_nombre: "crear_paciente",
      descripcion: `Registro de nuevo paciente: ${data.nombre_completo}`,
      origen: "paciente.controller",
      ip: req.ip,
      user_agent: req.headers["user-agent"],
    });
  } catch (err) {
    next(err);
  }
}
export async function listPacientes(req, res, next) {
  try {
    const id = Number(req.params.id);
    const pacientes = await prisma.$queryRaw`
    SELECT 
    p.nombre_completo,
    p.id_paciente,
    p.edad,
    p.sexo,
    r.riesgo_estimado * 100
    FROM public.paciente p 
    INNER JOIN public.usuario u
    on p.usuario_id =  u.id_usuario
    INNER JOIN public.evaluacion_clinica e
    on e.paciente_id = p.id_paciente
    INNER JOIN public.resultado_ia r
    on r.evaluacion_id = e.id_evaluacion
WHERE u.id_usuario = ${id}
    `;
    res.json(pacientes);

    await logAction({
      usuario_id: req.user?.userId || null,
      accion_nombre: "ver_pacientes",
      descripcion: "Visualización de lista de pacientes.",
      origen: "paciente.controller",
      ip: req.ip,
      user_agent: req.headers["user-agent"],
    });
  } catch (err) {
    next(err);
  }
}
