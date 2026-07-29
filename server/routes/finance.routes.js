import { Router } from "express";
import {
  addCreditLineCredit,
  addWalletCredit,
  getWallet
} from "../controllers/finance.controller.js";

export function createFinanceRouter({ requireAuth }) {
  const router = Router();
  router.use(requireAuth);
  router.get("/", getWallet);
  router.post("/add-credit", addWalletCredit);
  router.post("/credit-line/add-credit", addCreditLineCredit);
  return router;
}
