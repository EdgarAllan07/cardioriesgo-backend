import { prisma } from "../config/prismaClient.js";
export async function userList(req, res, next) {
  try {
    // const logs = await prisma.usuario.findMany({ include: { accion: true, usuario: true }, orderBy: { fecha: 'desc' } });
    // const users = await prisma.usuario.findMany({
    //   where: {
    //     tipo_usuario_id: {
    //       equals: 2
    //     }
    //   }
    // });
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
        t.nombre_tipo as tipo,
        u.correo,
        u.created_At as "Fecha de creacion"
       FROM
       public.usuario u
       INNER JOIN public.tipo_usuario t
       ON t.id_tipo_usuario = u.tipo_usuario_id
       WHERE id_usuario = ${id}
    `;
    res.json(user);
  } catch (err) {
    next(err);
  }
}

export async function createUser(req, res, next) {
  try {
    const data = req.body;
    const log = await prisma.usuario.create({ data });
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
  } catch (err) {
    next(err);
  }
}
