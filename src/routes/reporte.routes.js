import express from "express";
import { generarReporteClinico } from "../controllers/reporte.controller.js";

const router = express.Router();

// Genera el PDF y lo sube a Supabase
router.post("/generar/:evaluacion_id", generarReporteClinico);

export default router;
