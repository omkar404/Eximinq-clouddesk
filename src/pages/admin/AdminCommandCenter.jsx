import { useCallback, useEffect, useMemo, useState } from "react";
import { createElement } from "react";
import { Activity, BadgeIndianRupee, Building2, Download, Layers, LoaderCircle, RefreshCw, Search, TrendingDown, TrendingUp, Users } from "lucide-react";
import OnboardingNote from "../../components/onboarding/OnboardingNote";
import { getAdminDashboard } from "../../services/adminDashboardService";

const currency = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(value || 0));
const dateTime = (value) => value ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—";
const readable = (value = "") => value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

function Metric({ icon, label, value, tone = "blue" }) {
  return <article className={`admin-live-metric metric-${tone}`}><span>{createElement(icon, { size: 19 })}</span><div><strong>{value}</strong><small>{label}</small></div></article>;
}

export default function CommandCenter() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setData(await getAdminDashboard()); }
    catch (reason) { setError(reason.response?.data?.message || "Unable to load the live admin dashboard."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); const timer = window.setInterval(load, 30000); return () => window.clearInterval(timer); }, [load]);

  const transactions = useMemo(() => (data?.transactions || []).filter((item) =>
    [item.clientName,item.description,item.serviceName,item.requestCode].some((value) => String(value || "").toLowerCase().includes(search.toLowerCase()))
  ), [data, search]);

  return <div className="dashboard-page dashboard-console admin-live-dashboard">
    <OnboardingNote />
    <section className="dashboard-hero p-6 md:p-8">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><span className="premium-kicker">Live executive overview</span><h1 className="premium-page-title">Run CloudDesk with complete clarity.</h1><p className="mt-3 text-sm text-slate-500">Database-backed client, request, workforce, and financial operations.</p></div>
      <div className="flex gap-2"><button onClick={load} className="premium-button premium-button-secondary"><RefreshCw size={15} className={loading ? "spin" : ""}/> Refresh</button><button className="premium-button premium-button-primary"><Download size={15}/> Export</button></div></div>
      {data?.generatedAt && <small className="mt-4 block text-slate-400">Last synchronized {dateTime(data.generatedAt)}</small>}
    </section>
    {error && <div className="request-error">{error}</div>}
    {loading && !data ? <div className="screen-center"><LoaderCircle className="spin"/> Loading live operations…</div> : <>
      <section className="admin-live-metrics">
        <Metric icon={BadgeIndianRupee} label="Net financial change" value={currency(data?.summary.netChange)} tone="blue" />
        <Metric icon={TrendingUp} label="Money in" value={currency(data?.summary.moneyIn)} tone="green" />
        <Metric icon={TrendingDown} label="Money out" value={currency(data?.summary.moneyOut)} tone="rose" />
        <Metric icon={Building2} label="Active clients" value={data?.summary.activeClients || 0} tone="violet" />
        <Metric icon={Users} label="Active agents" value={data?.summary.activeAgents || 0} tone="cyan" />
        <Metric icon={Layers} label="Active requests" value={data?.summary.activeRequests || 0} tone="amber" />
      </section>
      <section className="dashboard-table-card">
        <header className="admin-live-table-header"><div><span className="premium-kicker">Financial operations</span><h2>Transaction ledger</h2></div><label><Search size={16}/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search transactions"/></label></header>
        <div className="dashboard-table-viewport custom-scrollbar"><table className="dashboard-ledger-table"><thead><tr><th>Date</th><th>Client</th><th>Service / Request</th><th>Account</th><th>Type</th><th>Amount</th><th>Balance after</th><th>Status</th></tr></thead><tbody>
          {transactions.length ? transactions.map((item) => <tr key={item.id}><td>{dateTime(item.date)}</td><td><strong>{item.clientName}</strong><small>{item.clientCode}</small></td><td><strong>{item.serviceName || item.description}</strong><small>{item.requestCode || item.description}</small></td><td>{readable(item.accountType)}</td><td><span className={`live-type type-${item.type?.toLowerCase()}`}>{readable(item.type)}</span></td><td className="font-bold">{currency(item.amount)}</td><td>{currency(item.balanceAfter)}</td><td>{readable(item.status)}</td></tr>) : <tr><td colSpan="8" className="text-center text-slate-400">No financial transactions found.</td></tr>}
        </tbody></table></div>
      </section>
      <section className="dashboard-table-card"><header className="admin-live-table-header"><div><span className="premium-kicker">Request activity</span><h2>Recently updated requests</h2></div><Activity size={20}/></header><div className="admin-request-strip">{(data?.recentRequests || []).map((request) => <article key={request.id}><div><strong>{request.requestCode}</strong><span>{request.serviceName} · {request.clientName}</span></div><span className="request-status">{readable(request.status)}</span></article>)}{!data?.recentRequests?.length && <p>No submitted requests yet.</p>}</div></section>
    </>}
  </div>;
}
