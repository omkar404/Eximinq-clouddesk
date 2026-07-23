import { Link, useLocation } from "react-router-dom";
import { LockKeyhole, Sparkles, ArrowRight } from "lucide-react";
import { useAuth } from "../context/useAuth";

function humanizePathname(pathname) {
  const segment = pathname.split("/").filter(Boolean).pop() || "page";
  return segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function MenuPlaceholder() {
  const location = useLocation();
  const { onboarding } = useAuth();
  const title = humanizePathname(location.pathname);
  const formIncomplete = onboarding?.companyProfileCompleted !== true;
  const approvalPending = onboarding?.profileApprovalStatus === "submitted";

  return (
    <div className="dashboard-page">
      <div className="dashboard-hero relative overflow-hidden p-6 md:p-9">
      <div className="absolute -right-10 -top-14 h-48 w-48 rounded-full bg-blue-300/20 blur-3xl" />
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-[#eef3ff] text-[#101eb9] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
          <Sparkles size={24} />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
            Workspace Section
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-900">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
            Your dedicated {title.toLowerCase()} workspace is ready for connected data and operational tools.
          </p>
        </div>
      </div>

      {formIncomplete || approvalPending ? (
        <div className="mt-8 rounded-[28px] border border-amber-200/80 bg-[linear-gradient(180deg,#fffaf0_0%,#fff6dd_100%)] p-5 shadow-[0_12px_26px_rgba(217,119,6,0.08)]">
          {formIncomplete ? (
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <LockKeyhole size={18} className="mt-0.5 text-amber-700" />
                <div>
                  <p className="text-sm font-semibold text-amber-900">
                    Complete your Quick Form to unlock actions across the portal
                  </p>
                  <p className="mt-1 text-sm text-amber-800">
                    You can explore every section right now, but submissions and edits stay
                    locked until the setup form is finished.
                  </p>
                </div>
              </div>
              <Link
                to="/client/company-profile-setup"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#101eb9] px-5 py-3 text-sm font-bold text-white shadow-[0_16px_30px_rgba(16,30,185,0.22)]"
              >
                Complete Quick Form
                <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <LockKeyhole size={18} className="mt-0.5 text-amber-700" />
              <div>
                <p className="text-sm font-semibold text-amber-900">
                  Admin approval is still pending
                </p>
                <p className="mt-1 text-sm text-amber-800">
                  This section is visible in read-only mode while your submitted form is under
                  review.
                </p>
              </div>
            </div>
          )}
        </div>
      ) : null}
      </div>
      <section className="grid gap-4 md:grid-cols-3">
        {["Workspace overview", "Recent activity", "Smart recommendations"].map((label, index) => (
          <article key={label} className="premium-metric min-h-40 p-5">
            <p className="premium-kicker">0{index + 1}</p>
            <h2 className="mt-3 text-base font-bold text-slate-900">{label}</h2>
            <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-gradient-to-r from-[#3157ff] to-[#60a5fa]" style={{ width: `${48 + index * 17}%` }} />
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">Connect this module to begin seeing live operational insights.</p>
          </article>
        ))}
      </section>
    </div>
  );
}
