import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { Plus } from "lucide-react";
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
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 px-5 py-3 backdrop-blur-xl md:px-6">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">
            Dashboard Workspace
          </p>
          <h1 className="mt-1 truncate text-[1.5rem] font-black tracking-[-0.04em] text-slate-900 md:text-[1.7rem]">
            {getTitle()}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex rounded-2xl border border-slate-200 bg-white p-1 shadow-[0_8px_22px_rgba(15,23,42,0.05)]">
            <button
              type="button"
              onClick={() => navigate("/client/wallet-credit")}
              className="rounded-xl bg-[#1f4fff] px-4 py-1.5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(31,79,255,0.22)]"
            >
              Wallet
            </button>
            <button
              type="button"
              className="px-4 py-1.5 text-sm font-semibold text-slate-400"
            >
              Credit Line
            </button>
          </div>

          <div className="flex items-center gap-3 rounded-[22px] border border-[#d8e4ff] bg-[linear-gradient(135deg,#f8fbff_0%,#eef4ff_100%)] pl-3 pr-1.5 py-1.5 shadow-[0_10px_24px_rgba(31,79,255,0.06)]">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#7f96d1]">
                Balance
              </span>
              <span className="text-sm font-black text-[#1f4fff]">
                {isWalletPage ? formatHeaderBalance(walletBalance) : "Rs. 42,500"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate("/client/wallet-credit#add-credit")}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1f4fff] text-white shadow-[0_8px_18px_rgba(31,79,255,0.22)] transition-all hover:-translate-y-0.5 hover:bg-[#173fd7]"
            >
              <Plus size={17} strokeWidth={3} />
            </button>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white bg-white text-sm font-black text-slate-600 shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
            {user?.name?.charAt(0).toUpperCase() || "A"}
          </div>
        </div>
      </div>
    </header>
  );
}
