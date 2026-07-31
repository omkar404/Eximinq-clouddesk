import { unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { getEbrcConfiguration, getEbrcDocument, getEbrcLedger, getEbrcQuote, getEbrcRequests, removeEbrcDocument, saveEbrcDraft, storeEbrcDocument, submitEbrc } from "../services/ebrc.service.js";
import { validateEbrcQuote, validateEbrcRequest } from "../validations/ebrc.validation.js";

const uploadDirectory=resolve("server/uploads/ebrc");
const removeFile=async(name)=>name&&unlink(resolve(uploadDirectory,name)).catch(()=>{});
export async function getConfiguration(req,res,next){try{res.json(await getEbrcConfiguration(req.user.id));}catch(e){next(e);}}
export async function getQuote(req,res,next){try{const v=validateEbrcQuote(req.body);if(!v.valid)return res.status(422).json({message:"Invalid e-BRC quote",errors:v.errors});res.json(await getEbrcQuote(req.user.id,v.value.ebrcType));}catch(e){next(e);}}
export async function getRequests(req,res,next){try{res.json({requests:await getEbrcRequests(req.user.id)});}catch(e){next(e);}}
export async function getLedger(req,res,next){try{res.json(await getEbrcLedger(req.user.id));}catch(e){next(e);}}
export async function saveDraft(req,res,next){try{const v=validateEbrcRequest(req.body);if(!v.valid)return res.status(422).json({message:"Invalid e-BRC draft",errors:v.errors});const request=await saveEbrcDraft(req.user.id,v.value);res.status(v.value.requestId?200:201).json({request});}catch(e){next(e);}}
export async function submitRequest(req,res,next){try{const v=validateEbrcRequest(req.body,{requireComplete:true});if(!v.valid)return res.status(422).json({message:"Complete all required e-BRC information",errors:v.errors});res.json(await submitEbrc(req.user.id,v.value));}catch(e){next(e);}}
export async function uploadDocument(req,res,next){try{if(!req.file)return res.status(400).json({message:"Select a document to upload"});const result=await storeEbrcDocument({userId:req.user.id,requestId:req.params.requestId,documentKey:req.params.documentKey,file:req.file});await removeFile(result.previousStoredName);const d=result.document;res.status(201).json({document:{id:d.id,documentKey:d.document_key,name:d.original_name,mimeType:d.mime_type,size:Number(d.size_bytes),uploadedAt:d.uploaded_at,status:"Uploaded"}});}catch(e){if(req.file?.filename)await removeFile(req.file.filename);next(e);}}
export async function deleteDocument(req,res,next){try{const d=await removeEbrcDocument(req.user.id,req.params.requestId,req.params.documentKey);if(!d)return res.status(404).json({message:"e-BRC document not found"});await removeFile(d.stored_name);res.status(204).end();}catch(e){next(e);}}
export async function downloadDocument(req,res,next){try{const d=await getEbrcDocument(req.user.id,req.params.requestId,req.params.documentKey);if(!d)return res.status(404).json({message:"e-BRC document not found"});res.download(resolve(uploadDirectory,d.stored_name),d.original_name);}catch(e){next(e);}}
