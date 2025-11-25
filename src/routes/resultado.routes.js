import express from "express";
import { getResultado } from "../controllers/resultado.controller.js";
import { authMiddleware } from "../middleware/auth.js";
const router = express.Router();

router.use(authMiddleware);
router.get("/:id", getResultado);
export default router;
