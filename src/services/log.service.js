import { prisma } from "../config/prismaClient.js";

export async function logAction({
  usuario_id,
  accion_nombre,
  descripcion,
  origen,
  ip,
  user_agent,
}) {
  try {
    // 1. Buscar si la acción existe
    let accion = await prisma.accion_sistema.findFirst({
      where: { nombre_accion: accion_nombre },
    });

    // 2. Si no existe, crearla
    if (!accion) {
      accion = await prisma.accion_sistema.create({
        data: {
          nombre_accion: accion_nombre,
          descripcion:
            descripcion || `Acción generada automáticamente: ${accion_nombre}`,
          categoria: "Sistema", // Categoría por defecto
        },
      });
      console.log(`[LOG] Nueva acción creada: ${accion_nombre}`);
    }

    // 3. Registrar el log
    await prisma.system_log.create({
      data: {
        id_usuario: usuario_id || null,
        id_accion: accion.id_accion,
        origen: origen || "API",
        ip_origen: ip || "Unknown",
        user_agent: user_agent || "Unknown",
      },
    });

    console.log(
      `[LOG] Acción registrada: ${accion_nombre} por usuario ${usuario_id}`
    );
  } catch (error) {
    console.error("[LOG ERROR] No se pudo registrar la acción:", error);
    // No lanzamos el error para no interrumpir el flujo principal
  }
}
