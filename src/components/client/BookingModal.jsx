import { useMemo, useState } from "react";
import Swal from "sweetalert2";
import {
  X,
  FileUp,
  CircleCheckBig,
  LoaderCircle,
  FileText,
  BadgeIndianRupee
} from "lucide-react";
import api from "../../services/interceptor";
import {
  BOOKING_DOCUMENT_FIELDS,
  getDocumentLabel
} from "../../constants/documents";
import { uploadBookingDocument } from "../../services/documentService";

const initialDetails = {
  invoice: "",
  country: ""
};

export default function BookingModal({ service, onClose }) {
  const [bookingId, setBookingId] = useState(null);
  const [details, setDetails] = useState(initialDetails);
  const [documentType, setDocumentType] = useState(BOOKING_DOCUMENT_FIELDS[0].type);
  const [file, setFile] = useState(null);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [creatingBooking, setCreatingBooking] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const selectedDocumentDefinition = useMemo(
    () =>
      BOOKING_DOCUMENT_FIELDS.find((item) => item.type === documentType) ||
      BOOKING_DOCUMENT_FIELDS[0],
    [documentType]
  );

  const showError = (title, err, fallback) =>
    Swal.fire({
      icon: "error",
      title,
      text: err.response?.data?.message || err.response?.data?.error || fallback,
      confirmButtonColor: "#101eb9"
    });

  const showSuccess = (title, text) =>
    Swal.fire({
      icon: "success",
      title,
      text,
      confirmButtonColor: "#101eb9"
    });

  const createBooking = async () => {
    try {
      setCreatingBooking(true);
      const response = await api.post("/auth/bookings/book", {
        service_id: service.id
      });

      setBookingId(response.data.booking_id);
    } catch (err) {
      showError("Unable to start booking", err, "Please try again.");
    } finally {
      setCreatingBooking(false);
    }
  };

  const addDetails = async () => {
    try {
      setSavingDetails(true);
      await api.post("/auth/bookings/add-details", {
        booking_id: bookingId,
        invoice_number: details.invoice,
        destination_country: details.country
      });

      showSuccess("Details saved", "Invoice and destination details were added.");
    } catch (err) {
      showError("Unable to save details", err, "Please review the form and retry.");
    } finally {
      setSavingDetails(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      showError("File required", {}, "Choose a file before uploading.");
      return;
    }

    try {
      setUploading(true);
      await uploadBookingDocument({
        bookingId,
        documentType,
        file
      });

      setUploadedDocuments((prev) => {
        const next = prev.filter((item) => item.type !== documentType);
        return [
          ...next,
          {
            type: documentType,
            name: file.name
          }
        ];
      });
      setFile(null);

      showSuccess(
        "Document uploaded",
        `${selectedDocumentDefinition.label} passed upload validation.`
      );
    } catch (err) {
      showError(
        "Upload rejected",
        err,
        "The document could not be uploaded."
      );
    } finally {
      setUploading(false);
    }
  };

  const confirmBooking = async () => {
    try {
      setConfirming(true);
      await api.post("/auth/bookings/confirm", {
        booking_id: bookingId
      });

      await showSuccess(
        "Booking confirmed",
        "Your request is now in motion."
      );
      onClose();
    } catch (err) {
      showError("Unable to confirm booking", err, "Please complete the remaining steps.");
    } finally {
      setConfirming(false);
    }
  };

  const hasUploadedDocuments = uploadedDocuments.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-8">
      <div className="max-h-full w-full max-w-4xl overflow-auto rounded-[32px] bg-white shadow-2xl">
        <div className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 px-6 py-5 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-600">
                Service Booking
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                {service.name}
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-500">
                Upload the right booking documents from the start. The backend now checks
                document type, ownership, and supported file formats before saving.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl bg-slate-100 p-3 text-slate-500 transition hover:bg-slate-200"
              aria-label="Close booking modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="space-y-8 p-6 md:p-8">
          <div className="grid gap-4 lg:grid-cols-4">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Credits
              </p>
              <p className="mt-4 flex items-center gap-2 text-3xl font-bold text-slate-900">
                <BadgeIndianRupee size={22} />
                {service.price}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                SLA
              </p>
              <p className="mt-4 text-3xl font-bold text-slate-900">
                {service.sla_hours}h
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Booking
              </p>
              <p className="mt-4 text-lg font-bold text-slate-900">
                {bookingId ? `#${bookingId}` : "Not started"}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Documents
              </p>
              <p className="mt-4 text-3xl font-bold text-slate-900">
                {uploadedDocuments.length}
              </p>
            </div>
          </div>

          <section className="rounded-[28px] border border-slate-100 bg-slate-50/70 p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
                  Step 1
                </p>
                <h3 className="mt-1 text-xl font-bold text-slate-900">
                  Create the booking shell
                </h3>
              </div>

              <button
                type="button"
                onClick={createBooking}
                disabled={creatingBooking || Boolean(bookingId)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#101eb9] px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creatingBooking ? <LoaderCircle className="animate-spin" size={16} /> : null}
                {bookingId ? "Booking created" : "Start booking"}
              </button>
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
              Step 2
            </p>
            <h3 className="mt-1 text-xl font-bold text-slate-900">
              Add invoice details
            </h3>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  Invoice Number
                </label>
                <input
                  value={details.invoice}
                  onChange={(event) =>
                    setDetails((prev) => ({ ...prev, invoice: event.target.value }))
                  }
                  placeholder="Enter invoice number"
                  disabled={!bookingId}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#101eb9] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  Destination Country
                </label>
                <input
                  value={details.country}
                  onChange={(event) =>
                    setDetails((prev) => ({ ...prev, country: event.target.value }))
                  }
                  placeholder="Enter destination country"
                  disabled={!bookingId}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#101eb9] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={addDetails}
              disabled={!bookingId || savingDetails}
              className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingDetails ? <LoaderCircle className="animate-spin" size={16} /> : null}
              Save details
            </button>
          </section>

          <section className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
              Step 3
            </p>
            <h3 className="mt-1 text-xl font-bold text-slate-900">
              Upload booking documents
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Choose the correct document type before uploading. The API now rejects type
              mismatches and unsupported formats.
            </p>

            <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr,1.4fr,0.9fr]">
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  Document Type
                </label>
                <select
                  value={documentType}
                  onChange={(event) => setDocumentType(event.target.value)}
                  disabled={!bookingId}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#101eb9] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {BOOKING_DOCUMENT_FIELDS.map((item) => (
                    <option key={item.type} value={item.type}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  File
                </label>
                <input
                  type="file"
                  accept={selectedDocumentDefinition.accept}
                  disabled={!bookingId}
                  onChange={(event) => setFile(event.target.files?.[0] || null)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-[0.82rem] text-sm text-slate-600 outline-none transition file:mr-4 file:rounded-xl file:border-0 file:bg-white file:px-3 file:py-2 file:text-sm file:font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                />
                <p className="text-xs text-slate-400">{selectedDocumentDefinition.helper}</p>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={!bookingId || uploading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {uploading ? <LoaderCircle className="animate-spin" size={16} /> : <FileUp size={16} />}
                  Upload file
                </button>
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <FileText size={16} />
                Uploaded documents
              </div>

              {hasUploadedDocuments ? (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {uploadedDocuments.map((item) => (
                    <div
                      key={item.type}
                      className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-white px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          {getDocumentLabel(BOOKING_DOCUMENT_FIELDS, item.type)}
                        </p>
                        <p className="text-xs text-slate-400">{item.name}</p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600">
                        <CircleCheckBig size={14} />
                        Ready
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-400">
                  No booking documents uploaded yet.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-[28px] border border-blue-100 bg-blue-50/70 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-600">
                  Step 4
                </p>
                <h3 className="mt-1 text-xl font-bold text-slate-900">
                  Confirm and start work
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Confirmation will still fail if booking details or documents are missing, or
                  if wallet balance is insufficient.
                </p>
              </div>

              <button
                type="button"
                onClick={confirmBooking}
                disabled={!bookingId || confirming}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#101eb9] px-6 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {confirming ? <LoaderCircle className="animate-spin" size={16} /> : null}
                Confirm booking
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
