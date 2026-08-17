import { unlink } from "node:fs/promises";
import { resolve } from "node:path";
import {
  getLicensingConfiguration,
  getLicensingDocument,
  getLicensingLedger,
  getLicensingQuote,
  getLicensingRequests,
  removeLicensingDocument,
  saveLicensingDraft,
  storeLicensingDocument,
  submitLicensingRequest,
} from "../services/licensing.service.js";
import { validateLicensingRequest } from "../validations/licensing.validation.js";

const uploadDirectory = resolve("server/uploads/licensing");
const removeFile = async (name) =>
  name && unlink(resolve(uploadDirectory, name)).catch(() => {});

export async function getConfiguration(req, res, next) {
  try {
    res.json(await getLicensingConfiguration(req.user.id, req.params.serviceSlug));
  } catch (error) {
    next(error);
  }
}

export async function getQuote(req, res, next) {
  try {
    const validation = validateLicensingRequest(req.params.serviceSlug, req.body, {
      requireComplete: false,
    });
    if (!validation.valid) {
      return res.status(422).json({ message: "Invalid licensing quote", errors: validation.errors });
    }
    res.json(await getLicensingQuote(req.user.id, req.params.serviceSlug, validation.value.form));
  } catch (error) {
    next(error);
  }
}

export async function getRequests(req, res, next) {
  try {
    res.json({ requests: await getLicensingRequests(req.user.id, req.params.serviceSlug) });
  } catch (error) {
    next(error);
  }
}

export async function getLedger(req, res, next) {
  try {
    res.json(await getLicensingLedger(req.user.id, req.params.serviceSlug));
  } catch (error) {
    next(error);
  }
}

export async function saveDraft(req, res, next) {
  try {
    const validation = validateLicensingRequest(req.params.serviceSlug, req.body, {
      requireComplete: false,
    });
    if (!validation.valid) {
      return res.status(422).json({ message: "Invalid licensing draft", errors: validation.errors });
    }
    const request = await saveLicensingDraft(req.user.id, req.params.serviceSlug, validation.value);
    res.status(validation.value.requestId ? 200 : 201).json({ request });
  } catch (error) {
    next(error);
  }
}

export async function submitRequest(req, res, next) {
  try {
    const validation = validateLicensingRequest(req.params.serviceSlug, req.body, {
      requireComplete: true,
    });
    if (!validation.valid) {
      return res.status(422).json({
        message: "Complete all required licensing information and documents",
        errors: validation.errors,
      });
    }
    res.json(await submitLicensingRequest(req.user.id, req.params.serviceSlug, validation.value));
  } catch (error) {
    next(error);
  }
}

export async function uploadDocument(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ message: "Select a document to upload" });
    const result = await storeLicensingDocument({
      userId: req.user.id,
      slug: req.params.serviceSlug,
      requestId: req.params.requestId,
      documentKey: req.params.documentKey,
      file: req.file,
    });
    await removeFile(result.previousStoredName);
    const document = result.document;
    res.status(201).json({
      document: {
        id: document.id,
        documentKey: document.document_key,
        name: document.original_name,
        mimeType: document.mime_type,
        size: Number(document.size_bytes),
        uploadedAt: document.uploaded_at,
        status: "Uploaded",
      },
    });
  } catch (error) {
    if (req.file?.filename) await removeFile(req.file.filename);
    next(error);
  }
}

export async function deleteDocument(req, res, next) {
  try {
    const document = await removeLicensingDocument(
      req.user.id,
      req.params.serviceSlug,
      req.params.requestId,
      req.params.documentKey,
    );
    if (!document) return res.status(404).json({ message: "Licensing document not found" });
    await removeFile(document.stored_name);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

export async function downloadDocument(req, res, next) {
  try {
    const document = await getLicensingDocument(
      req.user.id,
      req.params.serviceSlug,
      req.params.requestId,
      req.params.documentKey,
    );
    if (!document) return res.status(404).json({ message: "Licensing document not found" });
    res.download(resolve(uploadDirectory, document.stored_name), document.original_name);
  } catch (error) {
    next(error);
  }
}
