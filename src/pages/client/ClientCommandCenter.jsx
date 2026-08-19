import { createElement, useEffect, useMemo, useState } from "react";
import { FileCheck2, LoaderCircle, Plus, ReceiptText, ShieldCheck, Sparkles } from "lucide-react";
import OnboardingNote from "../../components/onboarding/OnboardingNote";
import { listClientTrackedRequests } from "../../services/requestWorkflowService";

const readable = (value = "") => value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
const tone = (status) => status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" : status === "REJECTED" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700";

export default function ClientCommandCenter() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { listClientTrackedRequests().then(data => setRequests(data.requests || data || [])).catch(() => setRequests([])).finally(() => setLoading(false)); }, []);
  const completed = useMemo(() => requests.filter(item => item.status === "COMPLETED").length, [requests]);
  const active = requests.length - completed;
  return <div className="dashboard-page dashboard-console">
    <OnboardingNote />
    <section className="dashboard-hero relative overflow-hidden p-6 md:p-8"><div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.14em] text-blue-700"><Sparkles size={13}/> Live trade workspace</div><h1 className="premium-page-title">Your operations, beautifully in control.</h1><p className="mt-3 text-sm text-slate-500">Only service requests you actually submit appear here.</p><div className="mt-5 flex gap-2"><button className="premium-button premium-button-secondary"><ReceiptText size={15}/> Match receipts</button><button className="premium-button premium-button-primary"><Plus size={16}/> New request</button></div></section>
    <section className="grid gap-3 lg:grid-cols-3">{[[FileCheck2,active,"Active requests"],[ReceiptText,requests.length,"Total requests"],[ShieldCheck,completed,"Completed"]].map(([Icon,value,label]) => <div key={label} className="premium-metric bg-white p-5">{createElement(Icon, { size: 18, className: "text-blue-600" })}<p className="mt-6 text-2xl font-black">{String(value).padStart(2,"0")}</p><p className="text-xs text-slate-500">{label}</p></div>)}</section>
    <section className="dashboard-table-card overflow-hidden"><div className="border-b px-5 py-4"><p className="premium-kicker">Operations</p><h2 className="mt-1 font-bold">Request ledger</h2></div>
      {loading ? <div className="flex justify-center p-16 text-slate-400"><LoaderCircle className="animate-spin"/></div> : requests.length === 0 ? <div className="p-20 text-center"><FileCheck2 className="mx-auto text-slate-300" size={38}/><h3 className="mt-4 font-bold text-slate-700">No service requests yet</h3><p className="mt-1 text-sm text-slate-400">Requests will appear only after you submit a service application.</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[760px]"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-400"><tr><th className="p-4">Request</th><th className="p-4">Service</th><th className="p-4">Submitted</th><th className="p-4">Status</th></tr></thead><tbody>{requests.map(item => <tr key={item.id} className="border-t"><td className="p-4 font-bold">{item.requestCode || item.request_code}</td><td className="p-4">{item.service?.name || item.serviceName || readable(item.service_slug)}</td><td className="p-4 text-sm text-slate-500">{item.submittedAt || item.submitted_at ? new Date(item.submittedAt || item.submitted_at).toLocaleDateString() : "-"}</td><td className="p-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${tone(item.status)}`}>{readable(item.status)}</span></td></tr>)}</tbody></table></div>}
    </section>
  </div>;
}
