export default function ActionCard({ icon, label }) {
  return (
    <button className="group rounded-[22px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f9fbff_100%)] p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-[#c7d6ff] hover:shadow-[0_18px_34px_rgba(41,82,255,0.08)]">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef3ff] text-[#2952ff] transition-transform duration-300 group-hover:scale-105">
        {icon}
      </div>
      <span className="mt-4 block text-sm font-bold tracking-tight text-slate-800">
        {label}
      </span>
    </button>
  );
}
