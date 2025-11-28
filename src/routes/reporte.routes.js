import express from "express";
import {
  generarReporteClinico,
  getReporteById,
  getReportesByPaciente,
} from "../controllers/reporte.controller.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.use(authMiddleware);

// Obtener todos los reportes de un paciente
router.get("/paciente/:patientId", getReportesByPaciente);

// Obtener un reporte específico por ID
router.get("/:reportId", getReporteById);

// Genera el PDF y lo sube a Supabase
router.post("/generar/", generarReporteClinico);

export default router;
