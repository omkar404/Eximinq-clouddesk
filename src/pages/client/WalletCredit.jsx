import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CircleDollarSign,
  Plus,
  WalletCards,
  X
} from "lucide-react";
import Swal from "sweetalert2";
import { addWalletCredit, getWallet } from "../../services/walletService";

const QUICK_AMOUNTS = [1000, 15000, 20000, 25000];

function formatCurrency(value) {
  if (value == null) {
    return "--";
  }

  return `Rs. ${Number(value).toLocaleString("en-IN")}`;
}

function formatCredits(value) {
  if (value == null) {
    return "--";
  }

  return `${Number(value).toLocaleString("en-IN")} Credits`;
}

export default function WalletCredit() {
  const location = useLocation();
  const [wallet, setWallet] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddCreditOpen, setIsAddCreditOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [lastTopUp, setLastTopUp] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadWallet() {
      try {
        const data = await getWallet();

        if (!isMounted) {
          return;
        }

        setWallet(data);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        Swal.fire({
          icon: "error",
          title: "Unable to load wallet",
          text: error.response?.data?.message || "Please refresh and try again.",
          confirmButtonColor: "#2952ff"
        });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadWallet();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (location.hash === "#add-credit") {
      setIsAddCreditOpen(true);
    }
  }, [location.hash]);

  useEffect(() => {
    if (!wallet) {
      return;
    }

    window.dispatchEvent(
      new CustomEvent("wallet:updated", {
        detail: {
          balance: wallet.balance,
          creditLine: wallet.credit_line ?? null
        }
      })
    );
  }, [wallet]);

  const walletBalance = wallet?.balance ?? null;
  const creditLineBalance = wallet?.credit_line ?? null;

  const usageSummary = useMemo(() => {
    if (walletBalance == null) {
      return "--";
    }

    return walletBalance === 0 ? "Rs. 0" : "No usage tracked yet";
  }, [walletBalance]);

  const handlePresetClick = (presetAmount) => {
    setAmount(String(presetAmount));
  };

  const handleCloseAddCredit = () => {
    setIsAddCreditOpen(false);

    if (window.location.hash === "#add-credit") {
      window.history.replaceState(null, "", window.location.pathname);
    }
  };

  const handleAddCredit = async (event) => {
    event.preventDefault();

    const parsedAmount = Number.parseInt(amount, 10);

    if (!Number.isInteger(parsedAmount) || parsedAmount <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Enter a valid amount",
        text: "Please enter a positive amount to add wallet credit.",
        confirmButtonColor: "#2952ff"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await addWalletCredit(parsedAmount);
      setWallet(response.wallet);
      setLastTopUp({
        amount: response.transaction?.amount ?? parsedAmount,
        createdAt: response.transaction?.createdAt ?? new Date().toISOString()
      });
      setAmount("");
      handleCloseAddCredit();

      Swal.fire({
        icon: "success",
        title: "Credit added",
        text: `${formatCurrency(parsedAmount)} has been added to the wallet.`,
        confirmButtonColor: "#2952ff"
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Unable to add credit",
        text: error.response?.data?.message || "Please try again.",
        confirmButtonColor: "#2952ff"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_380px] 2xl:min-h-[calc(100vh-11.5rem)]">
        <div className="grid gap-5">
          <div
            id="wallet-overview"
            className="overflow-hidden rounded-[34px] bg-[linear-gradient(135deg,#16233e_0%,#253965_100%)] p-6 text-white shadow-[0_28px_60px_rgba(15,23,42,0.18)] md:p-7"
          >
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-sm font-bold text-blue-100/90">Total Available Balance</p>
                <div className="mt-3 flex flex-wrap items-end gap-3">
                  <h2 className="text-[2.4rem] font-black tracking-[-0.06em] md:text-[3rem]">
                    {isLoading ? "..." : formatCredits(walletBalance)}
                  </h2>
                </div>
                <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100/70">
                  Add prepaid credits here before using paid services. Credit Line will stay empty until that workflow is implemented.
                </p>
              </div>

              <div className="flex h-18 w-18 items-center justify-center rounded-[24px] border border-white/10 bg-white/8 text-[#67a3ff] shadow-inner shadow-white/5 md:h-20 md:w-20">
                <WalletCards size={36} strokeWidth={1.9} />
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setIsAddCreditOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#3165ff] px-6 py-3.5 text-base font-black text-white shadow-[0_14px_28px_rgba(49,101,255,0.3)] transition-all hover:-translate-y-0.5 hover:bg-[#2857ea]"
              >
                <Plus size={19} strokeWidth={2.7} />
                Add Credit
              </button>

              <button
                type="button"
                disabled
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/10 px-6 py-3.5 text-base font-bold text-white/65"
              >
                Statement
              </button>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
            <div className="rounded-[34px] border border-slate-200 bg-white p-5 shadow-[0_18px_46px_rgba(15,23,42,0.06)] md:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">
                    Wallet Top-Up
                  </p>
                  <h3 className="mt-2 text-[1.7rem] font-black tracking-[-0.05em] text-slate-900">
                    Add prepaid balance fast
                  </h3>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                    Use any preset to auto-fill the amount, or type a custom value before confirming.
                  </p>
                </div>

                <button
                  id="add-credit"
                  type="button"
                  onClick={() => setIsAddCreditOpen(true)}
                  className="hidden rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100 md:inline-flex"
                >
                  Open Form
                </button>
              </div>

              <div className="mt-5 rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#fbfcff_0%,#f6f9ff_100%)] p-4">
                <div className="flex flex-wrap gap-2.5">
                  {QUICK_AMOUNTS.map((presetAmount) => (
                    <button
                      key={presetAmount}
                      type="button"
                      onClick={() => {
                        handlePresetClick(presetAmount);
                        setIsAddCreditOpen(true);
                      }}
                      className="rounded-full border border-[#d8e4ff] bg-white px-4 py-2 text-sm font-black text-[#2952ff] shadow-[0_8px_20px_rgba(41,82,255,0.08)] transition-all hover:-translate-y-0.5 hover:border-[#b7cbff]"
                    >
                      {formatCurrency(presetAmount)}
                    </button>
                  ))}
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                  <label className="block">
                    <span className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
                      Manual Amount
                    </span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={amount}
                      onChange={(event) => setAmount(event.target.value)}
                      onFocus={() => setIsAddCreditOpen(true)}
                      placeholder="Enter amount"
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-900 outline-none transition-all focus:border-[#2952ff] focus:ring-4 focus:ring-[#2952ff]/10"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => setIsAddCreditOpen(true)}
                    className="mt-[1.45rem] inline-flex items-center justify-center rounded-2xl bg-[#2952ff] px-6 py-3 text-sm font-black text-white shadow-[0_14px_28px_rgba(41,82,255,0.22)] transition-all hover:-translate-y-0.5 hover:bg-[#1f46e5]"
                  >
                    Add Credit
                  </button>
                </div>
              </div>
            </div>

            <div className="grid gap-5">
              <MetricCard
                icon={ArrowDownLeft}
                iconClassName="bg-emerald-50 text-emerald-600"
                label="Last Top-up"
                value={lastTopUp ? formatCurrency(lastTopUp.amount) : "--"}
                meta={
                  lastTopUp
                    ? new Date(lastTopUp.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                      })
                    : "No top-up added yet"
                }
              />

              <div
                id="credit-line"
                className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_18px_46px_rgba(15,23,42,0.06)] md:p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">
                      Credit Line
                    </p>
                    <h3 className="mt-2 text-[1.55rem] font-black tracking-[-0.05em] text-slate-900">
                      Next phase
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      This section stays visible in the same screen, but the workflow will be implemented later.
                    </p>
                  </div>

                  <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#f4ecff] text-[#6a2fb1]">
                    <CircleDollarSign size={26} strokeWidth={1.9} />
                  </div>
                </div>

                <div className="mt-5 rounded-[26px] bg-[linear-gradient(135deg,#53208d_0%,#6a2fb1_100%)] p-5 text-white shadow-[0_24px_50px_rgba(83,32,141,0.2)]">
                  <p className="text-sm font-bold text-violet-100/85">Available Credit Line</p>
                  <p className="mt-2 text-[2.1rem] font-black tracking-[-0.06em]">
                    {formatCredits(creditLineBalance)}
                  </p>
                  <p className="mt-3 text-sm text-violet-100/75">Used: -- / Total Limit: --</p>
                </div>
              </div>

              <MetricCard
                icon={ArrowUpRight}
                iconClassName="bg-rose-50 text-rose-500"
                label="Usage (This Month)"
                value={usageSummary}
                meta="Usage tracking will be connected with transaction history."
              />
            </div>
          </div>
        </div>
      </section>

      {isAddCreditOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/35 px-4 py-6 backdrop-blur-[2px] md:items-center">
          <div className="w-full max-w-xl rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_32px_80px_rgba(15,23,42,0.2)] md:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">
                  Add Credit
                </p>
                <h4 className="mt-2 text-[1.9rem] font-black tracking-[-0.05em] text-slate-900">
                  Top up your wallet
                </h4>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Choose a quick amount or enter a custom value manually.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseAddCredit}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <form className="mt-7 space-y-6" onSubmit={handleAddCredit}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {QUICK_AMOUNTS.map((presetAmount) => (
                  <button
                    key={presetAmount}
                    type="button"
                    onClick={() => handlePresetClick(presetAmount)}
                    className={`rounded-2xl border px-4 py-3 text-sm font-black transition-all ${
                      amount === String(presetAmount)
                        ? "border-[#2952ff] bg-[#2952ff] text-white shadow-[0_16px_26px_rgba(41,82,255,0.22)]"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:border-[#c8d6ff] hover:bg-white"
                    }`}
                  >
                    {formatCurrency(presetAmount)}
                  </button>
                ))}
              </div>

              <label className="block">
                <span className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
                  Amount
                </span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="Enter amount"
                  className="mt-2 w-full rounded-[22px] border border-slate-200 bg-white px-4 py-4 text-lg font-semibold text-slate-900 outline-none transition-all focus:border-[#2952ff] focus:ring-4 focus:ring-[#2952ff]/10"
                />
              </label>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleCloseAddCredit}
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center rounded-2xl bg-[#2952ff] px-6 py-3.5 text-sm font-black text-white shadow-[0_16px_28px_rgba(41,82,255,0.24)] transition-all hover:bg-[#2149ea] disabled:cursor-not-allowed disabled:bg-[#b7c8ff]"
                >
                  {isSubmitting ? "Adding..." : "Confirm Credit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MetricCard({ icon: Icon, iconClassName, label, value, meta }) {
  return (
    <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_18px_46px_rgba(15,23,42,0.06)] md:p-6">
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconClassName}`}>
        <Icon size={20} />
      </div>
      <p className="mt-4 text-sm font-bold text-[#57729c]">{label}</p>
      <p className="mt-3 text-[2rem] font-black tracking-[-0.05em] text-slate-900">{value}</p>
      <p className="mt-2 text-sm text-slate-400">{meta}</p>
    </div>
  );
}
