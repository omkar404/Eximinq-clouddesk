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
    { icon: BadgeIndianRupee, key: "finance", label: "Net financial change", value: currency(data?.summary.netChange), note: "Current ledger position", tone: "blue" },
    { icon: Building2, key: "clients", label: "Active clients", value: data?.summary.activeClients || 0, note: "Approved client accounts", tone: "violet" },
    { icon: Users, key: "agents", label: "Active agents", value: data?.summary.activeAgents || 0, note: "Available workforce", tone: "cyan" },
    { icon: AlertTriangle, key: "attention", label: "Action required", value: data?.summary.actionRequired || 0, note: "Pending operational review", tone: "amber" }
  ];

  return <div className="dashboard-page command-center command-center-admin">
    <OnboardingNote />
    <section className="command-hero command-hero-admin"><div><span className="command-eyebrow"><Activity size={13}/> Executive operations console</span><h1>CloudDesk Command Center</h1><p>Live oversight of clients, workforce, requests and financial movement.</p></div><div className="command-hero-actions"><span className="command-live"><i/> Synced {data?.generatedAt ? dateTime(data.generatedAt) : "now"}</span><button onClick={() => load(true)} disabled={refreshing} className="command-icon-button"><RefreshCw size={16} className={refreshing ? "animate-spin" : ""}/></button><button onClick={exportTransactions} className="command-primary"><Download size={15}/> Export ledger</button></div></section>
    {error && <div className="command-error"><AlertTriangle size={17}/><span>{error}</span><button onClick={() => load()}>Retry</button></div>}
    {loading && !data ? <div className="command-loading"><LoaderCircle className="animate-spin"/> Loading executive workspace…</div> : <>
      <section className="command-metrics">{metrics.map((item) => <Metric key={item.label} {...item} onClick={() => setSelected({ metric: item.key, label: item.label })}/>)}</section>
      <section className="command-grid-main admin-command-grid">
        <article className="command-panel command-workstream"><header><div><span className="command-kicker">Financial administration</span><h2>Transaction ledger</h2></div><label className="command-search"><Search size={14}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Client, request or service"/></label></header><div className="command-table-wrap"><table className="admin-command-table"><thead><tr><th>Date</th><th>Client</th><th>Service / Request</th><th>Type</th><th>Amount</th><th>Balance</th><th>Status</th></tr></thead><tbody>{transactions.length ? transactions.slice(0, 12).map((item) => <tr key={item.id} onClick={() => setSelected(item)}><td>{dateTime(item.date)}</td><td><strong>{item.clientName}</strong><small>{item.clientCode}</small></td><td><strong>{item.serviceName || item.description}</strong><small>{item.requestCode || item.description}</small></td><td><span className={`command-status ${item.type === "CREDIT" ? "status-good" : "status-info"}`}>{readable(item.type)}</span></td><td><strong>{currency(item.amount)}</strong></td><td>{currency(item.balanceAfter)}</td><td>{readable(item.status)}</td></tr>) : <tr><td colSpan="7" className="command-empty-cell">No financial transactions found.</td></tr>}</tbody></table></div></article>
        <aside className="command-side-stack"><section className="command-panel admin-finance-split"><header><div><span className="command-kicker">Cash movement</span><h2>Financial summary</h2></div></header><div><button onClick={() => navigate("/admin/service-requests")}><span className="finance-in"><TrendingUp size={17}/></span><div><small>Money in</small><strong>{currency(data?.summary.moneyIn)}</strong></div></button><button onClick={() => navigate("/admin/service-requests")}><span className="finance-out"><TrendingDown size={17}/></span><div><small>Money out</small><strong>{currency(data?.summary.moneyOut)}</strong></div></button></div></section><section className="command-panel command-alerts admin-recent"><header><div><span className="command-kicker">Request activity</span><h2>Recently updated</h2></div><Layers3 size={17}/></header><div>{(data?.recentRequests || []).slice(0, 6).map((item) => <button key={item.id} onClick={() => navigate("/admin/service-requests")}><i/><span><strong>{item.requestCode} · {item.serviceName}</strong><small>{item.clientName}</small></span><span className="command-status status-info">{readable(item.status)}</span></button>)}{!data?.recentRequests?.length && <p className="command-empty-line">No submitted requests.</p>}</div></section></aside>
      </section>
    </>}
    {selected?.metric ? <AdminMetricDrawer metric={selected.metric} label={selected.label} data={data} onClose={() => setSelected(null)} navigate={navigate}/> : selected && <TransactionDrawer item={selected} onClose={() => setSelected(null)}/>}
  </div>;
}

function Metric({ icon, label, value, note, tone, onClick }) { return <button onClick={onClick} className={`command-metric metric-${tone}`}><span>{createElement(icon, { size: 18 })}</span><div><small>{label}</small><strong>{value}</strong><p>{note}</p></div><ArrowRight size={14}/></button>; }
function TransactionDrawer({ item, onClose }) { return <div className="command-drawer-backdrop" onClick={onClose}><aside className="command-drawer" onClick={(event) => event.stopPropagation()}><header><div><span className="command-kicker">Financial transaction</span><h2>{item.serviceName || item.description}</h2><p>{item.requestCode || "Ledger entry"}</p></div><button onClick={onClose}><X size={18}/></button></header><div className="command-drawer-content"><div className="command-detail-grid"><Detail label="Client" value={item.clientName}/><Detail label="Client code" value={item.clientCode}/><Detail label="Transaction type" value={readable(item.type)}/><Detail label="Account" value={readable(item.accountType)}/><Detail label="Amount" value={currency(item.amount)}/><Detail label="Balance after" value={currency(item.balanceAfter)}/><Detail label="Status" value={readable(item.status)}/><Detail label="Recorded" value={dateTime(item.date)}/></div></div></aside></div>; }
function AdminMetricDrawer({ metric, label, data, onClose, navigate }) {
  const users = metric === "clients" ? data?.activeClients || [] : data?.activeAgents || [];
  const requests = (data?.recentRequests || []).filter((item) => ["SUBMITTED", "ADDITIONAL_DOCUMENTS_REQUESTED", "DOCUMENTS_RESUBMITTED", "AGENT_COMPLETED"].includes(item.status));
  const rows = metric === "finance" ? data?.transactions || [] : metric === "attention" ? requests : users;
  return <div className="command-drawer-backdrop metric-modal-backdrop" onClick={onClose}><section className="metric-detail-modal" onClick={(event) => event.stopPropagation()}><header><div><span className="command-kicker">Dashboard category</span><h2>{label}</h2><div className="metric-modal-badges"><span>{rows.length} records</span>{metric === "finance" && <b>Net: {currency(data?.summary.netChange)}</b>}</div></div><button onClick={onClose}><X size={19}/></button></header>{metric === "finance" && <div className="metric-modal-summary"><Detail label="Money in" value={currency(data?.summary.moneyIn)}/><Detail label="Money out" value={currency(data?.summary.moneyOut)}/><Detail label="Net change" value={currency(data?.summary.netChange)}/><Detail label="Ledger entries" value={rows.length}/></div>}<div className="metric-modal-table-wrap"><table><thead><tr>{metric === "finance" ? <><th>Date</th><th>Client</th><th>Service / Request</th><th>Type</th><th>Amount</th><th>Status</th></> : metric === "attention" ? <><th>Request</th><th>Client</th><th>Service</th><th>Submitted</th><th>Status</th></> : <><th>Member</th><th>CloudDesk ID</th><th>Email</th><th>Approval</th></>}</tr></thead><tbody>{rows.length ? rows.map((item) => metric === "finance" ? <tr key={item.id}><td>{dateTime(item.date)}</td><td>{item.clientName}</td><td><strong>{item.serviceName || item.description}</strong><small>{item.requestCode || "Ledger entry"}</small></td><td>{readable(item.type)}</td><td>{currency(item.amount)}</td><td>{readable(item.status)}</td></tr> : metric === "attention" ? <tr key={item.id}><td><strong>{item.requestCode}</strong></td><td>{item.clientName}</td><td>{item.serviceName}</td><td>{dateTime(item.submittedAt)}</td><td><span className="command-status status-warn">{readable(item.status)}</span></td></tr> : <tr key={item.id}><td><strong>{item.name}</strong></td><td>{item.code || "—"}</td><td>{item.email}</td><td><span className="command-status status-good">{readable(item.status)}</span></td></tr>) : <tr><td colSpan="6" className="metric-modal-empty">No records available for this category.</td></tr>}</tbody></table></div><footer><button onClick={() => navigate(metric === "clients" ? "/admin/clients" : metric === "agents" ? "/admin/workforce" : "/admin/service-requests")}>Open full register <ArrowRight size={14}/></button></footer></section></div>;
}
function Detail({ label, value }) { return <div className="command-detail"><small>{label}</small><strong>{value || "—"}</strong></div>; }
