import {
  ArrowDownToLine,
  ChevronDown,
  Download,
  FileCheck2,
  Filter,
  Plus,
  ReceiptText,
  Search,
  ShieldCheck,
  WalletCards
} from "lucide-react";
import { createElement } from "react";
import OnboardingNote from "../../components/onboarding/OnboardingNote";

const summaryCards = [
  {
    icon: FileCheck2,
    value: "06 Active",
    label: "Open client requests",
    className: "from-[#d9f2ff] via-[#c8dcff] to-[#ffe6a8]"
  },
  {
    icon: ArrowDownToLine,
    value: "24 Filings",
    label: "Processed this month",
    className: "from-[#b7f5ec] via-[#ddf6ff] to-[#ffd2b7]"
  },
  {
    icon: ShieldCheck,
    value: "92%",
    label: "Compliance health",
    className: "from-[#f2b2d4] via-[#f9d5e7] to-[#ffe5a5]"
  }
];

const rows = [
  ["01-12-2026", "Certificate of Origin", "Completed", "COO-1290", "Checking ...23456", "Document Review", "5683 654", "green"],
  ["01-12-2026", "IEM Registration", "Canceled", "IEM-2190", "Checking ...13425", "Client Update", "5683 654", "red"],
  ["01-12-2026", "EPCG License", "Pending Review", "EPCG-1290", "Checking ...23456", "Compliance Desk", "5683 654", "amber"],
  ["01-12-2026", "AEO T2 Certification", "Completed", "AEO-2890", "Checking ...13425", "Document Review", "5683 654", "green"],
  ["01-12-2026", "Legal Reply", "Pending Review", "LR-1290", "Checking ...23456", "Legal Desk", "5683 654", "amber"],
  ["01-12-2026", "Customs Advisory", "Canceled", "CA-2890", "Checking ...13425", "Client Update", "5683 654", "red"],
  ["01-12-2026", "RCMC Renewal", "Completed", "RCMC-1290", "Checking ...23456", "Document Review", "5683 654", "green"],
  ["01-12-2026", "BIS Registration", "Completed", "BIS-1290", "Checking ...23456", "Compliance Desk", "5683 654", "green"],
  ["01-12-2026", "Advance Auth Closure", "Pending Review", "AAC-2890", "Checking ...13425", "Legal Desk", "5683 654", "amber"],
  ["01-12-2026", "WPC License", "Canceled", "WPC-6590", "Checking ...87654", "Client Update", "5683 654", "red"]
];

const statusClasses = {
  green: "bg-emerald-100 text-emerald-700",
  amber: "bg-orange-100 text-orange-700",
  red: "bg-rose-100 text-rose-700"
};

function SummaryCard({ icon, value, label, className }) {
  return (
    <div className={`relative overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br ${className} p-4 shadow-sm`}>
      <div className="absolute inset-0 bg-white/35 backdrop-blur-[1px]" />
      <div className="relative">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/75 text-slate-600">
          {createElement(icon, { size: 14 })}
        </div>
        <p className="mt-8 text-lg font-bold text-slate-950">{value}</p>
        <p className="mt-1 text-[11px] font-medium text-slate-600">{label}</p>
      </div>
    </div>
  );
}

function FilterButton({ children, icon: Icon }) {
  return (
    <button className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50">
      {Icon ? <Icon size={13} /> : null}
      {children}
      <ChevronDown size={12} className="text-slate-400" />
    </button>
  );
}

export default function ClientCommandCenter() {
  return (
    <div className="dashboard-page dashboard-console">
      <OnboardingNote />

      <section className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-slate-950">Requests</h1>
          <p className="mt-1 text-[11px] font-medium text-slate-400">
            Track filings, documents, receipts, and compliance status
          </p>
        </div>
        <button className="inline-flex h-8 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-700 shadow-sm">
          <ReceiptText size={13} />
          Match Receipts
        </button>
      </section>

      <section className="grid gap-3 lg:grid-cols-3">
        {summaryCards.map((card) => (
          <SummaryCard key={card.label} {...card} />
        ))}
      </section>

      <section className="dashboard-table-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-3 py-2.5">
          <div>
            <h2 className="text-sm font-bold text-slate-950">Request Ledger</h2>
            <p className="mt-0.5 text-[10px] font-medium text-slate-400">10 latest records</p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <FilterButton>Data Views</FilterButton>
            <FilterButton icon={Filter}>Filters</FilterButton>
            <FilterButton>Date</FilterButton>
            <FilterButton icon={Search}>Keywords</FilterButton>
            <FilterButton>Amount</FilterButton>
            <button className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50">
              <Download size={13} />
              Export All
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto custom-scrollbar">
          <table className="dashboard-ledger-table">
            <thead>
              <tr>
                <th><input type="checkbox" /></th>
                <th>Due date</th>
                <th>Service</th>
                <th>Status</th>
                <th>Code</th>
                <th>Account</th>
                <th>Method</th>
                <th>GL Code</th>
                <th>Attachment</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([date, service, status, codeValue, account, method, glCode, tone], index) => (
                <tr key={`${service}-${index}`}>
                  <td><input type="checkbox" /></td>
                  <td>{date}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-black text-blue-500 shadow-sm">
                        G
                      </span>
                      <span className="font-semibold text-slate-800">{service}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${statusClasses[tone]}`}>
                      {status}
                    </span>
                  </td>
                  <td className="font-semibold text-slate-900">{codeValue}</td>
                  <td>{account}</td>
                  <td>
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-600">
                      <WalletCards size={12} />
                      {method}
                    </span>
                  </td>
                  <td>
                    <button className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600">
                      {glCode}
                      <ChevronDown size={11} />
                    </button>
                  </td>
                  <td>
                    <button className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                      <Plus size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 px-3 py-2 text-[10px] font-medium text-slate-500">
          <span>Showing 1-10 of 124 results</span>
          <div className="flex items-center gap-2">
            <span>Rows per page</span>
            <button className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-bold text-slate-700">10</button>
            <button className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-bold text-slate-700">Previous</button>
            <button className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-bold text-slate-700">Next</button>
          </div>
        </div>
      </section>
    </div>
  );
}
