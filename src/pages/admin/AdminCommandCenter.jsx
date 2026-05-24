import {
  DollarSign,
  Users,
  Layers,
  Activity,
  Plus,
  UserCheck,
  Megaphone,
  Upload,
  FileText,
  RefreshCcw,
  AlertTriangle,
  UsersRound,
  ShieldCheck,
  Sparkles
} from "lucide-react";

import KpiCard from "../../components/dashboard/KpiCard";
import ActionCard from "../../components/dashboard/ActionCard";
import QuoteCard from "../../components/dashboard/QuoteCard";
import RecentActivity from "../../components/dashboard/RecentActivity";
import OnboardingNote from "../../components/onboarding/OnboardingNote";

const kpis = [
  {
    icon: <DollarSign size={18} />,
    value: "Rs. 1.2 Cr",
    title: "Revenue",
    subtitle: "+12.5% vs last month",
    button: "View Invoices",
    color: "bg-blue-100 text-blue-600"
  },
  {
    icon: <Users size={18} />,
    value: "8 Online",
    title: "Workforce",
    subtitle: "Avg productivity 94%",
    button: "Track Agents",
    color: "bg-violet-100 text-violet-600"
  },
  {
    icon: <Layers size={18} />,
    value: "3",
    title: "Requests",
    subtitle: "5 critical SLA risks",
    button: "Open Board",
    color: "bg-amber-100 text-amber-600"
  },
  {
    icon: <Activity size={18} />,
    value: "Optimal",
    title: "System Health",
    subtitle: "DGFT API latency 42ms",
    color: "bg-slate-100 text-slate-700"
  }
];

const actions = [
  { icon: <Plus size={18} />, label: "New Request" },
  { icon: <UserCheck size={18} />, label: "Verify Client" },
  { icon: <Megaphone size={18} />, label: "Broadcast" },
  { icon: <Upload size={18} />, label: "Bulk Import" },
  { icon: <FileText size={18} />, label: "Generate Report" },
  { icon: <RefreshCcw size={18} />, label: "Update Rates" },
  { icon: <AlertTriangle size={18} />, label: "System Alert" },
  { icon: <UsersRound size={18} />, label: "Team Meet" }
];

export default function CommandCenter() {
  return (
    <div className="dashboard-page">
      <OnboardingNote />

      <section className="dashboard-hero px-6 py-6 md:px-7">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="dashboard-badge">
              <Sparkles size={14} />
              Admin Operations Suite
            </div>
            <h1 className="mt-4 text-[2.2rem] font-black tracking-[-0.05em] text-slate-900 md:text-[2.7rem]">
              A sharper control room for revenue, teams, and live trade workflows
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
              The command center is now denser and more structured so key metrics, actions,
              and activity stay visible with less vertical travel.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[440px]">
            <div className="rounded-[24px] border border-slate-200 bg-white/80 px-4 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                SLA Watch
              </p>
              <p className="mt-2 text-xl font-black tracking-[-0.04em] text-slate-900">
                05 Cases
              </p>
              <p className="mt-1 text-xs text-slate-500">Needs same-day intervention</p>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-white/80 px-4 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                Escalations
              </p>
              <p className="mt-2 text-xl font-black tracking-[-0.04em] text-slate-900">
                02 Open
              </p>
              <p className="mt-1 text-xs text-slate-500">Legal and customs priority</p>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#17326f_0%,#101c42_100%)] px-4 py-4 text-white shadow-[0_16px_32px_rgba(16,28,66,0.18)]">
              <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-blue-100">
                <ShieldCheck size={14} />
                Assurance
              </div>
              <p className="mt-2 text-xl font-black tracking-[-0.04em]">94%</p>
              <p className="mt-1 text-xs text-blue-100/80">Compliance confidence score</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => (
          <KpiCard key={item.title} {...item} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_360px]">
        <div className="dashboard-panel p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                Quick Actions
              </p>
              <h2 className="mt-1 text-xl font-black tracking-[-0.03em] text-slate-900">
                Command Center Actions
              </h2>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
              8 shortcuts
            </span>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {actions.map((action) => (
              <ActionCard key={action.label} {...action} />
            ))}
          </div>
        </div>

        <div className="dashboard-panel p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                Sales Queue
              </p>
              <h2 className="mt-1 text-xl font-black tracking-[-0.03em] text-slate-900">
                Pending Quotes
              </h2>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-[#2952ff]">
              2 warm leads
            </span>
          </div>

          <div className="mt-5 space-y-3">
            <QuoteCard
              title="Global Traders"
              desc="AEO T2 Certification | Rs. 50,000"
            />
            <QuoteCard
              title="Acme Exports"
              desc="Legal Reply (High Court) | Rs. 75,000"
            />
          </div>
        </div>
      </section>

      <RecentActivity />
    </div>
  );
}
