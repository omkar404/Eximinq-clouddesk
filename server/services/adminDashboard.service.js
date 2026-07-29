import { selectAdminDashboard } from "../models/adminDashboard.model.js";

export async function getAdminDashboard() {
  const data = await selectAdminDashboard();
  const moneyIn = Number(data.summary.money_in);
  const moneyOut = Number(data.summary.money_out);
  return {
    summary: {
      moneyIn, moneyOut, netChange: moneyIn - moneyOut,
      activeClients: Number(data.summary.active_clients),
      activeAgents: Number(data.summary.active_agents),
      activeRequests: Number(data.summary.active_requests),
      actionRequired: Number(data.summary.action_required)
    },
    transactions: data.transactions.map((row) => ({
      id: row.id, date: row.created_at, description: row.description,
      clientName: row.client_name, clientCode: row.user_code,
      requestCode: row.request_code, serviceName: row.service_name,
      accountType: row.account_type, type: row.transaction_type,
      amount: Number(row.amount), balanceAfter: Number(row.balance_after), status: row.status
    })),
    recentRequests: data.requests.map((row) => ({
      id: row.id, requestCode: row.request_code, status: row.status,
      submittedAt: row.submitted_at, clientName: row.client_name, serviceName: row.service_name
    })),
    generatedAt: new Date().toISOString()
  };
}
