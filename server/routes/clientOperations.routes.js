import { Router } from "express";
import { overview } from "../controllers/clientOperations.controller.js";

export function createClientOperationsRouter({ requireAuth, requireRole }) {
  const router = Router();
  router.use(requireAuth, requireRole("CLIENT"));
  router.get("/overview", overview);
  return router;
}
