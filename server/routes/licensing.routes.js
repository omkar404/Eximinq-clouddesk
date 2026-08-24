import crypto from "node:crypto";
import { mkdirSync } from "node:fs";
import { extname, resolve } from "node:path";
import { Router } from "express";
import multer from "multer";
import {
  deleteDocument,
  downloadDocument,
  getConfiguration,
  getLedger,
  getQuote,
  getRequests,
  saveDraft,
  submitRequest,
  uploadDocument,
} from "../controllers/licensing.controller.js";

const directory = resolve("server/uploads/licensing");
mkdirSync(directory, { recursive: true });
const allowed = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/pkix-cert",
  "application/x-x509-ca-cert",
]);
const upload = multer({
  storage: multer.diskStorage({
    destination: directory,
    filename(_req, file, callback) {
      callback(null, `${crypto.randomUUID()}${extname(file.originalname).toLowerCase()}`);
    },
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter(_req, file, callback) {
    const valid = allowed.has(file.mimetype);
    callback(valid ? null : new Error("Unsupported document type"), valid);
  },
});

export function createLicensingRouter({ requireAuth }) {
  const router = Router();
  router.use(requireAuth);
  router.get("/:serviceSlug/requests/:requestId/documents/:documentKey/download", downloadDocument);
  router.get("/:serviceSlug/requests", getRequests);
  router.get("/:serviceSlug/ledger", getLedger);
  router.post("/:serviceSlug/quote", getQuote);
  router.post("/:serviceSlug/drafts", saveDraft);
  router.post("/:serviceSlug/submit", submitRequest);
  router.post("/:serviceSlug/drafts/:requestId/documents/:documentKey", upload.single("file"), uploadDocument);
  router.delete("/:serviceSlug/drafts/:requestId/documents/:documentKey", deleteDocument);
  router.get("/:serviceSlug", getConfiguration);
  return router;
}
