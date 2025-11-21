import { prisma } from "../config/prismaClient.js";

export async function getAlert(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ error: "doctorId inválido o no enviado" });
    }

    const config = await prisma.config_alertas.findUnique({
      where: {
        usuario_id: id,
      },
    });

    if (!config) {
      return res.status(404).json({ error: "Configuración no encontrada" });
    }
    const nivel_riesgo = config.umbral_riesgo;

    const alertas = await prisma.alertas.findMany({
      where: {
        usuario_id: id,
        riesgo_estimado: {
            gte: nivel_riesgo
        }
      },
      include: {
        paciente: {
          select: {
            id_paciente: true,
            nombre_completo: true,
            edad: true,
            sexo: true,
          },
        },
        evaluacion: {
          select: {
            id_evaluacion: true,
            created_at: true,
          },
        },
        resultado_ia: {
          select: {
            id_resultado_ia: true,
            created_at: true,
            riesgo_estimado: true,
          },
        },
      },
      orderBy: {
        fecha: "desc",
      },
    });

    res.json(alertas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener la alerta" });
    next(error);
  }
}

export async function viewAlert(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ error: "doctorId inválido o no enviado" });
    }
    const updateAlert = await prisma.alertas.update({
      where: {
        usuario_id: id,
      },
      data: {
        visto: true,
      },
    });
    res.json(updateAlert);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener la alerta" });
    next(error);
  }
}
