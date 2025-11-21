import express from 'express';
import { header,pacienteAltoRiesgo,ultimaEvaluacionesPacientes,ultimaEvaluacionesRealizadas} from '../controllers/dashboard.controller.js';
const router = express.Router();
router.get('/header/:id',header);
router.get('/riesgos/:id',pacienteAltoRiesgo);
router.get('/pacientes/:id',ultimaEvaluacionesPacientes);
router.get('/evaluaciones/:id',ultimaEvaluacionesRealizadas)

export default router;