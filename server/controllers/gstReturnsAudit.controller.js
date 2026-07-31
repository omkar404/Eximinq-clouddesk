import { unlink } from "node:fs/promises";
import { resolve } from "node:path";
import {
  getGstReturnsConfiguration,
  getGstReturnsDocument,
  getGstReturnsLedger,
  getGstReturnsQuote,
  getGstReturnsRequests,
  removeGstReturnsDocument,
  saveGstReturnsDraft,
  storeGstReturnsDocument,
  submitGstReturns,
} from "../services/gstReturnsAudit.service.js";
import {
  validateGstReturnsQuote,
  validateGstReturnsRequest,
} from "../validations/gstReturnsAudit.validation.js";
const uploadDirectory = resolve("server/uploads/gst-returns-audit");
const removeFile = async (name) =>
  name && unlink(resolve(uploadDirectory, name)).catch(() => {});
export async function getConfiguration(req, res, next) {
  try {
    res.json(await getGstReturnsConfiguration(req.user.id));
  } catch (e) {
    next(e);
  }
}
export async function getQuote(req, res, next) {
  try {
    const v = validateGstReturnsQuote(req.body);
    if (!v.valid)
      return res
        .status(422)
        .json({ message: "Invalid GST quote", errors: v.errors });
    res.json(await getGstReturnsQuote(req.user.id, v.value.returnType));
  } catch (e) {
    next(e);
  }
}
export async function getRequests(req, res, next) {
  try {
    res.json({ requests: await getGstReturnsRequests(req.user.id) });
  } catch (e) {
    next(e);
  }
}
export async function getLedger(req, res, next) {
  try {
    res.json(await getGstReturnsLedger(req.user.id));
  } catch (e) {
    next(e);
  }
}
export async function saveDraft(req, res, next) {
  try {
    const v = validateGstReturnsRequest(req.body);
    if (!v.valid)
      return res
        .status(422)
        .json({ message: "Invalid GST draft", errors: v.errors });
    const request = await saveGstReturnsDraft(req.user.id, v.value);
    res.status(v.value.requestId ? 200 : 201).json({ request });
  } catch (e) {
    next(e);
  }
}
export async function submitRequest(req, res, next) {
  try {
    const v = validateGstReturnsRequest(req.body, { requireComplete: true });
    if (!v.valid)
      return res
        .status(422)
        .json({
          message: "Complete all required GST information",
          errors: v.errors,
        });
    res.json(await submitGstReturns(req.user.id, v.value));
  } catch (e) {
    next(e);
  }
}
export async function uploadDocument(req, res, next) {
  try {
    if (!req.file)
      return res.status(400).json({ message: "Select a document to upload" });
    const result = await storeGstReturnsDocument({
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
    const document = await removeGstReturnsDocument(
      req.user.id,
      req.params.requestId,
      req.params.documentKey,
    );
    if (!document)
      return res.status(404).json({ message: "GST document not found" });
    await removeFile(document.stored_name);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
}
export async function downloadDocument(req, res, next) {
  try {
    const document = await getGstReturnsDocument(
      req.user.id,
      req.params.requestId,
      req.params.documentKey,
    );
    if (!document)
      return res.status(404).json({ message: "GST document not found" });
    res.download(
      resolve(uploadDirectory, document.stored_name),
      document.original_name,
    );
  } catch (e) {
    next(e);
  }
}
