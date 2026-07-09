import { Clock3, MoveRight } from "lucide-react";

const activities = [
  {
    id: "REQ-2025-1008",
    title: "Advance Auth Closure",
    company: "Acme Exports",
    status: "Needs Clarification"
  },
  {
    id: "REQ-2025-1001",
    title: "EPCG License",
    company: "Acme Exports",
    status: "Approval Pending"
  },
  {
    id: "REQ-2025-1009",
    title: "Certificate of Origin",
    company: "Global Traders",
    status: "Completed"
  },
  {
    id: "REQ-2025-1015",
    title: "Legal Reply (SCN)",
    company: "Acme Exports",
    status: "Completed"
  }
];

const statusClasses = {
  Completed: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
  "Approval Pending": "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
  "Needs Clarification": "bg-amber-50 text-amber-700 ring-1 ring-amber-100"
};

export default function RecentActivity() {
  return (
    <section className="dashboard-panel dashboard-scroll-panel flex flex-col overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eef3ff] text-[#2952ff]">
            <Clock3 size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
              Operations Feed
            </p>
            <h3 className="mt-0.5 text-base font-black text-slate-900">
              Recent Activity
            </h3>
          </div>
        </div>

        <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:border-slate-300 hover:bg-white">
          Expand All
          <MoveRight size={14} />
        </button>
      </div>

      <div className="min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto custom-scrollbar">
        {activities.map((item) => (
          <div
            key={item.id}
            className="flex flex-col gap-3 px-4 py-3 transition-colors hover:bg-slate-50/60 md:flex-row md:items-center md:justify-between"
          >
            <div className="flex items-start gap-3">
              <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.08em] text-slate-600">
                {item.id}
              </span>

              <div>
                <p className="text-sm font-bold text-slate-900">{item.title}</p>
                <p className="mt-0.5 text-xs text-slate-500">{item.company}</p>
              </div>
            </div>

            <span
              className={`inline-flex w-fit rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] ${
                statusClasses[item.status]
              }`}
            >
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
