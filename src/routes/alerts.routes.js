import express from "express";
import { getAlert } from "../controllers/alertas.controller.js";
import { viewAlert } from "../controllers/alertas.controller.js";
const router = express.Router();

router.get("/:id", getAlert);
router.put("/:id", viewAlert);

export default router;