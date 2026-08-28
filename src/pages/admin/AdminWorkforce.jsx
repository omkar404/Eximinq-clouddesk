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
        className="workspace-overview-hero relative mb-6 flex min-h-44 flex-col justify-between gap-5 overflow-hidden rounded-3xl p-7 md:flex-row md:items-end md:p-8"
      >
        <div className="workspace-hero-orbit" />
        <div className="relative z-10 max-w-3xl"><span className="workspace-hero-eyebrow">Operations team</span><h1>Workforce & Productivity</h1><p>Monitor agents working on client requests, assignments, documents, and completion progress.</p></div>
        <div className="workspace-hero-metrics relative z-10"><Metric value={agents.length} label="Agents" /><Metric value={workforce.reduce((sum, agent) => sum + agent.active, 0)} label="Active tasks" /></div>
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
          <div className="max-h-[430px] overflow-auto"><table className="admin-register-table w-full min-w-[900px] table-fixed text-left text-sm"><thead className="sticky top-0 z-10 bg-[#eaf0f7] text-[10px] uppercase tracking-[.12em] text-slate-500"><tr><th className="w-[18%] px-5 py-3.5">Task Reference</th><th className="w-[30%] px-5 py-3.5">Service & Client</th><th className="w-[18%] px-5 py-3.5">Current Status</th><th className="w-[22%] px-5 py-3.5">Due Date</th><th className="w-[12%] px-5 py-3.5 text-right">Details</th></tr></thead><tbody>{filteredTasks.map((task) => <tr key={task.id} onClick={() => openTask(task)} className="group cursor-pointer"><td className="px-5 py-4"><strong className="block font-mono text-blue-700">{task.requestCode}</strong><span className="mt-1 block text-[9px] font-black uppercase tracking-wider text-slate-400">Assigned task</span></td><td className="px-5 py-4"><strong className="block text-slate-800">{task.service?.name}</strong><span className="mt-1 inline-flex rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">Client: {task.client?.name}</span></td><td className="px-5 py-4"><span className="rounded-full bg-blue-50 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wide text-blue-700">{readable(task.status)}</span></td><td className="px-5 py-4"><strong className="block text-xs text-slate-700">{task.assignment?.dueDate ? dateTime(task.assignment.dueDate) : "Not scheduled"}</strong><span className={`mt-1 block text-[10px] font-semibold ${task.assignment?.dueDate ? "text-amber-600" : "text-slate-400"}`}>{task.assignment?.dueDate ? "Processing deadline" : "No deadline assigned"}</span></td><td className="px-5 py-4 text-right"><button className="inline-flex items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-[10px] font-black uppercase text-blue-700 transition group-hover:bg-blue-600 group-hover:text-white">View <ChevronRight size={14} /></button></td></tr>)}{!filteredTasks.length && <tr><td colSpan="5" className="h-56 text-center text-slate-400">No assigned tasks match this view.</td></tr>}</tbody></table></div>
          {(taskLoading || selectedTask) && <div className="border-t border-slate-200 bg-slate-50/60"><TaskDetails task={selectedTask} loading={taskLoading} /></div>}
        </section>
      </>}
    </div>
  );
}

function Metric({ value, label }) { return <div className="workspace-hero-metric"><strong>{value}</strong><span>{label}</span></div>; }

function TaskDetails({ task, loading }) {
  if (loading) return <div className="flex items-center justify-center gap-2 p-8 text-slate-400"><LoaderCircle className="animate-spin" /> Loading task…</div>;
  if (!task) return <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400"><UserRound size={34} /><p className="mt-3">Select a task to view its client documents and workflow details.</p></div>;
  const files = [
    ...(task.documents || []).map((file) => ({ ...file, kind: "original" })),
    ...(task.clarifications || []).flatMap((item) => (item.documents || []).map((file) => ({ ...file, kind: "clarification" }))),
    ...(task.workDocuments || []).map((file) => ({ ...file, kind: "output" })),
  ];
  return <div className="max-h-[520px] overflow-auto p-5"><div className="flex items-center gap-2"><Activity className="text-blue-600" /><h3 className="font-black">{task.requestCode}</h3></div><div className="mt-4 grid grid-cols-2 gap-3 text-sm"><Info icon={<UserRound />} label="Client" value={task.client?.name} /><Info icon={<Clock3 />} label="Due date" value={task.assignment?.dueDate ? dateTime(task.assignment.dueDate) : "Not set"} /><Info icon={<CheckCircle2 />} label="Task status" value={readable(task.status)} /><Info icon={<Users />} label="Agent" value={task.assignment?.agent?.name} /></div><h4 className="mt-6 flex items-center gap-2 font-black"><FileText size={17} /> Client & work documents ({files.length})</h4><div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{files.map((file) => <article key={`${file.kind}-${file.id}`} className="compact-document-card"><span className="compact-document-icon"><FileText size={16}/></span><div className="min-w-0 flex-1"><strong>{file.name}</strong><small>{readable(file.kind)} document</small></div><div className="compact-document-actions"><button type="button" title="Download" onClick={() => downloadWorkflowFile({ role: "admin", requestId: task.id, kind: file.kind, fileId: file.id, name: file.name })}><Download size={14}/></button></div></article>)}{!files.length && <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-400 sm:col-span-2 xl:col-span-3">No documents attached.</p>}</div>{task.assignment?.instructions && <div className="mt-5 rounded-xl bg-amber-50 p-4"><span className="text-xs font-black uppercase text-amber-700">Assignment instructions</span><p className="mt-1 text-sm">{task.assignment.instructions}</p></div>}</div>;
}

function Info({ icon, label, value }) { return <div className="rounded-xl bg-slate-50 p-3"><span className="flex items-center gap-1 text-[10px] font-black uppercase text-slate-500">{icon}{label}</span><strong className="mt-2 block text-sm">{value || "—"}</strong></div>; }
