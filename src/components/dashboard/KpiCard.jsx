import { ArrowUpRight } from "lucide-react";

export default function KpiCard({
  icon,
  value,
  title,
  subtitle,
  button,
  color
}) {
  return (
    <div className="dashboard-panel group p-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(15,23,42,0.075)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
            {title}
          </p>
          <h2 className="mt-2 text-[1.45rem] font-black text-slate-900">
            {value}
          </h2>
        </div>
        <div className={`shrink-0 rounded-xl p-2 ${color}`}>
        {icon}
        </div>
      </div>

      {subtitle && (
        <p className="mt-2 text-xs leading-5 text-slate-500">
          {subtitle}
        </p>
      )}

      {button && (
        <button className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 transition hover:border-slate-300 hover:bg-white">
          {button}
          <ArrowUpRight size={14}/>
        </button>
      )}
    </div>
  );
}
