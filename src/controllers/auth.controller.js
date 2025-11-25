import { prisma } from "../config/prismaClient.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { logAction } from "../services/log.service.js";

export async function login(req, res, next) {
  try {
    const { correo, contrasena } = req.body;

    const user = await prisma.usuario.findUnique({ where: { correo } });
    if (!user) return res.status(401).json({ error: "Credenciales inválidas" });
    const match = contrasena === user.contrasena_hash;
    console.log("correo es: ", correo);
    console.log("contrasena es: ", user.contrasena_hash);
    console.log("match es: ", match);
    if (!match)
      return res.status(401).json({ error: "Credenciales inválidas" });
    const token = jwt.sign(
      { userId: user.id_usuario, role: user.tipo_usuario_id },
      process.env.JWT_SECRET
    );

    // Registrar log
    await logAction({
      usuario_id: user.id_usuario,
      accion_nombre: "login",
      descripcion: "Inicio de sesión exitoso en el sistema.",
      origen: "auth.controller",
      ip: req.ip,
      user_agent: req.headers["user-agent"],
    });

    res.json({ token,
      userId :  user.id_usuario
     });
  } catch (err) {
    next(err);
  }
}
