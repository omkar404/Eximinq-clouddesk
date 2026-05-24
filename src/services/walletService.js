import api from "./interceptor";

export async function getWallet() {
  const { data } = await api.get("/auth/wallet");
  return data;
}

export async function addWalletCredit(amount) {
  const { data } = await api.post("/auth/wallet/add-credit", { amount });
  return data;
}
