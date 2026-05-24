import { createElement } from "react";
import {
  BriefcaseBusiness,
  Clock3,
  FileCheck2,
  ShieldCheck,
  Sparkles,
  ArrowUpRight
} from "lucide-react";
import OnboardingNote from "../../components/onboarding/OnboardingNote";

const stats = [
  {
    label: "Active Requests",
    value: "06",
    meta: "2 awaiting documents",
    icon: BriefcaseBusiness
  },
  {
    label: "Compliance Health",
    value: "92%",
    meta: "Strong filing hygiene",
    icon: ShieldCheck
  },
  {
    label: "Open Tasks",
    value: "11",
    meta: "3 need review today",
    icon: Clock3
  },
  {
    label: "Recent Filings",
    value: "24",
    meta: "Processed this month",
    icon: FileCheck2
  }
];

export default function ClientCommandCenter() {
  return (
    <div className="dashboard-page">
      <OnboardingNote />

      <section className="dashboard-hero px-6 py-6 md:px-7">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="dashboard-badge">
              <Sparkles size={14} />
              Client Command Center
            </div>
            <h1 className="mt-4 text-[2.1rem] font-black tracking-[-0.05em] text-slate-900 md:text-[2.55rem]">
              Track filings, requests, and compliance progress without losing screen space
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
              Your workspace is condensed into a cleaner overview so active work, risk, and
              momentum remain visible above the fold.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[360px]">
            <div className="rounded-[24px] border border-slate-200 bg-white/85 px-4 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                Priority Focus
              </p>
              <p className="mt-2 text-xl font-black tracking-[-0.04em] text-slate-900">
                COO Filing
              </p>
              <p className="mt-1 text-xs text-slate-500">Documentation aligned for submission</p>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#17326f_0%,#101c42_100%)] px-4 py-4 text-white shadow-[0_16px_32px_rgba(16,28,66,0.18)]">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-100">
                Next Milestone
              </p>
              <p className="mt-2 text-xl font-black tracking-[-0.04em]">3 Reviews</p>
              <p className="mt-1 text-xs text-blue-100/80">Expected within 48 hours</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, meta, icon }) => (
          <div
            key={label}
            className="dashboard-panel group p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_46px_rgba(15,23,42,0.08)]"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                {label}
              </span>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef3ff] text-[#2952ff]">
                {createElement(icon, { size: 18 })}
              </div>
            </div>

            <p className="mt-5 text-[2rem] font-black tracking-[-0.05em] text-slate-900">
              {value}
            </p>
            <p className="mt-2 text-sm text-slate-500">{meta}</p>

            <button className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-bold text-slate-700 transition hover:border-slate-300 hover:bg-white">
              View details
              <ArrowUpRight size={14} />
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}
