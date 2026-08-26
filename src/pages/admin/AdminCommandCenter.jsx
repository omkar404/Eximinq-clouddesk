import { createElement, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity, AlertTriangle, ArrowRight, BadgeIndianRupee, Building2, Download,
  Layers3, LoaderCircle, RefreshCw, Search, TrendingDown, TrendingUp, Users, X
} from "lucide-react";
import OnboardingNote from "../../components/onboarding/OnboardingNote";
import { getAdminDashboard } from "../../services/adminDashboardService";

const currency = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value || 0));
const dateTime = (value) => value ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—";
const readable = (value = "") => String(value).replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function AdminCommandCenter() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const load = useCallback(async (quiet = false) => {
    quiet ? setRefreshing(true) : setLoading(true); setError("");
    try { setData(await getAdminDashboard()); }
    catch (reason) { setError(reason.response?.data?.message || "Unable to load the live admin dashboard."); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useEffect(() => { load(); const timer = window.setInterval(() => load(true), 15000); return () => window.clearInterval(timer); }, [load]);

  const transactions = useMemo(() => (data?.transactions || []).filter((item) =>
    [item.clientName, item.description, item.serviceName, item.requestCode].some((value) => String(value || "").toLowerCase().includes(search.toLowerCase()))
  ), [data, search]);

  function exportTransactions() {
    const rows = [["Date", "Client", "Request", "Service", "Account", "Type", "Amount", "Balance", "Status"], ...transactions.map((item) => [dateTime(item.date), item.clientName, item.requestCode, item.serviceName, item.accountType, item.type, item.amount, item.balanceAfter, item.status])];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `clouddesk-transactions-${new Date().toISOString().slice(0, 10)}.csv`; anchor.click(); URL.revokeObjectURL(url);
  }

  const metrics = [
    { icon: BadgeIndianRupee, label: "Net financial change", value: currency(data?.summary.netChange), note: "Current ledger position", path: "/admin/service-requests", tone: "blue" },
    { icon: Building2, label: "Active clients", value: data?.summary.activeClients || 0, note: "Approved client accounts", path: "/admin/clients", tone: "violet" },
    { icon: Users, label: "Active agents", value: data?.summary.activeAgents || 0, note: "Available workforce", path: "/admin/workforce", tone: "cyan" },
    { icon: AlertTriangle, label: "Action required", value: data?.summary.actionRequired || 0, note: "Pending operational review", path: "/admin/service-requests", tone: "amber" }
  ];

  return <div className="dashboard-page command-center command-center-admin">
    <OnboardingNote />
    <section className="command-hero command-hero-admin"><div><span className="command-eyebrow"><Activity size={13}/> Executive operations console</span><h1>CloudDesk Command Center</h1><p>Live oversight of clients, workforce, requests and financial movement.</p></div><div className="command-hero-actions"><span className="command-live"><i/> Synced {data?.generatedAt ? dateTime(data.generatedAt) : "now"}</span><button onClick={() => load(true)} disabled={refreshing} className="command-icon-button"><RefreshCw size={16} className={refreshing ? "animate-spin" : ""}/></button><button onClick={exportTransactions} className="command-primary"><Download size={15}/> Export ledger</button></div></section>
    {error && <div className="command-error"><AlertTriangle size={17}/><span>{error}</span><button onClick={() => load()}>Retry</button></div>}
    {loading && !data ? <div className="command-loading"><LoaderCircle className="animate-spin"/> Loading executive workspace…</div> : <>
      <section className="command-metrics">{metrics.map((item) => <Metric key={item.label} {...item} onClick={() => navigate(item.path)}/>)}</section>
      <section className="command-grid-main admin-command-grid">
        <article className="command-panel command-workstream"><header><div><span className="command-kicker">Financial administration</span><h2>Transaction ledger</h2></div><label className="command-search"><Search size={14}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Client, request or service"/></label></header><div className="command-table-wrap"><table className="admin-command-table"><thead><tr><th>Date</th><th>Client</th><th>Service / Request</th><th>Type</th><th>Amount</th><th>Balance</th><th>Status</th></tr></thead><tbody>{transactions.length ? transactions.slice(0, 12).map((item) => <tr key={item.id} onClick={() => setSelected(item)}><td>{dateTime(item.date)}</td><td><strong>{item.clientName}</strong><small>{item.clientCode}</small></td><td><strong>{item.serviceName || item.description}</strong><small>{item.requestCode || item.description}</small></td><td><span className={`command-status ${item.type === "CREDIT" ? "status-good" : "status-info"}`}>{readable(item.type)}</span></td><td><strong>{currency(item.amount)}</strong></td><td>{currency(item.balanceAfter)}</td><td>{readable(item.status)}</td></tr>) : <tr><td colSpan="7" className="command-empty-cell">No financial transactions found.</td></tr>}</tbody></table></div></article>
        <aside className="command-side-stack"><section className="command-panel admin-finance-split"><header><div><span className="command-kicker">Cash movement</span><h2>Financial summary</h2></div></header><div><button onClick={() => navigate("/admin/service-requests")}><span className="finance-in"><TrendingUp size={17}/></span><div><small>Money in</small><strong>{currency(data?.summary.moneyIn)}</strong></div></button><button onClick={() => navigate("/admin/service-requests")}><span className="finance-out"><TrendingDown size={17}/></span><div><small>Money out</small><strong>{currency(data?.summary.moneyOut)}</strong></div></button></div></section><section className="command-panel command-alerts admin-recent"><header><div><span className="command-kicker">Request activity</span><h2>Recently updated</h2></div><Layers3 size={17}/></header><div>{(data?.recentRequests || []).slice(0, 6).map((item) => <button key={item.id} onClick={() => navigate("/admin/service-requests")}><i/><span><strong>{item.requestCode} · {item.serviceName}</strong><small>{item.clientName}</small></span><span className="command-status status-info">{readable(item.status)}</span></button>)}{!data?.recentRequests?.length && <p className="command-empty-line">No submitted requests.</p>}</div></section></aside>
      </section>
    </>}
    {selected && <TransactionDrawer item={selected} onClose={() => setSelected(null)}/>}
  </div>;
}

function Metric({ icon, label, value, note, tone, onClick }) { return <button onClick={onClick} className={`command-metric metric-${tone}`}><span>{createElement(icon, { size: 18 })}</span><div><small>{label}</small><strong>{value}</strong><p>{note}</p></div><ArrowRight size={14}/></button>; }
function TransactionDrawer({ item, onClose }) { return <div className="command-drawer-backdrop" onClick={onClose}><aside className="command-drawer" onClick={(event) => event.stopPropagation()}><header><div><span className="command-kicker">Financial transaction</span><h2>{item.serviceName || item.description}</h2><p>{item.requestCode || "Ledger entry"}</p></div><button onClick={onClose}><X size={18}/></button></header><div className="command-drawer-content"><div className="command-detail-grid"><Detail label="Client" value={item.clientName}/><Detail label="Client code" value={item.clientCode}/><Detail label="Transaction type" value={readable(item.type)}/><Detail label="Account" value={readable(item.accountType)}/><Detail label="Amount" value={currency(item.amount)}/><Detail label="Balance after" value={currency(item.balanceAfter)}/><Detail label="Status" value={readable(item.status)}/><Detail label="Recorded" value={dateTime(item.date)}/></div></div></aside></div>; }
function Detail({ label, value }) { return <div className="command-detail"><small>{label}</small><strong>{value || "—"}</strong></div>; }
