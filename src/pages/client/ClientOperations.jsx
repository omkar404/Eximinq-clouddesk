import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity, AlertCircle, ArrowDownUp, BarChart3, CalendarDays, CheckCircle2,
  ChevronLeft, ChevronRight, Clock3, Download, FileSpreadsheet, FileText,
  IndianRupee, LoaderCircle, RefreshCw, Search, ShieldCheck, X
} from "lucide-react";
import { getClientOperationsOverview } from "../../services/clientOperationsService";

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const date = (value) => value ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value)) : "—";
const title = (value = "") => String(value).replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const PAGE_SIZE = 8;

const MODULES = {
  invoices: {
    eyebrow: "Financial Administration",
    title: "Invoices & Billing",
    description: "Audit service charges, statutory fees, GST and payment records from one reconciled ledger.",
    icon: FileSpreadsheet
  },
  schemes: {
    eyebrow: "Government Benefit Intelligence",
    title: "Schemes & Analytics",
    description: "Monitor eligible trade schemes, submitted applications and portfolio-level progress.",
    icon: BarChart3
  },
  workflows: {
    eyebrow: "Application Processing System",
    title: "Active Workflows",
    description: "Track live regulatory applications, assignments, documents, milestones and due dates.",
    icon: Activity
  }
};

export default function ClientOperations({ module }) {
  const definition = MODULES[module] || MODULES.workflows;
  const Icon = definition.icon;
  const [data, setData] = useState({ invoices: [], schemes: [], workflows: [], transactions: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [category, setCategory] = useState("ALL");
  const [financialYear, setFinancialYear] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);

  const load = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true); else setLoading(true);
    try {
      const result = await getClientOperationsOverview();
      setData(result);
      setUpdatedAt(result.generatedAt);
      setError("");

    } catch (requestError) {
      setError(requestError.response?.data?.message || "Operational data could not be loaded.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const refresh = () => load(true);
    const handleVisibility = () => { if (document.visibilityState === "visible") refresh(); };
    const timer = window.setInterval(refresh, 5000);
    window.addEventListener("clouddesk:operations-updated", refresh);
    window.addEventListener("wallet:updated", refresh);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("clouddesk:operations-updated", refresh);
      window.removeEventListener("wallet:updated", refresh);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [load]);

  useEffect(() => setPage(1), [module, search, status, category, financialYear, fromDate, toDate, sort]);

  const source = useMemo(() => data[module] || [], [data, module]);
  const categories = useMemo(() => [...new Set(source.map((item) => item.category).filter(Boolean))], [source]);
  const statuses = useMemo(() => [...new Set(source.map((item) => module === "invoices" ? item.paymentStatus : item.status).filter(Boolean))], [source, module]);
  const financialYears = useMemo(() => [...new Set(source.map((item) => financialYearFor(item.submittedAt || item.updatedAt)).filter(Boolean))], [source]);
  const filtered = useMemo(() => source.filter((item) => {
    const itemStatus = module === "invoices" ? item.paymentStatus : item.status;
    const timestamp = item.submittedAt || item.updatedAt;
    const text = `${item.requestCode || ""} ${item.billingReference || ""} ${item.serviceName || item.name || ""} ${item.category || ""} ${itemStatus || ""}`.toLowerCase();
    if (search && !text.includes(search.toLowerCase())) return false;
    if (status !== "ALL" && itemStatus !== status) return false;
    if (category !== "ALL" && item.category !== category) return false;
    if (financialYear !== "ALL" && financialYearFor(timestamp) !== financialYear) return false;
    if (fromDate && timestamp && new Date(timestamp) < new Date(`${fromDate}T00:00:00`)) return false;
    if (toDate && timestamp && new Date(timestamp) > new Date(`${toDate}T23:59:59`)) return false;
    return true;
  }).sort((a, b) => sortRows(a, b, sort)), [source, search, status, category, financialYear, fromDate, toDate, sort, module]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const metrics = moduleMetrics(module, filtered, data);

  function resetFilters() {
    setSearch(""); setStatus("ALL"); setCategory("ALL"); setFinancialYear("ALL");
    setFromDate(""); setToDate(""); setSort("newest");
  }

  function exportCsv() {
    const lines = module === "invoices"
      ? [["Billing Reference", "Service", "Date", "Amount", "Payment Status"], ...filtered.map((item) => [item.billingReference, item.serviceName, date(item.submittedAt), item.total, item.paymentStatus])]
      : module === "schemes"
        ? [["Scheme", "Category", "Request", "Status", "Updated"], ...filtered.map((item) => [item.name, item.category, item.requestCode || "", item.status, date(item.updatedAt)])]
        : [["Request", "Service", "Category", "Status", "Documents", "Updated"], ...filtered.map((item) => [item.requestCode, item.serviceName, item.category, item.status, item.documentCount, date(item.updatedAt)])];
    const csv = lines.map((line) => line.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a"); link.href = url; link.download = `${module}-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(url);
  }

  return <div className="min-h-full bg-[#f3f6fb] p-3 sm:p-5 lg:p-7"><div className="mx-auto max-w-[1600px] space-y-5">
    <section className="client-operations-overview overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,.07)]">
      <div className="workspace-overview-hero workspace-overview-hero--embedded px-5 py-6 sm:px-7 lg:px-9">
        <div className="workspace-hero-orbit" />
        <div className="relative z-10 flex flex-col justify-between gap-5 lg:flex-row lg:items-center"><div className="flex items-start gap-4"><div className="workspace-hero-icon"><Icon size={26} /></div><div><p className="workspace-hero-eyebrow">{definition.eyebrow}</p><h1>{definition.title}</h1><p>{definition.description}</p></div></div><div className="workspace-hero-actions"><span>Auto-synced<br />{updatedAt ? new Date(updatedAt).toLocaleTimeString("en-IN") : "Waiting"}</span><button onClick={() => load(true)} disabled={refreshing} className="workspace-hero-icon-button"><RefreshCw size={18} className={refreshing ? "animate-spin" : ""} /></button><button onClick={exportCsv} className="workspace-hero-primary"><Download size={15} /> Export CSV</button></div></div>
      </div>
      <div className="operations-summary-grid grid gap-px bg-slate-200 sm:grid-cols-2 xl:grid-cols-4">{metrics.map((metric) => <article key={metric.label} className="bg-white p-5"><div className="flex items-start justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.16em] text-slate-400">{metric.label}</p><strong className="mt-2 block text-2xl font-black text-slate-900">{metric.value}</strong><span className="mt-1 block text-xs text-slate-500">{metric.note}</span></div><metric.icon size={20} className="text-[#245ea8]" /></div></article>)}</div>
    </section>

    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 p-4 sm:p-5">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center"><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-[#245ea8]">Records Administration</p><h2 className="mt-1 text-lg font-black text-slate-900">Detailed register</h2></div><div className="flex flex-wrap gap-2"><FilterSelect label="Financial Year" value={financialYear} onChange={setFinancialYear} options={financialYears} /><FilterSelect label="Status" value={status} onChange={setStatus} options={statuses} /><FilterSelect label="Category" value={category} onChange={setCategory} options={categories} /><FilterSelect label="Sort" value={sort} onChange={setSort} options={["newest", "oldest", "name-asc", "name-desc"]} allLabel="Newest first" includeAll={false} /></div></div>
      <div className="mt-4 grid gap-2 md:grid-cols-[minmax(240px,1fr)_180px_180px_auto]"><label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3"><Search size={16} className="text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search request, invoice, service or category" className="h-11 w-full bg-transparent text-sm outline-none" /></label><DateInput label="From" value={fromDate} onChange={setFromDate} /><DateInput label="To" value={toDate} onChange={setToDate} /><button onClick={resetFilters} className="rounded-xl border px-4 text-xs font-black text-slate-600 hover:bg-slate-50">Reset filters</button></div>
    </div>
    {error && <div className="m-5 flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700"><span className="flex items-center gap-2"><AlertCircle size={18} />{error}</span><button onClick={() => load()} className="rounded-lg bg-white px-3 py-2">Retry</button></div>}
    <div className="h-[min(590px,calc(100vh-390px))] min-h-[360px] overflow-auto">{loading ? <LoadingState /> : module === "invoices" ? <InvoiceTable rows={rows} onSelect={setSelected} /> : module === "schemes" ? <SchemeTable rows={rows} onSelect={setSelected} /> : <WorkflowTable rows={rows} onSelect={setSelected} />}</div>
    <div className="flex flex-col justify-between gap-3 border-t p-4 text-xs text-slate-500 sm:flex-row sm:items-center"><span>Showing {filtered.length ? (page - 1) * PAGE_SIZE + 1 : 0}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} records</span><div className="flex items-center gap-2"><button disabled={page === 1} onClick={() => setPage((value) => value - 1)} className="rounded-lg border p-2 disabled:opacity-30"><ChevronLeft size={15} /></button><span className="font-bold">Page {page} of {pageCount}</span><button disabled={page === pageCount} onClick={() => setPage((value) => value + 1)} className="rounded-lg border p-2 disabled:opacity-30"><ChevronRight size={15} /></button></div></div>
    </section>
  </div>{selected && <DetailPanel module={module} item={selected} onClose={() => setSelected(null)} />}</div>;
}

function financialYearFor(value) { if (!value) return null; const dateValue = new Date(value); const year = dateValue.getFullYear(); const start = dateValue.getMonth() < 3 ? year - 1 : year; return `${start}-${String(start + 1).slice(-2)}`; }
function sortRows(a, b, sort) { const nameA = a.serviceName || a.name || "", nameB = b.serviceName || b.name || ""; if (sort === "name-asc") return nameA.localeCompare(nameB); if (sort === "name-desc") return nameB.localeCompare(nameA); const dateA = new Date(a.submittedAt || a.updatedAt || 0), dateB = new Date(b.submittedAt || b.updatedAt || 0); return sort === "oldest" ? dateA - dateB : dateB - dateA; }
function moduleMetrics(module, rows, data) { if (module === "invoices") { const paid = rows.filter((item) => item.paymentStatus === "PAID").reduce((sum, item) => sum + item.total, 0); const due = rows.filter((item) => item.paymentStatus !== "PAID").reduce((sum, item) => sum + item.total, 0); return [{ label: "Total Invoices", value: rows.length, note: "Filtered billing records", icon: FileText }, { label: "Paid Amount", value: money(paid), note: "Successfully reconciled", icon: CheckCircle2 }, { label: "Amount Outstanding", value: money(due), note: "Pending or partial", icon: IndianRupee }, { label: "Ledger Entries", value: data.transactions.length, note: "Recent transactions", icon: ArrowDownUp }]; } if (module === "schemes") return [{ label: "Available Schemes", value: rows.length, note: "Active catalog entries", icon: ShieldCheck }, { label: "Applications Filed", value: rows.filter((item) => item.requestCode).length, note: "Linked client requests", icon: FileText }, { label: "In Progress", value: rows.filter((item) => !["NOT APPLIED", "COMPLETED", "APPROVED"].includes(item.status)).length, note: "Under processing", icon: Clock3 }, { label: "Completed", value: rows.filter((item) => ["COMPLETED", "APPROVED"].includes(item.status)).length, note: "Successfully concluded", icon: CheckCircle2 }]; return [{ label: "Total Workflows", value: rows.length, note: "Submitted applications", icon: Activity }, { label: "Needs Attention", value: rows.filter((item) => ["ADDITIONAL_DOCUMENTS_REQUESTED", "REJECTED"].includes(item.status)).length, note: "Client action required", icon: AlertCircle }, { label: "Under Processing", value: rows.filter((item) => !["COMPLETED", "APPROVED", "REJECTED"].includes(item.status)).length, note: "Active with operations", icon: RefreshCw }, { label: "Completed", value: rows.filter((item) => ["COMPLETED", "APPROVED"].includes(item.status)).length, note: "Closed workflows", icon: CheckCircle2 }]; }
function FilterSelect({ label, value, onChange, options, allLabel = "All", includeAll = true }) { return <label className="relative"><span className="sr-only">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 pr-8 text-xs font-bold text-slate-700">{includeAll && <option value="ALL">{allLabel} {label}</option>}{options.map((option) => <option key={option} value={option}>{title(option)}</option>)}</select></label>; }
function DateInput({ label, value, onChange }) { return <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3"><CalendarDays size={15} className="text-slate-400" /><span className="text-[10px] font-bold text-slate-400">{label}</span><input type="date" value={value} onChange={(event) => onChange(event.target.value)} className="h-11 min-w-0 flex-1 bg-transparent text-xs outline-none" /></label>; }
function LoadingState() { return <div className="flex h-full items-center justify-center"><div className="text-center"><LoaderCircle className="mx-auto animate-spin text-[#245ea8]" /><p className="mt-3 text-sm font-bold text-slate-500">Loading verified operational records…</p></div></div>; }
function EmptyState({ message }) { return <tr><td colSpan="8" className="h-72 text-center"><FileText className="mx-auto text-slate-300" /><p className="mt-3 text-sm font-bold text-slate-500">{message}</p></td></tr>; }
function Status({ value }) { const good = ["PAID", "COMPLETED", "APPROVED"].includes(value), warn = ["QUOTE PENDING", "PARTIALLY PAID", "ADDITIONAL_DOCUMENTS_REQUESTED"].includes(value); return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${good ? "bg-emerald-100 text-emerald-700" : warn ? "bg-amber-100 text-amber-700" : value === "NOT APPLIED" ? "bg-slate-100 text-slate-600" : "bg-blue-100 text-blue-700"}`}>{title(value)}</span>; }
const Table = ({ headers, children }) => <table className="operations-table w-full min-w-[1080px] table-fixed text-left text-xs"><thead className="sticky top-0 z-10 bg-[#eaf0f7] text-[10px] uppercase tracking-[.13em] text-slate-500"><tr>{headers.map((header) => <th key={header.label} className={`${header.width} px-4 py-3.5`}>{header.label}</th>)}</tr></thead><tbody>{children}</tbody></table>;
function InvoiceTable({ rows, onSelect }) { return <Table headers={[{label:"Billing Reference",width:"w-44"},{label:"Service",width:"w-64"},{label:"Billing Date",width:"w-36"},{label:"Statutory Fee",width:"w-32"},{label:"Service + GST",width:"w-36"},{label:"Total",width:"w-32"},{label:"Payment",width:"w-36"}]}>{rows.length ? rows.map((item) => <tr key={item.id} onClick={() => onSelect(item)} className="cursor-pointer hover:bg-blue-50/50"><td className="px-5 py-4"><b className="block text-[#195eaa]">{item.billingReference}</b><span className="mt-1 block text-slate-400">Service request</span></td><td className="px-5 py-4"><b>{item.serviceName}</b><span className="mt-1 block capitalize text-slate-400">{item.category}</span></td><td className="px-5 py-4">{date(item.submittedAt)}</td><td className="px-5 py-4 font-bold">{money(item.officialFee)}</td><td className="px-5 py-4 font-bold">{money(item.serviceCharge + item.gst)}</td><td className="px-5 py-4 text-sm font-black">{money(item.total)}</td><td className="px-5 py-4"><Status value={item.paymentStatus} /></td></tr>) : <EmptyState message="No billing records match the selected filters." />}</Table>; }
function SchemeTable({ rows, onSelect }) { return <Table headers={[{label:"Scheme",width:"w-72"},{label:"Category",width:"w-40"},{label:"Application",width:"w-44"},{label:"Last Activity",width:"w-40"},{label:"Status",width:"w-40"}]}>{rows.length ? rows.map((item) => <tr key={item.slug} onClick={() => onSelect(item)} className="cursor-pointer hover:bg-blue-50/50"><td className="px-5 py-4"><b className="block text-sm">{item.name}</b><span className="mt-1 block line-clamp-2 text-slate-500">{item.description}</span></td><td className="px-5 py-4 capitalize">{item.category}</td><td className="px-5 py-4 font-bold text-[#195eaa]">{item.requestCode || "Not filed"}</td><td className="px-5 py-4">{date(item.updatedAt)}</td><td className="px-5 py-4"><Status value={item.status} /></td></tr>) : <EmptyState message="No schemes match the selected filters." />}</Table>; }
function WorkflowTable({ rows, onSelect }) { return <Table headers={[{label:"Request",width:"w-[16%]"},{label:"Service & Category",width:"w-[25%]"},{label:"Submitted",width:"w-[13%]"},{label:"Evidence",width:"w-[11%]"},{label:"Assigned Officer",width:"w-[17%]"},{label:"Due Date",width:"w-[11%]"},{label:"Current Status",width:"w-[17%]"},{label:"",width:"w-12"}]}>{rows.length ? rows.map((item) => <tr key={item.id} onClick={() => onSelect(item)} className="group cursor-pointer transition-colors"><td className="px-4 py-3.5"><b className="block font-black text-[#195eaa]">{item.requestCode}</b><span className="mt-1 block text-[9px] font-bold uppercase tracking-wider text-slate-400">View application</span></td><td className="px-4 py-3.5"><b className="block truncate text-[13px] text-slate-800" title={item.serviceName}>{item.serviceName}</b><span className="mt-1.5 inline-flex rounded-md bg-slate-100 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-slate-500">{title(item.category)}</span></td><td className="px-4 py-3.5 font-semibold text-slate-600">{date(item.submittedAt)}</td><td className="px-4 py-3.5"><span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-black text-slate-700"><FileText size={13} className="text-blue-500"/>{item.documentCount}<small className="font-semibold text-slate-400">files</small></span></td><td className="px-4 py-3.5"><b className="block text-slate-700">{item.assignment?.agentName || "Unassigned"}</b><span className={`mt-1 block text-[10px] font-semibold ${item.assignment ? "text-emerald-600" : "text-amber-600"}`}>{item.assignment ? "Processing officer" : "Awaiting assignment"}</span></td><td className="px-4 py-3.5"><b className="text-slate-700">{date(item.assignment?.dueDate)}</b></td><td className="px-4 py-3.5"><Status value={item.status} /><span className="mt-1.5 block text-[9px] font-semibold text-slate-400">Updated {date(item.updatedAt)}</span></td><td className="px-3 py-3.5"><span className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition group-hover:border-blue-200 group-hover:bg-blue-50 group-hover:text-blue-600"><ChevronRight size={16}/></span></td></tr>) : <EmptyState message="No workflow records match the selected filters." />}</Table>; }
function DetailPanel({ module, item, onClose }) { return <div className="fixed inset-0 z-[80] flex justify-end bg-slate-950/50 backdrop-blur-sm" onClick={onClose}><aside className="h-full w-full max-w-xl overflow-auto bg-[#f6f8fc] shadow-2xl" onClick={(event) => event.stopPropagation()}><header className="sticky top-0 z-10 flex items-start justify-between border-b bg-white p-6"><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-[#245ea8]">Official Record Detail</p><h2 className="mt-2 text-2xl font-black">{item.serviceName || item.name}</h2><p className="mt-1 text-sm text-slate-500">{item.billingReference || item.requestCode || title(module)}</p></div><button onClick={onClose} className="rounded-xl bg-slate-100 p-2"><X size={18} /></button></header><div className="space-y-4 p-5"><section className="grid gap-3 sm:grid-cols-2"><Detail label="Current Status" value={<Status value={module === "invoices" ? item.paymentStatus : item.status} />} /><Detail label="Category" value={title(item.category)} /><Detail label="Submitted" value={date(item.submittedAt)} /><Detail label="Last Updated" value={date(item.updatedAt)} />{item.total != null && <Detail label="Total Amount" value={money(item.total)} />}{item.documentCount != null && <Detail label="Documents" value={`${item.documentCount} files`} />}</section>{item.description && <section className="rounded-2xl border bg-white p-4"><h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Scheme Description</h3><p className="mt-2 text-sm leading-6 text-slate-700">{item.description}</p></section>}{item.fields?.length > 0 && <section className="rounded-2xl border bg-white p-4"><h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Submitted Information</h3><div className="mt-4 grid gap-3 sm:grid-cols-2">{item.fields.map((field) => <Detail key={field.key} label={field.label} value={String(field.value)} />)}</div></section>}</div></aside></div>; }
function Detail({ label, value }) { return <div className="rounded-2xl border bg-white p-4"><span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</span><div className="mt-2 font-bold text-slate-800">{value || "—"}</div></div>; }
