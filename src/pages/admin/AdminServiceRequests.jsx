import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownToLine, Building2, CalendarClock, CheckCircle2, ChevronRight,
  CircleDollarSign, FileText, LoaderCircle, Plus, Search, Trash2, UserRound, X,
} from "lucide-react";
import {
  downloadAdminServiceRequestDocument, getAdminServiceRequest,
  listAdminServiceRequests,
} from "../../services/adminServiceRequestService";
import {
  assignWorkflowAgent, decideWorkflowRequest, downloadWorkflowFile,
  listAvailableAgents, startAdminReview, startRequestReview, updateWorkflowRequestStatus
} from "../../services/requestWorkflowService";
import "./AdminServiceRequests.css";

const STATUSES = ["SUBMITTED", "UNDER_REVIEW", "ADDITIONAL_DOCUMENTS_REQUESTED", "DOCUMENTS_RESUBMITTED", "ASSIGNED_TO_AGENT", "IN_PROGRESS", "AGENT_COMPLETED", "ADMIN_REVIEW", "APPROVED", "COMPLETED", "REJECTED"];
const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(value || 0));
const dateTime = (value) => value ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—";
const readable = (value = "") => value.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const statusLabel = (value = "") => value === "ADDITIONAL_DOCUMENTS_REQUESTED" ? "Needs Clarification" : readable(value);
const displayValue = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  return typeof value === "object" ? JSON.stringify(value) : String(value);
};
const flattenFormData = (value, prefix = "") => {
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, child]) => {
    if (key === "documents") return [];
    const label = prefix ? `${prefix} / ${readable(key)}` : readable(key);
    if (child && typeof child === "object" && !Array.isArray(child)) return flattenFormData(child, label);
    return [{ label, value: displayValue(child) }];
  });
};

const createActionForm = () => ({
  documents: [],
  comments: "",
  dueDate: "",
  agentId: "",
  instructions: "",
});

export default function AdminServiceRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [agents, setAgents] = useState([]);
  const [action, setAction] = useState("");
  const [actionForm, setActionForm] = useState(createActionForm);

  const loadRequests = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const data = await listAdminServiceRequests({ search, status });
      setRequests(data.requests || data || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load service requests.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    const timer = window.setTimeout(loadRequests, 250);
    return () => window.clearTimeout(timer);
  }, [loadRequests]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      loadRequests(true);
      if (selected?.id) {
        getAdminServiceRequest(selected.id)
          .then((data) => setSelected(data.request || data))
          .catch(() => {});
      }
    }, 5000);
    return () => window.clearInterval(timer);
  }, [loadRequests, selected?.id]);

  useEffect(() => {
    listAvailableAgents().then((data) => setAgents(data.agents || [])).catch(() => setAgents([]));
  }, []);

  const openRequest = async (requestId) => {
    setDetailLoading(true);
    setSelected(null);
    try {
      const data = await getAdminServiceRequest(requestId);
      const request = data.request || data;
      setSelected(request);
        setAction("");
        setActionForm(createActionForm());
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to open this request.");
    } finally {
      setDetailLoading(false);
    }
  };

  const selectWorkflowAction = (nextAction) => {
    setAction(nextAction);
    setActionForm({
      ...createActionForm(),
      documents: nextAction === "clarification" ? [""] : [],
    });
  };

  const runWorkflowAction = async () => {
    if (!selected) return;
    if (action === "clarification" && !actionForm.documents.some((document) => document.trim())) {
      setError("Add at least one required document before submitting the clarification request.");
      return;
    }
    setSaving(true);
    try {
      if (action === "clarification") {
        await updateWorkflowRequestStatus(selected.id, {
          status: "NEEDS_CLARIFICATION",
      requestedDocuments: actionForm.documents.map((item) => item.trim()).filter(Boolean),
          comments: actionForm.comments, dueDate: actionForm.dueDate || null
        });
      } else if (action === "initial-review") {
        await startRequestReview(selected.id);
      } else if (action === "assign") {
        await assignWorkflowAgent(selected.id, {
          agentId: actionForm.agentId, instructions: actionForm.instructions,
          dueDate: actionForm.dueDate || null
        });
      } else if (action === "review") {
        await startAdminReview(selected.id);
      } else if (action === "approve" || action === "reject") {
        await decideWorkflowRequest(selected.id, {
          decision: action === "approve" ? "APPROVED" : "REJECTED",
          comments: actionForm.comments
        });
      }
      await openRequest(selected.id);
      await loadRequests();
      setAction("");
    setActionForm(createActionForm());
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to complete this workflow action.");
    } finally { setSaving(false); }
  };

  const metrics = useMemo(() => ({
    total: requests.length,
    action: requests.filter((item) => [
      "SUBMITTED", "UNDER_REVIEW", "ADDITIONAL_DOCUMENTS_REQUESTED",
      "DOCUMENTS_RESUBMITTED", "IN_PROGRESS", "AGENT_COMPLETED", "ADMIN_REVIEW",
    ].includes(item.status)).length,
    done: requests.filter((item) => ["APPROVED", "COMPLETED"].includes(item.status)).length,
  }), [requests]);
  const fields = useMemo(() => flattenFormData(selected?.formData), [selected?.formData]);

  return (
    <div className="admin-requests-page">
      <section className="admin-requests-hero">
        <div><span className="eyebrow">Operations workspace</span><h1>Request Board</h1><p>Review client submissions, documents, payments, assignments, and processing status.</p></div>
        <div className="request-metrics">
          <div><strong>{metrics.total}</strong><span>Total requests</span></div>
          <div><strong>{metrics.action}</strong><span>Needs action</span></div>
          <div><strong>{metrics.done}</strong><span>Completed</span></div>
        </div>
      </section>

      <section className="admin-requests-panel">
        <div className="request-toolbar">
          <label><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search request, client, email, or service" /></label>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">All statuses</option>
            {STATUSES.map((option) => <option key={option} value={option}>{statusLabel(option)}</option>)}
          </select>
        </div>
        {error && <div className="request-error">{error}</div>}
        <div className="request-table-wrap">
          <table>
            <thead><tr><th>Request</th><th>Client</th><th>Service</th><th>Submitted</th><th>Payment</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="7" className="request-empty"><LoaderCircle className="spin" /> Loading requests…</td></tr>
                : requests.length === 0 ? <tr><td colSpan="7" className="request-empty">No submitted service requests found.</td></tr>
                  : requests.map((request) => (
                    <tr key={request.id} onClick={() => openRequest(request.id)}>
                      <td><strong>{request.requestCode}</strong><small>{request.serviceSlug}</small></td>
                      <td><strong>{request.client?.name}</strong><small>{request.client?.email}</small></td>
                      <td>{request.service?.name}</td><td>{dateTime(request.submittedAt)}</td>
                      <td><strong>{money(request.pricing?.total)}</strong></td>
                      <td><span className={`request-status status-${request.status?.toLowerCase()}`}>{statusLabel(request.status)}</span></td>
                      <td><button type="button" onClick={(event) => { event.stopPropagation(); openRequest(request.id); }} className="request-manage-button">Manage <ChevronRight size={16} /></button></td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </section>

      {(selected || detailLoading) && (
        <div className="request-drawer-backdrop" onMouseDown={() => !detailLoading && setSelected(null)}>
          <aside className="request-drawer" onMouseDown={(event) => event.stopPropagation()}>
            {detailLoading ? <div className="drawer-loading"><LoaderCircle className="spin" /> Loading complete application…</div> : selected && (
              <>
                <header className="drawer-header">
                  <div><span>{selected.requestCode}</span><h2>{selected.service?.name}</h2><p>Submitted {dateTime(selected.submittedAt)}</p></div>
                  <button type="button" onClick={() => setSelected(null)} aria-label="Close"><X /></button>
                </header>
                <div className="drawer-scroll">
                  <section className="summary-grid">
                    <article><UserRound /><span>Client</span><strong>{selected.client?.name}</strong><small>{selected.client?.email}</small></article>
                    <article><Building2 /><span>Service</span><strong>{selected.service?.name}</strong><small>{selected.serviceSlug}</small></article>
                    <article><CalendarClock /><span>Submitted</span><strong>{dateTime(selected.submittedAt)}</strong><small>Created {dateTime(selected.createdAt)}</small></article>
                    <article><CircleDollarSign /><span>Total payable</span><strong>{money(selected.pricing?.total)}</strong><small>Payment captured</small></article>
                  </section>
                  <DetailTitle icon={<FileText />} title="Application fields" subtitle="Complete form data submitted by the client">
                    <div className="field-grid">{fields.length ? fields.map((field) => <div key={field.label}><span>{field.label}</span><strong>{field.value}</strong></div>) : <p>No form fields were stored.</p>}</div>
                  </DetailTitle>
                  <DetailTitle icon={<FileText />} title="Supporting documents" subtitle={`${selected.documents?.length || 0} uploaded files`}>
                    <div className="documents-list">{selected.documents?.length ? selected.documents.map((documentItem) => (
                      <article key={documentItem.id}><FileText /><div><strong>{documentItem.name}</strong><span>{readable(documentItem.documentKey)} · {documentItem.mimeType || "File"} · {dateTime(documentItem.uploadedAt)}</span></div>
                        <button type="button" onClick={() => downloadAdminServiceRequestDocument(selected.id, documentItem.id, documentItem.name)}><ArrowDownToLine size={17} /> Download</button></article>
                    )) : <p>No documents were uploaded.</p>}</div>
                  </DetailTitle>
                  <DetailTitle icon={<CircleDollarSign />} title="Transaction details" subtitle="Wallet and corporate credit line deductions">
                    <div className="pricing-grid">
                      <Price label="Official fee" value={selected.pricing?.officialFee} account="Prepaid Wallet" />
                      <Price label="Service charge" value={selected.pricing?.serviceCharge} account="Corporate Credit Line" />
                      <Price label="GST" value={selected.pricing?.gst} account="Corporate Credit Line" />
                      <Price label="Total" value={selected.pricing?.total} account="Captured on submission" />
                    </div>
                    <div className="transactions-list">{selected.transactions?.map((transaction) => (
                      <article key={transaction.id}><CheckCircle2 /><div><strong>{transaction.description}</strong><span>{readable(transaction.accountType)} · {dateTime(transaction.transactionDate)}</span></div><div><strong>{money(transaction.amount)}</strong><span>Balance: {money(transaction.balanceAfter)}</span></div></article>
                    ))}</div>
                  </DetailTitle>
                  <DetailTitle icon={<CalendarClock />} title="Workflow timeline" subtitle="Synchronized client, admin, and agent activity">
                    <div className="transactions-list">{selected.events?.map((event) => (
                      <article key={event.id}><CheckCircle2 /><div><strong>{event.title}</strong>
                        <span>{event.comments || readable(event.status)} · {dateTime(event.createdAt)} · {event.actorName || "System"}</span></div></article>
                    ))}</div>
                  </DetailTitle>
                  {selected.clarifications?.length > 0 && <DetailTitle icon={<FileText />} title="Additional document requests" subtitle="Client clarification exchange">
                    <div className="documents-list">{selected.clarifications.map((clarification) => <article key={clarification.id}><FileText /><div>
                      <strong>{clarification.requestedDocuments?.join(", ")}</strong><span>{clarification.comments} · {statusLabel(clarification.status)}</span>
                      {clarification.documents?.map((document) => <button key={document.id} onClick={() => downloadWorkflowFile({ role: "admin", requestId: selected.id, kind: "clarification", fileId: document.id, name: document.name })}>{document.name} · Download</button>)}</div></article>)}</div>
                  </DetailTitle>}
                  {selected.assignment && <DetailTitle icon={<UserRound />} title="Agent assignment" subtitle={readable(selected.assignment.status)}>
                    <div className="field-grid"><div><span>Agent</span><strong>{selected.assignment.agent?.name}</strong></div>
                      <div><span>Due date</span><strong>{selected.assignment.dueDate || "—"}</strong></div>
                      <div><span>Instructions</span><strong>{selected.assignment.instructions || "—"}</strong></div>
                      <div><span>Completion notes</span><strong>{selected.assignment.completionNotes || "—"}</strong></div></div>
                    <div className="documents-list">{selected.workDocuments?.map((document) => <article key={document.id}><FileText /><div><strong>{document.name}</strong><span>Agent output document</span></div>
                      <button onClick={() => downloadWorkflowFile({ role: "admin", requestId: selected.id, kind: "output", fileId: document.id, name: document.name })}>Download</button></article>)}</div>
                  </DetailTitle>}
                  <DetailTitle icon={<CheckCircle2 />} title="Update status" subtitle="Every saved change is synchronized to the client dashboard">
              <select value={action} onChange={(event) => selectWorkflowAction(event.target.value)} className="mb-4 w-full rounded-xl border border-slate-300 bg-white p-3 font-bold text-slate-800">
                      <option value="">Choose next workflow action</option>
                      {["SUBMITTED", "DOCUMENTS_RESUBMITTED"].includes(selected.status) && <option value="initial-review">Under Review</option>}
                      {["SUBMITTED", "UNDER_REVIEW", "DOCUMENTS_RESUBMITTED", "ADMIN_REVIEW"].includes(selected.status) && <option value="clarification">Needs Clarification</option>}
                      {["SUBMITTED", "UNDER_REVIEW", "DOCUMENTS_RESUBMITTED", "ADMIN_REVIEW"].includes(selected.status) && <option value="assign">Assigned to Agent</option>}
                      {selected.status === "AGENT_COMPLETED" && <option value="review">Admin Review</option>}
                      {["AGENT_COMPLETED", "ADMIN_REVIEW"].includes(selected.status) && <option value="approve">Approved / Completed</option>}
                      {["AGENT_COMPLETED", "ADMIN_REVIEW"].includes(selected.status) && <option value="reject">Rejected</option>}
                    </select>
                    <div className="flex flex-wrap gap-2">
              {["SUBMITTED", "DOCUMENTS_RESUBMITTED"].includes(selected.status) &&
                <button className="rounded-xl border border-blue-300 px-4 py-2 font-bold text-blue-700" onClick={() => selectWorkflowAction("initial-review")}>Start review</button>}
              {["SUBMITTED", "UNDER_REVIEW", "DOCUMENTS_RESUBMITTED", "ADMIN_REVIEW"].includes(selected.status) && <>
                <button className="rounded-xl border px-4 py-2 font-bold text-amber-700" onClick={() => selectWorkflowAction("clarification")}>Needs clarification</button>
                <button className="rounded-xl bg-blue-600 px-4 py-2 font-bold text-white" onClick={() => selectWorkflowAction("assign")}>Assign agent</button></>}
              {selected.status === "AGENT_COMPLETED" && <button className="rounded-xl bg-blue-600 px-4 py-2 font-bold text-white" onClick={() => selectWorkflowAction("review")}>Start admin review</button>}
              {["AGENT_COMPLETED", "ADMIN_REVIEW"].includes(selected.status) && <>
                <button className="rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white" onClick={() => selectWorkflowAction("approve")}>Approve & complete</button>
                <button className="rounded-xl bg-rose-600 px-4 py-2 font-bold text-white" onClick={() => selectWorkflowAction("reject")}>Reject</button></>}
            </div>
            {action && <div className="mt-4 grid gap-3 rounded-2xl bg-slate-50 p-4">
              {action === "clarification" && (
                <section className="clarification-documents" aria-label="Required documents">
                  <div className="clarification-documents__header">
                    <label className="clarification-documents__label">Required documents</label>
                    <button
                      type="button"
                      className="clarification-documents__add"
                      onClick={() =>
                        setActionForm((value) => ({
                          ...value,
                          documents: [...value.documents, ""],
                        }))
                      }
                    >
                      <Plus size={15} aria-hidden="true" /> Add document
                    </button>
                  </div>
                  <div className="clarification-documents__list">
                    {actionForm.documents.length === 0 ? (
                      <p className="clarification-documents__empty">
                        No documents added yet. Use Add document to create a requirement.
                      </p>
                    ) : (
                      actionForm.documents.map((document, index) => (
                        <div className="clarification-document-row" key={`required-document-${index}`}>
                          <input
                            className="clarification-document-input"
                            placeholder={`Required document ${index + 1}`}
                            value={document}
                            onChange={(event) =>
                              setActionForm((value) => ({
                                ...value,
                                documents: value.documents.map((entry, entryIndex) =>
                                  entryIndex === index ? event.target.value : entry
                                ),
                              }))
                            }
                          />
                          <button
                            type="button"
                            className="clarification-document-remove"
                            aria-label={`Remove required document ${index + 1}`}
                            onClick={() =>
                              setActionForm((value) => ({
                                ...value,
                                documents: value.documents.filter((_, documentIndex) => documentIndex !== index),
                              }))
                            }
                          >
                            <Trash2 size={14} aria-hidden="true" /> Remove
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              )}
                      {action === "assign" && <select className="rounded-xl border p-3" value={actionForm.agentId} onChange={(e) => setActionForm((v) => ({ ...v, agentId: e.target.value }))}><option value="">Select agent</option>{agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name} ({agent.active_tasks} active)</option>)}</select>}
                      {["clarification", "approve", "reject"].includes(action) && <textarea className="rounded-xl border p-3" placeholder={action === "clarification" ? "Explain the missing information and what the client must correct" : "Comments or instructions"} value={actionForm.comments} onChange={(e) => setActionForm((v) => ({ ...v, comments: e.target.value }))} />}
                      {action === "assign" && <textarea className="rounded-xl border p-3" placeholder="Agent instructions" value={actionForm.instructions} onChange={(e) => setActionForm((v) => ({ ...v, instructions: e.target.value }))} />}
                      {["clarification", "assign"].includes(action) && <input type="date" className="rounded-xl border p-3" value={actionForm.dueDate} onChange={(e) => setActionForm((v) => ({ ...v, dueDate: e.target.value }))} />}
              <div className="flex gap-2"><button disabled={saving} onClick={runWorkflowAction} className="rounded-xl bg-slate-950 px-4 py-2 font-bold text-white">{action === "clarification" ? "Submit Request" : "Save Status"}</button><button onClick={() => { setAction(""); setActionForm(createActionForm()); }} className="rounded-xl border px-4 py-2">Cancel</button></div>
                    </div>}
                  </DetailTitle>
                </div>
                <footer className="drawer-footer"><div><span>Current lifecycle status</span><strong>{statusLabel(selected.status)}</strong></div>
                  <small>Status changes are controlled by the actions above.</small></footer>
              </>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

function DetailTitle({ icon, title, subtitle, children }) {
  return <section className="detail-section"><div className="section-title">{icon}<div><h3>{title}</h3><p>{subtitle}</p></div></div>{children}</section>;
}

function Price({ label, value, account }) {
  return <div><span>{label}</span><strong>{money(value)}</strong><small>{account}</small></div>;
}
