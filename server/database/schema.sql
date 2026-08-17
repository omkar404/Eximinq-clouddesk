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

ALTER TABLE service_catalog
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS service_store_categories (
  slug VARCHAR(80) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  eyebrow VARCHAR(180) NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  icon_key VARCHAR(80) NOT NULL DEFAULT 'folder',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
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

-- FSSAI/FoSCoS workflow configuration. Form controls, evidence rules and
-- pricing are intentionally database-driven so future changes need no UI edit.
INSERT INTO service_catalog(slug, category, name, description, config)
VALUES(
  'fssai',
  'compliance',
  'FSSAI Compliance Hub',
  'FSSAI licensing, returns, labelling and FICS import-clearance support',
  '{
    "transactionType":"FoSCoS Compliance",
    "standard":"FSSAI / FoSCoS Regulatory Compliance",
    "prioritySla":true,
    "currency":"INR",
    "sla":"24 Working Hours",
    "reportingPeriod":"APR 2025 - MAR 2026",
    "requestModes":[
      {"id":"License","label":"License","description":"New / Renewal"},
      {"id":"Returns","label":"Returns","description":"Annual filing"},
      {"id":"Labelling","label":"Labelling","description":"Label audit"},
      {"id":"FICS","label":"FICS","description":"Import clearance"}
    ],
    "licenseTypes":[{"id":"New","label":"New"},{"id":"Renewal","label":"Renewal"}],
    "licenseRoles":[{"id":"Importer","label":"Importer"},{"id":"Exporter","label":"Exporter"}],
    "foodCategories":[
      {"id":"Standardized","label":"Standardized (Rule Base)"},
      {"id":"Proprietary","label":"Proprietary (Ingredient Base)"},
      {"id":"Health","label":"Nutraceuticals"}
    ],
    "documents":[
      {"id":"performanceSummary","label":"Annual Performance Summary","required":true,"modes":["Returns"]},
      {"id":"ficsReconciliation","label":"FICS Import Reconciliation","required":true,"modes":["Returns"]},
      {"id":"analysisReport","label":"Certificate of Analysis / Lab Report","required":true,"modes":["License","FICS"]},
      {"id":"labelDraft","label":"Product Label / Artwork Draft","required":true},
      {"id":"ingredientList","label":"Ingredient & Additive Declaration","required":true,"modes":["Labelling"]},
      {"id":"currentLicense","label":"Current FSSAI License","required":true,"modes":["License"],"licenseTypes":["Renewal"]},
      {"id":"exportDeclaration","label":"Export-Only Product Declaration","required":true,"modes":["License"],"licenseRoles":["Exporter"]},
      {"id":"recallPlan","label":"Food Recall Plan","required":true,"modes":["License"]}
    ],
    "pricing":{
      "officialFees":{"License":7500,"Returns":0,"Labelling":0,"FICS":0},
      "officialGstRate":18,
      "serviceFees":{"License":15000,"Returns":5000,"Labelling":5000,"FICS":3500},
      "serviceGstRate":18
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

-- Keep the public catalog placement authoritative after all service-specific seeds.
UPDATE service_catalog AS s
   SET category = v.category,
       name = v.name,
       sort_order = v.sort_order,
       is_active = TRUE,
       updated_at = NOW()
  FROM (VALUES
    ('advance-authorisation','licensing','Advance Authorisation',1),('epcg','licensing','EPCG Scheme',2),('dfia-license','licensing','DFIA License',3),('eop-extension','licensing','EOP Extension',4),('scomet-licensing','licensing','SCOMET Licensing',5),('customs-license','licensing','Customs License',6),('fertiliser-import','licensing','Fertiliser Import',7),
    ('import-management','registration','Import Management',1),('star-export-house','registration','Star Export House',2),('iec-management','registration','IEC Management',3),('icegate-registration','registration','ICEGATE Registration',4),('ad-code-registration','registration','AD Code Registration',5),('e-rcmc-issuance','registration','E-RCMC Issuance',6),('defence-exim-license','registration','Defence Exim License',7),('halal-certification','registration','Halal Certification',8),('gem-registration','registration','GeM Registration',9),('horticulture','registration','Horticulture',10),
    ('free-sale-certificate','incentives','Free Sale Certificate',1),('rodtep-rosctl-script-trading','incentives','RoDTEP / RoSCTL Script Trading',2),('interest-equalisation','incentives','Interest Equalisation',3),('igst-refund','incentives','IGST Refund',4),('duty-drawback','incentives','Duty Drawback',5),('rodtep-scheme','incentives','RoDTEP Scheme',6),('no-due-certificate','incentives','No Due Certificate',7),('no-incentive-certificate','incentives','No Incentive Certificate',8),
    ('svb-registration','custom-filing','SVB Registration',1),('moowr-scheme','custom-filing','MOOWR Scheme',2),('aeo-certification','custom-filing','AEO Certification',3),('bill-of-entry-import','custom-filing','Bill of Entry (Import)',4),('shipping-bill-export','custom-filing','Shipping Bill (Export)',5),('e-sanchit-support','custom-filing','e-Sanchit Support',6),('duty-payment-ecl','custom-filing','Duty Payment (ECL)',7),('rmcc-alert-removal','custom-filing','RMCC Alert Removal',8),
    ('customs-adjudication','dispute-resolution','Customs Adjudication',1),('policy-relaxation-prc','dispute-resolution','Policy Relaxation (PRC)',2),
    ('barcode-registration','iso-trademark','Barcode Registration',1),('brand-copyright','iso-trademark','Brand Copyright',2),('copyright','iso-trademark','Copyright',3),('design-registration','iso-trademark','Design Registration',4),('iso-certification','iso-trademark','ISO Certification',5),('logo-copyright','iso-trademark','Logo Copyright',6),('trademark','iso-trademark','Trademark',7),
    ('factory-stuffing','logistics','Factory Stuffing',1),('project-cargo','logistics','Project Cargo',2),('warehousing-solutions','logistics','Warehousing Solutions',3),('inland-transportation','logistics','Inland Transportation',4),('marine-insurance','logistics','Marine Insurance',5),('dpd-registration','logistics','DPD Registration',6)
  ) AS v(slug, category, name, sort_order)
 WHERE s.slug = v.slug;

UPDATE service_catalog
   SET is_active = FALSE, updated_at = NOW()
 WHERE category IN ('licensing','registration','incentives','custom-filing','dispute-resolution','iso-trademark','logistics')
   AND slug NOT IN (
    'advance-authorisation','epcg','dfia-license','eop-extension','scomet-licensing','customs-license','fertiliser-import','import-management','star-export-house','iec-management','icegate-registration','ad-code-registration','e-rcmc-issuance','defence-exim-license','halal-certification','gem-registration','horticulture','free-sale-certificate','rodtep-rosctl-script-trading','interest-equalisation','igst-refund','duty-drawback','rodtep-scheme','no-due-certificate','no-incentive-certificate','svb-registration','moowr-scheme','aeo-certification','bill-of-entry-import','shipping-bill-export','e-sanchit-support','duty-payment-ecl','rmcc-alert-removal','customs-adjudication','policy-relaxation-prc','barcode-registration','brand-copyright','copyright','design-registration','iso-certification','logo-copyright','trademark','factory-stuffing','project-cargo','warehousing-solutions','inland-transportation','marine-insurance','dpd-registration'
   );

-- Backend-managed Service Store navigation and ordering.
INSERT INTO service_store_categories
  (slug, name, eyebrow, description, icon_key, sort_order, is_active)
VALUES
  ('compliance', 'Compliance', 'DGFT and Trade Governance', 'Certification, return filing, licensing, and regulated documentation services.', 'shield-check', 0, TRUE),
  ('licensing', 'Licensing', 'Authorisations and Permissions', 'Licences, authorisations, extensions, and regulated import permissions.', 'landmark', 1, TRUE),
  ('registration', 'Registration', 'Entity and Filing Setup', 'Trade registrations, memberships, certifications, and account activation.', 'building', 2, TRUE),
  ('incentives', 'Incentives', 'Benefits and Claims', 'Export incentives, refunds, certificates, and script support.', 'wallet', 3, TRUE),
  ('custom-filing', 'Custom Filing', 'Customs and Port Operations', 'Customs registrations, declarations, payments, and cargo clearances.', 'file-text', 4, TRUE),
  ('dispute-resolution', 'Dispute Resolution', 'Remedy and Response', 'Adjudication and policy-relaxation representation.', 'scale', 5, TRUE),
  ('iso-trademark', 'ISO & Trademark', 'Brand and Standards', 'Brand protection, intellectual property, and quality certification.', 'badge-check', 6, TRUE),
  ('logistics', 'Logistics', 'Cargo and Supply Chain', 'Cargo movement, insurance, storage, and port enablement.', 'truck', 7, TRUE)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, eyebrow = EXCLUDED.eyebrow,
  description = EXCLUDED.description, icon_key = EXCLUDED.icon_key,
  sort_order = EXCLUDED.sort_order, is_active = TRUE, updated_at = NOW();

INSERT INTO service_catalog
  (slug, category, name, description, config, sort_order, is_active)
VALUES
  ('advance-authorisation','licensing','Advance Authorisation','Duty-free import authorisation support.','{"subtitle":"Duty-free import authorisation","iconKey":"landmark"}',1,TRUE),
  ('epcg','licensing','EPCG Scheme','Capital-goods import and export-obligation support.','{"subtitle":"Capital goods authorisation","iconKey":"factory"}',2,TRUE),
  ('dfia-license','licensing','DFIA License','Duty Free Import Authorisation filing and management.','{"subtitle":"DFIA filing and management","iconKey":"file-check"}',3,TRUE),
  ('eop-extension','licensing','EOP Extension','Export obligation period extension support.','{"subtitle":"Export obligation extension","iconKey":"clock"}',4,TRUE),
  ('scomet-licensing','licensing','SCOMET Licensing','Authorisation for controlled dual-use items.','{"subtitle":"Controlled-item authorisation","iconKey":"shield"}',5,TRUE),
  ('customs-license','licensing','Customs License','Customs licence application and renewal support.','{"subtitle":"Customs permissions","iconKey":"stamp"}',6,TRUE),
  ('fertiliser-import','licensing','Fertiliser Import','Import permissions for regulated fertiliser products.','{"subtitle":"Regulated fertiliser imports","iconKey":"leaf"}',7,TRUE),

  ('import-management','registration','Import Management','Import setup, registrations, and operational enablement.','{"subtitle":"Import setup and control","iconKey":"package"}',1,TRUE),
  ('star-export-house','registration','Star Export House','Status-holder recognition application support.','{"subtitle":"Status holder recognition","iconKey":"star"}',2,TRUE),
  ('iec-management','registration','IEC Management','IEC issuance, modification, and lifecycle support.','{"subtitle":"IEC lifecycle management","iconKey":"globe"}',3,TRUE),
  ('icegate-registration','registration','ICEGATE Registration','ICEGATE account registration and activation.','{"subtitle":"Customs portal activation","iconKey":"monitor"}',4,TRUE),
  ('ad-code-registration','registration','AD Code Registration','Bank AD code registration at customs ports.','{"subtitle":"Bank code registration","iconKey":"building"}',5,TRUE),
  ('e-rcmc-issuance','registration','E-RCMC Issuance','Electronic RCMC application and issuance support.','{"subtitle":"Export council membership","iconKey":"badge-check"}',6,TRUE),
  ('defence-exim-license','registration','Defence Exim License','Defence-sector export/import registration support.','{"subtitle":"Defence trade registration","iconKey":"shield"}',7,TRUE),
  ('halal-certification','registration','Halal Certification','Halal certification application coordination.','{"subtitle":"Product certification","iconKey":"file-check"}',8,TRUE),
  ('gem-registration','registration','GeM Registration','Government e-Marketplace seller onboarding.','{"subtitle":"Government marketplace onboarding","iconKey":"store"}',9,TRUE),
  ('horticulture','registration','Horticulture','Horticulture trade registrations and approvals.','{"subtitle":"Horticulture approvals","iconKey":"leaf"}',10,TRUE),

  ('free-sale-certificate','incentives','Free Sale Certificate','Free Sale Certificate application support.','{"subtitle":"Marketability certification","iconKey":"file-check"}',1,TRUE),
  ('rodtep-rosctl-script-trading','incentives','RoDTEP / RoSCTL Script Trading','Duty credit script advisory and transfer support.','{"subtitle":"Duty credit script trading","iconKey":"arrow-right-left"}',2,TRUE),
  ('interest-equalisation','incentives','Interest Equalisation','Interest Equalisation Scheme claim support.','{"subtitle":"Export credit benefit","iconKey":"percent"}',3,TRUE),
  ('igst-refund','incentives','IGST Refund','Export IGST refund reconciliation and follow-up.','{"subtitle":"Export tax refunds","iconKey":"receipt"}',4,TRUE),
  ('duty-drawback','incentives','Duty Drawback','Drawback claim preparation and reconciliation.','{"subtitle":"Customs duty benefit","iconKey":"wallet"}',5,TRUE),
  ('rodtep-scheme','incentives','RoDTEP Scheme','RoDTEP eligibility, claim, and reconciliation support.','{"subtitle":"Export remission benefit","iconKey":"badge-check"}',6,TRUE),
  ('no-due-certificate','incentives','No Due Certificate','No Due Certificate application support.','{"subtitle":"Clearance certification","iconKey":"file-check"}',7,TRUE),
  ('no-incentive-certificate','incentives','No Incentive Certificate','No Incentive Certificate preparation and filing.','{"subtitle":"Incentive declaration","iconKey":"file-minus"}',8,TRUE),

  ('svb-registration','custom-filing','SVB Registration','Special Valuation Branch registration support.','{"subtitle":"Related-party valuation","iconKey":"scale"}',1,TRUE),
  ('moowr-scheme','custom-filing','MOOWR Scheme','Manufacturing and Other Operations in Warehouse support.','{"subtitle":"Bonded manufacturing","iconKey":"factory"}',2,TRUE),
  ('aeo-certification','custom-filing','AEO Certification','Authorised Economic Operator certification support.','{"subtitle":"Trusted trader certification","iconKey":"shield-check"}',3,TRUE),
  ('bill-of-entry-import','custom-filing','Bill of Entry (Import)','Import Bill of Entry preparation and filing.','{"subtitle":"Import declaration filing","iconKey":"file-input"}',4,TRUE),
  ('shipping-bill-export','custom-filing','Shipping Bill (Export)','Export Shipping Bill preparation and filing.','{"subtitle":"Export declaration filing","iconKey":"file-output"}',5,TRUE),
  ('e-sanchit-support','custom-filing','e-Sanchit Support','Electronic supporting-document upload assistance.','{"subtitle":"Customs document upload","iconKey":"upload"}',6,TRUE),
  ('duty-payment-ecl','custom-filing','Duty Payment (ECL)','Electronic Cash Ledger duty-payment support.','{"subtitle":"Customs duty payment","iconKey":"credit-card"}',7,TRUE),
  ('rmcc-alert-removal','custom-filing','RMCC Alert Removal','RMCC alert response and removal support.','{"subtitle":"Customs alert resolution","iconKey":"alert-triangle"}',8,TRUE),

  ('customs-adjudication','dispute-resolution','Customs Adjudication','Representation in customs adjudication proceedings.','{"subtitle":"Customs legal representation","iconKey":"scale"}',1,TRUE),
  ('policy-relaxation-prc','dispute-resolution','Policy Relaxation (PRC)','Policy Relaxation Committee application support.','{"subtitle":"Policy relaxation representation","iconKey":"gavel"}',2,TRUE),

  ('barcode-registration','iso-trademark','Barcode Registration','GS1 barcode registration and allocation support.','{"subtitle":"Product barcode setup","iconKey":"scan-barcode"}',1,TRUE),
  ('brand-copyright','iso-trademark','Brand Copyright','Brand artwork copyright protection support.','{"subtitle":"Brand asset protection","iconKey":"copyright"}',2,TRUE),
  ('copyright','iso-trademark','Copyright','Copyright registration and filing support.','{"subtitle":"Creative work protection","iconKey":"copyright"}',3,TRUE),
  ('design-registration','iso-trademark','Design Registration','Industrial design registration support.','{"subtitle":"Industrial design protection","iconKey":"pen-tool"}',4,TRUE),
  ('iso-certification','iso-trademark','ISO Certification','ISO management-system certification support.','{"subtitle":"Quality system certification","iconKey":"badge-check"}',5,TRUE),
  ('logo-copyright','iso-trademark','Logo Copyright','Logo copyright registration support.','{"subtitle":"Logo asset protection","iconKey":"copyright"}',6,TRUE),
  ('trademark','iso-trademark','Trademark','Trademark search, filing, and prosecution support.','{"subtitle":"Trademark filing","iconKey":"stamp"}',7,TRUE),

  ('factory-stuffing','logistics','Factory Stuffing','Factory stuffing permission and coordination.','{"subtitle":"On-site container stuffing","iconKey":"factory"}',1,TRUE),
  ('project-cargo','logistics','Project Cargo','Heavy and project cargo movement coordination.','{"subtitle":"Special cargo logistics","iconKey":"boxes"}',2,TRUE),
  ('warehousing-solutions','logistics','Warehousing Solutions','Storage and warehouse-operation support.','{"subtitle":"Storage and fulfilment","iconKey":"warehouse"}',3,TRUE),
  ('inland-transportation','logistics','Inland Transportation','Domestic cargo transportation coordination.','{"subtitle":"Domestic cargo movement","iconKey":"truck"}',4,TRUE),
  ('marine-insurance','logistics','Marine Insurance','Cargo marine-insurance placement support.','{"subtitle":"Cargo risk coverage","iconKey":"ship"}',5,TRUE),
  ('dpd-registration','logistics','DPD Registration','Direct Port Delivery registration support.','{"subtitle":"Faster port delivery","iconKey":"anchor"}',6,TRUE)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category, name = EXCLUDED.name,
  description = EXCLUDED.description,
  config = service_catalog.config || EXCLUDED.config,
  sort_order = EXCLUDED.sort_order, is_active = TRUE, updated_at = NOW();

UPDATE service_catalog
   SET is_active = FALSE, updated_at = NOW()
 WHERE category IN ('licensing','registration','incentives','custom-filing','dispute-resolution','iso-trademark','logistics')
   AND slug NOT IN (
    'advance-authorisation','epcg','dfia-license','eop-extension','scomet-licensing','customs-license','fertiliser-import',
    'import-management','star-export-house','iec-management','icegate-registration','ad-code-registration','e-rcmc-issuance','defence-exim-license','halal-certification','gem-registration','horticulture',
    'free-sale-certificate','rodtep-rosctl-script-trading','interest-equalisation','igst-refund','duty-drawback','rodtep-scheme','no-due-certificate','no-incentive-certificate',
    'svb-registration','moowr-scheme','aeo-certification','bill-of-entry-import','shipping-bill-export','e-sanchit-support','duty-payment-ecl','rmcc-alert-removal',
    'customs-adjudication','policy-relaxation-prc','barcode-registration','brand-copyright','copyright','design-registration','iso-certification','logo-copyright','trademark',
    'factory-stuffing','project-cargo','warehousing-solutions','inland-transportation','marine-insurance','dpd-registration'
   );

INSERT INTO service_catalog(slug, category, name, description, config)
VALUES
  (
    'factory-license',
    'compliance',
    'Factory License',
    'Factory licensing, renewal, and statutory approval support',
    '{"transactionType":"Compliance","standard":"Factories Act Compliance","currency":"INR","status":"CATALOGUED"}'::jsonb
  ),
  (
    'fssai',
    'compliance',
    'FSSAI Licensing',
    'FSSAI licensing, registration, and renewal support',
    '{"transactionType":"Compliance","standard":"FSSAI Regulatory Compliance","currency":"INR","status":"CATALOGUED"}'::jsonb
  ),
  (
    'rex',
    'compliance',
    'REX Registration',
    'REX registration and exporter certification assistance',
    '{"transactionType":"Compliance","standard":"Registered Exporter System","currency":"INR","status":"CATALOGUED"}'::jsonb
  ),
  (
    'bis',
    'compliance',
    'BIS Registration',
    'BIS documentation, registration, and certification support',
    '{"transactionType":"Compliance","standard":"BIS Product Conformity","currency":"INR","status":"CATALOGUED"}'::jsonb
  )
ON CONFLICT(slug) DO UPDATE SET
  category = EXCLUDED.category,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  config = service_catalog.config || EXCLUDED.config,
  is_active = TRUE,
  updated_at = NOW();

-- Complete REX workflow configuration. This statement intentionally follows
-- the category-normalisation seed above so the catalog remains the single
-- source of truth for the client form, evidence rules, pricing, and SLA.
INSERT INTO service_catalog(slug, category, name, description, config)
VALUES(
  'rex',
  'compliance',
  'REX Registration & Audit',
  'Registered Exporter System registration, modification, and origin self-certification support',
  '{
    "transactionType": "GSP Self-Cert",
    "standard": "Registered Exporter System / Rules of Origin",
    "prioritySla": true,
    "currency": "INR",
    "sla": "48 Working Hours",
    "requestTypes": [
      {"id":"New","label":"New Registration","description":"Initial REX enrolment"},
      {"id":"Modification","label":"Modification","description":"Update an existing registration"}
    ],
    "destinations": [
      {"id":"EU","label":"European Union"},
      {"id":"UK","label":"United Kingdom"},
      {"id":"CH","label":"Switzerland"},
      {"id":"TR","label":"Turkey"}
    ],
    "documents": [
      {"id":"costSheet","label":"Product Cost Sheet & Value Addition Working","required":true},
      {"id":"rexDeclaration","label":"REX Exporter Declaration / Undertaking","required":true},
      {"id":"rawMaterialInvoices","label":"Raw Material Purchase Invoices","required":true},
      {"id":"iecGstCopy","label":"IEC & GST Registration Copy","required":true},
      {"id":"factoryPhotos","label":"Factory / Manufacturing Process Photographs","required":false}
    ],
    "pricing": {
      "officialFees": {"New":0,"Modification":0},
      "officialGstRate": 0,
      "draftingFees": {"New":5000,"Modification":2500},
      "originPremiums": {"New":5000,"Modification":5000},
      "serviceGstRate": 18
    },
    "minimumValueAddition": 40,
    "status": "ACTIVE"
  }'::jsonb
)
ON CONFLICT(slug) DO UPDATE SET
  category = EXCLUDED.category,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  config = EXCLUDED.config,
  is_active = TRUE,
  updated_at = NOW();

-- Complete BIS workflow configuration for CRS, ISI, and FMCS certification.
INSERT INTO service_catalog(slug, category, name, description, config)
VALUES(
  'bis',
  'compliance',
  'BIS Registration & Certification',
  'BIS CRS, ISI Mark, and Foreign Manufacturers Certification support',
  '{
    "transactionType": "G2B Safety",
    "standard": "BIS Product Conformity / MANAK Online",
    "prioritySla": true,
    "currency": "INR",
    "sla": "15–20 Working Days",
    "requestModes": [
      {"id":"CRS","label":"CRS Registration","description":"Compulsory Registration Scheme"},
      {"id":"ISI","label":"ISI Mark License","description":"Domestic product certification"},
      {"id":"FMCS","label":"FMCS Certification","description":"Foreign manufacturer certification"}
    ],
    "documents": [
      {"id":"cdfDocument","label":"Component Declaration Form (CDF)","requiredFor":["CRS","ISI","FMCS"]},
      {"id":"techSpecSheet","label":"Technical Data Sheet with Schematics","requiredFor":["CRS","ISI","FMCS"]},
      {"id":"testReport","label":"BIS-recognised Laboratory Test Report","requiredFor":["CRS","ISI","FMCS"]},
      {"id":"airAgreement","label":"Authorised Indian Representative Agreement","requiredFor":["FMCS"],"showFor":["FMCS"]},
      {"id":"factoryProcess","label":"Factory Process Flow and Quality Plan","requiredFor":["ISI","FMCS"],"showFor":["ISI","FMCS"]},
      {"id":"trademarkCert","label":"Trademark Registration Certificate","requiredFor":[]}
    ],
    "pricing": {
      "officialFees": {"CRS":1000,"ISI":15000,"FMCS":25000},
      "draftingFees": {"CRS":25000,"ISI":75000,"FMCS":100000},
      "shieldPremium": 15000,
      "serviceGstRate": 18
    },
    "status": "ACTIVE"
  }'::jsonb
)
ON CONFLICT(slug) DO UPDATE SET
  category = EXCLUDED.category,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  config = EXCLUDED.config,
  is_active = TRUE,
  updated_at = NOW();

-- Factory License workflow configuration. The service stays exclusively in
-- Compliance; the separate Logistics "Factory Stuffing" catalog entry remains
-- an independent service.
INSERT INTO service_catalog(slug, category, name, description, config)
VALUES(
  'factory-license',
  'compliance',
  'Factory License',
  'Factory licensing, renewal, and statutory infrastructure compliance support',
  '{
    "transactionType": "Factory Compliance",
    "standard": "CBIC Factory Stuffing Permission",
    "prioritySla": true,
    "currency": "INR",
    "sla": "10-15 Working Days",
    "requestTypes": [
      {"id":"New","label":"New Permission","description":"Factory Stuffing Approval"},
      {"id":"Renewal","label":"Renewal","description":"Permission Continuation"}
    ],
    "documents": [
      {"id":"prevPermission","label":"Previous Factory Stuffing Permission","required":true,"requestTypes":["Renewal"]},
      {"id":"factoryPhotos","label":"Factory Premises Photographs","required":true},
      {"id":"sitePlan","label":"Factory Site Plan & Examination Area","required":true},
      {"id":"factoryOwnership","label":"Factory Ownership / Registered Lease","required":true},
      {"id":"selfSealingDecl","label":"Self-Sealing & CCTV Declaration","required":true},
      {"id":"iecGstCopy","label":"IEC & GST Registration Copy","required":false}
    ],
    "pricing": {
      "officialFee": 0,
      "draftingFees": {"New":12500,"Renewal":7500},
      "savingsPerContainer": 8000,
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

-- Final authoritative placement. Service-specific seeds above may preserve legacy
-- category labels, so normalize the public catalog after every seed has run.
WITH desired(slug, category, name, sort_order) AS (
  VALUES
    ('advance-authorisation', 'licensing', 'Advance Authorisation', 1),
    ('epcg', 'licensing', 'EPCG Scheme', 2),
    ('dfia-license', 'licensing', 'DFIA License', 3),
    ('eop-extension', 'licensing', 'EOP Extension', 4),
    ('scomet-licensing', 'licensing', 'SCOMET Licensing', 5),
    ('customs-license', 'licensing', 'Customs License', 6),
    ('fertiliser-import', 'licensing', 'Fertiliser Import', 7),
    ('import-management', 'registration', 'Import Management', 1),
    ('star-export-house', 'registration', 'Star Export House', 2),
    ('iec-management', 'registration', 'IEC Management', 3),
    ('icegate-registration', 'registration', 'ICEGATE Registration', 4),
    ('ad-code-registration', 'registration', 'AD Code Registration', 5),
    ('e-rcmc-issuance', 'registration', 'E-RCMC Issuance', 6),
    ('defence-exim-license', 'registration', 'Defence Exim License', 7),
    ('halal-certification', 'registration', 'Halal Certification', 8),
    ('gem-registration', 'registration', 'GeM Registration', 9),
    ('horticulture', 'registration', 'Horticulture', 10),
    ('free-sale-certificate', 'incentives', 'Free Sale Certificate', 1),
    ('rodtep-rosctl-script-trading', 'incentives', 'RoDTEP / RoSCTL Script Trading', 2),
    ('interest-equalisation', 'incentives', 'Interest Equalisation', 3),
    ('igst-refund', 'incentives', 'IGST Refund', 4),
    ('duty-drawback', 'incentives', 'Duty Drawback', 5),
    ('rodtep-scheme', 'incentives', 'RoDTEP Scheme', 6),
    ('no-due-certificate', 'incentives', 'No Due Certificate', 7),
    ('no-incentive-certificate', 'incentives', 'No Incentive Certificate', 8),
    ('svb-registration', 'custom-filing', 'SVB Registration', 1),
    ('moowr-scheme', 'custom-filing', 'MOOWR Scheme', 2),
    ('aeo-certification', 'custom-filing', 'AEO Certification', 3),
    ('bill-of-entry-import', 'custom-filing', 'Bill of Entry (Import)', 4),
    ('shipping-bill-export', 'custom-filing', 'Shipping Bill (Export)', 5),
    ('e-sanchit-support', 'custom-filing', 'e-Sanchit Support', 6),
    ('duty-payment-ecl', 'custom-filing', 'Duty Payment (ECL)', 7),
    ('rmcc-alert-removal', 'custom-filing', 'RMCC Alert Removal', 8),
    ('customs-adjudication', 'dispute-resolution', 'Customs Adjudication', 1),
    ('policy-relaxation-prc', 'dispute-resolution', 'Policy Relaxation (PRC)', 2),
    ('barcode-registration', 'iso-trademark', 'Barcode Registration', 1),
    ('brand-copyright', 'iso-trademark', 'Brand Copyright', 2),
    ('copyright', 'iso-trademark', 'Copyright', 3),
    ('design-registration', 'iso-trademark', 'Design Registration', 4),
    ('iso-certification', 'iso-trademark', 'ISO Certification', 5),
    ('logo-copyright', 'iso-trademark', 'Logo Copyright', 6),
    ('trademark', 'iso-trademark', 'Trademark', 7),
    ('factory-stuffing', 'logistics', 'Factory Stuffing', 1),
    ('project-cargo', 'logistics', 'Project Cargo', 2),
    ('warehousing-solutions', 'logistics', 'Warehousing Solutions', 3),
    ('inland-transportation', 'logistics', 'Inland Transportation', 4),
    ('marine-insurance', 'logistics', 'Marine Insurance', 5),
    ('dpd-registration', 'logistics', 'DPD Registration', 6)
)
UPDATE service_catalog catalog
SET category = desired.category,
    name = desired.name,
    sort_order = desired.sort_order,
    is_active = TRUE,
    updated_at = NOW()
FROM desired
WHERE catalog.slug = desired.slug;

UPDATE service_catalog catalog
SET is_active = FALSE,
    updated_at = NOW()
WHERE catalog.category IN (
  'licensing', 'registration', 'incentives', 'custom-filing',
  'dispute-resolution', 'iso-trademark', 'logistics'
)
AND catalog.slug NOT IN (
  'advance-authorisation', 'epcg', 'dfia-license', 'eop-extension',
  'scomet-licensing', 'customs-license', 'fertiliser-import',
  'import-management', 'star-export-house', 'iec-management',
  'icegate-registration', 'ad-code-registration', 'e-rcmc-issuance',
  'defence-exim-license', 'halal-certification', 'gem-registration',
  'horticulture', 'free-sale-certificate', 'rodtep-rosctl-script-trading',
  'interest-equalisation', 'igst-refund', 'duty-drawback', 'rodtep-scheme',
  'no-due-certificate', 'no-incentive-certificate', 'svb-registration',
  'moowr-scheme', 'aeo-certification', 'bill-of-entry-import',
  'shipping-bill-export', 'e-sanchit-support', 'duty-payment-ecl',
  'rmcc-alert-removal', 'customs-adjudication', 'policy-relaxation-prc',
  'barcode-registration', 'brand-copyright', 'copyright',
  'design-registration', 'iso-certification', 'logo-copyright', 'trademark',
  'factory-stuffing', 'project-cargo', 'warehousing-solutions',
  'inland-transportation', 'marine-insurance', 'dpd-registration'
);

-- Licensing workflows.  The client renders these definitions dynamically; prices that
-- depend on a DGFT/customs authority review deliberately require a quotation.
INSERT INTO service_catalog (slug, category, name, description, config, is_active, sort_order)
VALUES
('advance-authorisation', 'licensing', 'Advance Authorisation',
 'DGFT duty-free input authorisation workflow.',
 $json${"title":"Advance Authorisation","badge":"DGFT Chapter 4","description":"Prepare an Advance Authorisation application with the applicable input-output evidence.","pricing":{"quoteRequired":true},"fields":[{"id":"authorisationRoute","label":"Authorisation route","type":"select","required":true,"options":[{"value":"SION","label":"Standard Input Output Norms (SION)"},{"value":"Self-declared","label":"Self-declared norms"}]},{"id":"applicationRoute","label":"Application route","type":"select","required":true,"options":[{"value":"Pre-export","label":"Pre-export"},{"value":"Post-export","label":"Post-export"}]},{"id":"iecNumber","label":"IEC number","type":"text","readonly":true,"required":true},{"id":"exportProduct","label":"Export product","type":"text","required":true},{"id":"inputRawMaterial","label":"Input / raw material","type":"textarea","required":true},{"id":"exportQuantityValue","label":"Export quantity and value","type":"text","required":true},{"id":"fobValue","label":"FOB value (INR)","type":"number","required":true},{"id":"normJustification","label":"Norm / justification","type":"textarea","required":true}],"documents":[{"id":"inputOutputNorm","label":"Input-output norm / SION evidence","required":true},{"id":"exportOrderOrShippingBills","label":"Export order or shipping bill evidence","required":true},{"id":"technicalJustification","label":"Technical justification","required":true}]}$json$::jsonb, TRUE, 1),
('dfia-license', 'licensing', 'DFIA License',
 'Duty Free Import Authorisation application or transferability workflow.',
 $json${"title":"DFIA License","badge":"DGFT Chapter 4","description":"Apply for DFIA issuance or prepare a transferability review.","pricing":{"quoteRequired":false},"fields":[{"id":"dfiaType","label":"DFIA request type","type":"select","required":true,"options":[{"value":"issuance","label":"New DFIA issuance"},{"value":"transferability","label":"Transferability endorsement"}]},{"id":"iecNumber","label":"IEC number","type":"text","readonly":true,"required":true},{"id":"sionNo","label":"SION / norms reference","type":"text","required":true},{"id":"raOffice","label":"Regional authority","type":"text","required":true},{"id":"dutyValue","label":"Duty saved / assessable value (INR)","type":"number","required":true}],"documents":[{"id":"shippingBillMatrix","label":"Shipping bill matrix","required":true,"visibleWhen":{"field":"dfiaType","equals":"issuance"}},{"id":"eBrcSummary","label":"e-BRC / bank realisation evidence","required":true,"visibleWhen":{"field":"dfiaType","equals":"issuance"}},{"id":"epCopyShippingBills","label":"EP copy of shipping bills","required":true,"visibleWhen":{"field":"dfiaType","equals":"issuance"}},{"id":"sionMapping","label":"SION and input-output mapping","required":true,"visibleWhen":{"field":"dfiaType","equals":"issuance"}},{"id":"licenseCopy","label":"Existing DFIA licence copy","required":true,"visibleWhen":{"field":"dfiaType","equals":"transferability"}}]}$json$::jsonb, TRUE, 3),
('eop-extension', 'licensing', 'EOP Extension',
 'Export obligation period extension request.',
 $json${"title":"Export Obligation Period Extension","badge":"DGFT Licensing","description":"Request an extension of the export-obligation period with performance evidence and reasons.","pricing":{"quoteRequired":true},"fields":[{"id":"authorisationNumber","label":"Authorisation / licence number","type":"text","required":true},{"id":"authorisationType","label":"Authorisation type","type":"select","required":true,"options":[{"value":"Advance Authorisation","label":"Advance Authorisation"},{"value":"EPCG","label":"EPCG"},{"value":"DFIA","label":"DFIA"}]},{"id":"originalDueDate","label":"Original obligation due date","type":"date","required":true},{"id":"extensionMonths","label":"Extension requested (months)","type":"number","required":true},{"id":"balanceExportObligation","label":"Balance export obligation","type":"text","required":true},{"id":"extensionJustification","label":"Extension justification","type":"textarea","required":true}],"documents":[{"id":"authorisationCopy","label":"Authorisation / licence copy","required":true},{"id":"exportPerformanceEvidence","label":"Export performance evidence","required":true},{"id":"extensionJustificationFile","label":"Supporting justification","required":true}]}$json$::jsonb, TRUE, 4),
('scomet-licensing', 'licensing', 'SCOMET Licensing',
 'SCOMET export or import authorisation workflow.',
 $json${"title":"SCOMET Licensing","badge":"DGFT SCOMET","description":"Prepare an export or import authorisation request for controlled items.","pricing":{"quoteRequired":false},"fields":[{"id":"transactionType","label":"Transaction type","type":"select","required":true,"options":[{"value":"Export","label":"Export authorisation"},{"value":"Import Restricted","label":"Restricted import authorisation"}]},{"id":"scometCategory","label":"SCOMET category / sub-category","type":"text","required":true},{"id":"itemDescription","label":"Item technical description","type":"textarea","required":true},{"id":"hsCode","label":"HS code","type":"text","required":true},{"id":"destinationCountry","label":"Destination / origin country","type":"text","required":true},{"id":"contractValue","label":"Contract value (INR)","type":"number","required":true}],"documents":[{"id":"techSpecSheet","label":"Technical specifications / data sheet","required":true},{"id":"purchaseOrder","label":"Purchase order or contract","required":true},{"id":"eucAppendix2S","label":"End-use certificate / Appendix 2S","required":true,"visibleWhen":{"field":"transactionType","equals":"Export"}},{"id":"endUserBusinessProfile","label":"End-user business profile","required":true,"visibleWhen":{"field":"transactionType","equals":"Export"}},{"id":"essentialityCert","label":"Essentiality certificate","required":true,"visibleWhen":{"field":"transactionType","equals":"Import Restricted"}},{"id":"annualProductionPlan","label":"Annual production plan","required":true,"visibleWhen":{"field":"transactionType","equals":"Import Restricted"}}]}$json$::jsonb, TRUE, 5),
('customs-license', 'licensing', 'Customs License',
 'Customs broker / licence support workflow.',
 $json${"title":"Customs License","badge":"Customs Brokerage","description":"Collect the applicant, premises and qualification records required for customs-licence support.","pricing":{"quoteRequired":true},"fields":[{"id":"applicantType","label":"Applicant type","type":"select","required":true,"options":[{"value":"Individual","label":"Individual"},{"value":"Partnership","label":"Partnership"},{"value":"Company","label":"Company"}]},{"id":"pan","label":"PAN","type":"text","required":true},{"id":"gstin","label":"GSTIN","type":"text","required":true},{"id":"principalBusinessPremises","label":"Principal business premises","type":"textarea","required":true},{"id":"customsStation","label":"Customs station","type":"text","required":true},{"id":"experienceQualification","label":"Experience and qualification","type":"textarea","required":true}],"documents":[{"id":"identityTaxProof","label":"Identity and tax registration proof","required":true},{"id":"premisesProof","label":"Business-premises proof","required":true},{"id":"experienceQualificationProof","label":"Experience / qualification evidence","required":true}]}$json$::jsonb, TRUE, 6),
('fertiliser-import', 'licensing', 'Fertiliser Import',
 'Fertiliser import clearance or permit workflow.',
 $json${"title":"Fertiliser Import","badge":"Import Controls","description":"Prepare the technical, product and consignment evidence for fertiliser import support.","pricing":{"quoteRequired":false},"fields":[{"id":"requestMode","label":"Product route","type":"select","required":true,"options":[{"value":"Standard","label":"Standard fertiliser"},{"value":"NewGrade","label":"New grade / special product"}]},{"id":"requestType","label":"Request type","type":"select","required":true,"options":[{"value":"Clearance","label":"Import clearance"},{"value":"Permit","label":"Import permit"}]},{"id":"iecNumber","label":"IEC number","type":"text","readonly":true,"required":true},{"id":"nitrogenContent","label":"Nitrogen content (%)","type":"number","required":true},{"id":"phosphorusContent","label":"Phosphorus content (%)","type":"number","required":true},{"id":"potassiumContent","label":"Potassium content (%)","type":"number","required":true},{"id":"portCode","label":"Port of import","type":"text","required":true},{"id":"consignmentValue","label":"Consignment value (INR)","type":"number","required":true}],"documents":[{"id":"certificateOfAnalysis","label":"Certificate of analysis","required":true},{"id":"mfgProcess","label":"Manufacturing process / product dossier","required":true},{"id":"fcoDeclaration","label":"FCO declaration / conformity evidence","required":true},{"id":"importPermit","label":"Existing import permit","required":true,"visibleWhen":{"field":"requestType","equals":"Clearance"}},{"id":"billOfLading","label":"Bill of lading / shipment evidence","required":true},{"id":"sampleTestResult","label":"Sample test result","required":false}]}$json$::jsonb, TRUE, 7)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  config = EXCLUDED.config,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
