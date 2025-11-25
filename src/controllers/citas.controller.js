import { prisma } from "../config/prismaClient.js";
import { logAction } from "../services/log.service.js";

// ==============================
// OBTENER TODAS LAS CITAS (doctor o admin)
// ==============================
export async function obtenerCitas(req, res, next) {
  try {
    const doctorId = Number(req.params.id) || null;

    const citas = await prisma.cita_medica.findMany({
      where: doctorId ? { id_usuario: doctorId } : {},
      include: {
        paciente: {
          select: {
            id_paciente: true,
            nombre_completo: true,
            email: true,
          },
        },
        usuario: {
          select: {
            id_usuario: true,
            nombre: true,
            apellido: true,
            correo: true,
          },
        },
      },
      orderBy: {
        fecha_cita: "asc",
      },
    });

    res.json(citas);

    await logAction({
      usuario_id: req.user?.userId || null,
      accion_nombre: "ver_citas",
      descripcion: "Visualización de lista de citas médicas.",
      origen: "citas.controller",
      ip: req.ip,
      user_agent: req.headers["user-agent"],
    });
  } catch (err) {
    next(err);
  }
}

// ==============================
// CREAR UNA NUEVA CITA
// ==============================
export async function crearCita(req, res, next) {
  try {
    const data = req.body;

    const nuevaCita = await prisma.cita_medica.create({
      data: {
        id_paciente: data.id_paciente,
        id_usuario: data.id_usuario,
        fecha_cita: new Date(data.fecha_cita),
        motivo: data.motivo,
        estado: data.estado || "Programada",
        observaciones: data.observaciones || null,
      },
    });

    res.status(201).json(nuevaCita);

    await logAction({
      usuario_id: req.user?.userId || null,
      accion_nombre: "crear_cita_medica",
      descripcion: `Creación de cita médica para paciente ID ${data.id_paciente}`,
      origen: "citas.controller",
      ip: req.ip,
      user_agent: req.headers["user-agent"],
    });
  } catch (err) {
    next(err);
  }
}

// ==============================
// ACTUALIZAR CITA (PATCH)
// ==============================
export async function actualizarCita(req, res, next) {
  try {
    const id = Number(req.params.id);
    const data = req.body;

    const citaActualizada = await prisma.cita_medica.update({
      where: { id_cita: id },
      data: {
        id_paciente: data.id_paciente,
        id_usuario: data.id_usuario,
        fecha_cita: data.fecha_cita ? new Date(data.fecha_cita) : undefined,
        motivo: data.motivo,
        estado: data.estado,
        observaciones: data.observaciones,
        updated_at: new Date(),
      },
    });

    res.json(citaActualizada);

    await logAction({
      usuario_id: req.user?.userId || null,
      accion_nombre: "actualizar_cita_medica",
      descripcion: `Actualización de cita médica ID ${id}`,
      origen: "citas.controller",
      ip: req.ip,
      user_agent: req.headers["user-agent"],
    });
  } catch (err) {
    next(err);
  }
}

// ==============================
// ELIMINAR UNA CITA POR ID
// ==============================
export async function eliminarCita(req, res, next) {
  try {
    const id = Number(req.params.id);

    await prisma.cita_medica.delete({
      where: { id_cita: id },
    });

    res.json({ message: "Cita eliminada correctamente" });

    await logAction({
      usuario_id: req.user?.userId || null,
      accion_nombre: "eliminar_cita_medica",
      descripcion: `Eliminación de cita médica ID ${id}`,
      origen: "citas.controller",
      ip: req.ip,
      user_agent: req.headers["user-agent"],
    });
  } catch (err) {
    next(err);
  }
}

// ==============================
// ELIMINAR TODAS LAS CITAS DE UN DOCTOR
// ==============================
export async function eliminarCitasPorDoctor(req, res, next) {
  try {
    const doctorId = Number(req.params.id);

    const deleted = await prisma.cita_medica.deleteMany({
      where: { id_usuario: doctorId },
    });

    res.json({
      message: `Se eliminaron ${deleted.count} citas del doctor con ID ${doctorId}`,
    });

    await logAction({
      usuario_id: req.user?.userId || null,
      accion_nombre: "eliminar_citas_doctor",
      descripcion: `Eliminación de todas las citas del doctor ID ${doctorId}`,
      origen: "citas.controller",
      ip: req.ip,
      user_agent: req.headers["user-agent"],
    });
  } catch (err) {
    next(err);
  }
}
