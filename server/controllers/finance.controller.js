import {
  addFinancialCredit,
  getWalletAndCreditLine
} from "../services/finance.service.js";

export async function getWallet(req, res, next) {
  try {
    res.json(await getWalletAndCreditLine(req.user.id));
  } catch (error) {
    next(error);
  }
}

export async function addWalletCredit(req, res, next) {
  try {
    res.json(await addFinancialCredit(req.user.id, "WALLET", req.body.amount));
  } catch (error) {
    next(error);
  }
}

export async function addCreditLineCredit(req, res, next) {
  try {
    res.json(await addFinancialCredit(req.user.id, "CREDIT_LINE", req.body.amount));
  } catch (error) {
    next(error);
  }
}
