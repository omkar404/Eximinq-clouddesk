import crypto from "node:crypto";
import { mkdirSync } from "node:fs";
import { extname, resolve } from "node:path";
import { Router } from "express";
import multer from "multer";
import { deleteDocument, downloadDocument, getConfiguration, getLedger, getQuote, getRequests, saveDraft, submitRequest, uploadDocument } from "../controllers/unIip.controller.js";
const uploadDirectory = resolve("server/uploads/un-iip");
mkdirSync(uploadDirectory, { recursive: true });
const allowed = new Set(["application/pdf", "image/jpeg", "image/png", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]);
const upload = multer({ storage: multer.diskStorage({ destination: uploadDirectory, filename(_req, file, callback) { callback(null, `${crypto.randomUUID()}${extname(file.originalname).toLowerCase()}`); } }), limits: { fileSize: 10 * 1024 * 1024 }, fileFilter(_req, file, callback) { const valid = allowed.has(file.mimetype); callback(valid ? null : new Error("Unsupported document type"), valid); } });
export function createUnIipRouter({ requireAuth }) {
  const router = Router(); router.use(requireAuth);
  router.get("/", getConfiguration); router.get("/requests", getRequests); router.get("/ledger", getLedger);
  router.post("/quote", getQuote); router.post("/drafts", saveDraft); router.post("/submit", submitRequest);
  router.post("/drafts/:requestId/documents/:documentKey", upload.single("file"), uploadDocument);
  router.delete("/drafts/:requestId/documents/:documentKey", deleteDocument);
  router.get("/requests/:requestId/documents/:documentKey/download", downloadDocument);
  return router;
}
