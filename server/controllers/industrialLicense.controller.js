import { unlink } from "node:fs/promises";
import { resolve } from "node:path";
import {
  getIndustrialLicenseConfiguration, getIndustrialLicenseDocument,
  getIndustrialLicenseLedger, getIndustrialLicenseQuote,
  getIndustrialLicenseRequests, removeIndustrialLicenseDocument,
  saveIndustrialLicenseDraft, storeIndustrialLicenseDocument,
  submitIndustrialLicense
} from "../services/industrialLicense.service.js";
import {
  validateIndustrialLicenseQuote, validateIndustrialLicenseRequest
} from "../validations/industrialLicense.validation.js";

const uploadDirectory = resolve("server/uploads/industrial-licence");
const removeFile = async (name) => name && unlink(resolve(uploadDirectory, name)).catch(() => {});

export async function getConfiguration(req, res, next) {
  try { res.json(await getIndustrialLicenseConfiguration(req.user.id)); } catch (error) { next(error); }
}
export async function getQuote(req, res, next) {
  try {
    const validation = validateIndustrialLicenseQuote(req.body);
    if (!validation.valid) return res.status(422).json({ message: "Invalid Industrial Licence quote", errors: validation.errors });
    res.json(await getIndustrialLicenseQuote(req.user.id, validation.value.requestType));
  } catch (error) { next(error); }
}
export async function getRequests(req, res, next) {
  try { res.json({ requests: await getIndustrialLicenseRequests(req.user.id) }); } catch (error) { next(error); }
}
export async function getLedger(req, res, next) {
  try { res.json(await getIndustrialLicenseLedger(req.user.id)); } catch (error) { next(error); }
}
export async function saveDraft(req, res, next) {
  try {
    const validation = validateIndustrialLicenseRequest(req.body);
    if (!validation.valid) return res.status(422).json({ message: "Invalid Industrial Licence draft", errors: validation.errors });
    const request = await saveIndustrialLicenseDraft(req.user.id, validation.value);
    res.status(validation.value.requestId ? 200 : 201).json({ request });
  } catch (error) { next(error); }
}
export async function submitRequest(req, res, next) {
  try {
    const validation = validateIndustrialLicenseRequest(req.body, { requireComplete: true });
    if (!validation.valid) return res.status(422).json({ message: "Complete all required Industrial Licence information", errors: validation.errors });
    const result = await submitIndustrialLicense(req.user.id, validation.value);
    res.status(validation.value.requestId ? 200 : 201).json(result);
  } catch (error) { next(error); }
}
export async function uploadDocument(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ message: "Select a document to upload" });
    const result = await storeIndustrialLicenseDocument({
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
    const document = await removeIndustrialLicenseDocument(req.user.id, req.params.requestId, req.params.documentKey);
    if (!document) return res.status(404).json({ message: "Industrial Licence document not found" });
    await removeFile(document.stored_name);
    res.status(204).end();
  } catch (error) { next(error); }
}
export async function downloadDocument(req, res, next) {
  try {
    const document = await getIndustrialLicenseDocument(req.user.id, req.params.requestId, req.params.documentKey);
    if (!document) return res.status(404).json({ message: "Industrial Licence document not found" });
    res.download(resolve(uploadDirectory, document.stored_name), document.original_name);
  } catch (error) { next(error); }
}
