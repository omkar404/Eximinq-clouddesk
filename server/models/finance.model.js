import { pool } from "../database/pool.js";

export async function getFinancialAccount(userId) {
  const result = await pool.query(
    `SELECT COALESCE(w.balance, 0)::numeric AS balance,
            COALESCE(c.credit_limit, 0)::numeric AS credit_limit,
            COALESCE(c.available_balance, 0)::numeric AS credit_line
       FROM users u
       LEFT JOIN wallets w ON w.user_id = u.id
       LEFT JOIN corporate_credit_lines c ON c.user_id = u.id
      WHERE u.id = $1`,
    [userId]
  );
  return result.rows[0] || null;
}

export async function topUpFinancialAccount(userId, accountType, amount) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    let balanceAfter;

    if (accountType === "WALLET") {
      const result = await client.query(
        `INSERT INTO wallets(user_id, balance) VALUES($1, $2)
         ON CONFLICT(user_id) DO UPDATE
           SET balance = wallets.balance + EXCLUDED.balance, updated_at = NOW()
         RETURNING balance`,
        [userId, amount]
      );
      balanceAfter = Number(result.rows[0].balance);
    } else {
      const result = await client.query(
        `INSERT INTO corporate_credit_lines(user_id, credit_limit, available_balance)
         VALUES($1, $2, $2)
         ON CONFLICT(user_id) DO UPDATE SET
           credit_limit = corporate_credit_lines.credit_limit + EXCLUDED.credit_limit,
           available_balance = corporate_credit_lines.available_balance + EXCLUDED.available_balance,
           updated_at = NOW()
         RETURNING available_balance`,
        [userId, amount]
      );
      balanceAfter = Number(result.rows[0].available_balance);
    }

    const transactionResult = await client.query(
      `INSERT INTO financial_transactions(
         user_id, account_type, transaction_type, amount, balance_after,
         description, status
       )
       VALUES($1, $2, 'CREDIT', $3, $4, $5, 'SUCCESS')
       RETURNING id, amount, balance_after, created_at`,
      [
        userId,
        accountType,
        amount,
        balanceAfter,
        accountType === "WALLET" ? "Wallet Top-up" : "Credit Line Top-up"
      ]
    );
    await client.query("COMMIT");
    return transactionResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function listAccountTransactions(userId, limit = 100) {
  const result = await pool.query(
    `SELECT ft.id, ft.account_type, ft.transaction_type, ft.amount,
            ft.balance_after, ft.description, ft.status, ft.created_at,
            sr.request_code, sc.name AS service_name
       FROM financial_transactions ft
       LEFT JOIN service_requests sr ON sr.id = ft.service_request_id
       LEFT JOIN service_catalog sc ON sc.slug = ft.service_slug
      WHERE ft.user_id = $1
      ORDER BY ft.created_at DESC, ft.id DESC
      LIMIT $2`,
    [userId, limit]
  );
  return result.rows;
}
