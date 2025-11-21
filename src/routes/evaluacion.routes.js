import express from 'express';
import { createEvaluacion,listaEvaluacionesPorPaciente } from '../controllers/evaluacion.controller.js';
const router = express.Router();
router.post('/', createEvaluacion);
router.get('/lista/:id',listaEvaluacionesPorPaciente)
export default router;