import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle, ArrowLeft, Bell, ChevronRight, Clock3, Download, Eye,
  FileText, LoaderCircle, Search, Upload, UserRound
} from "lucide-react";
import Swal from "sweetalert2";
import {
  getClientTrackedRequest, listClientTrackedRequests,
  downloadWorkflowFile, listClientNotifications, resubmitClarification,
  uploadClarificationDocument, viewWorkflowFile
} from "../../services/requestWorkflowService";

const readable = (value = "") => value.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
const when = (value) => value ? new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium", timeStyle: "short"
}).format(new Date(value)) : "—";

const FIELD_LABELS = {
  requestMode: "Selected Service/Category",
  requestType: "Request Type",
  portCode: "Port of Entry",
  consignmentValue: "Consignment Value (INR)",
  treatmentType: "Phyto-Treatment Method"
};
const HIDDEN_PAYLOAD_KEYS = new Set(["requestId", "documents"]);

function configuredOption(configuration, value) {
  if (value === "" || value == null || typeof value === "object") return null;
  for (const collection of Object.values(configuration || {})) {
    if (!Array.isArray(collection)) continue;
    const option = collection.find((item) => item && typeof item === "object" && (item.id ?? item.value) === value);
    if (option?.label) return option;
  }
  return null;
}

function isCategoryKey(key) {
  return /(type|mode|category|scheme|service|licen[cs]e|certification|tier|class|route|scope)$/i.test(key);
}

function categoryEntries(request) {
  const configuration = request.service?.configuration || {};
  return submittedEntries(request.formData).filter(([key, value]) =>
    isCategoryKey(key) && configuredOption(configuration, value)
  );
}

function displayValue(configuration, key, value) {
  const resolved = configuredOption(configuration, value)?.label || value;
  if (typeof resolved === "boolean") return resolved ? "Yes" : "No";
  if (Array.isArray(resolved)) return resolved.join(", ");
  if (resolved && typeof resolved === "object") return JSON.stringify(resolved);
  if (key === "consignmentValue" && resolved !== "" && resolved != null) {
    return `₹${Number(resolved).toLocaleString("en-IN")}`;
  }
  return resolved === "" || resolved == null ? "—" : String(resolved);
}

function submittedEntries(formData) {
  return Object.entries(formData || {}).flatMap(([key, value]) => {
    if (HIDDEN_PAYLOAD_KEYS.has(key)) return [];
    if (key === "form" && value && typeof value === "object" && !Array.isArray(value)) {
      return Object.entries(value).filter(([nestedKey]) => !HIDDEN_PAYLOAD_KEYS.has(nestedKey));
    }
    return [[key, value]];
  });
}

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
    window.addEventListener("clouddesk:operations-updated", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("clouddesk:operations-updated", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [refresh]);

  const visible = useMemo(() => requests.filter((request) =>
    `${request.requestCode} ${request.service?.name} ${request.status} ${JSON.stringify(request.formData || {})}`.toLowerCase().includes(search.toLowerCase())
  ), [requests, search]);
  const openRequest = async (id) => {
    setLoading(true);
    try { setSelected((await getClientTrackedRequest(id)).request); }
    catch (error) { Swal.fire("Unable to open request", error.response?.data?.message || "The complete request details could not be loaded.", "error"); }
    finally { setLoading(false); }
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
          <div className="max-h-[640px] overflow-auto">
            <table className="w-full min-w-[1080px] table-fixed text-left text-sm">
              <thead className="sticky top-0 z-10 bg-slate-100 text-xs uppercase tracking-wider text-slate-500">
                <tr><th className="w-[150px] p-5">Request No.</th><th className="w-[300px]">Service & Category</th><th className="w-[300px]">Submitted Details</th><th className="w-[110px]">Documents</th><th className="w-[155px]">Submitted</th><th className="w-[165px]">Status</th><th className="w-12" /></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">{loading ? <tr><td colSpan="7" className="p-12 text-center"><LoaderCircle className="mx-auto animate-spin" /></td></tr>
                : visible.map((request) => <tr key={request.id} onClick={() => openRequest(request.id)}
                  className="group cursor-pointer align-top transition hover:bg-blue-50/60">
                  <td className="p-5"><strong className="block text-blue-600">{request.requestCode}</strong><small className="mt-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Click for full details</small></td>
                  <td className="py-5 pr-5"><ServiceHierarchy request={request} /></td>
                  <td className="py-5 pr-4"><RequestSummary request={request} /></td>
                  <td className="py-5 pr-4"><span className="inline-flex rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700">{request.documentCount || 0} files</span></td>
                  <td className="py-5 pr-4 text-xs leading-relaxed text-slate-600">{when(request.submittedAt)}</td>
                  <td className="py-5 pr-4"><Status value={request.status} /><small className="mt-2 block text-slate-400">{request.assignment?.agent?.name || "Awaiting assignment"}</small></td><td className="py-5 pr-3"><button type="button" onClick={(event) => { event.stopPropagation(); openRequest(request.id); }} aria-label={`View ${request.requestCode}`} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-600 transition hover:bg-blue-600 hover:text-white"><Eye size={16}/></button></td></tr>)}
                {!loading && !visible.length && <tr><td colSpan="7" className="p-16 text-center text-slate-500">No submitted requests match your search.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function ServiceHierarchy({ request }) {
  const configuration = request.service?.configuration || {};
  const selections = categoryEntries(request);
  return <div><strong className="block text-[15px] leading-snug text-slate-950">{request.service?.name}</strong><div className="mt-2 flex flex-col items-start gap-1.5">{selections.map(([key, value], index) => <span key={key} className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black ${index % 2 ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>{displayValue(configuration, key, value)}</span>)}</div>{!selections.length && <small className="mt-1 block capitalize text-slate-400">{request.service?.category}</small>}</div>;
}

function RequestSummary({ request }) {
  const configuration = request.service?.configuration || {};
  const selectionKeys = new Set(categoryEntries(request).map(([key]) => key));
  const entries = submittedEntries(request.formData).filter(([key]) => !selectionKeys.has(key)).slice(0, 3);
  return <div className="space-y-1.5">{entries.map(([key, value]) => <div key={key} className="flex min-w-0 gap-2 text-xs"><span className="shrink-0 font-bold text-slate-400">{FIELD_LABELS[key] || readable(key)}:</span><strong className="truncate text-slate-700" title={displayValue(configuration, key, value)}>{displayValue(configuration, key, value)}</strong></div>)}{!entries.length && <span className="text-xs text-slate-400">No additional details</span>}</div>;
}

function RequestDetail({ request, onBack, onUpload, onResubmit, busy, resubmissionComments, onCommentsChange }) {
  const openClarification = request.clarifications?.find((item) => item.status === "OPEN");
  const configuration = request.service?.configuration || {};
  const formEntries = submittedEntries(request.formData);
  const serviceKeys = new Set(categoryEntries(request).map(([key]) => key));
  const serviceEntries = formEntries.filter(([key]) => serviceKeys.has(key));
  const otherEntries = formEntries.filter(([key]) => !serviceKeys.has(key));
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
      <Card title="Service Details" icon={<FileText />}><div className="grid gap-4 sm:grid-cols-2">
        <Info label="Request No." value={request.requestCode} /><Info label="Service Name" value={request.service?.name} />
        {serviceEntries.map(([key, value], index) => <Info key={key} label={index === 0 ? "Category / Type" : FIELD_LABELS[key] || readable(key)} value={displayValue(configuration, key, value)} />)}
        <Info label="Submitted" value={when(request.submittedAt)} /><Info label="Current Status" value={readable(request.status)} />
      </div></Card>
      <Card title="Other Details" icon={<FileText />}><div className="grid gap-4 sm:grid-cols-2">
        {otherEntries.length ? otherEntries.map(([key, value]) => <Info key={key} label={FIELD_LABELS[key] || readable(key)} value={displayValue(configuration, key, value)} />) : <p className="text-sm text-slate-500">No additional details were submitted.</p>}
      </div></Card>
      <Card title="Activity timeline" icon={<Clock3 />}><div className="space-y-5">{request.events?.map((event) =>
        <div key={event.id} className="relative flex gap-4 pl-1"><span className="mt-1 h-3 w-3 rounded-full bg-blue-600 ring-4 ring-blue-50" />
          <div><strong>{event.title}</strong><p className="text-sm text-slate-500">{event.comments}</p><small className="text-slate-400">{when(event.createdAt)} · {event.actorName || "System"}</small></div></div>)}</div></Card>
    </div><div className="space-y-6"><Card title="Documents" icon={<FileText />}>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">{request.documents?.map((file) => <FileRow key={file.id} file={file} kind="original" requestId={request.id} />)}
        {request.clarifications?.flatMap((item) => item.documents || []).map((file) => <FileRow key={`c-${file.id}`} file={file} kind="clarification" requestId={request.id} />)}
        {request.workDocuments?.map((file) => <FileRow key={`o-${file.id}`} file={file} kind="output" requestId={request.id} />)}
        {!request.documents?.length && !request.clarifications?.some((item) => item.documents?.length) && !request.workDocuments?.length && <p className="text-sm text-slate-500">No documents are attached to this request.</p>}</div></Card>
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
  const preview = () => viewWorkflowFile({ role: "client", requestId, kind, fileId: file.id })
    .catch((error) => Swal.fire("Unable to open document", error.response?.data?.message || "Please try again.", "error"));
  const download = () => downloadWorkflowFile({ role: "client", requestId, kind, fileId: file.id, name: file.name })
    .catch((error) => Swal.fire("Download failed", error.response?.data?.message || "Please try again.", "error"));
  return <article className="compact-document-card"><span className="compact-document-icon"><FileText size={16}/></span><div className="min-w-0 flex-1"><strong>{file.label || readable(file.documentKey || "Document")}</strong><small title={file.name}>{file.name}</small></div><div className="compact-document-actions"><button onClick={preview} title="View document"><Eye size={14}/></button><button onClick={download} title="Download document"><Download size={14}/></button></div></article>;
}
