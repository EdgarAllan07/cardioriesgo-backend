import express from "express";
import {
  createPaciente,
  listPacientes,
} from "../controllers/paciente.controller.js";
import { authMiddleware } from "../middleware/auth.js";
const router = express.Router();

router.use(authMiddleware);
router.post("/", createPaciente);
router.get("/:id", listPacientes);
export default router;
