import express from "express";
import {
  userList,
  createUser,
  obtenerUsuario,
  updateUserStatus,
  updateUserPass,
  updateUser
} from "../controllers/usuario.controller.js";
import { authMiddleware } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
const router = express.Router();

router.use(authMiddleware);
router.post("/", createUser);
router.get("/", userList);
router.get("/:id", obtenerUsuario);
router.patch("/estado/:id", updateUserStatus);
router.patch("/contrasena/:id", updateUserPass);
router.patch("/:id", upload.single("avatar"), updateUser);
export default router;
