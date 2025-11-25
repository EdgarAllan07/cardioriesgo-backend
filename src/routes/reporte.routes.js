import express from "express";
import { generarReporteClinico } from "../controllers/reporte.controller.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.use(authMiddleware);

// Genera el PDF y lo sube a Supabase
router.post("/generar/:evaluacion_id", generarReporteClinico);

export default router;
