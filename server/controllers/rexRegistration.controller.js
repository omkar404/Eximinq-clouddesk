import { unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { getRexConfiguration, getRexDocument, getRexLedger, getRexQuote, getRexRequests, removeRexDocument, saveRexDraft, storeRexDocument, submitRex } from "../services/rexRegistration.service.js";
import { validateRexQuote, validateRexRequest } from "../validations/rexRegistration.validation.js";
const uploadDirectory = resolve("server/uploads/rex");
const removeFile = async (name) => name && unlink(resolve(uploadDirectory, name)).catch(() => {});
export async function getConfiguration(req,res,next){try{res.json(await getRexConfiguration(req.user.id));}catch(e){next(e);}}
export async function getQuote(req,res,next){try{const v=validateRexQuote(req.body);if(!v.valid)return res.status(422).json({message:"Invalid REX quote",errors:v.errors});res.json(await getRexQuote(req.user.id,v.value.requestType));}catch(e){next(e);}}
export async function getRequests(req,res,next){try{res.json({requests:await getRexRequests(req.user.id)});}catch(e){next(e);}}
export async function getLedger(req,res,next){try{res.json(await getRexLedger(req.user.id));}catch(e){next(e);}}
export async function saveDraft(req,res,next){try{const v=validateRexRequest(req.body);if(!v.valid)return res.status(422).json({message:"Invalid REX draft",errors:v.errors});const request=await saveRexDraft(req.user.id,v.value);res.status(v.value.requestId?200:201).json({request});}catch(e){next(e);}}
export async function submitRequest(req,res,next){try{const v=validateRexRequest(req.body,{requireComplete:true});if(!v.valid)return res.status(422).json({message:"Complete all required REX information",errors:v.errors});res.json(await submitRex(req.user.id,v.value));}catch(e){next(e);}}
export async function uploadDocument(req,res,next){try{if(!req.file)return res.status(400).json({message:"Select a document to upload"});const result=await storeRexDocument({userId:req.user.id,requestId:req.params.requestId,documentKey:req.params.documentKey,file:req.file});await removeFile(result.previousStoredName);const d=result.document;res.status(201).json({document:{id:d.id,documentKey:d.document_key,name:d.original_name,mimeType:d.mime_type,size:Number(d.size_bytes),uploadedAt:d.uploaded_at,status:"Uploaded"}});}catch(e){if(req.file?.filename)await removeFile(req.file.filename);next(e);}}
export async function deleteDocument(req,res,next){try{const d=await removeRexDocument(req.user.id,req.params.requestId,req.params.documentKey);if(!d)return res.status(404).json({message:"REX document not found"});await removeFile(d.stored_name);res.status(204).end();}catch(e){next(e);}}
export async function downloadDocument(req,res,next){try{const d=await getRexDocument(req.user.id,req.params.requestId,req.params.documentKey);if(!d)return res.status(404).json({message:"REX document not found"});res.download(resolve(uploadDirectory,d.stored_name),d.original_name);}catch(e){next(e);}}
