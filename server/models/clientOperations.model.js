import { pool } from "../database/pool.js";

export async function getClientOperationalMetadata(userId) {
  const result = await pool.query(
    `SELECT sr.id,
            COALESCE((SELECT COUNT(*) FROM service_request_events event WHERE event.request_id=sr.id),0)::int event_count,
            COALESCE((SELECT SUM(ABS(ft.amount)) FROM financial_transactions ft
              WHERE ft.service_request_id=sr.id AND ft.transaction_type='DEBIT'),0)::numeric paid_amount
       FROM service_requests sr
      WHERE sr.user_id=$1 AND sr.status <> 'DRAFT'
      ORDER BY sr.updated_at DESC`,
    [userId]
  );
  return result.rows;
}

export async function getSchemeCatalog() {
  const result = await pool.query(
    `SELECT slug,name,category,description,config
       FROM service_catalog
      WHERE is_active=TRUE AND (
        category='incentives' OR name ILIKE '%scheme%' OR name ILIKE '%refund%'
        OR name ILIKE '%drawback%' OR name ILIKE '%incentive%'
      )
      ORDER BY category,name`
  );
  return result.rows;
}

export async function getClientOperationsTransactions(userId) {
  const result = await pool.query(
    `SELECT ft.id,ft.service_request_id,ft.account_type,ft.transaction_type,
            ft.amount,ft.balance_after,ft.description,ft.status,ft.created_at
       FROM financial_transactions ft
      WHERE ft.user_id=$1
      ORDER BY ft.created_at DESC LIMIT 100`,
    [userId]
  );
  return result.rows;
}
