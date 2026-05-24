import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import {
  Building2,
  Download,
  FileText,
  Search,
  Users,
  FolderOpen,
  LoaderCircle
} from "lucide-react";
import { fetchAdminClients, downloadAdminFile } from "../../services/documentService";
import {
  COMPANY_DOCUMENT_FIELDS,
  BOOKING_DOCUMENT_FIELDS,
  getDocumentLabel
} from "../../constants/documents";

function getClientDisplayName(client) {
  return (
    client.companyProfile?.company_name ||
    client.companyProfile?.companyName ||
    client.name ||
    "Unnamed Client"
  );
}

function formatDate(value) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

export default function ClientManagement() {
  const [clients, setClients] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeDownloadKey, setActiveDownloadKey] = useState("");

  useEffect(() => {
    const loadClients = async () => {
      try {
        setLoading(true);
        const data = await fetchAdminClients();
        setClients(data);
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Unable to load clients",
          text: err.response?.data?.message || "Please try again shortly.",
          confirmButtonColor: "#101eb9"
        });
      } finally {
        setLoading(false);
      }
    };

    loadClients();
  }, []);

  const filteredClients = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return clients;
    }

    return clients.filter((client) => {
      const companyProfile = client.companyProfile || {};

      return [
        client.name,
        client.email,
        companyProfile.company_name,
        companyProfile.companyName,
        companyProfile.iec_number,
        companyProfile.iecNumber,
        companyProfile.gstin
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [clients, searchQuery]);

  const handleDownload = async ({ url, key, fallbackName }) => {
    try {
      setActiveDownloadKey(key);
      await downloadAdminFile(url, fallbackName);
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

  if (loading) {
    return (
      <div className="dashboard-panel p-10">
        <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-500">
          <LoaderCircle className="animate-spin" size={16} />
          Loading clients and documents...
        </p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-hero p-6 md:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-600">
              Admin Client Visibility
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-900">
              Review client records and download submitted documents
            </h1>
            <p className="mt-3 max-w-3xl text-sm text-slate-500">
              This view is powered by the new admin-only client listing endpoint and download
              actions for both company-profile documents and booking uploads.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-blue-100 bg-blue-50/90 px-4 py-3 text-sm font-bold text-[#101eb9] shadow-[0_10px_18px_rgba(41,82,255,0.08)]">
              {clients.length} clients
            </div>
            <div className="relative w-full min-w-[260px] lg:w-[320px]">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by client, company, IEC, or GSTIN"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[#101eb9] focus:bg-white"
              />
            </div>
          </div>
        </div>
      </div>

      {filteredClients.length === 0 ? (
        <div className="dashboard-panel border-dashed p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-300">
            <Users size={30} />
          </div>
          <p className="mt-5 text-lg font-bold text-slate-800">No matching clients found</p>
          <p className="mt-2 text-sm text-slate-400">
            Try a different search term or clear the current filter.
          </p>
        </div>
      ) : null}

      <div className="space-y-6">
        {filteredClients.map((client) => {
          const companyProfile = client.companyProfile || {};
          const companyDocuments = companyProfile.documents || [];
          const bookings = client.bookings || [];

          return (
            <section
              key={client.id}
              className="dashboard-panel overflow-hidden"
            >
              <div className="border-b border-slate-100 px-8 py-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                      <Building2 size={14} />
                      Client #{client.id}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                        {getClientDisplayName(client)}
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">{client.email}</p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                        IEC
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-800">
                        {companyProfile.iec_number || companyProfile.iecNumber || "Not available"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                        GSTIN
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-800">
                        {companyProfile.gstin || "Not available"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                        Bookings
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-800">{bookings.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 px-8 py-8 xl:grid-cols-[1fr,1.3fr]">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
                    <FolderOpen size={16} />
                    Company Profile Documents
                  </div>

                  <div className="space-y-3">
                    {COMPANY_DOCUMENT_FIELDS.map((definition) => {
                      const document = companyDocuments.find((item) => item.type === definition.type);
                      const downloadKey = `company-${client.id}-${definition.type}`;
                      const isDownloading = activeDownloadKey === downloadKey;

                      return (
                        <div
                          key={definition.type}
                          className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-sm font-bold text-slate-900">
                                {definition.label}
                              </p>
                              <p className="mt-1 text-xs text-slate-400">{definition.helper}</p>
                            </div>
                            <span
                              className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase ${
                                document
                                  ? "bg-emerald-50 text-emerald-600"
                                  : "bg-slate-200 text-slate-500"
                              }`}
                            >
                              {document ? "Available" : "Missing"}
                            </span>
                          </div>

                          <div className="mt-4">
                            {document ? (
                              <button
                                type="button"
                                onClick={() =>
                                  handleDownload({
                                    url: document.download_url,
                                    key: downloadKey,
                                    fallbackName: `${client.id}-${definition.type}.pdf`
                                  })
                                }
                                className="inline-flex items-center gap-2 rounded-2xl bg-[#101eb9] px-4 py-2.5 text-sm font-bold text-white"
                              >
                                {isDownloading ? (
                                  <LoaderCircle className="animate-spin" size={16} />
                                ) : (
                                  <Download size={16} />
                                )}
                                Download
                              </button>
                            ) : (
                              <p className="text-sm text-slate-400">
                                No validated file is available for this document.
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
                    <FileText size={16} />
                    Booking Documents
                  </div>

                  {bookings.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-sm text-slate-400">
                      This client has no bookings yet.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {bookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                        >
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                              <p className="text-sm font-bold text-slate-900">
                                Booking #{booking.id}
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                Status: {booking.status || "Unknown"} | Invoice:{" "}
                                {booking.invoice_number || "Not provided"} | Destination:{" "}
                                {booking.destination_country || "Not provided"}
                              </p>
                            </div>
                            <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase text-slate-500">
                              {booking.documents?.length || 0} docs
                            </span>
                          </div>

                          {booking.documents?.length ? (
                            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                              <table className="w-full">
                                <thead className="bg-slate-50">
                                  <tr className="text-left text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                                    <th className="px-4 py-3">Type</th>
                                    <th className="px-4 py-3">Created</th>
                                    <th className="px-4 py-3 text-right">Action</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {booking.documents.map((document) => {
                                    const downloadKey = `booking-${document.id}`;
                                    const isDownloading = activeDownloadKey === downloadKey;

                                    return (
                                      <tr key={document.id} className="border-t border-slate-100">
                                        <td className="px-4 py-3 text-sm font-semibold text-slate-800">
                                          {getDocumentLabel(
                                            BOOKING_DOCUMENT_FIELDS,
                                            document.document_type
                                          )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-500">
                                          {formatDate(document.createdAt || document.created_at)}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleDownload({
                                                url: document.download_url,
                                                key: downloadKey,
                                                fallbackName: `booking-${document.id}`
                                              })
                                            }
                                            className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
                                          >
                                            {isDownloading ? (
                                              <LoaderCircle className="animate-spin" size={16} />
                                            ) : (
                                              <Download size={16} />
                                            )}
                                            Download
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="mt-4 text-sm text-slate-400">
                              No booking documents uploaded for this booking.
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
