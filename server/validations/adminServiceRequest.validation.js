export const ADMIN_REQUEST_STATUSES = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "PROCESSING",
  "NEEDS_INFORMATION",
  "APPROVED",
  "COMPLETED",
  "REJECTED"
];

export function validateAdminStatus(value) {
  const status = String(value || "").trim().toUpperCase();
  return {
    valid: ADMIN_REQUEST_STATUSES.includes(status),
    value: status
  };
}
