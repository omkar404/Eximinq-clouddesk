import { unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { getBisConfiguration, getBisDocument, getBisLedger, getBisQuote, getBisRequests, removeBisDocument, saveBisDraft, storeBisDocument, submitBis } from "../services/bisRegistration.service.js";
import { validateBisQuote, validateBisRequest } from "../validations/bisRegistration.validation.js";
const uploadDirectory = resolve("server/uploads/bis");
const removeFile = async (name) => name && unlink(resolve(uploadDirectory, name)).catch(() => {});
export async function getConfiguration(req,res,next){try{res.json(await getBisConfiguration(req.user.id));}catch(e){next(e);}}
export async function getQuote(req,res,next){try{const v=validateBisQuote(req.body);if(!v.valid)return res.status(422).json({message:"Invalid BIS quote",errors:v.errors});res.json(await getBisQuote(req.user.id,v.value.requestMode));}catch(e){next(e);}}
export async function getRequests(req,res,next){try{res.json({requests:await getBisRequests(req.user.id)});}catch(e){next(e);}}
export async function getLedger(req,res,next){try{res.json(await getBisLedger(req.user.id));}catch(e){next(e);}}
export async function saveDraft(req,res,next){try{const v=validateBisRequest(req.body);if(!v.valid)return res.status(422).json({message:"Invalid BIS draft",errors:v.errors});const request=await saveBisDraft(req.user.id,v.value);res.status(v.value.requestId?200:201).json({request});}catch(e){next(e);}}
export async function submitRequest(req,res,next){try{const v=validateBisRequest(req.body,{requireComplete:true});if(!v.valid)return res.status(422).json({message:"Complete all required BIS information",errors:v.errors});res.json(await submitBis(req.user.id,v.value));}catch(e){next(e);}}
export async function uploadDocument(req,res,next){try{if(!req.file)return res.status(400).json({message:"Select a document to upload"});const result=await storeBisDocument({userId:req.user.id,requestId:req.params.requestId,documentKey:req.params.documentKey,file:req.file});await removeFile(result.previousStoredName);const d=result.document;res.status(201).json({document:{id:d.id,documentKey:d.document_key,name:d.original_name,mimeType:d.mime_type,size:Number(d.size_bytes),uploadedAt:d.uploaded_at,status:"Uploaded"}});}catch(e){if(req.file?.filename)await removeFile(req.file.filename);next(e);}}
export async function deleteDocument(req,res,next){try{const d=await removeBisDocument(req.user.id,req.params.requestId,req.params.documentKey);if(!d)return res.status(404).json({message:"BIS document not found"});await removeFile(d.stored_name);res.status(204).end();}catch(e){next(e);}}
export async function downloadDocument(req,res,next){try{const d=await getBisDocument(req.user.id,req.params.requestId,req.params.documentKey);if(!d)return res.status(404).json({message:"BIS document not found"});res.download(resolve(uploadDirectory,d.stored_name),d.original_name);}catch(e){next(e);}}
