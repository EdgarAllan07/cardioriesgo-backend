import { prisma } from "../config/prismaClient.js";
import { logAction } from "../services/log.service.js";
export async function getResultado(req, res, next) {
  try {
    const id = Number(req.params.id);
    const resultado = await prisma.resultadoIA.findUnique({
      where: { id_resultado: id },
      include: { evaluacion: true },
    });
    res.json(resultado);

    await logAction({
      usuario_id: req.user?.userId || null,
      accion_nombre: "ver_resultado_ia",
      descripcion: `Visualización de resultado IA ID ${id}`,
      origen: "resultado.controller",
      ip: req.ip,
      user_agent: req.headers["user-agent"],
    });
  } catch (err) {
    next(err);
  }
}
