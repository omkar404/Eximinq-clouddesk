import "dotenv/config";
import bcrypt from "bcryptjs";
import process from "node:process";
import { pool } from "./pool.js";

const email = (process.env.ADMIN_EMAIL || "admin@eximinq.com").toLowerCase();
const password = process.env.ADMIN_PASSWORD;
const clientEmail = process.env.CLIENT_EMAIL?.trim().toLowerCase();
const clientPassword = process.env.CLIENT_PASSWORD;
const agentEmail = (process.env.AGENT_EMAIL || "agent@eximinq.com").toLowerCase();
const agentPassword = process.env.AGENT_PASSWORD || "Agent@12345!";

if (!password || password.length < 10) {
  throw new Error("ADMIN_PASSWORD must contain at least 10 characters");
}

if ((clientEmail || clientPassword) && (!clientEmail || !clientPassword || clientPassword.length < 10)) {
  throw new Error("CLIENT_EMAIL and a CLIENT_PASSWORD of at least 10 characters must be provided together");
}

const menus = [
  ["Command Center", "/admin/command-center", 10],
  ["Workforce", "/admin/workforce", 12],
  ["Request Board", "/admin/service-requests", 15],
  ["User Management", "/admin/users", 20],
  ["Menu Management", "/admin/menus", 30],
  ["Client Management", "/admin/clients", 40],
  ["Company Profiles", "/admin/company-profile", 50],
  ["Command Center", "/client/command-center", 110],
  ["Track Requests", "/client/track-requests", 120],
  ["Invoices & Billing", "/client/invoices-billing", 130],
  ["Schemes & Analytics", "/client/schemes-analytics", 140],
  ["Active Workflows", "/client/active-workflows", 150],
  ["Service Store", "/client/service-store", 160],
  ["Compliance Audit", "/client/compliance-audit", 170],
  ["Smart Vault", "/client/smart-vault", 180],
  ["Wallet", "/client/wallet-credit", 190],
  ["Company Profile", "/client/company-profile", 200]
  ,["My Dashboard", "/agent/dashboard", 210]
  ,["My Tasks", "/agent/tasks", 220]
];

const client = await pool.connect();
try {
  await client.query("BEGIN");
  for (const role of ["ADMIN", "CLIENT", "AGENT"]) {
    await client.query("INSERT INTO roles(name) VALUES($1) ON CONFLICT(name) DO NOTHING", [role]);
  }
  for (const [name, path, sortOrder] of menus) {
    await client.query(
      "INSERT INTO menus(name, path, sort_order) VALUES($1,$2,$3) ON CONFLICT(path) DO UPDATE SET name=EXCLUDED.name, sort_order=EXCLUDED.sort_order",
      [name, path, sortOrder]
    );
  }
  const role = await client.query("SELECT id FROM roles WHERE name='ADMIN'");
  await client.query(
    "INSERT INTO role_menus(role_id, menu_id) SELECT $1,id FROM menus WHERE path LIKE '/admin/%' ON CONFLICT DO NOTHING",
    [role.rows[0].id]
  );
  const clientRole = await client.query("SELECT id FROM roles WHERE name='CLIENT'");
  await client.query(
    "INSERT INTO role_menus(role_id, menu_id) SELECT $1,id FROM menus WHERE path LIKE '/client/%' AND path <> '/client/company-profile-setup' ON CONFLICT DO NOTHING",
    [clientRole.rows[0].id]
  );
  const agentRole = await client.query("SELECT id FROM roles WHERE name='AGENT'");
  await client.query(
    "INSERT INTO role_menus(role_id, menu_id) SELECT $1,id FROM menus WHERE path LIKE '/agent/%' ON CONFLICT DO NOTHING",
    [agentRole.rows[0].id]
  );
  const hash = await bcrypt.hash(password, 12);
  await client.query(
    `INSERT INTO users(name,email,password_hash,user_code,role_id)
     VALUES('CloudDesk Administrator',$1,$2,'ADM-0001',$3)
     ON CONFLICT(user_code) DO UPDATE SET email=EXCLUDED.email,
       password_hash=EXCLUDED.password_hash, role_id=EXCLUDED.role_id,
       is_active=TRUE, updated_at=NOW()`,
    [email, hash, role.rows[0].id]
  );
  if (clientEmail && clientPassword) {
    const clientHash = await bcrypt.hash(clientPassword, 12);
    await client.query(
      `INSERT INTO users(name,email,password_hash,user_code,role_id)
       VALUES('CloudDesk Client',$1,$2,'CLI-0001',$3)
       ON CONFLICT(email) DO UPDATE SET password_hash=EXCLUDED.password_hash,
         role_id=EXCLUDED.role_id,is_active=TRUE,updated_at=NOW()`,
      [clientEmail, clientHash, clientRole.rows[0].id]
    );
  }
  const agentHash = await bcrypt.hash(agentPassword, 12);
  await client.query(
    `INSERT INTO users(name,email,password_hash,user_code,role_id)
     VALUES('CloudDesk Agent',$1,$2,'AGT-0001',$3)
     ON CONFLICT(email) DO UPDATE SET password_hash=EXCLUDED.password_hash,
       role_id=EXCLUDED.role_id,is_active=TRUE,updated_at=NOW()`,
    [agentEmail, agentHash, agentRole.rows[0].id]
  );
  await client.query("COMMIT");
  console.log(`Admin account is ready: ${email}`);
  if (clientEmail) console.log(`Client account is ready: ${clientEmail}`);
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await pool.end();
}
