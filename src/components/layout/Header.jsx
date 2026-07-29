import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { Bell, Menu, Plus, Search, Sparkles } from "lucide-react";
import { getWallet } from "../../services/walletService";

function formatHeaderBalance(value) {
  if (value == null) {
    return "--";
  }

  return `Rs. ${Number(value).toLocaleString("en-IN")}`;
}

export default function Header({ onOpenSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [walletBalance, setWalletBalance] = useState(null);
  const [creditLineBalance, setCreditLineBalance] = useState(null);
  const isCreditLineActive =
    location.pathname === "/client/wallet-credit" &&
    location.hash === "#credit-line";

  useEffect(() => {
    if (user?.role !== "CLIENT") {
      return undefined;
    }

    let isMounted = true;

    getWallet()
      .then((wallet) => {
        if (isMounted) {
          setWalletBalance(wallet?.balance ?? null);
          setCreditLineBalance(wallet?.credit_line ?? null);
        }
      })
      .catch(() => {
        if (isMounted) {
          setWalletBalance(null);
          setCreditLineBalance(null);
        }
      });

    const handleWalletUpdated = (event) => {
      if (!isMounted) {
        return;
      }

      setWalletBalance(event.detail?.balance ?? null);
      setCreditLineBalance(event.detail?.creditLine ?? null);
    };

    window.addEventListener("wallet:updated", handleWalletUpdated);

    return () => {
      isMounted = false;
      window.removeEventListener("wallet:updated", handleWalletUpdated);
    };
  }, [user?.role]);

  const getTitle = () => {
    const path = location.pathname.split("/").filter(Boolean).pop();

    if (!path) {
      return "Dashboard";
    }

    return path.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <header className="premium-header sticky top-0 z-20 px-3 py-3 md:px-5">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onOpenSidebar}
          aria-label="Open navigation"
          className="premium-icon-button md:hidden"
        >
          <Menu size={18} />
        </button>

        <div className="hidden min-w-0 md:block">
          <p className="premium-kicker">CloudDesk workspace</p>
          <h1 className="mt-1 truncate text-base font-bold tracking-[-0.02em] text-slate-950">
            {getTitle()}
          </h1>
        </div>

        <div className="premium-search mx-auto flex min-w-0 max-w-[460px] flex-1 items-center gap-2.5 px-3.5 py-2.5 text-slate-400">
          <Search size={15} />
          <input
            aria-label="Search"
            placeholder="Search requests, clients, documents…"
            className="min-w-0 flex-1 border-0 bg-transparent p-0 text-xs font-medium text-slate-700 outline-none placeholder:text-slate-400"
          />
          <span className="hidden rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-400 sm:inline">
            ⌘ K
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <div className="hidden rounded-xl border border-slate-200/80 bg-slate-100/70 p-1 lg:flex">
            <button
              type="button"
              onClick={() => navigate("/client/wallet-credit")}
              className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition ${
                isCreditLineActive
                  ? "text-slate-500 hover:text-slate-800"
                  : "bg-slate-950 text-white shadow-sm"
              }`}
            >
              Wallet
            </button>
            <button
              type="button"
              onClick={() => navigate("/client/wallet-credit#credit-line")}
              title={`Available credit: ${formatHeaderBalance(creditLineBalance)}`}
              className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition ${
                isCreditLineActive
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Credit Line
            </button>
          </div>

          <div className="hidden items-center gap-2 rounded-xl border border-slate-200/80 bg-white/90 py-1 pl-3 pr-1.5 shadow-sm xl:flex">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400">
                Balance
              </span>
              <span className="text-[11px] font-bold text-slate-900">
                {user?.role === "CLIENT" ? formatHeaderBalance(walletBalance) : "--"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate("/client/wallet-credit#add-credit")}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#3157ff] to-[#1831c9] text-white transition-all hover:-translate-y-0.5"
            >
              <Plus size={15} strokeWidth={3} />
            </button>
          </div>

          <button className="premium-icon-button relative hidden sm:flex" aria-label="Notifications">
            <Bell size={14} />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-emerald-400 ring-2 ring-white" />
          </button>

          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#172554] to-[#3157ff] text-xs font-black text-white shadow-[0_8px_18px_rgba(49,87,255,.22)]">
            {user?.name?.charAt(0).toUpperCase() || "A"}
          </div>
          <Sparkles size={14} className="hidden text-[#3157ff] xl:block" />
        </div>
      </div>
    </header>
  );
}
