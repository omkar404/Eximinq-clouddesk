import {
  getFinancialAccount,
  listAccountTransactions,
  topUpFinancialAccount
} from "../models/finance.model.js";

export async function getWalletAndCreditLine(userId) {
  const [account, transactionRows] = await Promise.all([
    getFinancialAccount(userId),
    listAccountTransactions(userId)
  ]);
  return {
    balance: Number(account?.balance || 0),
    credit_line: Number(account?.credit_line || 0),
    credit_limit: Number(account?.credit_limit || 0),
    transactions: transactionRows.map((transaction) => ({
      id: transaction.id,
      accountType: transaction.account_type,
      transactionType: transaction.transaction_type,
      amount: Number(transaction.amount),
      balanceAfter: Number(transaction.balance_after),
      description: transaction.description,
      serviceName: transaction.service_name,
      requestCode: transaction.request_code,
      status: transaction.status,
      createdAt: transaction.created_at
    }))
  };
}

export async function addFinancialCredit(userId, accountType, rawAmount) {
  const amount = Number(rawAmount);
  if (!Number.isFinite(amount) || amount <= 0) {
    const error = new Error("Enter a positive top-up amount");
    error.status = 422;
    throw error;
  }

  const transaction = await topUpFinancialAccount(userId, accountType, amount);
  return {
    wallet: await getWalletAndCreditLine(userId),
    transaction: {
      id: transaction.id,
      amount: Number(transaction.amount),
      balanceAfter: Number(transaction.balance_after),
      createdAt: transaction.created_at
    }
  };
}
