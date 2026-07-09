export default function ActionCard({ icon, label }) {
  return (
    <button className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f9fbff_100%)] p-3 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-[#c7d6ff] hover:shadow-[0_14px_28px_rgba(41,82,255,0.08)]">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eef3ff] text-[#2952ff] transition-transform duration-300 group-hover:scale-105">
        {icon}
      </div>
      <span className="block min-w-0 text-xs font-bold text-slate-800">
        {label}
      </span>
    </button>
  );
}
