import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import {
  BadgeCheck,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Download,
  LoaderCircle,
  Pencil,
  Search,
  ShieldCheck,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import ClientCompanyProfile from "../client/ClientCompanyProfile";
import {
  fetchAdminClients,
  downloadAdminFile,
  approveAdminCompanyProfile
} from "../../services/documentService";

function hasProfile(client) {
  return Boolean(client.companyProfile);
}

function documentLabel(document) {
  return document.label || String(document.key || "Company document")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function SummaryCard({ title, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{title}</p>
      <p className="mt-2 text-sm font-semibold text-slate-800">{value || "-"}</p>
    </div>
  );
}

export default function AdminCompanyProfiles() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDownloadKey, setActiveDownloadKey] = useState("");
  const [approvingClientId, setApprovingClientId] = useState("");
  const [managedClient, setManagedClient] = useState(null);
  const [expandedClientId, setExpandedClientId] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchAdminClients();
        setClients(data.filter(hasProfile));
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Unable to load company profiles",
          text: err.response?.data?.message || "Please try again shortly.",
          confirmButtonColor: "#101eb9"
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const filteredClients = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return clients;

    return clients.filter((client) =>
      [
        client.name,
        client.email,
        client.user_code,
        client.companyProfile?.company_name,
        client.companyProfile?.pan_number,
        client.companyProfile?.iec_number,
        client.companyProfile?.gstin
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [clients, searchQuery]);

  const handleDownload = async (document) => {
    try {
      setActiveDownloadKey(document.key);
      await downloadAdminFile(document.download_url, `${document.key}`);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Download failed",
        text: err.response?.data?.message || "The file could not be downloaded.",
        confirmButtonColor: "#101eb9"
      });
    } finally {
      setActiveDownloadKey("");
    }
  };

  const handleApprove = async (clientId) => {
    try {
      setApprovingClientId(clientId);
      await approveAdminCompanyProfile(clientId);
      const data = await fetchAdminClients();
      setClients(data.filter(hasProfile));
      Swal.fire({
        icon: "success",
        title: "Company profile approved",
        text: "The client dashboard will unlock on the next login.",
        confirmButtonColor: "#101eb9"
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Approval failed",
        text: err.response?.data?.message || "Unable to approve this company profile.",
        confirmButtonColor: "#101eb9"
      });
    } finally {
      setApprovingClientId("");
    }
  };

  if (managedClient) {
    return (
      <div className="space-y-5">
        <div className="flex flex-col gap-4 rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="premium-kicker">Admin-managed company profile</p>
            <h1 className="mt-2 text-xl font-bold text-slate-950">
              {managedClient.companyProfile?.companyDisplayName || managedClient.name}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Changes save to the shared profile and appear read-only for the client.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setManagedClient(null)}
            className="premium-button premium-button-secondary"
          >
            <ArrowLeft size={16} />
            Back to profiles
          </button>
        </div>
        <ClientCompanyProfile
          adminClientId={managedClient.id}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white p-10 shadow-sm">
        <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-500">
          <LoaderCircle className="animate-spin" size={16} />
          Loading submitted company profiles...
        </p>
      </div>
    );
  }

  return (
    <div className="company-profiles-page space-y-4">
      <div className="rounded-[24px] border border-slate-100 bg-[linear-gradient(135deg,#ffffff_0%,#f8fbff_45%,#eef4ff_100%)] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-600">
              Admin Company Profiles
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              Review client-submitted profile sections and documents
            </h1>
            <p className="mt-3 max-w-3xl text-sm text-slate-500">
              Review submitted company profile data, download the supporting files,
              and approve the client once verification is complete.
            </p>
          </div>
          <div className="relative w-full min-w-[260px] lg:w-[340px]">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by client, code, PAN, IEC, or GSTIN"
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[#101eb9]"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {filteredClients.map((client) => {
          const profile = client.companyProfile;
          const documents = profile?.documentCatalog || [];
          const approvalStatus = profile?.workflowState?.approvalStatus || "draft";
          const isApproved = approvalStatus === "approved";
          const isExpanded = expandedClientId === client.id;

          return (
            <section
              key={client.id}
              className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_8px_24px_rgb(15,23,42,0.04)]"
            >
              <div className={`${isExpanded ? "border-b" : ""} border-slate-100 px-5 py-4 md:px-6`}>
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                      <Building2 size={14} />
                      {client.user_code || client.id}
                    </div>
                    <div
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] ${
                        isApproved
                          ? "bg-emerald-100 text-emerald-700"
                          : approvalStatus === "submitted"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <BadgeCheck size={14} />
                      {approvalStatus}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold tracking-tight text-slate-900">
                        {profile.companyDisplayName || client.name}
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">{client.email}</p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <SummaryCard title="PAN" value={profile.pan_number || "Not available"} />
                    <SummaryCard title="IEC" value={profile.iec_number || "Not available"} />
                    <SummaryCard
                      title="GSTIN Count"
                      value={String(profile.gstin_details?.length || 0)}
                    />
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  <button type="button" onClick={() => setExpandedClientId(isExpanded ? null : client.id)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">{isExpanded ? <ChevronUp size={15}/> : <ChevronDown size={15}/>} {isExpanded ? "Hide details" : "View details"}</button>
                  <button
                    type="button"
                    onClick={() => setManagedClient(client)}
                    className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-3 py-2 text-xs font-bold text-blue-700"
                  >
                    <Pencil size={16} />
                    Manage Full Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApprove(client.id)}
                    disabled={isApproved || approvingClientId === client.id}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#101eb9] px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {approvingClientId === client.id ? (
                      <LoaderCircle className="animate-spin" size={16} />
                    ) : (
                      <CheckCircle2 size={16} />
                    )}
                    {isApproved ? "Already Approved" : "Approve Profile"}
                  </button>
                </div>
              </div>

              {isExpanded ? <div className="grid gap-4 px-5 py-5 xl:grid-cols-[1fr,1fr] md:px-6">
                <div className="space-y-6">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
                      <ShieldCheck size={16} />
                      Submitted Profile Snapshot
                    </div>
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      <SummaryCard title="Concern Nature" value={profile.concern_nature} />
                      <SummaryCard
                        title="Exporter / Importer Category"
                        value={profile.exporter_importer_category}
                      />
                      <SummaryCard title="Firm Mobile" value={profile.firm_mobile_no} />
                      <SummaryCard
                        title="Correspondence Email"
                        value={profile.correspondence_email}
                      />
                      <div className="md:col-span-2">
                        <SummaryCard
                          title="Head Office Address"
                          value={profile.head_office_address}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
                      Section Status
                    </p>
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      {(profile.sections || []).map((section) => (
                        <div
                          key={section.key}
                          className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3"
                        >
                          <span className="text-sm font-semibold text-slate-800">
                            {section.title}
                          </span>
                          <span
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${
                              section.completed
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            <CheckCircle2 size={14} />
                            {section.completed ? "Completed" : "Pending"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
                    <Download size={16} />
                    Uploaded Company Profile Documents
                  </div>
                  {documents.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-sm text-slate-400">
                      This client has not uploaded company profile documents yet.
                    </div>
                  ) : (
                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">{documents.map((document) => (
                      <div
                        key={document.key}
                        className="flex min-h-[88px] items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3"
                      >
                        <div>
                          <p className="text-sm font-bold text-slate-900">{documentLabel(document)}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {document.ownerLabel || "Company level document"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDownload(document)}
                          className="inline-flex items-center gap-2 rounded-xl bg-[#101eb9] px-3 py-2 text-xs font-bold text-white"
                        >
                          {activeDownloadKey === document.key ? (
                            <LoaderCircle className="animate-spin" size={16} />
                          ) : (
                            <Download size={16} />
                          )}
                          Download
                        </button>
                      </div>
                    ))}</div>
                  )}
                </div>
              </div> : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}
