import { prisma } from '../config/prismaClient.js';

// ==============================
// OBTENER TODAS LAS CITAS (doctor o admin)
// ==============================
export async function obtenerCitas(req, res, next) {
  try {
    const doctorId = Number(req.query.doctorId) || null;

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
        fecha_cita: 'asc',
      },
    });

    res.json(citas);
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
        estado: data.estado || 'Programada',
        observaciones: data.observaciones || null,
      },
    });

    res.status(201).json(nuevaCita);
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

    res.json({ message: 'Cita eliminada correctamente' });
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
  } catch (err) {
    next(err);
  }
}
