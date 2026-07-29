import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity, CheckCircle2, ChevronRight, Clock3, Download, FileText,
  LoaderCircle, Search, UserRound, Users,
} from "lucide-react";
import {
  downloadWorkflowFile, getWorkflowAdminRequest, listAvailableAgents,
  listWorkflowAdminRequests,
} from "../../services/requestWorkflowService";

const COMPLETED = new Set(["AGENT_COMPLETED", "ADMIN_REVIEW", "APPROVED", "COMPLETED"]);
const readable = (value = "") => value.replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const dateTime = (value) => value
  ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
  : "—";

function workload(activeTasks) {
  if (!activeTasks) return { label: "Available", className: "bg-emerald-100 text-emerald-700" };
  if (activeTasks >= 8) return { label: "Busy", className: "bg-amber-100 text-amber-700" };
  return { label: "Active", className: "bg-blue-100 text-blue-700" };
}

export default function AdminWorkforce() {
  const [agents, setAgents] = useState([]);
  const [requests, setRequests] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskLoading, setTaskLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadWorkforce = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [agentData, requestData] = await Promise.all([
        listAvailableAgents(), listWorkflowAdminRequests(),
      ]);
      const nextAgents = agentData.agents || agentData || [];
      setAgents(nextAgents);
      setRequests(requestData.requests || requestData || []);
      setSelectedAgentId((current) => current || nextAgents[0]?.id || "");
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load workforce data.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { loadWorkforce(); }, [loadWorkforce]);
  useEffect(() => {
    const timer = window.setInterval(() => loadWorkforce(true), 5000);
    return () => window.clearInterval(timer);
  }, [loadWorkforce]);

  const workforce = useMemo(() => agents.map((agent) => {
    const tasks = requests.filter((request) => request.assignment?.agent?.id === agent.id);
    const completed = tasks.filter((request) => COMPLETED.has(request.status)).length;
    return {
      ...agent, tasks, completed,
      active: tasks.filter((request) => !COMPLETED.has(request.status) && request.status !== "REJECTED").length,
      completionRate: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
    };
  }), [agents, requests]);

  const selectedAgent = workforce.find((agent) => agent.id === selectedAgentId);
  const filteredTasks = (selectedAgent?.tasks || []).filter((request) => {
    const text = `${request.requestCode} ${request.service?.name} ${request.client?.name}`.toLowerCase();
    return text.includes(search.toLowerCase()) && (!status || request.status === status);
  });

  const openTask = async (request) => {
    setTaskLoading(true);
    setSelectedTask(null);
    try {
      const data = await getWorkflowAdminRequest(request.id);
      setSelectedTask(data.request || data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load task details.");
    } finally { setTaskLoading(false); }
  };

  return (
    <div className="min-h-full bg-slate-50 p-4 text-slate-900 md:p-7">
      <section
        className="relative mb-6 flex min-h-44 flex-col justify-between gap-5 overflow-hidden rounded-3xl p-7 text-white shadow-xl md:flex-row md:items-end md:p-8"
        style={{ background: "linear-gradient(125deg, #07142f 0%, #102b5f 55%, #174eb5 100%)" }}
      >
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border border-white/10 bg-white/5" />
        <div className="pointer-events-none absolute bottom-0 right-64 h-28 w-28 translate-y-16 rounded-full bg-blue-300/10 blur-xl" />
        <div className="relative z-10 max-w-3xl"><span className="text-xs font-black uppercase tracking-[.22em] text-blue-200">Operations team</span><h1 className="mt-3 text-3xl font-black tracking-tight text-white md:text-4xl">Workforce & Productivity</h1><p className="mt-3 text-sm leading-6 text-blue-100/90">Monitor agents working on client requests, assignments, documents, and completion progress.</p></div>
        <div className="relative z-10 flex gap-3"><Metric value={agents.length} label="Agents" /><Metric value={workforce.reduce((sum, agent) => sum + agent.active, 0)} label="Active tasks" /></div>
      </section>

      {error && <div className="mb-4 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</div>}
      {loading ? <div className="flex h-72 items-center justify-center gap-2 text-slate-500"><LoaderCircle className="animate-spin" /> Loading workforce…</div> : <>
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {workforce.map((agent) => {
            const state = workload(agent.active);
            return <button key={agent.id} type="button" onClick={() => { setSelectedAgentId(agent.id); setSelectedTask(null); }} className={`rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${selectedAgentId === agent.id ? "border-blue-500 ring-2 ring-blue-100" : "border-slate-200"}`}>
              <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-full bg-slate-100 font-black text-slate-600">{agent.name?.slice(0, 1)}</span><div><strong className="block text-sm">{agent.name}</strong><span className="text-xs text-slate-500">{agent.user_code || agent.email}</span></div></div><span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${state.className}`}>{state.label}</span></div>
              <div className="mt-5 flex justify-between text-xs"><span className="text-slate-500">Completion rate</span><strong>{agent.completionRate}%</strong></div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${agent.completionRate}%` }} /></div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-center"><span className="rounded-lg bg-slate-50 p-2 text-xs"><b className="block text-base">{agent.active}</b>Active</span><span className="rounded-lg bg-slate-50 p-2 text-xs"><b className="block text-base">{agent.completed}</b>Completed</span></div>
            </button>;
          })}
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <header className="flex flex-col justify-between gap-3 border-b border-slate-200 p-5 lg:flex-row lg:items-center">
            <div className="flex items-center gap-3"><Users className="text-blue-600" /><div><h2 className="font-black">Tasks: {selectedAgent?.name || "Select an agent"}</h2><p className="text-xs text-slate-500">Client work assigned from the Request Board</p></div></div>
            <div className="flex flex-col gap-2 sm:flex-row"><label className="flex items-center gap-2 rounded-xl border px-3"><Search size={16} /><input className="h-10 outline-none" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks" /></label><select className="h-10 rounded-xl border px-3" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option>{[...new Set((selectedAgent?.tasks || []).map((task) => task.status))].map((item) => <option key={item} value={item}>{readable(item)}</option>)}</select></div>
          </header>
          <div className="grid min-h-[340px] xl:grid-cols-[1.15fr_.85fr]">
            <div className="max-h-[520px] overflow-auto border-r border-slate-200"><table className="w-full min-w-[720px] text-left text-sm"><thead className="sticky top-0 bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-4">Task</th><th className="p-4">Service / Client</th><th className="p-4">Status</th><th className="p-4">Due</th><th className="p-4">Action</th></tr></thead><tbody>{filteredTasks.map((task) => <tr key={task.id} onClick={() => openTask(task)} className="cursor-pointer border-t hover:bg-blue-50/50"><td className="p-4 font-mono font-bold text-blue-700">{task.requestCode}</td><td className="p-4"><strong className="block">{task.service?.name}</strong><span className="text-xs text-slate-500">{task.client?.name}</span></td><td className="p-4"><span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-black uppercase text-blue-700">{readable(task.status)}</span></td><td className="p-4 text-xs">{task.assignment?.dueDate ? dateTime(task.assignment.dueDate) : "Not set"}</td><td className="p-4"><button className="inline-flex items-center gap-1 font-bold text-blue-700">View <ChevronRight size={15} /></button></td></tr>)}{!filteredTasks.length && <tr><td colSpan="5" className="h-56 text-center text-slate-400">No assigned tasks match this view.</td></tr>}</tbody></table></div>
            <TaskDetails task={selectedTask} loading={taskLoading} />
          </div>
        </section>
      </>}
    </div>
  );
}

function Metric({ value, label }) { return <div className="min-w-28 rounded-2xl border border-white/20 bg-white/10 p-4 shadow-inner backdrop-blur-sm"><strong className="block text-2xl font-black text-white">{value}</strong><span className="mt-1 block text-xs font-bold text-blue-100">{label}</span></div>; }

function TaskDetails({ task, loading }) {
  if (loading) return <div className="flex items-center justify-center gap-2 p-8 text-slate-400"><LoaderCircle className="animate-spin" /> Loading task…</div>;
  if (!task) return <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400"><UserRound size={34} /><p className="mt-3">Select a task to view its client documents and workflow details.</p></div>;
  const files = [
    ...(task.documents || []).map((file) => ({ ...file, kind: "original" })),
    ...(task.clarifications || []).flatMap((item) => (item.documents || []).map((file) => ({ ...file, kind: "clarification" }))),
    ...(task.workDocuments || []).map((file) => ({ ...file, kind: "output" })),
  ];
  return <div className="max-h-[520px] overflow-auto p-5"><div className="flex items-center gap-2"><Activity className="text-blue-600" /><h3 className="font-black">{task.requestCode}</h3></div><div className="mt-4 grid grid-cols-2 gap-3 text-sm"><Info icon={<UserRound />} label="Client" value={task.client?.name} /><Info icon={<Clock3 />} label="Due date" value={task.assignment?.dueDate ? dateTime(task.assignment.dueDate) : "Not set"} /><Info icon={<CheckCircle2 />} label="Task status" value={readable(task.status)} /><Info icon={<Users />} label="Agent" value={task.assignment?.agent?.name} /></div><h4 className="mt-6 flex items-center gap-2 font-black"><FileText size={17} /> Client & work documents ({files.length})</h4><div className="mt-3 grid gap-2">{files.map((file) => <article key={`${file.kind}-${file.id}`} className="flex items-center gap-3 rounded-xl border bg-slate-50 p-3"><FileText className="text-blue-600" size={18} /><div className="min-w-0 flex-1"><strong className="block truncate text-sm">{file.name}</strong><span className="text-xs text-slate-500">{readable(file.kind)} document</span></div><button type="button" title="Download" onClick={() => downloadWorkflowFile({ role: "admin", requestId: task.id, kind: file.kind, fileId: file.id, name: file.name })} className="rounded-lg border bg-white p-2 text-blue-700"><Download size={16} /></button></article>)}{!files.length && <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-400">No documents attached.</p>}</div>{task.assignment?.instructions && <div className="mt-5 rounded-xl bg-amber-50 p-4"><span className="text-xs font-black uppercase text-amber-700">Assignment instructions</span><p className="mt-1 text-sm">{task.assignment.instructions}</p></div>}</div>;
}

function Info({ icon, label, value }) { return <div className="rounded-xl bg-slate-50 p-3"><span className="flex items-center gap-1 text-[10px] font-black uppercase text-slate-500">{icon}{label}</span><strong className="mt-2 block text-sm">{value || "—"}</strong></div>; }
