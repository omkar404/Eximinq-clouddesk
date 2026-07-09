export default function QuoteCard({ title, desc }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f9fbff_100%)] p-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#d9e4ff] hover:shadow-[0_14px_26px_rgba(15,23,42,0.06)]">
      <p className="text-sm font-bold text-[#2952ff]">
        {title}
      </p>
      <p className="mt-1 text-xs leading-5 text-slate-500">
        {desc}
      </p>
    </div>
  );
}
