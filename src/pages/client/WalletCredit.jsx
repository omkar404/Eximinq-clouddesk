import { useEffect, useMemo, useState } from "react";
import { createElement } from "react";
import { useLocation } from "react-router-dom";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Download,
  Filter,
  Plus,
  ReceiptText,
  WalletCards,
  X
} from "lucide-react";
import Swal from "sweetalert2";
import {
  addCreditLineCredit,
  addWalletCredit,
  getWallet
} from "../../services/walletService";

const QUICK_AMOUNTS = [1000, 5000, 10000, 25000, 50000];

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })}`;
}

function nextBillingDate() {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 5);
  return next.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function MetricCard({ icon: Icon, label, value, meta, tone = "emerald" }) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-600",
    rose: "bg-rose-50 text-rose-500",
    violet: "bg-violet-50 text-violet-600"
  };

  return (
    <article className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,.05)]">
      <div className="flex items-center gap-3">
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${tones[tone]}`}>
          {createElement(Icon, { size: 20 })}
        </span>
        <p className="text-sm font-semibold text-slate-500">{label}</p>
      </div>
      <p className="mt-4 text-2xl font-black tracking-[-0.04em] text-slate-900">{value}</p>
      <p className="mt-1 text-xs font-medium text-slate-400">{meta}</p>
    </article>
  );
}

export default function WalletCredit() {
  const location = useLocation();
  const [activeAccount, setActiveAccount] = useState(
    location.hash === "#credit-line" ? "CREDIT_LINE" : "WALLET"
  );
  const [account, setAccount] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadAccount = async () => {
    const data = await getWallet();
    setAccount(data);
    return data;
  };

  useEffect(() => {
    let mounted = true;
    getWallet()
      .then((data) => {
        if (mounted) setAccount(data);
      })
      .catch((error) => {
        if (!mounted) return;
        Swal.fire({
          icon: "error",
          title: "Unable to load balances",
          text: error.response?.data?.message || "Please refresh and try again.",
          confirmButtonColor: "#2952ff"
        });
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setActiveAccount(location.hash === "#credit-line" ? "CREDIT_LINE" : "WALLET");
    if (location.hash === "#add-credit") {
      setIsTopUpOpen(true);
    }
  }, [location.hash]);

  useEffect(() => {
    if (!account) return;
    window.dispatchEvent(
      new CustomEvent("wallet:updated", {
        detail: {
          balance: account.balance,
          creditLine: account.credit_line
        }
      })
    );
  }, [account]);

  const transactions = useMemo(
    () =>
      (account?.transactions || []).filter(
        (transaction) => transaction.accountType === activeAccount
      ),
    [account?.transactions, activeAccount]
  );

  const currentMonthUsage = useMemo(() => {
    const now = new Date();
    return transactions
      .filter((transaction) => {
        const date = new Date(transaction.createdAt);
        return (
          transaction.transactionType === "DEBIT" &&
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );
      })
      .reduce((total, transaction) => total + transaction.amount, 0);
  }, [transactions]);

  const lastTopUp = transactions.find(
    (transaction) => transaction.transactionType === "CREDIT"
  );
  const isWallet = activeAccount === "WALLET";
  const availableBalance = isWallet ? account?.balance : account?.credit_line;
  const totalLimit = Number(account?.credit_limit || 0);
  const creditUsed = Math.max(0, totalLimit - Number(account?.credit_line || 0));

  const openTopUp = () => {
    setAmount("");
    setIsTopUpOpen(true);
  };

  const handleTopUp = async (event) => {
    event.preventDefault();
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Enter a valid amount",
        text: "Top-up amount must be greater than zero.",
        confirmButtonColor: "#2952ff"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      if (isWallet) {
        await addWalletCredit(parsedAmount);
      } else {
        await addCreditLineCredit(parsedAmount);
      }
      await loadAccount();
      setIsTopUpOpen(false);
      setAmount("");
      Swal.fire({
        icon: "success",
        title: `${isWallet ? "Wallet" : "Credit Line"} updated`,
        text: `${formatCurrency(parsedAmount)} has been added successfully.`,
        confirmButtonColor: "#2952ff"
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Top-up failed",
        text: error.response?.data?.message || "Please try again.",
        confirmButtonColor: "#2952ff"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dashboard-page">
      <div>
        <div>
          <p className="premium-kicker">Financial workspace</p>
          <h1 className="mt-1 text-2xl font-black tracking-[-0.04em] text-slate-950">
            Wallet & Credit Line
          </h1>
        </div>
      </div>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,.8fr)]">
        <article
          className={`relative min-h-[310px] overflow-hidden rounded-[26px] p-7 text-white shadow-[0_24px_55px_rgba(15,23,42,.18)] ${
            isWallet
              ? "bg-[linear-gradient(135deg,#101a30_0%,#20365d_100%)]"
              : "bg-[linear-gradient(135deg,#63209a_0%,#3d2a84_100%)]"
          }`}
        >
          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/8 blur-2xl" />
          <div className="relative flex items-start justify-between gap-6">
            <div>
              <p className="text-sm font-semibold text-white/65">
                {isWallet ? "Total Available Balance" : "Available Credit Limit"}
              </p>
              <p className="mt-3 text-4xl font-black tracking-[-0.05em] md:text-5xl">
                {isLoading ? "..." : formatCurrency(availableBalance)}
                <span className="ml-2 text-base font-bold text-white/55">Credits</span>
              </p>
              {!isWallet ? (
                <p className="mt-3 text-sm font-semibold text-white/70">
                  Used: {formatCurrency(creditUsed)} / Total Limit: {formatCurrency(totalLimit)}
                </p>
              ) : null}
            </div>
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-blue-300">
              {isWallet ? <WalletCards size={31} /> : <CreditCard size={31} />}
            </span>
          </div>

          <div className="relative mt-10 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={openTopUp}
              className={`inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-black text-white shadow-lg ${
                isWallet ? "bg-[#2f66f3]" : "bg-[#a84df4]"
              }`}
            >
              {isWallet ? <Plus size={18} /> : <CheckCircle2 size={18} />}
              {isWallet ? "Add Credits" : "Top Up Credit Line"}
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-6 py-3 text-sm font-bold text-white/85"
            >
              <Download size={17} />
              Statement
            </button>
          </div>
        </article>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <MetricCard
            icon={isWallet ? ArrowDownLeft : CalendarDays}
            label={isWallet ? "Last Top-up" : "Next Bill Date"}
            value={
              isWallet
                ? lastTopUp
                  ? formatCurrency(lastTopUp.amount)
                  : "--"
                : nextBillingDate()
            }
            meta={
              isWallet
                ? lastTopUp
                  ? new Date(lastTopUp.createdAt).toLocaleDateString("en-IN")
                  : "No top-up recorded"
                : "Billing Cycle: 5th Monthly"
            }
            tone={isWallet ? "emerald" : "violet"}
          />
          <MetricCard
            icon={ArrowUpRight}
            label="Usage (This Month)"
            value={formatCurrency(currentMonthUsage)}
            meta={`${transactions.filter((item) => item.transactionType === "DEBIT").length} transactions`}
            tone="rose"
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,.05)]">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <p className="premium-kicker">{isWallet ? "Wallet" : "Credit line"}</p>
            <h2 className="mt-1 text-lg font-black text-slate-900">
              {isWallet ? "Wallet Passbook" : "Credit Line Statement"}
            </h2>
          </div>
          <div className="flex gap-2 text-slate-400">
            <Filter size={18} />
            <CalendarDays size={18} />
          </div>
        </div>
        <div className="max-h-[310px] overflow-auto custom-scrollbar">
          <table className="w-full min-w-[850px] table-fixed text-left text-xs">
            <thead className="sticky top-0 z-10 bg-slate-50 text-[10px] font-black uppercase tracking-[.08em] text-slate-500">
              <tr>
                <th className="px-6 py-4">Transaction ID</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Balance After</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="border-t border-slate-100 hover:bg-slate-50/80">
                  <td className="px-6 py-4 font-mono font-bold text-slate-500">TX-{transaction.id}</td>
                  <td className="px-6 py-4 text-slate-600">
                    {new Date(transaction.createdAt).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-800">
                    {transaction.description || transaction.serviceName}
                  </td>
                  <td className={`px-6 py-4 font-black ${
                    transaction.transactionType === "DEBIT" ? "text-rose-600" : "text-emerald-600"
                  }`}>
                    {transaction.transactionType === "DEBIT" ? "−" : "+"}{formatCurrency(transaction.amount)}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-700">{formatCurrency(transaction.balanceAfter)}</td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-bold text-emerald-700">
                      {transaction.status}
                    </span>
                  </td>
                </tr>
              ))}
              {!transactions.length ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-sm text-slate-400">
                    No {isWallet ? "Wallet" : "Credit Line"} transactions yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {isTopUpOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleTopUp}
            className="w-full max-w-md rounded-[28px] border border-white bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="premium-kicker">Add balance</p>
                <h2 className="mt-2 text-xl font-black text-slate-900">
                  Top up {isWallet ? "Wallet" : "Credit Line"}
                </h2>
              </div>
              <button type="button" onClick={() => setIsTopUpOpen(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {QUICK_AMOUNTS.map((quickAmount) => (
                <button
                  key={quickAmount}
                  type="button"
                  onClick={() => setAmount(String(quickAmount))}
                  className="rounded-full border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-bold text-[#2952ff]"
                >
                  {formatCurrency(quickAmount)}
                </button>
              ))}
            </div>
            <label className="mt-5 block">
              <span className="text-xs font-bold text-slate-700">Amount</span>
              <div className="relative mt-2">
                <ReceiptText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="Enter top-up amount"
                  className="w-full rounded-2xl border border-slate-200 py-3.5 pl-11 pr-4 text-sm font-semibold"
                  autoFocus
                />
              </div>
            </label>
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 w-full rounded-2xl bg-[#2952ff] py-3.5 text-sm font-black text-white disabled:opacity-60"
            >
              {isSubmitting ? "Processing..." : `Top up ${isWallet ? "Wallet" : "Credit Line"}`}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
