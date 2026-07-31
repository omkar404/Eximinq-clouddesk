import { pool } from "../database/pool.js";

export async function findServiceDefinition(serviceSlug) {
  const result = await pool.query(
    `SELECT slug, category, name, description, config, is_active, updated_at
       FROM service_catalog WHERE slug=$1 AND is_active=TRUE`,
    [serviceSlug]
  );
  return result.rows[0] || null;
}

export async function findFinancialContext(userId) {
  const result = await pool.query(
    `SELECT COALESCE(w.balance,0)::numeric wallet_balance,
            COALESCE(c.available_balance,0)::numeric credit_line_balance,
            COALESCE(c.credit_limit,0)::numeric credit_limit
       FROM users u
       LEFT JOIN wallets w ON w.user_id=u.id
       LEFT JOIN corporate_credit_lines c ON c.user_id=u.id
      WHERE u.id=$1`,
    [userId]
  );
  return result.rows[0] || { wallet_balance: 0, credit_line_balance: 0, credit_limit: 0 };
}

export async function findClientServiceIdentity(userId) {
  const result = await pool.query(
    `SELECT COALESCE(cp.data->>'iec_number','') AS iec_number,
            COALESCE(cp.data->>'gstin',cp.data->>'gst_number',cp.data->'gstin_details'->0->>'gstin','') AS gstin,
            COALESCE(cp.data->>'firm_name',cp.data->>'company_name',u.name,'') AS company_name
       FROM users u
       LEFT JOIN company_profiles cp ON cp.user_id=u.id
      WHERE u.id=$1`,
    [userId]
  );
  return result.rows[0] || { iec_number: "", gstin: "", company_name: "" };
}

export async function createServiceRequest({ userId, serviceSlug, payload, pricingSnapshot }) {
  const result = await pool.query(
    `INSERT INTO service_requests(user_id,service_slug,status,payload,pricing_snapshot)
     VALUES($1,$2,'DRAFT',$3,$4)
     RETURNING id,request_code,service_slug,status,payload,pricing_snapshot,
               submitted_at,created_at,updated_at`,
    [userId, serviceSlug, payload, pricingSnapshot]
  );
  return result.rows[0];
}

export async function updateServiceDraft({ requestId, userId, serviceSlug, payload, pricingSnapshot }) {
  const result = await pool.query(
    `UPDATE service_requests SET payload=$4,pricing_snapshot=$5,updated_at=NOW()
      WHERE id=$1 AND user_id=$2 AND service_slug=$3 AND status='DRAFT'
      RETURNING id,request_code,service_slug,status,payload,pricing_snapshot,
                submitted_at,created_at,updated_at`,
    [requestId, userId, serviceSlug, payload, pricingSnapshot]
  );
  return result.rows[0] || null;
}

export async function findServiceRequest(requestId, userId, serviceSlug) {
  const result = await pool.query(
    `SELECT id,request_code,service_slug,status,payload,pricing_snapshot,
            submitted_at,created_at,updated_at
       FROM service_requests WHERE id=$1 AND user_id=$2 AND service_slug=$3`,
    [requestId, userId, serviceSlug]
  );
  return result.rows[0] || null;
}

export async function listServiceRequests(userId, serviceSlug) {
  const result = await pool.query(
    `SELECT sr.id,sr.request_code,sr.service_slug,sr.status,sr.payload,
            sr.pricing_snapshot,sr.submitted_at,sr.created_at,sr.updated_at,
            COALESCE(jsonb_agg(jsonb_build_object(
              'id',d.id,'documentKey',d.document_key,'name',d.original_name,
              'mimeType',d.mime_type,'size',d.size_bytes,'uploadedAt',d.uploaded_at
            )) FILTER (WHERE d.id IS NOT NULL),'[]'::jsonb) documents
       FROM service_requests sr
       LEFT JOIN service_request_documents d ON d.request_id=sr.id
      WHERE sr.user_id=$1 AND sr.service_slug=$2
      GROUP BY sr.id ORDER BY sr.updated_at DESC`,
    [userId, serviceSlug]
  );
  return result.rows;
}

export async function upsertServiceDocument({ requestId, documentKey, originalName, storedName, mimeType, size }) {
  const result = await pool.query(
    `INSERT INTO service_request_documents(
       request_id,document_key,original_name,stored_name,mime_type,size_bytes
     ) VALUES($1,$2,$3,$4,$5,$6)
     ON CONFLICT(request_id,document_key) DO UPDATE SET
       original_name=EXCLUDED.original_name,stored_name=EXCLUDED.stored_name,
       mime_type=EXCLUDED.mime_type,size_bytes=EXCLUDED.size_bytes,uploaded_at=NOW()
     RETURNING *`,
    [requestId, documentKey, originalName, storedName, mimeType, size]
  );
  return result.rows[0];
}

export async function findServiceDocument(requestId, documentKey, userId, serviceSlug) {
  const result = await pool.query(
    `SELECT d.* FROM service_request_documents d
       JOIN service_requests sr ON sr.id=d.request_id
      WHERE d.request_id=$1 AND d.document_key=$2 AND sr.user_id=$3 AND sr.service_slug=$4`,
    [requestId, documentKey, userId, serviceSlug]
  );
  return result.rows[0] || null;
}

export async function listServiceDocuments(requestId, userId, serviceSlug) {
  const result = await pool.query(
    `SELECT d.* FROM service_request_documents d
       JOIN service_requests sr ON sr.id=d.request_id
      WHERE d.request_id=$1 AND sr.user_id=$2 AND sr.service_slug=$3
      ORDER BY d.uploaded_at`,
    [requestId, userId, serviceSlug]
  );
  return result.rows;
}

export async function deleteServiceDocument(requestId, documentKey, userId, serviceSlug) {
  const result = await pool.query(
    `DELETE FROM service_request_documents d USING service_requests sr
      WHERE d.request_id=$1 AND d.document_key=$2 AND sr.id=d.request_id
        AND sr.user_id=$3 AND sr.service_slug=$4 AND sr.status='DRAFT'
      RETURNING d.*`,
    [requestId, documentKey, userId, serviceSlug]
  );
  return result.rows[0] || null;
}

export async function submitServiceRequestAndDeduct({
  userId, requestId, serviceSlug, payload, pricingSnapshot, serviceName
}) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "INSERT INTO wallets(user_id,balance) VALUES($1,0) ON CONFLICT(user_id) DO NOTHING",
      [userId]
    );
    await client.query(
      `INSERT INTO corporate_credit_lines(user_id,credit_limit,available_balance)
       VALUES($1,0,0) ON CONFLICT(user_id) DO NOTHING`,
      [userId]
    );
    const balanceResult = await client.query(
      `SELECT w.balance,c.credit_limit,c.available_balance FROM wallets w
       JOIN corporate_credit_lines c ON c.user_id=w.user_id
       WHERE w.user_id=$1 FOR UPDATE OF w,c`,
      [userId]
    );
    const balances = balanceResult.rows[0];
    const walletBalance = Number(balances.balance);
    const creditBalance = Number(balances.available_balance);
    const officialFee = Number(pricingSnapshot.officialFee);
    const creditDeduction = Number((Number(pricingSnapshot.serviceCharge) + Number(pricingSnapshot.gst)).toFixed(2));
    const walletInsufficient = walletBalance < officialFee;
    const creditLineInsufficient = creditBalance < creditDeduction;
    if (walletInsufficient || creditLineInsufficient) {
      const error = new Error("Insufficient balance");
      error.code = walletInsufficient && creditLineInsufficient
        ? "INSUFFICIENT_WALLET_AND_CREDIT_LINE"
        : walletInsufficient ? "INSUFFICIENT_WALLET" : "INSUFFICIENT_CREDIT_LINE";
      error.balanceDetails = {
        wallet: { available: walletBalance, required: officialFee },
        creditLine: { available: creditBalance, required: creditDeduction }
      };
      throw error;
    }
    const requestResult = requestId
      ? await client.query(
          `UPDATE service_requests SET status='SUBMITTED',payload=$3,pricing_snapshot=$4,
                  submitted_at=NOW(),updated_at=NOW()
            WHERE id=$1 AND user_id=$2 AND service_slug=$5 AND status='DRAFT'
            RETURNING *`,
          [requestId, userId, payload, pricingSnapshot, serviceSlug]
        )
      : await client.query(
          `INSERT INTO service_requests(user_id,service_slug,status,payload,pricing_snapshot,submitted_at)
           VALUES($1,$2,'SUBMITTED',$3,$4,NOW()) RETURNING *`,
          [userId, serviceSlug, payload, pricingSnapshot]
        );
    const request = requestResult.rows[0];
    if (!request) {
      const error = new Error("Draft not found or already submitted");
      error.code = "REQUEST_NOT_EDITABLE";
      throw error;
    }
    const walletAfter = Number((walletBalance - officialFee).toFixed(2));
    const creditAfter = Number((creditBalance - creditDeduction).toFixed(2));
    await client.query("UPDATE wallets SET balance=$2,updated_at=NOW() WHERE user_id=$1", [userId, walletAfter]);
    await client.query("UPDATE corporate_credit_lines SET available_balance=$2,updated_at=NOW() WHERE user_id=$1", [userId, creditAfter]);
    await client.query(
      `INSERT INTO financial_transactions(
        user_id,service_request_id,service_slug,account_type,transaction_type,
        amount,balance_after,description
      ) VALUES
        ($1,$2,$3,'WALLET','DEBIT',$4,$5,$6),
        ($1,$2,$3,'CREDIT_LINE','DEBIT',$7,$8,$9)`,
      [userId, request.id, serviceSlug, officialFee, walletAfter,
        `${serviceName} - Official Fees`, creditDeduction, creditAfter,
        `${serviceName} - Service Charges & GST`]
    );
    await client.query("COMMIT");
    return {
      request,
      balances: { walletBalance: walletAfter, creditLineBalance: creditAfter, creditLimit: Number(balances.credit_limit) }
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
