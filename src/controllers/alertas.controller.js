import { prisma } from "../config/prismaClient.js";
import { logAction } from "../services/log.service.js";

export async function getAlert(req, res) {
  try {
    const id = Number(req.params.id);

    if (!req.params.id || isNaN(id)) {
      return res.status(400).json({ error: "doctorId inválido o no enviado" });
    }

    const config = await prisma.config_alertas.findUnique({
      where: { usuario_id: id },
    });

    if (!config) {
      return res.status(404).json({ error: "Configuración no encontrada" });
    }

    const nivel_riesgo = config.umbral_riesgo;

    const alertas = await prisma.$queryRaw`
    SELECT 
    a.*,
    p.nombre_completo as nombre_paciente,
    r.riesgo_estimado,
    a.nivel_riesgo,
    a.estado,
    a.fecha,
    a.mensaje
    FROM alertas a 
    inner join paciente p on a.paciente_id = p.id_paciente
    INNER JOIN evaluacion_clinica e on a.evaluacion_id = e.id_evaluacion
    INNER JOIN resultado_ia r on e.id_evaluacion = r.evaluacion_id
    WHERE a.usuario_id = ${id}
    AND a.riesgo_estimado >= ${nivel_riesgo}
    ORDER BY fecha DESC;
    `

    logAction({
      usuario_id: req.user?.userId || null,
      accion_nombre: "ver_alertas",
      descripcion: `Visualización de alertas para usuario ID ${id}`,
      origen: "alertas.controller",
      ip: req.ip,
      user_agent: req.headers["user-agent"],
    }).catch(console.error);

    return res.json(alertas);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error al obtener la alerta" });
  }
}


export async function viewAlert(req, res, next) {
  try {
    const id = Number(req.params.id);
    const body = req.body;
    if (!id) {
      return res.status(400).json({ error: "doctorId inválido o no enviado" });
    }
    const updateAlert = await prisma.alertas.update({
      where: {
        id_alerta: id,
      },
      data: {
        estado: body?.estado,
      },
    });
    res.json(updateAlert);

    await logAction({
      usuario_id: req.user?.userId || null,
      accion_nombre: "marcar_alerta_vista",
      descripcion: `Marcadas como vistas las alertas del usuario ID ${id}`,
      origen: "alertas.controller",
      ip: req.ip,
      user_agent: req.headers["user-agent"],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener la alerta" });
    next(error);
  }
}

export async function setUpConfig(req,res,next){
    try {
        const id = Number(req.params.id);
        const body =  req.body;
        if (!id) {
            return res.status(400).json({ error: "doctorId inválido o no enviado" });
        }
        const insertConfig= await prisma.config_alertas.update({
            where: {
                usuario_id: id,
            },
            data: {
                usuario_id: id,
                activar_notificaciones: body.activar_notificaciones,
                umbral_riesgo: body.umbral_riesgo,
                updated_at: new Date(),

            },
        });
        res.json(insertConfig);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al obtener la alerta" });
        next(error);
    }
}

export async function getConfigs(req,res,next) {
  try {
    const id = Number(req.params.id);
    if (!id) {  
      return res.status(400).json({ error: "doctorId inválido o no enviado" });
    }
    const config = await prisma.config_alertas.findUnique({
      where: { usuario_id: id },
    });
    res.json(config);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener la alerta" });
    next(error);
  }
}