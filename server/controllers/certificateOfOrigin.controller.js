import { unlink } from "node:fs/promises";
import { resolve } from "node:path";
import {
  buildCertificateOfOriginQuote,
  getCertificateOfOriginConfiguration,
  getCertificateOfOriginDocument,
  getCertificateOfOriginLedger,
  getCertificateOfOriginRequests,
  removeCertificateOfOriginDocument,
  saveCertificateOfOriginRequest,
  storeCertificateOfOriginDocument
} from "../services/certificateOfOrigin.service.js";
import {
  validateQuotePayload,
  validateRequestPayload
} from "../validations/certificateOfOrigin.validation.js";

const uploadDirectory = resolve("server/uploads/certificate-of-origin");

async function removeStoredFile(storedName) {
  if (!storedName) return;
  await unlink(resolve(uploadDirectory, storedName)).catch(() => {});
}
export async function getConfiguration(req, res, next) {
  try {
    res.json(await getCertificateOfOriginConfiguration(req.user.id));
  } catch (error) {
    next(error);
  }
}

export async function getRequests(req, res, next) {
  try {
    res.json({ requests: await getCertificateOfOriginRequests(req.user.id) });
  } catch (error) {
    next(error);
  }
}

export async function getLedger(req, res, next) {
  try {
    res.json(await getCertificateOfOriginLedger(req.user.id));
  } catch (error) {
    next(error);
  }
}

export async function createQuote(req, res, next) {
  try {
    const validation = validateQuotePayload(req.body);
    if (!validation.valid) {
      return res.status(422).json({
        message: "Invalid quote request",
        errors: validation.errors
      });
    }

    res.json(
      await buildCertificateOfOriginQuote(
        req.user.id,
        validation.value.certificateType
      )
    );
  } catch (error) {
    next(error);
  }
}

export async function saveDraft(req, res, next) {
  try {
    const validation = validateRequestPayload(req.body);
    if (!validation.valid) {
      return res.status(422).json({
        message: "Invalid Certificate of Origin draft",
        errors: validation.errors
      });
    }

    const request = await saveCertificateOfOriginRequest(
      req.user.id,
      validation.value,
      "DRAFT"
    );
    res.status(validation.value.requestId ? 200 : 201).json({ request });
  } catch (error) {
    next(error);
  }
}

export async function submitRequest(req, res, next) {
  try {
    const validation = validateRequestPayload(req.body, { requireComplete: true });
    if (!validation.valid) {
      return res.status(422).json({
        message: "Complete all required Certificate of Origin information",
        errors: validation.errors
      });
    }

    const result = await saveCertificateOfOriginRequest(
      req.user.id,
      validation.value,
      "SUBMITTED"
    );
    res.status(validation.value.requestId ? 200 : 201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function uploadDocument(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Select a document to upload" });
    }

    const result = await storeCertificateOfOriginDocument({
      userId: req.user.id,
      requestId: req.params.requestId,
      documentKey: req.params.documentKey,
      file: req.file
    });
    await removeStoredFile(result.previousStoredName);

    res.status(201).json({
      document: {
        id: result.document.id,
        documentKey: result.document.document_key,
        name: result.document.original_name,
        mimeType: result.document.mime_type,
        size: Number(result.document.size_bytes),
        uploadedAt: result.document.uploaded_at,
        status: "Uploaded"
      }
    });
  } catch (error) {
    if (req.file?.filename) await removeStoredFile(req.file.filename);
    next(error);
  }
}

export async function removeDocument(req, res, next) {
  try {
    const document = await removeCertificateOfOriginDocument(
      req.user.id,
      req.params.requestId,
      req.params.documentKey
    );
    if (!document) {
      return res.status(404).json({ message: "Supporting document not found" });
    }
    await removeStoredFile(document.stored_name);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

export async function downloadDocument(req, res, next) {
  try {
    const document = await getCertificateOfOriginDocument(
      req.user.id,
      req.params.requestId,
      req.params.documentKey
    );
    if (!document) {
      return res.status(404).json({ message: "Supporting document not found" });
    }
    res.download(resolve(uploadDirectory, document.stored_name), document.original_name);
  } catch (error) {
    next(error);
  }
}
