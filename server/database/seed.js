import "dotenv/config";
import bcrypt from "bcryptjs";
import process from "node:process";
import { pool } from "./pool.js";

const email = (process.env.ADMIN_EMAIL || "admin@eximinq.com").toLowerCase();
const password = process.env.ADMIN_PASSWORD;

if (!password || password.length < 10) {
  throw new Error("ADMIN_PASSWORD must contain at least 10 characters");
}

const menus = [
  ["Command Center", "/admin/command-center", 10],
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
  const hash = await bcrypt.hash(password, 12);
  await client.query(
    `INSERT INTO users(name,email,password_hash,user_code,role_id)
     VALUES('CloudDesk Administrator',$1,$2,'ADM-0001',$3)
     ON CONFLICT(email) DO UPDATE SET password_hash=EXCLUDED.password_hash, role_id=EXCLUDED.role_id, is_active=TRUE, updated_at=NOW()`,
    [email, hash, role.rows[0].id]
  );
  await client.query("COMMIT");
  console.log(`Admin account is ready: ${email}`);
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await pool.end();
}
