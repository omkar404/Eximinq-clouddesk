import {
  ArrowDownToLine,
  BadgeIndianRupee,
  ChevronDown,
  Download,
  Filter,
  Plus,
  ReceiptText,
  Search,
  Sparkles,
  TrendingUp,
  WalletCards
} from "lucide-react";
import { createElement } from "react";
import OnboardingNote from "../../components/onboarding/OnboardingNote";

const summaryCards = [
  {
    icon: ReceiptText,
    value: "+2,844.00 USD",
    label: "Net change this month",
    className: "from-[#d9f2ff] via-[#b5d7ff] to-[#ffe6a8]"
  },
  {
    icon: ArrowDownToLine,
    value: "+4,234.00 USD",
    label: "Money in",
    className: "from-[#b7f5ec] via-[#ddf6ff] to-[#ffd2b7]"
  },
  {
    icon: BadgeIndianRupee,
    value: "-1,123.00 USD",
    label: "Money Out",
    className: "from-[#f2b2d4] via-[#f9d5e7] to-[#ffe5a5]"
  }
];

const rows = [
  ["01-12-2026", "Global Workspace", "Completed", "$129.00", "Checking ...23456", "Wire 5683 654", "5683 654", "green"],
  ["01-12-2026", "Acme Exports LTD.", "Canceled", "$219.00", "Checking ...13425", "Wire 5683 654", "5683 654", "red"],
  ["01-12-2026", "Google Workspace", "Pending Review", "$129.00", "Checking ...23456", "Wire 5683 654", "5683 654", "amber"],
  ["01-12-2026", "Orbit Freight LTD.", "Completed", "$289.00", "Checking ...13425", "Wire 5683 654", "5683 654", "green"],
  ["01-12-2026", "Google Workspace", "Pending Review", "$129.00", "Checking ...23456", "Wire 5683 654", "5683 654", "amber"],
  ["01-12-2026", "Prime Global INC.", "Canceled", "$289.00", "Checking ...13425", "Wire 5683 654", "5683 654", "red"],
  ["01-12-2026", "Google Workspace", "Completed", "$129.00", "Checking ...23456", "Wire 5683 654", "5683 654", "green"],
  ["01-12-2026", "Google Workspace", "Completed", "$129.00", "Checking ...23456", "Wire 5683 654", "5683 654", "green"],
  ["01-12-2026", "Acme Exports LTD.", "Pending Review", "$289.00", "Checking ...13425", "Wire 5683 654", "5683 654", "amber"],
  ["01-12-2026", "Google Workspace", "Canceled", "$659.00", "Checking ...87654", "Wire 5683 654", "5683 654", "red"]
];

const statusClasses = {
  green: "bg-emerald-100 text-emerald-700",
  amber: "bg-orange-100 text-orange-700",
  red: "bg-rose-100 text-rose-700"
};

function SummaryCard({ icon, value, label, className }) {
  return (
    <div className={`premium-metric relative overflow-hidden bg-gradient-to-br ${className} p-5`}>
      <div className="absolute inset-0 bg-white/35 backdrop-blur-[1px]" />
      <div className="relative">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/75 text-slate-600">
          {createElement(icon, { size: 14 })}
        </div>
        <p className="mt-8 text-2xl font-black tracking-[-0.04em] text-slate-950">{value}</p>
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

export default function CommandCenter() {
  return (
    <div className="dashboard-page dashboard-console">
      <OnboardingNote />

      <section className="dashboard-hero relative overflow-hidden p-6 md:p-8">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.14em] text-emerald-700">
              <Sparkles size={13} /> Executive overview
            </div>
            <h1 className="premium-page-title">Run the business with complete clarity.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
              Monitor client activity, receipts, approvals, and operational risk across the entire CloudDesk platform.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="premium-button premium-button-secondary"><Download size={15} /> Export report</button>
            <button className="premium-button premium-button-primary"><Plus size={16} /> Add transaction</button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-3">
        {summaryCards.map((card) => (
          <SummaryCard key={card.label} {...card} />
        ))}
      </section>

      <section className="dashboard-table-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-3 py-2.5">
          <div>
            <p className="premium-kicker">Financial operations</p>
            <h2 className="mt-1 text-base font-bold text-slate-950">Transactions</h2>
            <p className="mt-0.5 text-[10px] font-medium text-slate-400">10 latest records</p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 hidden items-center gap-1 text-[10px] font-bold text-emerald-600 md:inline-flex"><TrendingUp size={13}/> Updated live</span>
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
                <th>To/From</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Account</th>
                <th>Method</th>
                <th>GL Code</th>
                <th>Attachment</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([date, company, status, amount, account, method, code, tone], index) => (
                <tr key={`${company}-${index}`}>
                  <td><input type="checkbox" /></td>
                  <td>{date}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-black text-blue-500 shadow-sm">
                        G
                      </span>
                      <span className="font-semibold text-slate-800">{company}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${statusClasses[tone]}`}>
                      {status}
                    </span>
                  </td>
                  <td className="font-semibold text-slate-900">{amount}</td>
                  <td>{account}</td>
                  <td>
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-600">
                      <WalletCards size={12} />
                      {method} ******
                    </span>
                  </td>
                  <td>
                    <button className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600">
                      {code}
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
