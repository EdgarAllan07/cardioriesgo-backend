import express from 'express';
import { getResultado } from '../controllers/resultado.controller.js';
const router = express.Router();
router.get('/:id', getResultado);
export default router;
