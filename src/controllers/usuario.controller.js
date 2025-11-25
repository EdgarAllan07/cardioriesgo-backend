import { prisma } from "../config/prismaClient.js";
import { supabase } from "../config/supabaseClient.js";
import { logAction } from "../services/log.service.js";
export async function updateUser(req, res) {
  try {
    const id = Number(req.params.id);

    // Verifica si el usuario existe
    const user = await prisma.usuario.findUnique({
      where: { id_usuario: id },
    });

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    let avatarUrl = user.avatar_url; // mantener actual si no envían nueva imagen

    // SI ENVIAN ARCHIVO => lo subimos a Supabase Storage
    if (req.file) {
      const file = req.file;
      const fileExt = file.originalname.split(".").pop();
      const fileName = `avatar_${id}_${Date.now()}.${fileExt}`;

      // Subida a Supabase
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });

      if (uploadError) {
        console.error(uploadError);
        return res.status(500).json({ message: "Error subiendo avatar" });
      }

      // Obtener URL pública
      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      avatarUrl = publicUrlData.publicUrl;
    }

    // Actualizar datos del usuario
    const response = await prisma.usuario.update({
      where: { id_usuario: id },
      data: {
        nombre: req.body.nombre,
        apellido: req.body.apellido,
        correo: req.body.correo,
        contrasena_hash: req.body.contrasena_hash,
        avatar_url: avatarUrl, // <----- guardar aquí
      },
    });

    // Log
    await logAction({
      usuario_id: req.user?.userId || null,
      accion_nombre: "actualizar_usuario",
      descripcion: `Actualización del usuario ID ${id}.`,
      origen: "usuario.controller",
      ip: req.ip,
      user_agent: req.headers["user-agent"],
    });

    return res.status(200).json(response);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error actualizando usuario" });
  }
}

export async function userList(req, res, next) {
  try {
    const users = await prisma.$queryRaw`
  SELECT 
      u.id_usuario as id,
      CONCAT(u.nombre, ' ', u.apellido) AS nombre,
      u.correo as correo,
      t.nombre_tipo as tipo,
      u.estado as estado
    FROM public.usuario u 
    INNER JOIN public.tipo_usuario t ON u.tipo_usuario_id = t.id_tipo_usuario 
    ORDER BY u.created_at DESC
    `;
    res.json(users);

    // Log action
    // Note: We might not want to log every list view to avoid spam, but per requirements:
    await logAction({
      usuario_id: req.user?.userId || null, // Assuming auth middleware populates req.user
      accion_nombre: "ver_usuarios",
      descripcion: "Visualización de la lista de usuarios.",
      origen: "usuario.controller",
      ip: req.ip,
      user_agent: req.headers["user-agent"],
    });
  } catch (err) {
    next(err);
  }
}

export async function obtenerUsuario(req, res, next) {
  const id = Number(req.params.id);
  try {
    const user = await prisma.$queryRaw`
        SELECT 
        u.id_usuario,
        u.nombre,
        u.apellido,
        t.nombre_tipo as tipo_usuario_id,
        u.contrasena_hash as contrasena,
        u.correo,
        avatar_url as foto_perfil
       FROM
       public.usuario u
       INNER JOIN public.tipo_usuario t
       ON t.id_tipo_usuario = u.tipo_usuario_id
       WHERE id_usuario = ${id}
    `;
    res.json(user);

    await logAction({
      usuario_id: req.user?.userId || null,
      accion_nombre: "ver_perfil_usuario",
      descripcion: `Visualización del perfil del usuario ID ${id}.`,
      origen: "usuario.controller",
      ip: req.ip,
      user_agent: req.headers["user-agent"],
    });
  } catch (err) {
    next(err);
  }
}

export async function createUser(req, res, next) {
  try {
    const data = req.body;
    const log = await prisma.usuario.create({ data });
    const insertConfig= await prisma.config_alertas.create({
        data: {
            usuario_id: log.id_usuario,
            activar_notificaciones: true,
            umbral_riesgo: 70,
        },
    });
    await logAction({
      usuario_id: req.user?.userId || null,
      accion_nombre: "crear_usuario",
      descripcion: `Creación de nuevo usuario: ${data.correo}`,
      origen: "usuario.controller",
      ip: req.ip,
      user_agent: req.headers["user-agent"],
    });

    res.status(201).json(log);
  } catch (err) {
    next(err);
  }
}

//actualizar usuario para desactivarlo o reactivarlo
export async function updateUserStatus(req, res, next) {
  const id = Number(req.params.id);
  const body = req.body;
  try {
    const response = await prisma.usuario.update({
      where: {
        id_usuario: id,
      },
      data: {
        estado: body.estado,
      },
    });
    res.status(201).json(response);

    await logAction({
      usuario_id: req.user?.userId || null,
      accion_nombre: "actualizar_estado_usuario",
      descripcion: `Actualización de estado del usuario ID ${id} a ${body.estado}`,
      origen: "usuario.controller",
      ip: req.ip,
      user_agent: req.headers["user-agent"],
    });
  } catch (err) {
    next(err);
  }
}

export async function updateUserPass(req, res, next) {
  const id = Number(req.params.id);
  const body = req.body;
  try {
    const response = await prisma.usuario.update({
      where: {
        id_usuario: id,
      },
      data: {
        contrasena_hash: body.contrasena_hash,
      },
    });
    res.status(201).json(response);

    await logAction({
      usuario_id: req.user?.userId || null,
      accion_nombre: "actualizar_contrasena_usuario",
      descripcion: `Actualización de contraseña del usuario ID ${id}`,
      origen: "usuario.controller",
      ip: req.ip,
      user_agent: req.headers["user-agent"],
    });
  } catch (err) {
    next(err);
  }
}

