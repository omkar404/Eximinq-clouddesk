import { unlink } from "node:fs/promises";
import { resolve } from "node:path";
import {
  getWpcEtaConfiguration,
  getWpcEtaDocument,
  getWpcEtaLedger,
  getWpcEtaQuote,
  getWpcEtaRequests,
  removeWpcEtaDocument,
  saveWpcEtaDraft,
  storeWpcEtaDocument,
  submitWpcEta,
} from "../services/wpcEta.service.js";
import {
  validateWpcEtaQuote,
  validateWpcEtaRequest,
} from "../validations/wpcEta.validation.js";

const uploadDirectory = resolve("server/uploads/wpc-eta");
const removeFile = async (name) =>
  name && unlink(resolve(uploadDirectory, name)).catch(() => {});
export async function getConfiguration(req, res, next) {
  try {
    res.json(await getWpcEtaConfiguration(req.user.id));
  } catch (e) {
    next(e);
  }
}
export async function getQuote(req, res, next) {
  try {
    const validation = validateWpcEtaQuote(req.body);
    if (!validation.valid)
      return res
        .status(422)
        .json({ message: "Invalid WPC quote", errors: validation.errors });
    res.json(await getWpcEtaQuote(req.user.id, validation.value.requestMode));
  } catch (e) {
    next(e);
  }
}
export async function getRequests(req, res, next) {
  try {
    res.json({ requests: await getWpcEtaRequests(req.user.id) });
  } catch (e) {
    next(e);
  }
}
export async function getLedger(req, res, next) {
  try {
    res.json(await getWpcEtaLedger(req.user.id));
  } catch (e) {
    next(e);
  }
}
export async function saveDraft(req, res, next) {
  try {
    const validation = validateWpcEtaRequest(req.body);
    if (!validation.valid)
      return res
        .status(422)
        .json({ message: "Invalid WPC draft", errors: validation.errors });
    const request = await saveWpcEtaDraft(req.user.id, validation.value);
    res.status(validation.value.requestId ? 200 : 201).json({ request });
  } catch (e) {
    next(e);
  }
}
export async function submitRequest(req, res, next) {
  try {
    const validation = validateWpcEtaRequest(req.body, {
      requireComplete: true,
    });
    if (!validation.valid)
      return res
        .status(422)
        .json({
          message: "Complete all required WPC information",
          errors: validation.errors,
        });
    res.json(await submitWpcEta(req.user.id, validation.value));
  } catch (e) {
    next(e);
  }
}
export async function uploadDocument(req, res, next) {
  try {
    if (!req.file)
      return res.status(400).json({ message: "Select a document to upload" });
    const result = await storeWpcEtaDocument({
      userId: req.user.id,
      requestId: req.params.requestId,
      documentKey: req.params.documentKey,
      file: req.file,
    });
    await removeFile(result.previousStoredName);
    const item = result.document;
    res
      .status(201)
      .json({
        document: {
          id: item.id,
          documentKey: item.document_key,
          name: item.original_name,
          mimeType: item.mime_type,
          size: Number(item.size_bytes),
          uploadedAt: item.uploaded_at,
          status: "Uploaded",
        },
      });
  } catch (e) {
    if (req.file?.filename) await removeFile(req.file.filename);
    next(e);
  }
}
export async function deleteDocument(req, res, next) {
  try {
    const document = await removeWpcEtaDocument(
      req.user.id,
      req.params.requestId,
      req.params.documentKey,
    );
    if (!document)
      return res.status(404).json({ message: "WPC document not found" });
    await removeFile(document.stored_name);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
}
export async function downloadDocument(req, res, next) {
  try {
    const document = await getWpcEtaDocument(
      req.user.id,
      req.params.requestId,
      req.params.documentKey,
    );
    if (!document)
      return res.status(404).json({ message: "WPC document not found" });
    res.download(
      resolve(uploadDirectory, document.stored_name),
      document.original_name,
    );
  } catch (e) {
    next(e);
  }
}
