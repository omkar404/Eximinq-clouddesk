import { unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { getGstLutConfiguration, getGstLutDocument, getGstLutLedger, getGstLutQuote,
  getGstLutRequests, removeGstLutDocument, saveGstLutDraft, storeGstLutDocument,
  submitGstLut } from "../services/gstLut.service.js";
import { validateGstLutQuote, validateGstLutRequest } from "../validations/gstLut.validation.js";

const uploadDirectory = resolve("server/uploads/gst-lut");
const removeFile = async (name) => name && unlink(resolve(uploadDirectory, name)).catch(() => {});
export async function getConfiguration(req, res, next) { try { res.json(await getGstLutConfiguration(req.user.id)); } catch (e) { next(e); } }
export async function getQuote(req, res, next) { try { const v = validateGstLutQuote(req.body); if (!v.valid) return res.status(422).json({ message: "Invalid LUT quote", errors: v.errors }); res.json(await getGstLutQuote(req.user.id, v.value.requestType)); } catch (e) { next(e); } }
export async function getRequests(req, res, next) { try { res.json({ requests: await getGstLutRequests(req.user.id) }); } catch (e) { next(e); } }
export async function getLedger(req, res, next) { try { res.json(await getGstLutLedger(req.user.id)); } catch (e) { next(e); } }
export async function saveDraft(req, res, next) { try { const v = validateGstLutRequest(req.body); if (!v.valid) return res.status(422).json({ message: "Invalid LUT draft", errors: v.errors }); const request = await saveGstLutDraft(req.user.id, v.value); res.status(v.value.requestId ? 200 : 201).json({ request }); } catch (e) { next(e); } }
export async function submitRequest(req, res, next) { try { const v = validateGstLutRequest(req.body, { requireComplete: true }); if (!v.valid) return res.status(422).json({ message: "Complete all required LUT information", errors: v.errors }); res.json(await submitGstLut(req.user.id, v.value)); } catch (e) { next(e); } }
export async function uploadDocument(req, res, next) { try { if (!req.file) return res.status(400).json({ message: "Select a document to upload" }); const result = await storeGstLutDocument({ userId: req.user.id, requestId: req.params.requestId, documentKey: req.params.documentKey, file: req.file }); await removeFile(result.previousStoredName); const item = result.document; res.status(201).json({ document: { id: item.id, documentKey: item.document_key, name: item.original_name, mimeType: item.mime_type, size: Number(item.size_bytes), uploadedAt: item.uploaded_at, status: "Uploaded" } }); } catch (e) { if (req.file?.filename) await removeFile(req.file.filename); next(e); } }
export async function deleteDocument(req, res, next) { try { const document = await removeGstLutDocument(req.user.id, req.params.requestId, req.params.documentKey); if (!document) return res.status(404).json({ message: "LUT document not found" }); await removeFile(document.stored_name); res.status(204).end(); } catch (e) { next(e); } }
export async function downloadDocument(req, res, next) { try { const document = await getGstLutDocument(req.user.id, req.params.requestId, req.params.documentKey); if (!document) return res.status(404).json({ message: "LUT document not found" }); res.download(resolve(uploadDirectory, document.stored_name), document.original_name); } catch (e) { next(e); } }
