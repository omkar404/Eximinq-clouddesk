import {
  createElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  CheckCircle2,
  FileText,
  IndianRupee,
  Layers3,
  LoaderCircle,
  Plus,
  ReceiptText,
  RefreshCw,
  Search,
  ShieldCheck,
  Store,
  Workflow,
  X,
} from "lucide-react";
import OnboardingNote from "../../components/onboarding/OnboardingNote";
import { getClientOperationsOverview } from "../../services/clientOperationsService";
import { listClientNotifications } from "../../services/requestWorkflowService";

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;
const readable = (value = "") =>
  String(value)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
const dateTime = (value) =>
  value
    ? new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "—";
const closedStatuses = new Set(["COMPLETED", "APPROVED", "REJECTED"]);

export default function ClientCommandCenter() {
  const navigate = useNavigate();
  const [data, setData] = useState({
    invoices: [],
    workflows: [],
    schemes: [],
    transactions: [],
  });
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);

  const load = useCallback(async (quiet = false) => {
    quiet ? setRefreshing(true) : setLoading(true);
    try {
      const [overview, noticeData] = await Promise.all([
        getClientOperationsOverview(),
        listClientNotifications().catch(() => ({ notifications: [] })),
      ]);
      setData(overview);
      setNotifications(noticeData.notifications || []);
      setError("");
    } catch (reason) {
      if (!quiet) {
        setError(
          reason.response?.data?.message ||
            "Workspace information could not be loaded.",
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const refresh = () => load(true);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    const timer = window.setInterval(refresh, 5000);
    window.addEventListener("clouddesk:operations-updated", refresh);
    window.addEventListener("wallet:updated", refresh);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("clouddesk:operations-updated", refresh);
      window.removeEventListener("wallet:updated", refresh);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [load]);

  const active = useMemo(
    () => data.workflows.filter((item) => !closedStatuses.has(item.status)),
    [data.workflows],
  );
  const completed = useMemo(
    () =>
      data.workflows.filter((item) =>
        ["COMPLETED", "APPROVED"].includes(item.status),
      ),
    [data.workflows],
  );
  const attention = useMemo(
    () =>
      active.filter((item) =>
        ["ADDITIONAL_DOCUMENTS_REQUESTED", "REJECTED"].includes(item.status),
      ),
    [active],
  );
  const outstanding = useMemo(
    () =>
      data.invoices
        .filter((item) => item.paymentStatus !== "PAID")
        .reduce((sum, item) => sum + item.total, 0),
    [data.invoices],
  );
  const visibleWorkflows = useMemo(
    () =>
      data.workflows
        .filter((item) =>
          `${item.requestCode} ${item.serviceName} ${item.category} ${item.status}`
            .toLowerCase()
            .includes(query.toLowerCase()),
        )
        .slice(0, 7),
    [data.workflows, query],
  );

  const shortcuts = [
    {
      label: "New service request",
      note: "Browse the service catalog",
      icon: Store,
      path: "/client/service-store",
      tone: "blue",
    },
    {
      label: "Track requests",
      note: `${data.workflows.length} recorded applications`,
      icon: Layers3,
      path: "/client/track-requests",
      tone: "cyan",
    },
    {
      label: "Invoices & billing",
      note: outstanding
        ? `${money(outstanding)} outstanding`
        : "Accounts reconciled",
      icon: ReceiptText,
      path: "/client/invoices-billing",
      tone: "amber",
    },
    {
      label: "Schemes & analytics",
      note: `${data.schemes.length} schemes available`,
      icon: BarChart3,
      path: "/client/schemes-analytics",
      tone: "violet",
    },
  ];

  return (
    <div className="dashboard-page command-center command-center-client">
      <OnboardingNote />
      <section className="command-hero">
        <div>
          <span className="command-eyebrow">
            <ShieldCheck size={13} /> Client operations console
          </span>
          <h1>Command Center</h1>
          <p>
            A live, consolidated view of your filings, payments and actions.
          </p>
        </div>
        <div className="command-hero-actions">
          <span className="command-live">
            <i /> Live data
          </span>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="command-icon-button"
            title="Refresh dashboard"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => navigate("/client/service-store")}
            className="command-primary"
          >
            <Plus size={16} /> New request
          </button>
        </div>
      </section>

      {error && (
        <div className="command-error">
          <AlertTriangle size={17} />
          <span>{error}</span>
          <button onClick={() => load()}>Retry</button>
        </div>
      )}
      {loading ? (
        <div className="command-loading">
          <LoaderCircle className="animate-spin" /> Loading operational
          workspace…
        </div>
      ) : (
        <>
          <section className="command-metrics">
            <Metric
              icon={Workflow}
              label="Active workflows"
              value={active.length}
              note="Currently processing"
              onClick={() => navigate("/client/active-workflows")}
            />
            <Metric
              icon={AlertTriangle}
              label="Action required"
              value={attention.length}
              note="Needs your attention"
              tone="amber"
              onClick={() => navigate("/client/track-requests")}
            />
            <Metric
              icon={CheckCircle2}
              label="Completed"
              value={completed.length}
              note="Concluded requests"
              tone="green"
              onClick={() => navigate("/client/track-requests")}
            />
            <Metric
              icon={IndianRupee}
              label="Outstanding"
              value={money(outstanding)}
              note="Pending billing value"
              tone="violet"
              onClick={() => navigate("/client/invoices-billing")}
            />
          </section>

          <section className="command-grid-main">
            <article className="command-panel command-workstream">
              <header>
                <div>
                  <span className="command-kicker">Operational activity</span>
                  <h2>Recent requests</h2>
                </div>
                <label className="command-search">
                  <Search size={14} />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search requests"
                  />
                </label>
              </header>
              <div className="command-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Request</th>
                      <th>Service</th>
                      <th>Submitted</th>
                      <th>Documents</th>
                      <th>Status</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {visibleWorkflows.length ? (
                      visibleWorkflows.map((item) => (
                        <tr key={item.id} onClick={() => setSelected(item)}>
                          <td>
                            <strong className="command-link">
                              {item.requestCode}
                            </strong>
                          </td>
                          <td>
                            <strong>{item.serviceName}</strong>
                            <small>{readable(item.category)}</small>
                          </td>
                          <td>{dateTime(item.submittedAt)}</td>
                          <td>{item.documentCount} files</td>
                          <td>
                            <Status value={item.status} />
                          </td>
                          <td>
                            <ArrowRight size={15} />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6">
                          <Empty
                            icon={FileText}
                            title="No requests found"
                            text="Submit a service request or change your search."
                            action={() => navigate("/client/service-store")}
                          />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <footer>
                <button onClick={() => navigate("/client/track-requests")}>
                  View complete request register <ArrowRight size={14} />
                </button>
              </footer>
            </article>

            <aside className="command-side-stack">
              <section className="command-panel command-shortcuts">
                <header>
                  <div>
                    <span className="command-kicker">Direct access</span>
                    <h2>Workspace modules</h2>
                  </div>
                </header>
                <div>
                  {shortcuts.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className={`shortcut-${item.tone}`}
                    >
                      <span>{createElement(item.icon, { size: 17 })}</span>
                      <div>
                        <strong>{item.label}</strong>
                        <small>{item.note}</small>
                      </div>
                      <ArrowRight size={14} />
                    </button>
                  ))}
                </div>
              </section>
              <section className="command-panel command-alerts">
                <header>
                  <div>
                    <span className="command-kicker">Alerts & messages</span>
                    <h2>Latest notifications</h2>
                  </div>
                  <Bell size={17} />
                </header>
                <div>
                  {notifications.slice(0, 4).map((item) => (
                    <button
                      key={item.id}
                      onClick={() =>
                        item.request_id
                          ? navigate("/client/track-requests")
                          : setSelected({
                              serviceName: item.title,
                              fields: [
                                { label: "Message", value: item.message },
                              ],
                              status: item.type,
                              updatedAt: item.created_at,
                            })
                      }
                    >
                      <i className={item.is_read ? "is-read" : ""} />
                      <span>
                        <strong>{item.title}</strong>
                        <small>{item.message}</small>
                      </span>
                      <time>{dateTime(item.created_at)}</time>
                    </button>
                  ))}
                  {!notifications.length && (
                    <p className="command-empty-line">
                      <Bell size={15} /> No new alerts.
                    </p>
                  )}
                </div>
              </section>
            </aside>
          </section>
        </>
      )}
      {selected && (
        <DetailDrawer
          item={selected}
          onClose={() => setSelected(null)}
          navigate={navigate}
        />
      )}
    </div>
  );
}

function Metric({ icon, label, value, note, tone = "blue", onClick }) {
  return (
    <button onClick={onClick} className={`command-metric metric-${tone}`}>
      <span>{createElement(icon, { size: 18 })}</span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
        <p>{note}</p>
      </div>
      <ArrowRight size={14} />
    </button>
  );
}
function Status({ value }) {
  const good = ["COMPLETED", "APPROVED", "PAID"].includes(value);
  const warn = ["ADDITIONAL_DOCUMENTS_REQUESTED", "PARTIALLY_PAID"].includes(
    value,
  );
  return (
    <span
      className={`command-status ${good ? "status-good" : warn ? "status-warn" : "status-info"}`}
    >
      {readable(value)}
    </span>
  );
}
function Empty({ icon, title, text, action }) {
  return (
    <div className="command-empty">
      {createElement(icon, { size: 24 })}
      <strong>{title}</strong>
      <span>{text}</span>
      <button
        onClick={(event) => {
          event.stopPropagation();
          action();
        }}
      >
        Start a request
      </button>
    </div>
  );
}
function DetailDrawer({ item, onClose, navigate }) {
  return (
    <div className="command-drawer-backdrop" onClick={onClose}>
      <aside
        className="command-drawer"
        onClick={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <span className="command-kicker">Request detail</span>
            <h2>{item.serviceName}</h2>
            <p>{item.requestCode || "Notification"}</p>
          </div>
          <button onClick={onClose}>
            <X size={18} />
          </button>
        </header>
        <div className="command-drawer-content">
          <div className="command-detail-grid">
            <Detail label="Status" value={<Status value={item.status} />} />
            <Detail
              label="Category"
              value={readable(item.category || "General")}
            />
            <Detail label="Submitted" value={dateTime(item.submittedAt)} />
            <Detail label="Last updated" value={dateTime(item.updatedAt)} />
          </div>
          {item.fields?.length > 0 && (
            <section>
              <h3>Submitted information</h3>
              <div className="command-detail-grid">
                {item.fields.map((field) => (
                  <Detail
                    key={field.key || field.label}
                    label={field.label}
                    value={String(field.value)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
        <footer>
          <button onClick={() => navigate("/client/track-requests")}>
            Open complete request <ArrowRight size={14} />
          </button>
        </footer>
      </aside>
    </div>
  );
}
function Detail({ label, value }) {
  return (
    <div className="command-detail">
      <small>{label}</small>
      <strong>{value || "—"}</strong>
    </div>
  );
}
