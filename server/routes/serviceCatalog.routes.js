import { Router } from "express";
import { catalog } from "../controllers/serviceCatalog.controller.js";

export function createServiceCatalogRouter({ requireAuth }) {
  const router = Router();
  router.use(requireAuth);
  router.get("/catalog", catalog);
  return router;
}
