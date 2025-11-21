import express from 'express';
import { listLogs, createLog } from '../controllers/systemlog.controller.js';
const router = express.Router();
router.get('/', listLogs);
router.post('/', createLog);
export default router;
