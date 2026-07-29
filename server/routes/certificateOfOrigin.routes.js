import { Router } from "express";
import { mkdirSync } from "node:fs";
import { extname, resolve } from "node:path";
import crypto from "node:crypto";
import multer from "multer";
import {
  createQuote,
  getConfiguration,
  getLedger,
  getRequests,
  downloadDocument,
  removeDocument,
  saveDraft,
  submitRequest,
  uploadDocument
} from "../controllers/certificateOfOrigin.controller.js";

const uploadDirectory = resolve("server/uploads/certificate-of-origin");
mkdirSync(uploadDirectory, { recursive: true });

const allowedMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
]);

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDirectory,
    filename(_req, file, callback) {
      callback(null, `${crypto.randomUUID()}${extname(file.originalname).toLowerCase()}`);
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(_req, file, callback) {
    callback(
      allowedMimeTypes.has(file.mimetype)
        ? null
        : new Error("Unsupported document type"),
      allowedMimeTypes.has(file.mimetype)
    );
  }
});

export function createCertificateOfOriginRouter({ requireAuth }) {
  const router = Router();

  router.use(requireAuth);
  router.get("/", getConfiguration);
  router.get("/requests", getRequests);
  router.get("/ledger", getLedger);
  router.post("/quote", createQuote);
  router.post("/drafts", saveDraft);
  router.post("/submit", submitRequest);
  router.post(
    "/drafts/:requestId/documents/:documentKey",
    upload.single("file"),
    uploadDocument
  );
  router.delete("/drafts/:requestId/documents/:documentKey", removeDocument);
  router.get("/requests/:requestId/documents/:documentKey/download", downloadDocument);

  return router;
}
