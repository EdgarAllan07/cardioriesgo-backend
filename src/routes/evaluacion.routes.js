import express from "express";
import {
  createEvaluacion,
  listaEvaluacionesPorPaciente,
} from "../controllers/evaluacion.controller.js";
import { authMiddleware } from "../middleware/auth.js";
const router = express.Router();

router.use(authMiddleware);
router.post("/", createEvaluacion);
router.get("/lista/:id", listaEvaluacionesPorPaciente);
export default router;
