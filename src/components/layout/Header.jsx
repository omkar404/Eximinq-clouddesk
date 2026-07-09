import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { Bell, Maximize2, Plus, Search, Settings2 } from "lucide-react";
import { getWallet } from "../../services/walletService";

function formatHeaderBalance(value) {
  if (value == null) {
    return "--";
  }

  return `Rs. ${Number(value).toLocaleString("en-IN")}`;
}

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [walletBalance, setWalletBalance] = useState(null);

  const isWalletPage = useMemo(
    () => location.pathname === "/client/wallet-credit",
    [location.pathname]
  );

  useEffect(() => {
    if (!isWalletPage) {
      return undefined;
    }

    let isMounted = true;

    getWallet()
      .then((wallet) => {
        if (isMounted) {
          setWalletBalance(wallet?.balance ?? null);
        }
      })
      .catch(() => {
        if (isMounted) {
          setWalletBalance(null);
        }
      });

    const handleWalletUpdated = (event) => {
      if (!isMounted) {
        return;
      }

      setWalletBalance(event.detail?.balance ?? null);
    };

    window.addEventListener("wallet:updated", handleWalletUpdated);

    return () => {
      isMounted = false;
      window.removeEventListener("wallet:updated", handleWalletUpdated);
    };
  }, [isWalletPage]);

  const getTitle = () => {
    const path = location.pathname.split("/").filter(Boolean).pop();

    if (!path) {
      return "Dashboard";
    }

    return path.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-[#fbfcfe] px-3 py-2 backdrop-blur-xl md:px-4">
      <div className="flex items-center justify-between gap-3">
        <div className="hidden min-w-0 md:block">
          <h1 className="truncate text-sm font-semibold text-slate-900">
            {getTitle()}
          </h1>
          <p className="mt-0.5 text-[10px] font-medium text-slate-400">
            Manage your workspace, requests, and balances
          </p>
        </div>

        <div className="mx-auto flex min-w-[220px] max-w-[430px] flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
          <Search size={14} />
          <input
            aria-label="Search"
            placeholder="Search..."
            className="min-w-0 flex-1 bg-transparent text-xs font-medium text-slate-700 outline-none placeholder:text-slate-400"
          />
          <span className="hidden rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-400 sm:inline">
            ⌘ K
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <div className="hidden rounded-lg border border-slate-200 bg-white p-0.5 sm:flex">
            <button
              type="button"
              onClick={() => navigate("/client/wallet-credit")}
              className="rounded-md bg-slate-900 px-2.5 py-1.5 text-[11px] font-bold text-white"
            >
              Wallet
            </button>
            <button
              type="button"
              className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-400"
            >
              Credit Line
            </button>
          </div>

          <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-white py-1 pl-2.5 pr-1.5 lg:flex">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400">
                Balance
              </span>
              <span className="text-[11px] font-bold text-slate-900">
                {isWalletPage ? formatHeaderBalance(walletBalance) : "Rs. 42,500"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate("/client/wallet-credit#add-credit")}
              className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-900 text-white transition-all hover:-translate-y-0.5"
            >
              <Plus size={15} strokeWidth={3} />
            </button>
          </div>

          <button className="hidden h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 md:flex">
            <Settings2 size={14} />
          </button>
          <button className="hidden h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 md:flex">
            <Maximize2 size={14} />
          </button>
          <button className="hidden h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 sm:flex">
            <Bell size={14} />
          </button>

          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-xs font-black text-slate-700">
            {user?.name?.charAt(0).toUpperCase() || "A"}
          </div>
        </div>
      </div>
    </header>
  );
}
