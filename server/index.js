import "dotenv/config";
import crypto from "node:crypto";
import process from "node:process";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import jwt from "jsonwebtoken";
import { pool } from "./database/pool.js";
import { createCertificateOfOriginRouter } from "./routes/certificateOfOrigin.routes.js";
import { createFinanceRouter } from "./routes/finance.routes.js";
import { createAdminServiceRequestRouter } from "./routes/adminServiceRequest.routes.js";
import { createIemRegistrationRouter } from "./routes/iemRegistration.routes.js";
import { createIndustrialLicenseRouter } from "./routes/industrialLicense.routes.js";
import { createWpcEtaRouter } from "./routes/wpcEta.routes.js";
import { createUnIipRouter } from "./routes/unIip.routes.js";
import { createGstReturnsAuditRouter } from "./routes/gstReturnsAudit.routes.js";
import { createGstLutRouter } from "./routes/gstLut.routes.js";
import { createCdscoRouter } from "./routes/cdsco.routes.js";
import { createAqcsPqmsRouter } from "./routes/aqcsPqms.routes.js";
import { createWarehouseLicenseRouter } from "./routes/warehouseLicense.routes.js";
import { createDscServicesRouter } from "./routes/dscServices.routes.js";
import { createEbrcRouter } from "./routes/ebrc.routes.js";
import { createEpcgRouter } from "./routes/epcg.routes.js";
import { createIgcrReturnRouter } from "./routes/igcrReturn.routes.js";
import { createPollutionControlRouter } from "./routes/pollutionControl.routes.js";
import { createCaCertificationRouter } from "./routes/caCertification.routes.js";
import { createLmpcRouter } from "./routes/lmpc.routes.js";
import { createEprAuthorizationRouter } from "./routes/eprAuthorization.routes.js";
import { createRequestWorkflowRouters } from "./routes/requestWorkflow.routes.js";
import { createAdminDashboardRouter } from "./routes/adminDashboard.routes.js";

const app = express();
const port = Number(process.env.PORT || 4001);
const jwtSecret = process.env.JWT_SECRET;
const appOrigins = new Set(
  (process.env.APP_ORIGINS || process.env.APP_ORIGIN || "http://localhost:5173,http://127.0.0.1:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
);

if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error("JWT_SECRET must contain at least 32 characters");
}

app.disable("x-powered-by");
app.use(cors({
  credentials: true,
  origin(origin, callback) {
    callback(null, !origin || appOrigins.has(origin));
  }
}));
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

function signAccessToken(user) {
  return jwt.sign({ sub: String(user.id), role: user.role }, jwtSecret, { expiresIn: "15m" });
}

function tokenHash(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function createRefreshToken(userId) {
  const token = crypto.randomBytes(48).toString("base64url");
  await pool.query(
    "INSERT INTO refresh_tokens(user_id, token_hash, expires_at) VALUES($1,$2,NOW() + INTERVAL '7 days')",
    [userId, tokenHash(token)]
  );
  return token;
}

function setRefreshCookie(res, token) {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

async function getUser(id) {
  const result = await pool.query(
    `SELECT u.id,u.name,u.email,u.user_code,u.is_active,r.name AS role
       FROM users u JOIN roles r ON r.id=u.role_id WHERE u.id=$1`,
    [id]
  );
  return result.rows[0];
}

async function getMenus(user) {
  const result = await pool.query(
    `SELECT DISTINCT m.id,m.name,m.path,m.parent_id,m.sort_order
       FROM menus m
       LEFT JOIN role_menus rm ON rm.menu_id=m.id
       LEFT JOIN roles r ON r.id=rm.role_id
       LEFT JOIN user_menus um ON um.menu_id=m.id
      WHERE r.name=$1 OR um.user_id=$2
      ORDER BY m.sort_order,m.id`,
    [user.role, user.id]
  );
  return result.rows.map((menu) => ({ ...menu, children: [] }));
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    user_code: user.user_code,
    role: user.role
  };
}

async function onboardingFor(user) {
  if (user.role === "CLIENT") {
    const result = await pool.query(
      "SELECT status FROM company_profiles WHERE user_id=$1",
      [user.id]
    );
    const approvalStatus = (result.rows[0]?.status || "draft").toLowerCase();
    const completed = approvalStatus === "submitted" || approvalStatus === "approved";
    const approved = approvalStatus === "approved";

    return {
        status: "PENDING",
        dashboardLocked: !completed,
        actionPath: !completed ? "/client/company-profile-setup" : "/client/command-center",
        companyProfileCompleted: completed,
        companyProfileEditable: !completed,
        profileCompleted: completed,
        profileApprovalStatus: approvalStatus,
        approved
    };
  }

  return {
    status: "COMPLETE",
    dashboardLocked: false,
    companyProfileCompleted: true,
    companyProfileEditable: true,
    profileCompleted: true,
    profileApprovalStatus: "approved",
    approved: true
  };
}

function normalizeCompanyProfilePayload(body) {
  return {
    company_name: body.companyName || "",
    company_type: body.companyType || "",
    concern_nature: body.concernNature || "",
    exporter_importer_category: body.exporterImporterCategory || "",
    head_office_address: body.headOfficeAddress || "",
    firm_mobile_no: body.firmMobileNo || "",
    correspondence_email: body.firmEmail || "",
    pan_number: body.panNumber || "",
    iec_number: body.iecNumber || "",
    iec_issued_at: body.iecIssuedAt || "",
    gst_filing_status: body.gstFilingStatus || "",
    gstin_details: body.gstinDetails || [],
    date_of_incorporation: body.dateOfIncorporation || "",
    incorporation_certificate_no: body.incorporationCertificateNo || "",
    udhyam_certificate_no: body.udhyamCertificateNo || "",
    udhyam_status: body.udhyamStatus || "",
    rcmc_number: body.rcmcNumber || "",
    rcmc_valid_until: body.rcmcValidUntil || "",
    is_sez: body.isSez === "YES" || body.isSez === true,
    branches: body.branches || [],
    key_people: body.keyPeople || [],
    authorised_signatories: body.authorisedSignatories || [],
    portal_credentials: body.portalCredentials || [],
    documents: body.documents || {}
  };
}

async function requireAuth(req, res, next) {
  try {
    const value = req.headers.authorization || "";
    const token = value.startsWith("Bearer ") ? value.slice(7) : "";
    const payload = jwt.verify(token, jwtSecret);
    const user = await getUser(payload.sub);
    if (!user?.is_active) return res.status(401).json({ message: "Account is unavailable" });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: "Authentication required" });
  }
}

function requireAdmin(req, res, next) {
  if (req.user.role !== "ADMIN") return res.status(403).json({ message: "Admin access required" });
  next();
}

const requireRole = (role) => (req, res, next) => {
  if (req.user.role !== role) return res.status(403).json({ message: `${role} access required` });
  next();
};

app.get("/health", async (_req, res, next) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch (error) {
    next(error);
  }
});

app.post("/auth/login", async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const result = await pool.query(
      `SELECT u.*,r.name AS role FROM users u JOIN roles r ON r.id=u.role_id WHERE LOWER(u.email)=$1`,
      [email]
    );
    const user = result.rows[0];
    if (!user?.is_active || !(await bcrypt.compare(String(req.body.password || ""), user.password_hash))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const refreshToken = await createRefreshToken(user.id);
    setRefreshCookie(res, refreshToken);
    res.json({
      accessToken: signAccessToken(user),
      user: publicUser(user),
      menus: await getMenus(user),
      onboarding: await onboardingFor(user)
    });
  } catch (error) {
    next(error);
  }
});

app.get("/auth/dashboard", requireAuth, async (req, res, next) => {
  try {
    res.json({ user: publicUser(req.user), menus: await getMenus(req.user), onboarding: await onboardingFor(req.user) });
  } catch (error) {
    next(error);
  }
});

app.post("/auth/refresh", async (req, res, next) => {
  try {
    const current = req.cookies.refreshToken;
    if (!current) return res.status(401).json({ message: "Refresh token required" });
    const found = await pool.query(
      "SELECT user_id FROM refresh_tokens WHERE token_hash=$1 AND expires_at>NOW()",
      [tokenHash(current)]
    );
    if (!found.rows[0]) return res.status(401).json({ message: "Refresh token is invalid" });
    const user = await getUser(found.rows[0].user_id);
    if (!user?.is_active) return res.status(401).json({ message: "Account is unavailable" });
    res.json({ accessToken: signAccessToken(user) });
  } catch (error) {
    next(error);
  }
});

app.post("/auth/logout", async (req, res, next) => {
  try {
    if (req.cookies.refreshToken) {
      await pool.query("DELETE FROM refresh_tokens WHERE token_hash=$1", [tokenHash(req.cookies.refreshToken)]);
    }
    res.clearCookie("refreshToken");
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.get("/auth/company-profile", requireAuth, async (req, res, next) => {
  try {
    if (req.user.role !== "CLIENT") {
      return res.status(403).json({ message: "Client access required" });
    }
    const result = await pool.query(
      "SELECT data FROM company_profiles WHERE user_id=$1",
      [req.user.id]
    );
    res.json({
      user: { userCode: req.user.user_code, email: req.user.email },
      profile: result.rows[0]?.data || {},
      documentCatalog: [],
      onboarding: await onboardingFor(req.user)
    });
  } catch (error) {
    next(error);
  }
});

app.put("/auth/company-profile", requireAuth, async (req, res, next) => {
  try {
    if (req.user.role !== "CLIENT") {
      return res.status(403).json({ message: "Client access required" });
    }
    const profile = normalizeCompanyProfilePayload(req.body);
    await pool.query(
      `INSERT INTO company_profiles(user_id,data,status,updated_at)
       VALUES($1,$2,'SUBMITTED',NOW())
       ON CONFLICT(user_id) DO UPDATE SET data=EXCLUDED.data,status='SUBMITTED',updated_at=NOW()`,
      [req.user.id, profile]
    );
    res.json({
      user: { userCode: req.user.user_code, email: req.user.email },
      profile,
      documentCatalog: [],
      onboarding: await onboardingFor(req.user)
    });
  } catch (error) {
    next(error);
  }
});

app.get("/auth/admin/clients", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT u.id,u.name,u.email,u.user_code,u.created_at,
              cp.data AS company_profile_data,cp.status AS company_profile_status,cp.updated_at AS profile_updated_at
         FROM users u
         JOIN roles r ON r.id=u.role_id
         LEFT JOIN company_profiles cp ON cp.user_id=u.id
        WHERE r.name='CLIENT'
        ORDER BY cp.updated_at DESC NULLS LAST,u.created_at DESC`
    );
    const clients = result.rows.map((row) => {
      const data = row.company_profile_data;
      const status = (row.company_profile_status || "DRAFT").toLowerCase();
      const companyProfile = data
        ? {
            ...data,
            companyDisplayName: data.company_name || row.name,
            gstin: data.gstin_details?.[0]?.gstin || "",
            documentCatalog: [],
            workflowState: { approvalStatus: status, submittedAt: row.profile_updated_at },
            sections: [
              { key: "company", title: "Company Details", completed: Boolean(data.company_name) },
              { key: "documents", title: "Documents & IDs", completed: Boolean(data.pan_number && data.iec_number) },
              { key: "people", title: "Key People", completed: Boolean(data.key_people?.length) },
              { key: "portals", title: "Portal Access", completed: Boolean(data.portal_credentials?.length) }
            ]
          }
        : null;
      return {
        id: row.id,
        name: row.name,
        email: row.email,
        user_code: row.user_code,
        created_at: row.created_at,
        companyProfile,
        bookings: []
      };
    });
    res.json({ clients });
  } catch (error) {
    next(error);
  }
});

app.post("/auth/admin/clients/:clientId/company-profile/approve", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const result = await pool.query(
      `UPDATE company_profiles cp
          SET status='APPROVED',updated_at=NOW()
         FROM users u JOIN roles r ON r.id=u.role_id
        WHERE cp.user_id=u.id AND u.id=$1 AND r.name='CLIENT' AND cp.status='SUBMITTED'
        RETURNING cp.user_id`,
      [req.params.clientId]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ message: "Submitted company profile not found" });
    }
    res.json({ message: "Company profile approved", clientId: result.rows[0].user_id, status: "approved" });
  } catch (error) {
    next(error);
  }
});

app.get("/auth/users", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT u.id,u.name,u.email,u.user_code,u.is_active,u.created_at,r.name AS role_name
         FROM users u JOIN roles r ON r.id=u.role_id ORDER BY u.created_at DESC`
    );
    res.json(result.rows.map((u) => ({ ...u, role: { name: u.role_name } })));
  } catch (error) {
    next(error);
  }
});

app.post("/auth/register", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { name, email, password, role = "CLIENT" } = req.body;
    if (!name || !email || !password || password.length < 8) {
      return res.status(400).json({ message: "Name, email, and an 8-character password are required" });
    }
    const roleResult = await pool.query("SELECT id FROM roles WHERE name=$1", [String(role).toUpperCase()]);
    if (!roleResult.rows[0]) return res.status(400).json({ message: "Unknown role" });
    const code = `${String(role).toUpperCase().slice(0, 3)}-${Date.now().toString().slice(-6)}`;
    const result = await pool.query(
      `INSERT INTO users(name,email,password_hash,user_code,role_id) VALUES($1,LOWER($2),$3,$4,$5)
       RETURNING id,name,email,user_code,is_active,created_at`,
      [name, email, await bcrypt.hash(password, 12), code, roleResult.rows[0].id]
    );
    res.status(201).json({ ...result.rows[0], role: { name: String(role).toUpperCase() } });
  } catch (error) {
    if (error.code === "23505") return res.status(409).json({ message: "Email already exists" });
    next(error);
  }
});

app.use(
  "/service-store/certificate-of-origin",
  createCertificateOfOriginRouter({ requireAuth })
);
app.use(
  "/service-store/iem-registration",
  createIemRegistrationRouter({ requireAuth })
);
app.use(
  "/service-store/industrial-licence",
  createIndustrialLicenseRouter({ requireAuth })
);
app.use(
  "/service-store/wpc-licence",
  createWpcEtaRouter({ requireAuth })
);
app.use(
  "/service-store/epcg",
  createEpcgRouter({ requireAuth })
);
app.use(
  "/service-store/igcr-return",
  createIgcrReturnRouter({ requireAuth })
);
app.use(
  "/service-store/pollution-control",
  createPollutionControlRouter({ requireAuth })
);
app.use(
  "/service-store/ca-certification",
  createCaCertificationRouter({ requireAuth })
);
app.use(
  "/service-store/lmpc",
  createLmpcRouter({ requireAuth })
);
app.use(
  "/service-store/epr-authorisation",
  createEprAuthorizationRouter({ requireAuth })
);
app.use(
  "/service-store/un-iip-certificate",
  createUnIipRouter({ requireAuth })
);
app.use(
  "/service-store/gst-return",
  createGstReturnsAuditRouter({ requireAuth })
);
app.use(
  "/service-store/gst-lut-filing",
  createGstLutRouter({ requireAuth })
);
app.use(
  "/service-store/cdsco-drug-control",
  createCdscoRouter({ requireAuth })
);
app.use(
  "/service-store/aqcs-pqms",
  createAqcsPqmsRouter({ requireAuth })
);
app.use(
  "/service-store/warehouse-license",
  createWarehouseLicenseRouter({ requireAuth })
);
app.use(
  "/service-store/dsc-services",
  createDscServicesRouter({ requireAuth })
);
app.use("/service-store/ebrc", createEbrcRouter({ requireAuth }));
app.use("/auth/wallet", createFinanceRouter({ requireAuth }));
app.use("/auth/admin/dashboard", createAdminDashboardRouter({ requireAuth, requireAdmin }));
app.use(
  "/admin/service-requests",
  createAdminServiceRequestRouter({ requireAuth, requireAdmin })
);
const workflowRouters = createRequestWorkflowRouters({ requireAuth, requireRole });
app.use("/client/track-requests", workflowRouters.client);
app.use("/admin/workflow-requests", workflowRouters.admin);
app.use("/agent/tasks", workflowRouters.agent);

app.use((err, _req, res, next) => {
  void next;
  console.error(err);
  res.status(err.status || 500).json({
    message: err.status ? err.message : "Internal server error",
    ...(err.details ? { errors: err.details } : {})
  });
});

const server = app.listen(port, () => console.log(`CloudDesk API listening at http://localhost:${port}`));

async function shutdown() {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
