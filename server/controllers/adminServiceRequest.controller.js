import { resolve } from "node:path";
import {
  changeAdminServiceRequestStatus,
  getAdminRequestDocument,
  getAdminServiceRequest,
  getAdminServiceRequests
} from "../services/adminServiceRequest.service.js";
import {
  ADMIN_REQUEST_STATUSES,
  validateAdminStatus
} from "../validations/adminServiceRequest.validation.js";

const uploadDirectories = {
  "certificate-of-origin": resolve("server/uploads/certificate-of-origin"),
  "iem-registration": resolve("server/uploads/iem-registration"),
  "industrial-licence": resolve("server/uploads/industrial-licence")
};

export async function listRequests(req, res, next) {
  try {
    const requests = await getAdminServiceRequests({
      status: req.query.status ? String(req.query.status).toUpperCase() : "",
      search: String(req.query.search || "").trim()
    });
    res.json({ requests, statuses: ADMIN_REQUEST_STATUSES });
  } catch (error) {
    next(error);
  }
}

export async function getRequest(req, res, next) {
  try {
    const request = await getAdminServiceRequest(req.params.requestId);
    if (!request) return res.status(404).json({ message: "Service request not found" });
    res.json({ request, statuses: ADMIN_REQUEST_STATUSES });
  } catch (error) {
    next(error);
  }
}

export async function updateStatus(req, res, next) {
  try {
    const validation = validateAdminStatus(req.body.status);
    if (!validation.valid) {
      return res.status(422).json({
        message: "Select a valid application status",
        statuses: ADMIN_REQUEST_STATUSES
      });
    }
    const request = await changeAdminServiceRequestStatus(
      req.params.requestId,
      validation.value
    );
    if (!request) return res.status(404).json({ message: "Submitted request not found" });
    res.json({
      request: {
        id: request.id,
        requestCode: request.request_code,
        status: request.status,
        submittedAt: request.submitted_at,
        updatedAt: request.updated_at
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function downloadDocument(req, res, next) {
  try {
    const document = await getAdminRequestDocument(
      req.params.requestId,
      req.params.documentId
    );
    if (!document) return res.status(404).json({ message: "Document not found" });
    const uploadDirectory = uploadDirectories[document.service_slug];
    if (!uploadDirectory) return res.status(404).json({ message: "Document storage not found" });
    res.download(resolve(uploadDirectory, document.stored_name), document.original_name);
  } catch (error) {
    next(error);
  }
}
