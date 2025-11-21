import express from 'express';
import { createPaciente, listPacientes } from '../controllers/paciente.controller.js';
const router = express.Router();
router.post('/', createPaciente);
router.get('/', listPacientes);
export default router;
