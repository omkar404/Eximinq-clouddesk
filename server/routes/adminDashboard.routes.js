import { Router } from "express";
import { dashboard } from "../controllers/adminDashboard.controller.js";

export function createAdminDashboardRouter({ requireAuth, requireAdmin }) {
  const router = Router();
  router.use(requireAuth, requireAdmin);
  router.get("/", dashboard);
  return router;
}
