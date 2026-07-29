import { unlink } from "node:fs/promises";
import { resolve } from "node:path";
import {
  getIemConfiguration, getIemDocument, getIemLedger, getIemQuote,
  getIemRequests, removeIemDocument, saveIemDraft, storeIemDocument,
  submitIemRequest
} from "../services/iemRegistration.service.js";
import { validateIemQuote, validateIemRequest } from "../validations/iemRegistration.validation.js";

const uploadDirectory = resolve("server/uploads/iem-registration");
const removeFile = async (name) => name && unlink(resolve(uploadDirectory, name)).catch(() => {});

export async function getConfiguration(req, res, next) {
  try { res.json(await getIemConfiguration(req.user.id)); } catch (error) { next(error); }
}
export async function getQuote(req, res, next) {
  try {
    const validation = validateIemQuote(req.body);
    if (!validation.valid) return res.status(422).json({ message: "Invalid IEM quote request", errors: validation.errors });
    res.json(await getIemQuote(req.user.id, validation.value.filingPart));
  } catch (error) { next(error); }
}
export async function getRequests(req, res, next) {
  try { res.json({ requests: await getIemRequests(req.user.id) }); } catch (error) { next(error); }
}
export async function getLedger(req, res, next) {
  try { res.json(await getIemLedger(req.user.id)); } catch (error) { next(error); }
}
export async function saveDraft(req, res, next) {
  try {
    const validation = validateIemRequest(req.body);
    if (!validation.valid) return res.status(422).json({ message: "Invalid IEM draft", errors: validation.errors });
    const request = await saveIemDraft(req.user.id, validation.value);
    res.status(validation.value.requestId ? 200 : 201).json({ request });
  } catch (error) { next(error); }
}
export async function submitRequest(req, res, next) {
  try {
    const validation = validateIemRequest(req.body, { requireComplete: true });
    if (!validation.valid) return res.status(422).json({ message: "Complete all required IEM information", errors: validation.errors });
    const result = await submitIemRequest(req.user.id, validation.value);
    res.status(validation.value.requestId ? 200 : 201).json(result);
  } catch (error) { next(error); }
}
export async function uploadDocument(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ message: "Select a document to upload" });
    const result = await storeIemDocument({
      userId: req.user.id, requestId: req.params.requestId,
      documentKey: req.params.documentKey, file: req.file
    });
    await removeFile(result.previousStoredName);
    const item = result.document;
    res.status(201).json({ document: {
      id: item.id, documentKey: item.document_key, name: item.original_name,
      mimeType: item.mime_type, size: Number(item.size_bytes),
      uploadedAt: item.uploaded_at, status: "Uploaded"
    } });
  } catch (error) {
    if (req.file?.filename) await removeFile(req.file.filename);
    next(error);
  }
}
export async function deleteDocument(req, res, next) {
  try {
    const document = await removeIemDocument(req.user.id, req.params.requestId, req.params.documentKey);
    if (!document) return res.status(404).json({ message: "IEM document not found" });
    await removeFile(document.stored_name);
    res.status(204).end();
  } catch (error) { next(error); }
}
export async function downloadDocument(req, res, next) {
  try {
    const document = await getIemDocument(req.user.id, req.params.requestId, req.params.documentKey);
    if (!document) return res.status(404).json({ message: "IEM document not found" });
    res.download(resolve(uploadDirectory, document.stored_name), document.original_name);
  } catch (error) { next(error); }
}
