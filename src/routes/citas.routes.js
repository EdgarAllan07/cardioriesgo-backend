import express from 'express';
import {
  obtenerCitas,
  crearCita,
  actualizarCita,
  eliminarCita,
  eliminarCitasPorDoctor,
} from '../controllers/citas.controller.js';

const router = express.Router();

router.get('/:id', obtenerCitas); // ?doctorId=3
router.post('/', crearCita);
router.patch('/:id', actualizarCita);
router.delete('/:id', eliminarCita);
router.delete('/by-doctor/:id', eliminarCitasPorDoctor);

export default router;
