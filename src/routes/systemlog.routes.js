import express from "express";
import { listLogs, createLog } from "../controllers/systemlog.controller.js";
import { authMiddleware } from "../middleware/auth.js";
const router = express.Router();

router.use(authMiddleware);
router.get("/", listLogs);
router.post("/", createLog);
export default router;
