import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle, ArrowLeft, Bell, Calendar, CheckCircle2, ChevronRight,
  Clock3, FileText, LoaderCircle, Search, Upload, UserRound
} from "lucide-react";
import Swal from "sweetalert2";
import {
  getClientTrackedRequest, listClientTrackedRequests,
  downloadWorkflowFile, listClientNotifications, resubmitClarification, uploadClarificationDocument
} from "../../services/requestWorkflowService";

const readable = (value = "") => value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
const when = (value) => value ? new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium", timeStyle: "short"
}).format(new Date(value)) : "—";

export default function ClientTrackRequests() {
  const [requests, setRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const fileInput = useRef(null);
  const [uploadTarget, setUploadTarget] = useState(null);
  const [resubmissionComments, setResubmissionComments] = useState("");

  const refresh = useCallback(async () => {
    try {
      const [data, notificationData] = await Promise.all([
        listClientTrackedRequests(), listClientNotifications()
      ]);
      setRequests(data.requests || []);
      setNotifications(notificationData.notifications || []);
      if (selected?.id) {
        const detail = await getClientTrackedRequest(selected.id);
        setSelected(detail.request);
      }
    } finally { setLoading(false); }
  }, [selected?.id]);

  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, 5000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const visible = useMemo(() => requests.filter((request) =>
    `${request.requestCode} ${request.service?.name} ${request.status}`.toLowerCase().includes(search.toLowerCase())
  ), [requests, search]);
  const openRequest = async (id) => {
    setLoading(true);
    try { setSelected((await getClientTrackedRequest(id)).request); } finally { setLoading(false); }
  };
  const chooseFile = (clarification, label) => {
    setUploadTarget({ clarification, label });
    fileInput.current?.click();
  };
  const uploadFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !uploadTarget) return;
    setBusy(true);
    try {
      await uploadClarificationDocument(uploadTarget.clarification.id, file, uploadTarget.label);
      await openRequest(selected.id);
      Swal.fire({ icon: "success", title: "Document uploaded", timer: 1300, showConfirmButton: false });
    } catch (error) {
      Swal.fire("Upload failed", error.response?.data?.message || "Please try again.", "error");
    } finally { setBusy(false); }
  };
  const submitDocuments = async (clarification) => {
    setBusy(true);
    try {
      await resubmitClarification(
        clarification.id,
        resubmissionComments.trim() || "Requested documents uploaded by client."
      );
      await openRequest(selected.id);
      setResubmissionComments("");
      Swal.fire("Documents resubmitted", "The admin has been notified immediately.", "success");
    } catch (error) {
      Swal.fire("Unable to resubmit", error.response?.data?.message || "Please upload the requested files.", "error");
    } finally { setBusy(false); }
  };

  if (selected) return <><input ref={fileInput} type="file" className="hidden" onChange={uploadFile}
    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx" /><RequestDetail request={selected} onBack={() => setSelected(null)}
    onUpload={chooseFile} onResubmit={submitDocuments} busy={busy}
    resubmissionComments={resubmissionComments} onCommentsChange={setResubmissionComments} /></>;
  return (
    <div className="min-h-full bg-slate-50/70 p-4 sm:p-6 lg:p-8">
      <input ref={fileInput} type="file" className="hidden" onChange={uploadFile}
        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx" />
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><p className="text-xs font-black uppercase tracking-[.2em] text-blue-600">Live request workspace</p>
            <h1 className="mt-2 text-3xl font-black text-slate-950">Track Requests</h1>
            <p className="mt-1 text-sm text-slate-500">Follow every submission, clarification, assignment, and approval.</p></div>
          <div className="flex items-center gap-3"><div className="relative rounded-2xl border bg-white p-3 text-slate-500 shadow-sm" title={`${notifications.filter((item) => !item.is_read).length} unread notifications`}>
            <Bell size={19} />{notifications.some((item) => !item.is_read) && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500" />}</div>
            <label className="flex items-center gap-2 rounded-2xl border bg-white px-4 py-3 shadow-sm">
              <Search size={17} className="text-slate-400" /><input value={search}
                onChange={(e) => setSearch(e.target.value)} placeholder="Search requests" className="outline-none" /></label></div>
        </header>
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="max-h-[620px] overflow-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="sticky top-0 z-10 bg-slate-100 text-xs uppercase tracking-wider text-slate-500">
                <tr><th className="p-5">Request</th><th>Service</th><th>Submitted</th><th>Assigned to</th><th>Status</th><th /></tr>
              </thead>
              <tbody className="divide-y">{loading ? <tr><td colSpan="6" className="p-12 text-center"><LoaderCircle className="mx-auto animate-spin" /></td></tr>
                : visible.map((request) => <tr key={request.id} onClick={() => openRequest(request.id)}
                  className="cursor-pointer transition hover:bg-blue-50/50">
                  <td className="p-5"><strong className="text-blue-600">{request.requestCode}</strong></td>
                  <td><strong>{request.service?.name}</strong><small className="block text-slate-400">{request.service?.category}</small></td>
                  <td>{when(request.submittedAt)}</td><td>{request.assignment?.agent?.name || "Awaiting assignment"}</td>
                  <td><Status value={request.status} /></td><td><ChevronRight /></td></tr>)}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function RequestDetail({ request, onBack, onUpload, onResubmit, busy, resubmissionComments, onCommentsChange }) {
  const openClarification = request.clarifications?.find((item) => item.status === "OPEN");
  const filesFor = (clarification, label) =>
    clarification.documents?.filter((document) => document.label === label) || [];
  return <div className="min-h-full bg-slate-50/70 p-4 sm:p-6 lg:p-8"><div className="mx-auto max-w-7xl">
    <button onClick={onBack} className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-500"><ArrowLeft size={18} /> All requests</button>
    <header className="mb-6 flex flex-wrap items-center gap-3"><div><h1 className="text-3xl font-black">{request.requestCode}</h1>
      <p className="text-slate-500">{request.service?.name} · {request.service?.category}</p></div><Status value={request.status} /></header>
    {openClarification && <section className="mb-6 rounded-3xl border border-amber-200 bg-amber-50 p-5">
      <div className="flex gap-3"><AlertTriangle className="text-amber-600" /><div className="flex-1"><h2 className="font-black text-amber-900">Action required: additional documents</h2>
        <p className="mt-1 text-sm text-amber-800">{openClarification.comments}</p>
        {openClarification.dueDate && <p className="mt-2 text-xs font-bold">Due {openClarification.dueDate}</p>}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">{openClarification.requestedDocuments.map((label) =>
          <article key={label} className="rounded-2xl border border-amber-200 bg-white p-4"><strong>{label}</strong>
            {filesFor(openClarification, label).map((file) => <small key={file.id} className="mt-1 block text-emerald-600">✓ {file.name}</small>)}
            <button disabled={busy} onClick={() => onUpload(openClarification, label)}
              className="mt-3 flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white"><Upload size={14} /> Upload file</button></article>)}</div>
        <label className="mt-4 block text-xs font-black uppercase tracking-wider text-amber-900">Response to admin (optional)</label>
        <textarea value={resubmissionComments} onChange={(event) => onCommentsChange(event.target.value)} rows="3"
          placeholder="Add the requested information or explain the uploaded documents"
          className="mt-2 w-full rounded-2xl border border-amber-200 bg-white p-3 text-sm outline-none focus:border-blue-500" />
        <button disabled={busy || !openClarification.documents?.length} onClick={() => onResubmit(openClarification)}
          className="mt-4 rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white disabled:opacity-40">Resubmit to Admin</button>
      </div></div></section>}
    <div className="grid gap-6 lg:grid-cols-[1.5fr_.8fr]"><div className="space-y-6">
      <Card title="Request details" icon={<FileText />}><div className="grid gap-4 sm:grid-cols-2">
        <Info label="Service" value={request.service?.name} /><Info label="Submitted" value={when(request.submittedAt)} />
        <Info label="Assigned agent" value={request.assignment?.agent?.name || "Not assigned"} />
        <Info label="Current status" value={readable(request.status)} /></div></Card>
      <Card title="Activity timeline" icon={<Clock3 />}><div className="space-y-5">{request.events?.map((event) =>
        <div key={event.id} className="relative flex gap-4 pl-1"><span className="mt-1 h-3 w-3 rounded-full bg-blue-600 ring-4 ring-blue-50" />
          <div><strong>{event.title}</strong><p className="text-sm text-slate-500">{event.comments}</p><small className="text-slate-400">{when(event.createdAt)} · {event.actorName || "System"}</small></div></div>)}</div></Card>
    </div><div className="space-y-6"><Card title="Documents" icon={<FileText />}>
      <div className="space-y-2">{request.documents?.map((file) => <FileRow key={file.id} file={file} kind="original" requestId={request.id} />)}
        {request.clarifications?.flatMap((item) => item.documents || []).map((file) => <FileRow key={`c-${file.id}`} file={file} kind="clarification" requestId={request.id} />)}
        {request.workDocuments?.map((file) => <FileRow key={`o-${file.id}`} file={file} kind="output" requestId={request.id} />)}</div></Card>
      {request.assignment && <Card title="Agent assignment" icon={<UserRound />}><Info label="Agent" value={request.assignment.agent?.name} />
        <p className="mt-3 text-sm text-slate-500">{request.assignment.instructions}</p></Card>}</div></div>
  </div></div>;
}
function Card({ title, icon, children }) { return <section className="rounded-3xl border bg-white p-6 shadow-sm"><h2 className="mb-5 flex items-center gap-2 text-lg font-black">{icon}{title}</h2>{children}</section>; }
function Info({ label, value }) { return <div><span className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</span><strong className="mt-1 block">{value || "—"}</strong></div>; }
function Status({ value }) {
  const attention = ["ADDITIONAL_DOCUMENTS_REQUESTED", "REJECTED"].includes(value);
  const done = ["COMPLETED", "APPROVED"].includes(value);
  const label = value === "ADDITIONAL_DOCUMENTS_REQUESTED" ? "Needs Clarification" : readable(value);
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${attention ? "bg-amber-100 text-amber-700" : done ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>{label}</span>;
}
function FileRow({ file, kind, requestId }) {
  return <button onClick={() => downloadWorkflowFile({ role: "client", requestId, kind, fileId: file.id, name: file.name })}
    className="flex w-full items-center justify-between rounded-xl bg-slate-50 p-3 text-left text-sm hover:bg-blue-50"><span>{file.name}</span><span className="text-xs font-bold text-blue-600">Download</span></button>;
}
