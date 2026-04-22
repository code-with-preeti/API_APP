import { Router } from "express";
import {
  createAPI,
  getAPIs,
  deleteAPI,
  getApiHistoryController,
  getUptimeController
} from "../controllers/monitoredAPIController";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();

// All routes protected
router.use(authenticate);

// CRUD + history + uptime
router.post("/monitored-apis", createAPI);
router.get("/monitored-apis", getAPIs);
router.delete("/monitored-apis/:id", deleteAPI);
router.get("/monitored-apis/:id/history", getApiHistoryController);
router.get("/monitored-apis/:id/uptime", getUptimeController);

export default router;
