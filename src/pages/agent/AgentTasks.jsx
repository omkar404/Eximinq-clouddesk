import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft, BriefcaseBusiness, CalendarClock, CheckCircle2,
  ChevronRight, FileText, LoaderCircle, Play, Upload, UserRound
} from "lucide-react";
import Swal from "sweetalert2";
import {
  completeAgentTask, downloadWorkflowFile, getAgentTask, listAgentTasks,
  startAgentTask, uploadAgentOutput
} from "../../services/requestWorkflowService";

const readable = (value = "") => value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
const when = (value) => value ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—";

export default function AgentTasks() {
  const [tasks, setTasks] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState("");
  const input = useRef(null);
  const refresh = useCallback(async () => {
    try {
      setTasks((await listAgentTasks()).tasks || []);
      if (selected?.id) setSelected((await getAgentTask(selected.id)).task);
    } finally { setLoading(false); }
  }, [selected?.id]);
  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 5000);
    return () => clearInterval(timer);
  }, [refresh]);
  const open = async (id) => {
    setLoading(true);
    try { setSelected((await getAgentTask(id)).task); } finally { setLoading(false); }
  };
  const start = async () => {
    setBusy(true);
    try { await startAgentTask(selected.id); await open(selected.id); } catch (e) {
      Swal.fire("Unable to start", e.response?.data?.message || "Please try again.", "error");
    } finally { setBusy(false); }
  };
  const upload = async (event) => {
    const file = event.target.files?.[0]; event.target.value = ""; if (!file) return;
    setBusy(true);
    try { await uploadAgentOutput(selected.id, file); await open(selected.id); } catch (e) {
      Swal.fire("Upload failed", e.response?.data?.message || "Please try again.", "error");
    } finally { setBusy(false); }
  };
  const complete = async () => {
    setBusy(true);
    try {
      await completeAgentTask(selected.id, notes);
      await open(selected.id);
      Swal.fire("Work submitted", "The admin has been notified for final review.", "success");
    } catch (e) { Swal.fire("Unable to complete", e.response?.data?.message || "Please try again.", "error"); }
    finally { setBusy(false); }
  };
  if (selected) return <div className="min-h-full bg-slate-50 p-5 lg:p-8"><input ref={input} type="file" className="hidden" onChange={upload} />
    <div className="mx-auto max-w-6xl"><button onClick={() => setSelected(null)} className="mb-5 flex items-center gap-2 font-bold text-slate-500"><ArrowLeft /> My tasks</button>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[.2em] text-blue-600">Agent workdesk</p>
        <h1 className="text-3xl font-black">{selected.requestCode}</h1><p className="text-slate-500">{selected.service?.name} · {selected.client?.name}</p></div><Status value={selected.status} /></header>
      <div className="grid gap-6 lg:grid-cols-[1.25fr_.75fr]"><div className="space-y-6"><Card title="Assignment" icon={<BriefcaseBusiness />}>
        <div className="grid gap-4 sm:grid-cols-2"><Info label="Client" value={selected.client?.name} /><Info label="Due date" value={selected.assignment?.dueDate || "Not specified"} /></div>
        <p className="mt-4 rounded-2xl bg-blue-50 p-4 text-sm text-blue-900">{selected.assignment?.instructions || "Process the submitted application and return the completed work."}</p></Card>
        <Card title="Application data" icon={<FileText />}><pre className="overflow-auto whitespace-pre-wrap rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">{JSON.stringify(selected.formData, null, 2)}</pre></Card>
        <Card title="Activity timeline" icon={<CalendarClock />}><div className="space-y-4">{selected.events?.map((event) =>
          <div key={event.id} className="flex gap-3"><CheckCircle2 size={18} className="mt-1 text-blue-600" /><div><strong>{event.title}</strong><p className="text-sm text-slate-500">{event.comments}</p><small className="text-slate-400">{when(event.createdAt)}</small></div></div>)}</div></Card></div>
        <aside className="space-y-6"><Card title="Source documents" icon={<FileText />}><div className="space-y-2">{(selected.documents || []).map((file) =>
          <button key={`original-${file.id}`} onClick={() => downloadWorkflowFile({ role: "agent", requestId: selected.id, kind: "original", fileId: file.id, name: file.name })} className="block w-full rounded-xl bg-slate-50 p-3 text-left text-sm hover:bg-blue-50">{file.name}</button>)}
          {selected.clarifications.flatMap((c) => c.documents || []).map((file) =>
          <button key={`clarification-${file.id}`} onClick={() => downloadWorkflowFile({ role: "agent", requestId: selected.id, kind: "clarification", fileId: file.id, name: file.name })} className="block w-full rounded-xl bg-amber-50 p-3 text-left text-sm hover:bg-amber-100">{file.name}</button>)}</div></Card>
          <Card title="Agent output" icon={<Upload />}><div className="space-y-2">{selected.workDocuments?.map((file) => <div key={file.id} className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{file.name}</div>)}</div>
            {["ASSIGNED_TO_AGENT", "IN_PROGRESS"].includes(selected.status) && <button disabled={busy} onClick={() => input.current?.click()} className="mt-4 w-full rounded-xl border border-blue-300 px-4 py-3 font-bold text-blue-600">Upload output document</button>}</Card>
          {selected.status === "ASSIGNED_TO_AGENT" && <button disabled={busy} onClick={start} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 p-4 font-black text-white"><Play size={18} /> Start processing</button>}
          {selected.status === "IN_PROGRESS" && <Card title="Complete work" icon={<CheckCircle2 />}><textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Completion notes for admin" className="min-h-28 w-full rounded-xl border p-3" />
            <button disabled={busy} onClick={complete} className="mt-3 w-full rounded-xl bg-slate-950 p-3 font-black text-white">Submit completed work</button></Card>}</aside></div>
    </div></div>;
  return <div className="min-h-full bg-slate-50 p-5 lg:p-8"><div className="mx-auto max-w-7xl"><header className="mb-6"><p className="text-xs font-black uppercase tracking-[.2em] text-blue-600">Agent workdesk</p><h1 className="text-3xl font-black">My Tasks</h1><p className="text-slate-500">Assigned service requests update here in real time.</p></header>
    <section className="overflow-hidden rounded-3xl border bg-white shadow-sm"><div className="max-h-[650px] overflow-auto"><table className="w-full min-w-[800px] text-left text-sm"><thead className="sticky top-0 bg-slate-100 text-xs uppercase text-slate-500"><tr><th className="p-5">Task</th><th>Client</th><th>Service</th><th>Due</th><th>Status</th><th /></tr></thead>
      <tbody className="divide-y">{loading ? <tr><td colSpan="6" className="p-12 text-center"><LoaderCircle className="mx-auto animate-spin" /></td></tr> : tasks.map((task) => <tr key={task.id} onClick={() => open(task.id)} className="cursor-pointer hover:bg-blue-50"><td className="p-5 font-black text-blue-600">{task.requestCode}</td><td>{task.client?.name}</td><td>{task.service?.name}</td><td>{task.assignment?.dueDate || "—"}</td><td><Status value={task.status} /></td><td><ChevronRight /></td></tr>)}</tbody></table></div></section>
  </div></div>;
}
function Card({ title, icon, children }) { return <section className="rounded-3xl border bg-white p-6 shadow-sm"><h2 className="mb-5 flex items-center gap-2 text-lg font-black">{icon}{title}</h2>{children}</section>; }
function Info({ label, value }) { return <div><span className="text-xs font-black uppercase tracking-wider text-slate-400">{label}</span><strong className="mt-1 block">{value || "—"}</strong></div>; }
function Status({ value }) { return <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">{readable(value)}</span>; }
