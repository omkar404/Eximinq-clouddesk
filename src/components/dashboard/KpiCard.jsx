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
    <div className="dashboard-panel group p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_46px_rgba(15,23,42,0.08)]">
      <div className={`w-fit rounded-2xl p-2.5 ${color}`}>
        {icon}
      </div>

      <h2 className="mt-4 text-[1.9rem] font-black tracking-[-0.05em] text-slate-900">
        {value}
      </h2>

      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
        {title}
      </p>

      {subtitle && (
        <p className="mt-2 text-sm text-slate-500">
          {subtitle}
        </p>
      )}

      {button && (
        <button className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-bold text-slate-700 transition hover:border-slate-300 hover:bg-white">
          {button}
          <ArrowUpRight size={14}/>
        </button>
      )}
    </div>
  );
}
