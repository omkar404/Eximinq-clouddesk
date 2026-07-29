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
