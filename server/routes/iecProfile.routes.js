import crypto from "node:crypto";
import { mkdirSync } from "node:fs";
import { unlink } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { Router } from "express";
import multer from "multer";
import { pool } from "../database/pool.js";

const uploadDir = resolve("server/uploads/iec-profile");
mkdirSync(uploadDir, { recursive: true });
const upload = multer({
  storage: multer.diskStorage({ destination: uploadDir, filename: (_req, file, done) => done(null, `${crypto.randomUUID()}${extname(file.originalname).toLowerCase()}`) }),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, done) => done(null, ["application/pdf", "image/jpeg", "image/png"].includes(file.mimetype)),
});

const editable = new Set(["DRAFT", "ACTION_REQUIRED"]);
const code = () => `IEC-${Date.now().toString().slice(-8)}`;
const notFound = () => Object.assign(new Error("IEC application not found"), { status: 404 });
async function owned(id, userId) {
  const result = await pool.query("SELECT * FROM iec_applications WHERE id=$1 AND user_id=$2", [id, userId]);
  if (!result.rows[0]) throw notFound();
  return result.rows[0];
}
async function complete(application) {
  const [branches, persons, documents, history] = await Promise.all([
    pool.query("SELECT id,branch_code,details,created_at,updated_at FROM iec_branches WHERE application_id=$1 ORDER BY id", [application.id]),
    pool.query("SELECT id,name,details,created_at,updated_at FROM iec_persons WHERE application_id=$1 ORDER BY id", [application.id]),
    pool.query("SELECT id,section,document_key,original_name,mime_type,size_bytes,uploaded_at FROM iec_documents WHERE application_id=$1 ORDER BY id", [application.id]),
    pool.query("SELECT id,status,event_type,comments,created_at FROM iec_application_history WHERE application_id=$1 ORDER BY created_at DESC", [application.id]),
  ]);
  return { ...application, branches: branches.rows, persons: persons.rows, documents: documents.rows, history: history.rows };
}
function validateSubmit(app) {
  const f = app.firm_details || {}, a = app.registered_address || {}, b = app.bank_details || {}, d = app.declarations || {};
  const required = [[f.firmName,"Firm name"],[f.nature,"Nature of firm"],[f.exporterCategory,"Exporter category"],[f.pan,"PAN"],[f.panName,"Name as PAN"],[f.birthDate,"Date of birth/incorporation"],[f.contact,"Contact number"],[f.email,"Email"],[a.address1,"Registered address"],[a.city,"City"],[a.state,"State"],[a.pincode,"Pincode"],[b.accountNumber,"Account number"],[b.accountHolder,"Account holder"],[b.ifsc,"IFSC"],[d.place,"Place"]];
  const missing = required.filter(([value]) => !String(value || "").trim()).map(([,label]) => label);
  if ([1,2,3,4,5,6].some((n) => d[`declaration${n}`] !== true) || d.terms !== true) missing.push("All declarations and Terms & Conditions");
  if (missing.length) throw Object.assign(new Error(`Complete required fields: ${missing.join(", ")}`), { status: 422 });
}

export function createIecProfileRouter({ requireAuth, requireRole }) {
  const router = Router();
  void requireRole;
  router.use(requireAuth, async (req,res,next) => {
    try {
      if (req.user.role === "CLIENT") {
        if (req.method !== "GET") return res.status(403).json({ message: "Statutory Profile is managed by the Admin and is read-only for clients" });
        return next();
      }
      if (req.user.role !== "ADMIN") return res.status(403).json({ message: "Statutory Profile access denied" });
      const clientId = Number(req.headers["x-statutory-client-id"] || req.query.clientId || req.body?.clientId);
      if (!clientId) return res.status(422).json({ message: "Select a client by CDCR ID first" });
      const owner = await pool.query("SELECT u.*,'CLIENT'::text AS role FROM users u JOIN roles r ON r.id=u.role_id WHERE u.id=$1 AND r.name='CLIENT'",[clientId]);
      if (!owner.rows[0]) return res.status(404).json({ message: "Selected client was not found" });
      req.statutoryAdmin = req.user;
      req.user = owner.rows[0];
      next();
    } catch (error) { next(error); }
  });
  router.get("/", async (req,res,next) => { try { const result=await pool.query("SELECT * FROM iec_applications WHERE user_id=$1 ORDER BY updated_at DESC",[req.user.id]); res.json({applications:result.rows}); } catch(e){next(e);} });
  router.post("/", async (req,res,next) => { try { const result=await pool.query("INSERT INTO iec_applications(request_code,user_id) VALUES($1,$2) RETURNING *",[code(),req.user.id]); await pool.query("INSERT INTO iec_application_history(application_id,status,event_type,actor_id) VALUES($1,'DRAFT','CREATED',$2)",[result.rows[0].id,req.user.id]); res.status(201).json({application:await complete(result.rows[0])}); } catch(e){next(e);} });
  router.get("/:id", async(req,res,next)=>{try{res.json({application:await complete(await owned(req.params.id,req.user.id))});}catch(e){next(e);}});
  router.patch("/:id", async(req,res,next)=>{try{const app=await owned(req.params.id,req.user.id);if(!editable.has(app.status))return res.status(409).json({message:"Submitted IEC applications cannot be edited"});const allowed=["firm_details","registered_address","bank_details","trade_details","declarations","current_step","application_type"];const sets=[],values=[];for(const key of allowed){if(req.body[key]!==undefined){values.push(req.body[key]);sets.push(`${key}=$${values.length}`);}}values.push(req.params.id,req.user.id);const result=await pool.query(`UPDATE iec_applications SET ${sets.length?sets.join(","):"updated_at=updated_at"},updated_at=NOW() WHERE id=$${values.length-1} AND user_id=$${values.length} RETURNING *`,values);res.json({application:await complete(result.rows[0])});}catch(e){next(e);}});
  for (const [path,table,label] of [["branches","iec_branches","branch_code"],["persons","iec_persons","name"]]) {
    router.post(`/:id/${path}`,async(req,res,next)=>{try{const app=await owned(req.params.id,req.user.id);if(!editable.has(app.status))return res.status(409).json({message:"Application is read-only"});const value=String(req.body[label]||"").trim();if(!value)return res.status(422).json({message:`${label.replace("_"," ")} is required`});const result=await pool.query(`INSERT INTO ${table}(application_id,${label},details) VALUES($1,$2,$3) RETURNING *`,[app.id,value,req.body.details||{}]);res.status(201).json({item:result.rows[0]});}catch(e){next(e);}});
    router.put(`/:id/${path}/:itemId`,async(req,res,next)=>{try{const app=await owned(req.params.id,req.user.id);if(!editable.has(app.status))return res.status(409).json({message:"Application is read-only"});const result=await pool.query(`UPDATE ${table} SET ${label}=$1,details=$2,updated_at=NOW() WHERE id=$3 AND application_id=$4 RETURNING *`,[req.body[label],req.body.details||{},req.params.itemId,app.id]);res.json({item:result.rows[0]});}catch(e){next(e);}});
    router.delete(`/:id/${path}/:itemId`,async(req,res,next)=>{try{const app=await owned(req.params.id,req.user.id);if(!editable.has(app.status))return res.status(409).json({message:"Application is read-only"});await pool.query(`DELETE FROM ${table} WHERE id=$1 AND application_id=$2`,[req.params.itemId,app.id]);res.status(204).end();}catch(e){next(e);}});
  }
  router.post("/:id/documents",upload.single("file"),async(req,res,next)=>{try{const app=await owned(req.params.id,req.user.id);if(!editable.has(app.status))return res.status(409).json({message:"Application is read-only"});if(!req.file)return res.status(422).json({message:"PDF, JPG or PNG document required"});const result=await pool.query("INSERT INTO iec_documents(application_id,section,document_key,original_name,stored_name,mime_type,size_bytes) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id,section,document_key,original_name,mime_type,size_bytes,uploaded_at",[app.id,req.body.section||"general",req.body.documentKey||"supporting",req.file.originalname,req.file.filename,req.file.mimetype,req.file.size]);res.status(201).json({document:result.rows[0]});}catch(e){next(e);}});
  router.get("/:id/documents/:documentId",async(req,res,next)=>{try{const app=await owned(req.params.id,req.user.id);const result=await pool.query("SELECT * FROM iec_documents WHERE id=$1 AND application_id=$2",[req.params.documentId,app.id]);if(!result.rows[0])throw notFound();res.download(resolve(uploadDir,result.rows[0].stored_name),result.rows[0].original_name);}catch(e){next(e);}});
  router.delete("/:id/documents/:documentId",async(req,res,next)=>{try{const app=await owned(req.params.id,req.user.id);if(!editable.has(app.status))return res.status(409).json({message:"Application is read-only"});const result=await pool.query("DELETE FROM iec_documents WHERE id=$1 AND application_id=$2 RETURNING stored_name",[req.params.documentId,app.id]);if(result.rows[0])await unlink(resolve(uploadDir,result.rows[0].stored_name)).catch(()=>{});res.status(204).end();}catch(e){next(e);}});
  router.post("/:id/submit",async(req,res,next)=>{try{const app=await owned(req.params.id,req.user.id);if(!editable.has(app.status))return res.status(409).json({message:"Application is already submitted"});validateSubmit(app);const result=await pool.query("UPDATE iec_applications SET status='SUBMITTED',current_step=8,submitted_at=NOW(),updated_at=NOW() WHERE id=$1 RETURNING *",[app.id]);await pool.query("INSERT INTO iec_application_history(application_id,status,event_type,comments,actor_id) VALUES($1,'SUBMITTED','SUBMITTED','IEC application submitted by client',$2)",[app.id,req.user.id]);res.json({application:await complete(result.rows[0])});}catch(e){next(e);}});
  return router;
}
