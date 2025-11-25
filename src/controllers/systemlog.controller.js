import { prisma } from "../config/prismaClient.js";
import { logAction } from "../services/log.service.js";
export async function listLogs(req, res, next) {
  try {
    // const logs = await prisma.system_log.findMany({ include: { accion: true, usuario: true }, orderBy: { fecha: 'desc' } });
    const logs = await prisma.$queryRaw`
    SELECT sl.fecha as fecha_ahora,
    CONCAT(u.nombre, ' ', u.apellido) AS nombre,
    a.nombre_accion as accion,
    a.descripcion as descripcion
    FROM public.system_log sl
    INNER JOIN public.accion_sistema a ON sl.id_accion = a.id_accion
    INNER JOIN public.usuario u ON sl.id_usuario = u.id_usuario
    ORDER BY sl.fecha DESC
    `;
    res.json(logs);

  } catch (err) {
    next(err);
  }
}
export async function createLog(req, res, next) {
  try {
    const data = req.body;
    const log = await prisma.system_log.create({ data });
    res.status(201).json(log);
  } catch (err) {
    next(err);
  }
}
