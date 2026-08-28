import { pool } from "../database/pool.js";

export async function selectAdminDashboard() {
  const [summary, transactions, requests, users] = await Promise.all([
    pool.query(`SELECT
      COALESCE((SELECT SUM(amount) FROM financial_transactions WHERE transaction_type='CREDIT'),0) AS money_in,
      COALESCE((SELECT SUM(amount) FROM financial_transactions WHERE transaction_type='DEBIT'),0) AS money_out,
      (SELECT COUNT(*) FROM users u JOIN roles r ON r.id=u.role_id WHERE r.name='CLIENT' AND u.is_active) AS active_clients,
      (SELECT COUNT(*) FROM users u JOIN roles r ON r.id=u.role_id WHERE r.name='AGENT' AND u.is_active) AS active_agents,
      (SELECT COUNT(*) FROM service_requests WHERE status NOT IN ('DRAFT','COMPLETED','REJECTED')) AS active_requests,
      (SELECT COUNT(*) FROM service_requests WHERE status IN ('SUBMITTED','ADDITIONAL_DOCUMENTS_REQUESTED','DOCUMENTS_RESUBMITTED','AGENT_COMPLETED')) AS action_required`),
    pool.query(`SELECT ft.id,ft.created_at,ft.description,ft.account_type,ft.transaction_type,ft.amount,ft.balance_after,ft.status,
      u.name AS client_name,u.user_code,sr.request_code,sc.name AS service_name
      FROM financial_transactions ft JOIN users u ON u.id=ft.user_id
      LEFT JOIN service_requests sr ON sr.id=ft.service_request_id
      LEFT JOIN service_catalog sc ON sc.slug=ft.service_slug
      ORDER BY ft.created_at DESC,ft.id DESC LIMIT 100`),
    pool.query(`SELECT sr.id,sr.request_code,sr.status,sr.submitted_at,u.name AS client_name,sc.name AS service_name
      FROM service_requests sr JOIN users u ON u.id=sr.user_id JOIN service_catalog sc ON sc.slug=sr.service_slug
      WHERE sr.status <> 'DRAFT' ORDER BY sr.updated_at DESC LIMIT 100`),
    pool.query(`SELECT u.id,u.name,u.email,u.user_code,u.registration_status,u.is_active,r.name AS role
      FROM users u JOIN roles r ON r.id=u.role_id
      WHERE r.name IN ('CLIENT','AGENT') AND u.is_active=TRUE
      ORDER BY r.name,u.name`)
  ]);
  return { summary: summary.rows[0], transactions: transactions.rows, requests: requests.rows, users: users.rows };
}
