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

    // Obtener todos los pacientes del usuario con sus evaluaciones
    const pacientes = await prisma.paciente.findMany({
      where: {
        usuario_id: id,
      },
      include: {
        evaluacion_clinica: {
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
          take: 1, // Solo la evaluación más reciente
        },
      },
    });

    // Transformar los datos al formato esperado
    const data = pacientes.map((paciente) => {
      const ultimaEvaluacion = paciente.evaluacion_clinica[0];

      return {
        id_paciente: paciente.id_paciente,
        nombre_completo: paciente.nombre_completo,
        edad: paciente.edad,
        sexo: paciente.sexo,
        email: paciente.email,
        telefono: paciente.telefono,
        fecha_nacimiento: paciente.fecha_nacimiento
          ? paciente.fecha_nacimiento.toISOString().split("T")[0]
          : null,
        ultima_evaluacion: ultimaEvaluacion?.created_at
          ? ultimaEvaluacion.created_at.toISOString().split("T")[0]
          : null,
        nivel_riesgo: ultimaEvaluacion?.resultado_ia?.[0]?.riesgo_estimado
          ? parseFloat(ultimaEvaluacion.resultado_ia[0].riesgo_estimado)
          : null,
      };
    });

    res.json({
      data: data,
      total: data.length,
    });

    await logAction({
      usuario_id: req.user?.userId || null,
      accion_nombre: "ver_pacientes",
      descripcion: `Visualización de lista de pacientes del usuario ID ${id}`,
      origen: "paciente.controller",
      ip: req.ip,
      user_agent: req.headers["user-agent"],
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
}
