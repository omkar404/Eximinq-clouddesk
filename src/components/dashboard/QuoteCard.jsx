export default function QuoteCard({ title, desc }) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f9fbff_100%)] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#d9e4ff] hover:shadow-[0_16px_30px_rgba(15,23,42,0.06)]">
      <p className="font-bold text-[#2952ff]">
        {title}
      </p>
      <p className="mt-1.5 text-sm leading-6 text-slate-500">
        {desc}
      </p>
    </div>
  );
}
