import { Router } from "express";
import {
  downloadDocument,
  getRequest,
  listRequests,
  updateStatus
} from "../controllers/adminServiceRequest.controller.js";

export function createAdminServiceRequestRouter({ requireAuth, requireAdmin }) {
  const router = Router();
  router.use(requireAuth, requireAdmin);
  router.get("/", listRequests);
  router.get("/:requestId", getRequest);
  router.patch("/:requestId/status", updateStatus);
  router.get("/:requestId/documents/:documentId/download", downloadDocument);
  return router;
}
