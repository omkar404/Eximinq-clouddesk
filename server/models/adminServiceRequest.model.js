import { pool } from "../database/pool.js";

const REQUEST_SELECT = `
  SELECT sr.id, sr.request_code, sr.service_slug, sr.status, sr.payload,
         sr.pricing_snapshot, sr.submitted_at, sr.created_at, sr.updated_at,
         u.id AS client_id, u.name AS client_name, u.email AS client_email,
         u.user_code AS client_code,
         sc.name AS service_name, sc.category AS service_category,
         sc.description AS service_description
    FROM service_requests sr
    JOIN users u ON u.id = sr.user_id
    JOIN service_catalog sc ON sc.slug = sr.service_slug
`;

export async function listAdminServiceRequests({ status, search } = {}) {
  const values = [];
  const conditions = ["sr.status <> 'DRAFT'"];

  if (status) {
    values.push(status);
    conditions.push(`sr.status = $${values.length}`);
  }
  if (search) {
    values.push(`%${search}%`);
    conditions.push(
      `(sr.request_code ILIKE $${values.length} OR u.name ILIKE $${values.length}
        OR u.email ILIKE $${values.length} OR sc.name ILIKE $${values.length})`
    );
  }

  const result = await pool.query(
    `${REQUEST_SELECT}
     ${conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""}
     ORDER BY sr.submitted_at DESC NULLS LAST, sr.updated_at DESC`,
    values
  );
  return result.rows;
}

export async function findAdminServiceRequest(requestId) {
  const requestResult = await pool.query(
    `${REQUEST_SELECT} WHERE sr.id = $1`,
    [requestId]
  );
  const request = requestResult.rows[0];
  if (!request) return null;

  const [documentsResult, transactionsResult] = await Promise.all([
    pool.query(
      `SELECT id, document_key, original_name, mime_type, size_bytes, uploaded_at
         FROM service_request_documents
        WHERE request_id = $1
        ORDER BY uploaded_at`,
      [requestId]
    ),
    pool.query(
      `SELECT id, account_type, transaction_type, amount, balance_after,
              description, status, created_at
         FROM financial_transactions
        WHERE service_request_id = $1
        ORDER BY created_at, id`,
      [requestId]
    )
  ]);

  return {
    ...request,
    documents: documentsResult.rows,
    transactions: transactionsResult.rows
  };
}

export async function updateAdminServiceRequestStatus(requestId, status) {
  const result = await pool.query(
    `UPDATE service_requests
        SET status = $2, updated_at = NOW()
      WHERE id = $1 AND status <> 'DRAFT'
      RETURNING id, request_code, status, submitted_at, updated_at`,
    [requestId, status]
  );
  return result.rows[0] || null;
}

export async function findAdminRequestDocument(requestId, documentId) {
  const result = await pool.query(
    `SELECT d.*, sr.service_slug
       FROM service_request_documents d
       JOIN service_requests sr ON sr.id = d.request_id
      WHERE d.request_id = $1 AND d.id = $2 AND sr.status <> 'DRAFT'`,
    [requestId, documentId]
  );
  return result.rows[0] || null;
}
