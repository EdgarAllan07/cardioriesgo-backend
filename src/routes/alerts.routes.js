import express from "express";
import { getAlert } from "../controllers/alertas.controller.js";
import { viewAlert } from "../controllers/alertas.controller.js";
import { authMiddleware } from "../middleware/auth.js";
import { setUpConfig } from "../controllers/alertas.controller.js";
import { getConfigs } from "../controllers/alertas.controller.js";
const router = express.Router();

router.use(authMiddleware);

router.get("/:id", getAlert);
router.patch("/:id", viewAlert);
router.patch("/config/:id", setUpConfig);
router.get("/config/:id", getConfigs);

export default router;
