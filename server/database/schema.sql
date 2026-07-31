CREATE TABLE IF NOT EXISTS roles (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(30) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  user_code VARCHAR(40) UNIQUE NOT NULL,
  role_id BIGINT NOT NULL REFERENCES roles(id),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS menus (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  path VARCHAR(255) UNIQUE NOT NULL,
  parent_id BIGINT REFERENCES menus(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS role_menus (
  role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  menu_id BIGINT NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, menu_id)
);

CREATE TABLE IF NOT EXISTS user_menus (
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  menu_id BIGINT NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, menu_id)
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS company_profiles (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallets (
  user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS corporate_credit_lines (
  user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  credit_limit NUMERIC(14,2) NOT NULL DEFAULT 0,
  available_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (credit_limit >= 0),
  CHECK (available_balance >= 0),
  CHECK (available_balance <= credit_limit)
);

CREATE TABLE IF NOT EXISTS service_catalog (
  id BIGSERIAL PRIMARY KEY,
  slug VARCHAR(120) UNIQUE NOT NULL,
  category VARCHAR(80) NOT NULL,
  name VARCHAR(180) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_requests (
  id BIGSERIAL PRIMARY KEY,
  request_code VARCHAR(40) UNIQUE GENERATED ALWAYS AS
    ((CASE service_slug WHEN 'certificate-of-origin' THEN 'COO' WHEN 'iem-registration' THEN 'IEM' WHEN 'industrial-licence' THEN 'IL' ELSE 'SRV' END)
      || '-' || LPAD(id::text, 8, '0')) STORED,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_slug VARCHAR(120) NOT NULL REFERENCES service_catalog(slug),
  status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  pricing_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_requests_user_service
  ON service_requests(user_id, service_slug, updated_at DESC);

CREATE TABLE IF NOT EXISTS service_request_documents (
  id BIGSERIAL PRIMARY KEY,
  request_id BIGINT NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  document_key VARCHAR(80) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  stored_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(150) NOT NULL,
  size_bytes BIGINT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(request_id, document_key)
);

CREATE TABLE IF NOT EXISTS financial_transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_request_id BIGINT REFERENCES service_requests(id) ON DELETE SET NULL,
  service_slug VARCHAR(120) REFERENCES service_catalog(slug),
  account_type VARCHAR(30) NOT NULL CHECK (account_type IN ('WALLET', 'CREDIT_LINE')),
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('DEBIT', 'CREDIT')),
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  balance_after NUMERIC(14,2) NOT NULL,
  description VARCHAR(255) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'SUCCESS',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_financial_transactions_user_created
  ON financial_transactions(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS service_request_events (
  id BIGSERIAL PRIMARY KEY,
  request_id BIGINT NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  actor_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL,
  title VARCHAR(180) NOT NULL,
  comments TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_request_events_request
  ON service_request_events(request_id, created_at);

CREATE TABLE IF NOT EXISTS service_request_clarifications (
  id BIGSERIAL PRIMARY KEY,
  request_id BIGINT NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  requested_by BIGINT NOT NULL REFERENCES users(id),
  comments TEXT NOT NULL,
  requested_documents JSONB NOT NULL DEFAULT '[]'::jsonb,
  due_date DATE,
  status VARCHAR(30) NOT NULL DEFAULT 'OPEN'
    CHECK (status IN ('OPEN', 'RESUBMITTED', 'ACCEPTED')),
  resubmitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clarification_documents (
  id BIGSERIAL PRIMARY KEY,
  clarification_id BIGINT NOT NULL REFERENCES service_request_clarifications(id) ON DELETE CASCADE,
  uploaded_by BIGINT NOT NULL REFERENCES users(id),
  document_label VARCHAR(180) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  stored_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(150) NOT NULL,
  size_bytes BIGINT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_request_assignments (
  id BIGSERIAL PRIMARY KEY,
  request_id BIGINT NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  agent_id BIGINT NOT NULL REFERENCES users(id),
  assigned_by BIGINT NOT NULL REFERENCES users(id),
  instructions TEXT NOT NULL DEFAULT '',
  due_date DATE,
  status VARCHAR(30) NOT NULL DEFAULT 'ASSIGNED'
    CHECK (status IN ('ASSIGNED', 'IN_PROGRESS', 'COMPLETED')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completion_notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(request_id)
);

CREATE TABLE IF NOT EXISTS agent_work_documents (
  id BIGSERIAL PRIMARY KEY,
  assignment_id BIGINT NOT NULL REFERENCES service_request_assignments(id) ON DELETE CASCADE,
  uploaded_by BIGINT NOT NULL REFERENCES users(id),
  original_name VARCHAR(255) NOT NULL,
  stored_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(150) NOT NULL,
  size_bytes BIGINT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_id BIGINT REFERENCES service_requests(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(180) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON notifications(user_id, is_read, created_at DESC);

INSERT INTO corporate_credit_lines(user_id, credit_limit, available_balance)
SELECT u.id, 50000, 50000
  FROM users u
  JOIN roles r ON r.id = u.role_id
 WHERE r.name = 'CLIENT'
ON CONFLICT(user_id) DO NOTHING;

INSERT INTO service_catalog(slug, category, name, description, config)
VALUES(
  'certificate-of-origin',
  'compliance',
  'Issuance of Certificate of Origin',
  'Chamber-certified export origin documentation workflow',
  '{
    "transactionType": "Transactional",
    "standard": "DGFT Compliance Standard",
    "prioritySla": true,
    "currency": "INR",
    "defaultCreditLine": 50000,
    "invoicePlaceholder": "INV/2026/0042",
    "certificateTypes": [
      {"id": "non-preferential", "label": "Non-Preferential"},
      {"id": "preferential", "label": "Preferential (FTA)"}
    ],
    "issuingAgencies": [
      {"value": "ficci", "label": "FICCI"},
      {"value": "cii", "label": "CII"},
      {"value": "eepc", "label": "EEPC India"},
      {"value": "apex", "label": "Apex Chamber of Commerce"}
    ],
    "destinationCountries": [
      {"value": "AE", "label": "United Arab Emirates"},
      {"value": "SG", "label": "Singapore"},
      {"value": "DE", "label": "Germany"},
      {"value": "VN", "label": "Vietnam"}
    ],
    "ftaAgreements": [
      {"value": "cepa", "label": "India-UAE CEPA"},
      {"value": "aifta", "label": "ASEAN-India FTA"},
      {"value": "isfta", "label": "Indo-Sri Lanka FTA"}
    ],
    "documents": [
      {"id": "invoice", "label": "Commercial Invoice", "requiredFor": ["non-preferential", "preferential"]},
      {"id": "packingList", "label": "Packing List", "requiredFor": ["non-preferential", "preferential"]},
      {"id": "costSheet", "label": "Cost Sheet", "requiredFor": ["preferential"], "sampleAvailable": true},
      {"id": "mfgDecl", "label": "Manufacturer''s Declaration", "requiredFor": ["preferential"]},
      {"id": "bol", "label": "Bill of Lading / AWB", "requiredFor": []}
    ],
    "pricing": {
      "non-preferential": {"officialFee": 450, "serviceCharge": 125, "gstRate": 18},
      "preferential": {"officialFee": 650, "serviceCharge": 255, "gstRate": 18}
    }
  }'::jsonb
)
ON CONFLICT(slug) DO UPDATE SET
  category = EXCLUDED.category,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  config = EXCLUDED.config,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO service_catalog(slug, category, name, description, config)
VALUES(
  'ca-certification',
  'compliance',
  'Statutory CA Audit Hub',
  'ICAI-compliant certification coordination with UDIN-backed audit evidence',
  '{
    "transactionType": "Professional",
    "standard": "ICAI Statutory Certification",
    "priorityLabel": "UDIN Mandate",
    "currency": "INR",
    "sla": "48 Working Hours",
    "certificationTypes": [
      {"id":"adv-4h","label":"ADV (Appendix 4H)","description":"Consumption Audit","auditLogic":"Reconcile raw-material imports, exports, consumption, and closing stock for Appendix 4H certification."},
      {"id":"epcg-5c","label":"EPCG (ANX 5C)","description":"Installation Audit","auditLogic":"Verify machinery installation, serial numbers, Bills of Entry, and nexus with the EPCG authorization."},
      {"id":"star-fob","label":"Star House Performance","description":"FOB USD Audit","auditLogic":"Certify the two-year average FOB export performance using shipping bills and e-BRC evidence."},
      {"id":"rcmc","label":"RCMC Turnover","description":"EPC Council Cert","auditLogic":"Certify turnover for Export Promotion Council membership or renewal with UDIN validation."},
      {"id":"gst-turnover","label":"GST Turnover","description":"Statutory Reconciliation","auditLogic":"Reconcile GSTR-1, GSTR-3B, and audited financial statements to certify export turnover."},
      {"id":"solvency","label":"Solvency Certificate","description":"Financial Health","auditLogic":"Review audited financials, assets, liabilities, and net worth for the requested solvency certification."}
    ],
    "epcCouncils": [
      {"value":"EEPC","label":"EEPC - Engineering"},
      {"value":"CHEMEXCIL","label":"CHEMEXCIL - Chemicals"},
      {"value":"APEDA","label":"APEDA - Agriculture"},
      {"value":"PHARMEXCIL","label":"PHARMEXCIL - Pharma"},
      {"value":"FIEO","label":"FIEO - General / Services"},
      {"value":"GJEPC","label":"GJEPC - Gems & Jewelry"}
    ],
    "documents": [
      {"id":"draftCert","label":"Draft Certificate / Prescribed Format","required":true,"sampleAvailable":true},
      {"id":"gstr9","label":"GSTR-9 / Annual Return","required":true,"certificationTypes":["gst-turnover"]},
      {"id":"recoStatement","label":"Turnover Reconciliation Statement","required":true,"certificationTypes":["gst-turnover"]},
      {"id":"stockLedger","label":"Import, Export & Stock Ledger","required":true,"certificationTypes":["adv-4h"]},
      {"id":"factoryPhotos","label":"Machinery Installation Evidence","required":true,"certificationTypes":["epcg-5c"]},
      {"id":"balanceSheet","label":"Audited Balance Sheet & Financials","required":true,"certificationTypes":["solvency","rcmc","gst-turnover"]}
    ],
    "pricing": {
      "officialFee":0,
      "shieldPremium":10000,
      "gstRate":18,
      "certificationTypes": {
        "adv-4h":{"professionalFee":15000},
        "epcg-5c":{"professionalFee":15000},
        "star-fob":{"professionalFee":7500},
        "rcmc":{"professionalFee":7500},
        "gst-turnover":{"professionalFee":7500},
        "solvency":{"professionalFee":5000}
      }
    }
  }'::jsonb
)
ON CONFLICT(slug) DO UPDATE SET
  category=EXCLUDED.category,
  name=EXCLUDED.name,
  description=EXCLUDED.description,
  config=EXCLUDED.config,
  is_active=TRUE,
  updated_at=NOW();

INSERT INTO service_catalog(slug, category, name, description, config)
VALUES(
  'lmpc',
  'compliance',
  'Legal Metrology (LMPC) Audit',
  'Importer, packer, and packaged commodity label compliance under Legal Metrology rules',
  '{
    "transactionType":"Packaging Act",
    "standard":"Legal Metrology Packaged Commodities Rules",
    "priorityLabel":"SLA Priority",
    "currency":"INR",
    "sla":"15-20 Working Days",
    "warning":"Every retail package must carry the prescribed declarations, including the Unit Sale Price requirements effective from January 2024.",
    "requestModes":[
      {"id":"importer","label":"Importer","description":"Registration"},
      {"id":"packer","label":"Packer","description":"Registration"},
      {"id":"label-audit","label":"Label Audit","description":"Compliance"}
    ],
    "productCategories":[
      {"id":"non-food","label":"Non-Food Packaged Commodity"},
      {"id":"food","label":"Food / FMCG"},
      {"id":"electronic","label":"Electronic / Electrical"},
      {"id":"medical","label":"Medical / Healthcare"}
    ],
    "documents":[
      {"id":"labelDraft","label":"Product Label / Artwork Draft","requiredFor":["importer","packer","label-audit"],"availableFor":["importer","packer","label-audit"],"sampleAvailable":true},
      {"id":"weightsProof","label":"Net Quantity / Weights Evidence","requiredFor":["importer","packer"],"availableFor":["importer","packer"],"sampleAvailable":true},
      {"id":"iecGstCopy","label":"IEC and GST Registration Copy","requiredFor":["importer","packer"],"availableFor":["importer","packer"]},
      {"id":"sitePhotos","label":"Packing Premises & Machinery Photos","requiredFor":["packer"],"availableFor":["packer"]},
      {"id":"warehouseLease","label":"Warehouse Ownership / Lease Proof","requiredFor":["importer"],"availableFor":["importer"]},
      {"id":"moaAoa","label":"Company MOA / AOA (Optional)","requiredFor":[],"availableFor":["importer","packer"]}
    ],
    "pricing":{
      "gstRate":18,
      "modes":{
        "importer":{"officialFee":500,"serviceCharge":5000},
        "packer":{"officialFee":500,"serviceCharge":7500},
        "label-audit":{"officialFee":0,"serviceCharge":2500,"perVariant":true}
      }
    }
  }'::jsonb
)
ON CONFLICT(slug) DO UPDATE SET
  category=EXCLUDED.category,
  name=EXCLUDED.name,
  description=EXCLUDED.description,
  config=EXCLUDED.config,
  is_active=TRUE,
  updated_at=NOW();

INSERT INTO service_catalog(slug, category, name, description, config)
VALUES(
  'pollution-control',
  'compliance',
  'Pollution Consent (SPCB) Audit',
  'Consent to establish, operate, renew, and file annual environmental returns',
  '{
    "transactionType": "Statutory",
    "standard": "State Pollution Control Board / OCMMS",
    "priorityLabel": "Inspection Priority",
    "currency": "INR",
    "sla": "15-20 Working Days",
    "requestTypes": [
      {"id": "cte", "label": "Establish", "description": "Consent to Establish"},
      {"id": "cto", "label": "Operate", "description": "Consent to Operate"},
      {"id": "renewal", "label": "Renewal", "description": "Consent renewal"},
      {"id": "returns", "label": "Annual", "description": "Form V return"}
    ],
    "industryCategories": [
      {"id": "red", "label": "Red"},
      {"id": "orange", "label": "Orange"},
      {"id": "green", "label": "Green"},
      {"id": "white", "label": "White"}
    ],
    "emissionSources": [
      {"value": "dg-set", "label": "D.G. Sets (Stack Height Audit)"},
      {"value": "process-boiler", "label": "Process Boiler (Fuel Logic)"},
      {"value": "furnace-oven", "label": "Furnace / Oven"},
      {"value": "process-only", "label": "Nil (Process Emissions Only)"}
    ],
    "documents": [
      {"id": "processFlow", "label": "Manufacturing Process Flow", "required": true, "sampleAvailable": true},
      {"id": "caCertInvestment", "label": "CA-Certified Gross Block Investment", "required": true},
      {"id": "waterBalance", "label": "Water Balance & Effluent Treatment Scheme", "required": true, "sampleAvailable": true},
      {"id": "machineryList", "label": "Plant & Machinery List", "required": true},
      {"id": "previousConsent", "label": "Previous Consent Order", "required": true, "requestTypes": ["renewal"]},
      {"id": "sitePlan", "label": "Site Plan / Layout", "required": true, "requestTypes": ["cte", "cto"]}
    ],
    "pricing": {
      "grossBlockThreshold": 10000000,
      "officialFeeBase": 5000,
      "officialFeeHigh": 25000,
      "gstRate": 18,
      "requestTypes": {
        "cte": {"draftingFee": 25000},
        "cto": {"draftingFee": 25000},
        "renewal": {"draftingFee": 12500},
        "returns": {"draftingFee": 7500}
      },
      "categories": {
        "red": {"shieldPremium": 15000},
        "orange": {"shieldPremium": 15000},
        "green": {"shieldPremium": 5000},
        "white": {"shieldPremium": 5000}
      }
    }
  }'::jsonb
)
ON CONFLICT(slug) DO UPDATE SET
  category = EXCLUDED.category,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  config = EXCLUDED.config,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO service_catalog(slug, category, name, description, config)
VALUES(
  'igcr-return',
  'compliance',
  'IGCR Returns & Compliance Audit',
  'Monthly and quarterly IGCR returns with process intimation and statutory evidence review',
  '{
    "transactionType": "Duty Concession",
    "standard": "Customs IGCR Rules",
    "prioritySla": true,
    "priorityLabel": "SLA Priority",
    "currency": "INR",
    "sla": "24 Working Hours",
    "requestTypes": [
      {"id": "monthly", "label": "Monthly", "description": "IGCR-3 monthly return"},
      {"id": "quarterly", "label": "Quarterly", "description": "Three-month audit"},
      {"id": "intimation", "label": "Intimation", "description": "IGCR-1 process intimation"}
    ],
    "reportingPeriods": [
      {"value": "2026-07", "label": "July 2026"},
      {"value": "2026-06", "label": "June 2026"},
      {"value": "2026-Q2", "label": "Q2 (Jul-Sep 2026)"},
      {"value": "2026-Q1", "label": "Q1 (Apr-Jun 2026)"}
    ],
    "documents": [
      {"id": "consumptionRegister", "label": "Consumption Register", "required": true},
      {"id": "importBoeData", "label": "Import Bill of Entry Data", "required": true},
      {"id": "caNexusCert", "label": "CA Nexus Certification", "required": true},
      {"id": "stockVerification", "label": "Quarterly Stock Verification", "required": true, "requestTypes": ["quarterly"]},
      {"id": "quarterlySummary", "label": "Quarterly Consumption Summary", "required": true, "sampleAvailable": true, "requestTypes": ["quarterly"]},
      {"id": "technicalProcess", "label": "Technical Manufacturing Process", "required": true, "requestTypes": ["intimation"]}
    ],
    "pricing": {
      "monthly": {"officialFee": 0, "draftingFee": 5000, "shieldPremium": 5000, "gstRate": 18},
      "quarterly": {"officialFee": 0, "draftingFee": 10000, "shieldPremium": 5000, "gstRate": 18},
      "intimation": {"officialFee": 0, "draftingFee": 10000, "shieldPremium": 5000, "gstRate": 18}
    }
  }'::jsonb
)
ON CONFLICT(slug) DO UPDATE SET
  category = EXCLUDED.category,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  config = EXCLUDED.config,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO service_catalog(slug, category, name, description, config)
VALUES(
  'epcg',
  'compliance',
  'EPCG Scheme Management',
  'New EPCG authorisation, export obligation extension, and redemption workflow',
  '{
    "transactionType": "FTP Chapter 5",
    "standard": "DGFT Export Promotion Capital Goods",
    "prioritySla": true,
    "currency": "INR",
    "sla": "30-45 Working Days",
    "epcgTypes": [
      {"id": "new", "label": "New EPCG", "description": "Capital goods authorisation"},
      {"id": "extension", "label": "EO Extension", "description": "Export obligation extension"},
      {"id": "redemption", "label": "Redemption", "description": "EODC and obligation closure"}
    ],
    "raOffices": [
      {"value": "mumbai", "label": "RA Mumbai (Zonal)"},
      {"value": "delhi", "label": "RA CLA Delhi"},
      {"value": "chennai", "label": "RA Chennai"},
      {"value": "kolkata", "label": "RA Kolkata"}
    ],
    "documents": [
      {"id": "ceCertificate", "label": "Chartered Engineer Certificate (Nexus Proof)", "required": true, "epcgTypes": ["new"]},
      {"id": "machinerySpec", "label": "Proforma Invoice & Technical Specs", "required": true, "epcgTypes": ["new"]},
      {"id": "installationCert", "label": "Appendix 5A - Installation Certificate", "required": true, "sampleAvailable": true, "epcgTypes": ["redemption"]},
      {"id": "anf5B", "label": "ANF 5B - Statement of EO Fulfillment", "required": true, "sampleAvailable": true, "epcgTypes": ["redemption"]},
      {"id": "eofulfillment", "label": "Shipping Bill & Bill of Entry Matrix", "required": true, "epcgTypes": ["redemption"]},
      {"id": "extensionJustification", "label": "Justification for EO Period Extension", "required": true, "sampleAvailable": true, "epcgTypes": ["extension"]}
    ],
    "pricing": {
      "new": {"officialFee": 15000, "draftingFee": 15000, "successFeeRate": 1, "gstRate": 18},
      "extension": {"officialFee": 5000, "draftingFee": 10000, "successFeeRate": 0, "gstRate": 18},
      "redemption": {"officialFee": 2000, "draftingFee": 25000, "successFeeRate": 1, "gstRate": 18}
    }
  }'::jsonb
)
ON CONFLICT(slug) DO UPDATE SET
  category = EXCLUDED.category,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  config = EXCLUDED.config,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO service_catalog(slug, category, name, description, config)
VALUES(
  'ebrc',
  'compliance',
  'e-BRC Issuance & Audit',
  'Electronic Bank Realisation Certificate self-issuance and bank reconciliation workflow',
  '{
    "transactionType": "Liquidity",
    "standard": "DGFT e-BRC / EDPMS Realisation",
    "prioritySla": true,
    "priorityLabel": "Priority Settlement",
    "currency": "INR",
    "sla": "24 Working Hours",
    "issuanceMethods": [
      {"id": "Auto", "label": "Self-Issuance", "description": "Automatic Declaration"},
      {"id": "Reconcile", "label": "Reconciliation", "description": "Manual Bank Linking"}
    ],
    "documents": [
      {"id": "bankAdvice", "label": "Bank Advice / Credit Advice", "required": true},
      {"id": "exportInvoice", "label": "Export Commercial Invoice", "required": true},
      {"id": "shippingBill", "label": "Shipping Bill Copy", "required": true, "ebrcTypes": ["Reconcile"]},
      {"id": "fircCopy", "label": "FIRC / Inward Remittance Certificate", "required": true, "ebrcTypes": ["Reconcile"]}
    ],
    "pricing": {
      "officialFee": 0,
      "serviceFees": {"Auto": 500, "Reconcile": 2500},
      "gstRate": 18
    }
  }'::jsonb
)
ON CONFLICT(slug) DO UPDATE SET
  category = EXCLUDED.category,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  config = EXCLUDED.config,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO service_catalog(slug, category, name, description, config)
VALUES(
  'warehouse-license',
  'compliance',
  'Warehouse Licence',
  'Customs bonded warehouse licensing, renewal and statutory site compliance',
  '{
    "transactionType": "Customs Bonded",
    "standard": "Customs Act Sections 57 / 58",
    "prioritySla": true,
    "currency": "INR",
    "sla": "Physical Site Verification",
    "requestTypes": [
      {"id": "New", "label": "New Licence", "description": "Section 57 / 58 Application"},
      {"id": "Renewal", "label": "Renewal / Amendment", "description": "Bond Reconciliation"}
    ],
    "documents": [
      {"id": "sitePlan", "label": "Certified Site Plan (Showing Entry / Exit)", "required": true, "requestTypes": ["New"], "sampleAvailable": true},
      {"id": "fireNoc", "label": "Fire Department NOC", "required": true, "requestTypes": ["New"]},
      {"id": "solvencyCert", "label": "Bank Solvency Certificate", "required": true, "requestTypes": ["New"]},
      {"id": "prevLicense", "label": "Previous Warehouse Licence", "required": true, "requestTypes": ["Renewal"]},
      {"id": "bondedLedger", "label": "Bonded Goods Stock Ledger", "required": true, "requestTypes": ["Renewal"], "sampleAvailable": true},
      {"id": "insurancePolicy", "label": "Warehouse Insurance Policy", "required": true},
      {"id": "titleDeeds", "label": "Title Deeds / Registered Lease", "required": true}
    ],
    "pricing": {
      "officialFee": 0,
      "draftingFees": {"New": 25000, "Renewal": 12500},
      "successFeeRate": 1,
      "gstRate": 18
    }
  }'::jsonb
)
ON CONFLICT(slug) DO UPDATE SET
  category = EXCLUDED.category,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  config = EXCLUDED.config,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO service_catalog(slug, category, name, description, config)
VALUES(
  'dsc-services',
  'compliance',
  'DSC Services',
  'Digital Signature Certificate procurement, KYC validation and secure token delivery',
  '{
    "transactionType": "Transactional",
    "standard": "CCA Digital Signature Certificate",
    "prioritySla": true,
    "currency": "INR",
    "sla": "Priority Issuance",
    "applicantTypes": [
      {"id": "Individual", "label": "Individual", "description": "Personal DSC procurement"},
      {"id": "Organization", "label": "Organization", "description": "Authorized signatory DSC"}
    ],
    "certificateClasses": [
      {"id": "Class2", "label": "Class II", "description": "Standard validation"},
      {"id": "Class3", "label": "Class III", "description": "High assurance"}
    ],
    "usageTypes": [
      {"id": "Combo", "label": "Combo", "description": "Signature + Encryption"},
      {"id": "Signature", "label": "Signature", "description": "Digital signing"},
      {"id": "Encryption", "label": "Encryption", "description": "Secure encryption"}
    ],
    "validityOptions": [
      {"value": 1, "label": "1 Year"},
      {"value": 2, "label": "2 Years"},
      {"value": 3, "label": "3 Years"}
    ],
    "documents": [
      {"id": "applicantPhoto", "label": "Recent Applicant Photograph", "required": true},
      {"id": "panCard", "label": "PAN Card", "required": true},
      {"id": "addressProof", "label": "Address Proof", "required": true},
      {"id": "iecCert", "label": "IEC Certificate", "required": true},
      {"id": "orgProof", "label": "Organization Registration Proof", "required": true, "applicantTypes": ["Organization"]},
      {"id": "boardRes", "label": "Board Resolution", "required": true, "applicantTypes": ["Organization"], "sampleAvailable": true},
      {"id": "directorList", "label": "Director / Partner List", "required": true, "applicantTypes": ["Organization"], "sampleAvailable": true},
      {"id": "authLetter", "label": "Authorization Letter", "required": true, "applicantTypes": ["Organization"], "sampleAvailable": true}
    ],
    "pricing": {
      "officialFeePerYear": {"Class2": 900, "Class3": 1200},
      "serviceBase": {"Individual": 1200, "Organization": 2200},
      "usageSurcharge": {"Combo": 400, "Signature": 0, "Encryption": 0},
      "tokenCost": 500,
      "gstRate": 18
    }
  }'::jsonb
)
ON CONFLICT(slug) DO UPDATE SET
  category = EXCLUDED.category,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  config = EXCLUDED.config,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO service_catalog(slug, category, name, description, config)
VALUES(
  'aqcs-pqms',
  'compliance',
  'AQCS & PQMS',
  'Animal and plant quarantine permits, bio-security audits, and shipment clearance',
  '{
    "transactionType": "Bio-Security",
    "standard": "AQCS / PQMS Regulatory Clearance",
    "prioritySla": true,
    "priorityLabel": "Demurrage Priority",
    "currency": "INR",
    "sla": "2-3 Working Days",
    "requestModes": [
      {"id": "AQCS", "label": "Animal Quarantine", "description": "AQCS sanitary clearance"},
      {"id": "PQMS", "label": "Plant Quarantine", "description": "PQMS phytosanitary clearance"}
    ],
    "requestTypes": [
      {"id": "Permit", "label": "Import Permit", "description": "Initial IP / SIP"},
      {"id": "Clearance", "label": "Shipment Clearance", "description": "NOC & Sampling"}
    ],
    "treatmentMethods": [
      {"value": "Fumigation", "label": "Methyl Bromide Fumigation"},
      {"value": "Heat", "label": "Heat Treatment (HT)"},
      {"value": "Aluminium", "label": "Aluminium Phosphide"},
      {"value": "None", "label": "None (Processed Goods)"}
    ],
    "documents": [
      {"id": "healthCertificate", "label": "International Health Certificate (Original Copy)", "required": true, "requestModes": ["AQCS"]},
      {"id": "phytoCertificate", "label": "Phytosanitary Certificate (PSC)", "required": true, "requestModes": ["PQMS"]},
      {"id": "fumigationCert", "label": "Fumigation Certificate (ISPM-15)", "required": true, "requestModes": ["PQMS"]},
      {"id": "importPermit", "label": "Valid Import Permit (IP) / SIP Copy", "required": true, "requestTypes": ["Clearance"]},
      {"id": "billOfLading", "label": "Bill of Lading / Airway Bill (EP Copy)", "required": true},
      {"id": "analysisReport", "label": "Certificate of Analysis (Lab Results)", "required": true, "sampleAvailable": true}
    ],
    "pricing": {
      "AQCS": {"officialFee": 5000, "draftingFees": {"Permit": 10000, "Clearance": 5000}, "minimumSuccessFee": 10000, "successFeeRate": 1, "gstRate": 18},
      "PQMS": {"officialFee": 2500, "draftingFees": {"Permit": 10000, "Clearance": 5000}, "minimumSuccessFee": 10000, "successFeeRate": 1, "gstRate": 18}
    }
  }'::jsonb
)
ON CONFLICT(slug) DO UPDATE SET
  category = EXCLUDED.category,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  config = EXCLUDED.config,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO service_catalog(slug, category, name, description, config)
VALUES(
  'gst-lut-filing',
  'compliance',
  'GST LUT Undertaking',
  'RFD-11 Letter of Undertaking filing and annual renewal for zero-rated exports',
  '{
    "transactionType": "Zero-Rated",
    "standard": "GST RFD-11 Export Undertaking",
    "prioritySla": true,
    "currency": "INR",
    "sla": "24 Working Hours",
    "requestTypes": [
      {"id": "new", "label": "New Filing", "description": "RFD-11 Submission"},
      {"id": "renewal", "label": "Renewal", "description": "FY Rollover Audit"}
    ],
    "documents": [
      {"id": "gstCert", "label": "GST Registration Certificate (REG-06)", "required": true},
      {"id": "selfDecl", "label": "Undertaking of Non-Prosecution (Draft)", "required": true, "sampleAvailable": true},
      {"id": "prevLut", "label": "Previous Year LUT Acknowledgment", "required": true, "requestTypes": ["renewal"], "visibleTypes": ["renewal"]},
      {"id": "authSignatoryID", "label": "Authorized Signatory PAN / Aadhaar", "required": true},
      {"id": "witnessId", "label": "Witness ID Proofs (Consolidated)", "required": false}
    ],
    "pricing": {
      "new": {"officialFee": 0, "draftingFee": 1500, "transmissionShield": 2500, "gstRate": 18},
      "renewal": {"officialFee": 0, "draftingFee": 1500, "transmissionShield": 2500, "gstRate": 18}
    }
  }'::jsonb
)
ON CONFLICT(slug) DO UPDATE SET
  category = EXCLUDED.category,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  config = EXCLUDED.config,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO service_catalog(slug, category, name, description, config)
VALUES(
  'gst-return',
  'compliance',
  'GST Returns & ITC Audit',
  'Monthly and annual GST return preparation with input tax credit reconciliation',
  '{
    "transactionType": "Statutory",
    "standard": "GSTN Return & ITC Reconciliation",
    "prioritySla": true,
    "currency": "INR",
    "sla": "24 Working Hours",
    "returnTypes": [
      {"id": "gstr1_3b", "label": "GSTR-1 & 3B", "description": "Monthly Return"},
      {"id": "itc_audit", "label": "ITC Audit", "description": "2B Reconciliation"},
      {"id": "gstr9", "label": "GSTR-9", "description": "Annual Return"}
    ],
    "documents": [
      {"id": "salesRegister", "label": "Sales Register", "required": true},
      {"id": "purchaseRegister", "label": "Purchase Register", "required": true, "returnTypes": ["gstr1_3b"], "visibleTypes": ["gstr1_3b", "itc_audit"]},
      {"id": "icegateShippingBills", "label": "ICEGATE Shipping Bills", "required": true, "returnTypes": ["gstr1_3b"], "visibleTypes": ["gstr1_3b"]},
      {"id": "gstr2bDownload", "label": "GSTR-2B Download", "required": true, "returnTypes": ["itc_audit"], "visibleTypes": ["itc_audit"]},
      {"id": "trialBalance", "label": "Trial Balance", "required": true, "returnTypes": ["gstr9"], "visibleTypes": ["gstr9"]},
      {"id": "bankStatement", "label": "Bank Statement", "required": false}
    ],
    "pricing": {
      "gstr1_3b": {"officialFee": 0, "draftingFee": 2500, "shieldPremium": 5000, "gstRate": 18},
      "itc_audit": {"officialFee": 0, "draftingFee": 5000, "shieldPremium": 5000, "gstRate": 18},
      "gstr9": {"officialFee": 0, "draftingFee": 10000, "shieldPremium": 5000, "gstRate": 18}
    }
  }'::jsonb
)
ON CONFLICT(slug) DO UPDATE SET
  category = EXCLUDED.category,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  config = EXCLUDED.config,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO service_catalog(slug, category, name, description, config)
VALUES(
  'wpc-licence',
  'compliance',
  'WPC ETA Authorization',
  'Equipment Type Approval and wireless import clearance workflow',
  '{
    "transactionType": "Spectrum Compliance",
    "standard": "DoT / WPC RF Performance",
    "prioritySla": true,
    "currency": "INR",
    "sla": "10 Working Days",
    "gsrCompliance": "Compliant with Gazetted Norms",
    "requestModes": [
      {"id": "eta", "label": "ETA Authorization", "description": "Equipment / Type Approval"},
      {"id": "import-license", "label": "Import Licence", "description": "WPC Import Clearance"}
    ],
    "documents": [
      {"id": "rfTestReport", "label": "RF Test Report (NABL/ILAC Accredited)", "required": true},
      {"id": "productSpecSheet", "label": "Technical Data Sheet (with Frequency)", "required": true},
      {"id": "oemAuthLetter", "label": "OEM Authorization Letter (India Ops)", "required": true},
      {"id": "iecGstCopy", "label": "Company Profile (IEC/GST)", "required": true},
      {"id": "labelPhotos", "label": "Hardware Label / Marking Photos", "required": true},
      {"id": "importInvoice", "label": "Proforma Invoice / Purchase Order", "required": true, "requestModes": ["import-license"]}
    ],
    "pricing": {
      "eta": {"officialFee": 10000, "draftingFee": 10000, "successPremium": 10000, "gstRate": 18},
      "import-license": {"officialFee": 1000, "draftingFee": 5000, "successPremium": 10000, "gstRate": 18}
    }
  }'::jsonb
)
ON CONFLICT(slug) DO UPDATE SET
  category = EXCLUDED.category,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  config = EXCLUDED.config,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO service_catalog(slug, category, name, description, config)
VALUES(
  'cdsco-drug-control',
  'compliance',
  'CDSCO Import Authorization',
  'Medical device, drug, and cosmetic import authorization through the CDSCO SUGAM workflow',
  '{
    "transactionType": "Bio-Statutory",
    "standard": "CDSCO SUGAM Import Authorization",
    "prioritySla": true,
    "priorityLabel": "SEC Priority",
    "currency": "INR",
    "sla": "45-60 Working Days",
    "indianAgent": "Linked Authorized Agent",
    "requestModes": [
      {"id": "medical-device", "label": "Medical Device", "description": "MDR 2017"},
      {"id": "drug", "label": "Drug", "description": "Form 10 / Site Registration"},
      {"id": "cosmetic", "label": "Cosmetic", "description": "Form COS-2"}
    ],
    "medicalDeviceClasses": [
      {"value": "A", "label": "Class A - Low Risk"},
      {"value": "B", "label": "Class B - Low Moderate Risk"},
      {"value": "C", "label": "Class C - Moderate High Risk"},
      {"value": "D", "label": "Class D - High Risk"}
    ],
    "documents": [
      {"id": "plantMasterFile", "label": "Plant Master File", "required": true, "sampleAvailable": true},
      {"id": "freeSaleCert", "label": "Free Sale Certificate / Market Authorization", "required": true},
      {"id": "deviceMasterFile", "label": "Device Master File", "required": true, "requestModes": ["medical-device"]},
      {"id": "iso13485", "label": "ISO 13485 Certificate", "required": true, "requestModes": ["medical-device"]},
      {"id": "siteMasterFile", "label": "Site Master File", "required": true, "requestModes": ["drug"]},
      {"id": "labelSpecs", "label": "Labeling & Pack Specifications", "required": true},
      {"id": "agentAuth", "label": "Indian Agent Authorization Letter", "required": true, "sampleAvailable": true}
    ],
    "pricing": {
      "medical-device": {"officialFee": 75000, "draftingFee": 25000, "highRiskDraftingFee": 50000, "shieldPremium": 25000, "gstRate": 18},
      "drug": {"officialFee": 125000, "draftingFee": 50000, "shieldPremium": 25000, "gstRate": 18},
      "cosmetic": {"officialFee": 15000, "draftingFee": 15000, "shieldPremium": 25000, "gstRate": 18}
    }
  }'::jsonb
)
ON CONFLICT(slug) DO UPDATE SET
  category = EXCLUDED.category,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  config = EXCLUDED.config,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO service_catalog(slug, category, name, description, config)
VALUES(
  'un-iip-certificate',
  'compliance',
  'UN IIP Packaging Audit',
  'Hazardous goods packaging audit and UN performance certification workflow',
  '{
    "transactionType": "HAZMAT",
    "standard": "UN / IIP Packaging Performance",
    "prioritySla": true,
    "currency": "INR",
    "sla": "15-20 Working Days",
    "labCenter": "Mumbai Lab",
    "complianceMode": "Performance Mode",
    "requestTypes": [
      {"id": "new", "label": "New Certificate", "description": "Full Lab Testing"},
      {"id": "renewal", "label": "Re-validation", "description": "Batch Audit"}
    ],
    "hazardClasses": [
      {"value": "3", "label": "Class 3 - Flammable Liquids"},
      {"value": "6.1", "label": "Class 6.1 - Toxic Substances"},
      {"value": "8", "label": "Class 8 - Corrosive Substances"},
      {"value": "9", "label": "Class 9 - Miscellaneous Dangerous Goods"}
    ],
    "packagingGroups": [
      {"value": "I", "label": "Group I - High Danger"},
      {"value": "II", "label": "Group II - Medium Danger"},
      {"value": "III", "label": "Group III - Low Danger"}
    ],
    "documents": [
      {"id": "pkgDrawing", "label": "Technical Blueprint (Showing Stitching/Gauge)", "required": true},
      {"id": "materialSpec", "label": "Material COA (LDPE Liner/HDPE Woven)", "required": true},
      {"id": "msdsSheet", "label": "MSDS of Chemical Cargo", "required": true},
      {"id": "prevReport", "label": "Previous IIP Test Report", "required": true, "requestTypes": ["renewal"]},
      {"id": "samplePhotos", "label": "Product/Package Compatibility Declaration", "required": true},
      {"id": "labellingDraft", "label": "UN Marking Label Design", "required": true}
    ],
    "pricing": {
      "new": {"officialFee": 10000, "draftingFee": 15000, "successPremium": 10000, "gstRate": 18},
      "renewal": {"officialFee": 10000, "draftingFee": 7500, "successPremium": 10000, "gstRate": 18}
    }
  }'::jsonb
)
ON CONFLICT(slug) DO UPDATE SET
  category = EXCLUDED.category,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  config = EXCLUDED.config,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO service_catalog(slug, category, name, description, config)
VALUES(
  'epr-authorisation',
  'compliance',
  'EPR Authorisation & Returns',
  'CPCB extended producer responsibility authorisation, registration, and annual return workflow',
  '{
    "transactionType": "CPCB Compliance",
    "standard": "Extended Producer Responsibility",
    "prioritySla": true,
    "priorityLabel": "Priority Filing",
    "currency": "INR",
    "sla": "15-20 Working Days",
    "wasteTypes": [
      {"id": "plastic", "label": "Plastic Waste", "description": "PWM Rules 2016"},
      {"id": "e-waste", "label": "E-Waste", "description": "EW Rules 2022"},
      {"id": "battery", "label": "Battery Waste", "description": "BWM Rules 2022"},
      {"id": "tyre", "label": "Waste Tyre", "description": "TWM Rules 2022"}
    ],
    "requestTypes": [
      {"id": "new", "label": "New", "description": "Authorisation / Registration"},
      {"id": "return", "label": "Return", "description": "Annual Return / Obligation"}
    ],
    "producerTypes": [
      {"id": "importer", "label": "Importer"},
      {"id": "producer", "label": "Producer"},
      {"id": "brand-owner", "label": "Brand Owner"}
    ],
    "documents": [
      {"id": "gstCert", "label": "GST Registration Certificate", "requiredFor": ["new", "return"], "availableFor": ["new", "return"]},
      {"id": "actionPlan", "label": "EPR Action Plan & Target Calculation", "requiredFor": ["new"], "availableFor": ["new"], "sampleAvailable": true},
      {"id": "procurementData", "label": "Import / Procurement Data for Previous FY", "requiredFor": ["new", "return"], "availableFor": ["new", "return"], "sampleAvailable": true},
      {"id": "agreementWithPWP", "label": "Agreement with Recycler / PWP", "requiredFor": ["new"], "availableFor": ["new"]},
      {"id": "recyclingCredits", "label": "Recycling Certificates / EPR Credits", "requiredFor": ["return"], "availableFor": ["return"]},
      {"id": "signatoryKyc", "label": "Authorized Signatory KYC", "requiredFor": ["new", "return"], "availableFor": ["new", "return"], "sampleAvailable": true}
    ],
    "pricing": {
      "gstRate": 18,
      "requestTypes": {
        "new": {"officialFee": 10000, "draftingFee": 15000, "shieldPremium": 10000},
        "return": {"officialFee": 5000, "draftingFee": 7500, "shieldPremium": 10000}
      }
    },
    "warning": "Plastic EPR statutory fees are subject to the applicable weight-based or SME slab. High-volume applications may require a supplemental payment after CPCB scrutiny."
  }'::jsonb
)
ON CONFLICT(slug) DO UPDATE SET
  category = EXCLUDED.category,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  config = EXCLUDED.config,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO service_catalog(slug, category, name, description, config)
VALUES(
  'industrial-licence',
  'compliance',
  'Industrial Licence Audit',
  'Industrial licensing and statutory clearance workflow under the IDR Act, 1951',
  '{
    "transactionType": "IDR Act 1951",
    "standard": "DPIIT Industrial Licensing",
    "prioritySla": true,
    "currency": "INR",
    "sla": "45-60 Working Days",
    "requestTypes": [
      {"id": "new", "label": "New Licence (IL)", "description": "Technical Drafting"},
      {"id": "amendment", "label": "COB / Amendment", "description": "Capacity Audit"}
    ],
    "locationTypes": [
      {"value": "standard", "label": "Industrial Area (MIDC/GIDC/RIICO)"},
      {"value": "restricted", "label": "Within 25KM of City (1M+ Population)"},
      {"value": "backward", "label": "Designated Backward Area"}
    ],
    "documents": [
      {"id": "technicalProcess", "label": "Detailed Manufacturing Process Flow", "required": true, "sampleAvailable": true},
      {"id": "projectReport", "label": "Comprehensive Techno-Economic Project Report", "required": true},
      {"id": "landDocs", "label": "Land Possession / Allotment Letter", "required": true},
      {"id": "moaAoa", "label": "Company MOA/AOA (Object Clause Check)", "required": true},
      {"id": "mouTech", "label": "Technical Collaboration MOU (If Any)", "required": false},
      {"id": "envClearance", "label": "Environmental Clearance (Consent to Establish)", "required": true}
    ],
    "pricing": {
      "new": {"officialFee": 2500, "draftingFee": 50000, "successPremium": 25000, "gstRate": 18},
      "amendment": {"officialFee": 2500, "draftingFee": 25000, "successPremium": 25000, "gstRate": 18}
    }
  }'::jsonb
)
ON CONFLICT(slug) DO UPDATE SET
  category = EXCLUDED.category,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  config = EXCLUDED.config,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO service_catalog(slug, category, name, description, config)
VALUES(
  'iem-registration',
  'compliance',
  'IEM Statutory Filing',
  'Industrial Entrepreneurs Memorandum filing with DPIIT',
  '{
    "transactionType": "G2B Compliance",
    "standard": "DPIIT Industrial Memorandum",
    "prioritySla": true,
    "currency": "INR",
    "entityLabel": "Industrial Memorandum Mode",
    "filingParts": [
      {"id": "intent", "label": "Part A (Intent)", "description": "Memorandum of Intent"},
      {"id": "commence", "label": "Part B (Commence)", "description": "Commercial Production"}
    ],
    "sectorOptions": [
      {"value": "non-compulsory", "label": "Non-Compulsory Licensed"},
      {"value": "compulsory", "label": "Compulsory Licensed"},
      {"value": "reserved", "label": "Reserved Sector"}
    ],
    "documents": [
      {"id": "processDescription", "label": "Brief Manufacturing Process Description", "required": true},
      {"id": "moaAoa", "label": "Company MOA/AOA (Self-Attested)", "required": true},
      {"id": "plantLayout", "label": "Plant Layout / Project Report", "required": false}
    ],
    "pricing": {
      "intent": {"officialFee": 1000, "serviceCharge": 250, "gstRate": 18},
      "commence": {"officialFee": 1500, "serviceCharge": 350, "gstRate": 18}
    }
  }'::jsonb
)
ON CONFLICT(slug) DO UPDATE SET
  category = EXCLUDED.category,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  config = EXCLUDED.config,
  is_active = TRUE,
  updated_at = NOW();
