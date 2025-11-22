import express from "express";
import {
  userList,
  createUser,
  obtenerUsuario,
  updateUserStatus,
  updateUserPass
} from "../controllers/usuario.controller.js";
const router = express.Router();
router.post("/", createUser);
router.get("/", userList);
router.get("/:id", obtenerUsuario);
router.patch("/estado/:id", updateUserStatus);
router.patch("/contrasena/:id", updateUserPass);
export default router;
