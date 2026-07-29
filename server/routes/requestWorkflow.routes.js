import crypto from "node:crypto";
import { mkdirSync } from "node:fs";
import { extname, resolve } from "node:path";
import { Router } from "express";
import multer from "multer";
import {
  adminDecision, adminDetail, adminList, adminReview, adminStatusUpdate, agentComplete,
  agentDetail, agentList, agentOutputUpload, agents, agentStart,
  assignmentCreate, clarificationCreate, clarificationResubmit,
  clarificationUpload, clientDetail, clientList, fileDownload, notificationRead,
  notifications, requestReview
} from "../controllers/requestWorkflow.controller.js";

const uploadDirectory = resolve("server/uploads/workflow");
mkdirSync(uploadDirectory, { recursive: true });
const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDirectory,
    filename(_req, file, callback) {
      callback(null, `${crypto.randomUUID()}${extname(file.originalname).toLowerCase()}`);
    }
  }),
  limits: { fileSize: 15 * 1024 * 1024 }
});

export function createRequestWorkflowRouters({ requireAuth, requireRole }) {
  const client = Router();
  client.use(requireAuth, requireRole("CLIENT"));
  client.get("/", clientList);
  client.get("/notifications", notifications);
  client.patch("/notifications/:notificationId/read", notificationRead);
  client.get("/:requestId", clientDetail);
  client.get("/:requestId/files/:kind/:fileId", fileDownload);
  client.post("/clarifications/:clarificationId/documents", upload.single("file"), clarificationUpload);
  client.post("/clarifications/:clarificationId/resubmit", clarificationResubmit);

  const admin = Router();
  admin.use(requireAuth, requireRole("ADMIN"));
  admin.get("/", adminList);
  admin.get("/agents", agents);
  admin.get("/:requestId", adminDetail);
  admin.get("/:requestId/files/:kind/:fileId", fileDownload);
  admin.patch("/:requestId/status", adminStatusUpdate);
  admin.post("/:requestId/clarifications", clarificationCreate);
  admin.post("/:requestId/review", requestReview);
  admin.post("/:requestId/assign", assignmentCreate);
  admin.post("/:requestId/admin-review", adminReview);
  admin.post("/:requestId/decision", adminDecision);

  const agent = Router();
  agent.use(requireAuth, requireRole("AGENT"));
  agent.get("/", agentList);
  agent.get("/notifications", notifications);
  agent.patch("/notifications/:notificationId/read", notificationRead);
  agent.get("/:requestId", agentDetail);
  agent.get("/:requestId/files/:kind/:fileId", fileDownload);
  agent.post("/:requestId/start", agentStart);
  agent.post("/:requestId/outputs", upload.single("file"), agentOutputUpload);
  agent.post("/:requestId/complete", agentComplete);
  return { client, admin, agent };
}
