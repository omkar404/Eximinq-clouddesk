import { unlink } from "node:fs/promises";
import { resolve } from "node:path";
import {
  getEpcgConfiguration,
  getEpcgDocument,
  getEpcgLedger,
  getEpcgQuote,
  getEpcgRequests,
  removeEpcgDocument,
  saveEpcgDraft,
  storeEpcgDocument,
  submitEpcg,
} from "../services/epcg.service.js";
import {
  validateEpcgQuote,
  validateEpcgRequest,
} from "../validations/epcg.validation.js";
const uploadDirectory = resolve("server/uploads/epcg");
const removeFile = async (name) =>
  name && unlink(resolve(uploadDirectory, name)).catch(() => {});
export async function getConfiguration(req, res, next) {
  try {
    res.json(await getEpcgConfiguration(req.user.id));
  } catch (e) {
    next(e);
  }
}
export async function getQuote(req, res, next) {
  try {
    const v = validateEpcgQuote(req.body);
    if (!v.valid)
      return res
        .status(422)
        .json({ message: "Invalid EPCG quote", errors: v.errors });
    res.json(
      await getEpcgQuote(req.user.id, v.value.epcgType, v.value.dutyValue),
    );
  } catch (e) {
    next(e);
  }
}
export async function getRequests(req, res, next) {
  try {
    res.json({ requests: await getEpcgRequests(req.user.id) });
  } catch (e) {
    next(e);
  }
}
export async function getLedger(req, res, next) {
  try {
    res.json(await getEpcgLedger(req.user.id));
  } catch (e) {
    next(e);
  }
}
export async function saveDraft(req, res, next) {
  try {
    const v = validateEpcgRequest(req.body);
    if (!v.valid)
      return res
        .status(422)
        .json({ message: "Invalid EPCG draft", errors: v.errors });
    const request = await saveEpcgDraft(req.user.id, v.value);
    res.status(v.value.requestId ? 200 : 201).json({ request });
  } catch (e) {
    next(e);
  }
}
export async function submitRequest(req, res, next) {
  try {
    const v = validateEpcgRequest(req.body, { requireComplete: true });
    if (!v.valid)
      return res
        .status(422)
        .json({
          message: "Complete all required EPCG information",
          errors: v.errors,
        });
    res.json(await submitEpcg(req.user.id, v.value));
  } catch (e) {
    next(e);
  }
}
export async function uploadDocument(req, res, next) {
  try {
    if (!req.file)
      return res.status(400).json({ message: "Select a document to upload" });
    const result = await storeEpcgDocument({
      userId: req.user.id,
      requestId: req.params.requestId,
      documentKey: req.params.documentKey,
      file: req.file,
    });
    await removeFile(result.previousStoredName);
    const d = result.document;
    res
      .status(201)
      .json({
        document: {
          id: d.id,
          documentKey: d.document_key,
          name: d.original_name,
          mimeType: d.mime_type,
          size: Number(d.size_bytes),
          uploadedAt: d.uploaded_at,
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
    const d = await removeEpcgDocument(
      req.user.id,
      req.params.requestId,
      req.params.documentKey,
    );
    if (!d) return res.status(404).json({ message: "EPCG document not found" });
    await removeFile(d.stored_name);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
}
export async function downloadDocument(req, res, next) {
  try {
    const d = await getEpcgDocument(
      req.user.id,
      req.params.requestId,
      req.params.documentKey,
    );
    if (!d) return res.status(404).json({ message: "EPCG document not found" });
    res.download(resolve(uploadDirectory, d.stored_name), d.original_name);
  } catch (e) {
    next(e);
  }
}
