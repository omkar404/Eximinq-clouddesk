import API from "./api";

const basePath = "/service-store/licensing";
const servicePath = (slug) => `${basePath}/${slug}`;

export const getLicensingConfiguration = async (slug) =>
  (await API.get(servicePath(slug))).data;
export const getLicensingQuote = async (slug, form) =>
  (await API.post(`${servicePath(slug)}/quote`, { form })).data;
export const getLicensingRequests = async (slug) =>
  (await API.get(`${servicePath(slug)}/requests`)).data;
export const getLicensingLedger = async (slug) =>
  (await API.get(`${servicePath(slug)}/ledger`)).data;
export const saveLicensingDraft = async (slug, payload) =>
  (await API.post(`${servicePath(slug)}/drafts`, payload)).data;
export const submitLicensingRequest = async (slug, payload) =>
  (await API.post(`${servicePath(slug)}/submit`, payload)).data;

export async function uploadLicensingDocument(slug, requestId, documentKey, file) {
  const body = new FormData();
  body.append("file", file);
  return (
    await API.post(
      `${servicePath(slug)}/drafts/${requestId}/documents/${documentKey}`,
      body,
      { headers: { "Content-Type": "multipart/form-data" } },
    )
  ).data;
}

export const removeLicensingDocument = async (slug, requestId, documentKey) =>
  (
    await API.delete(
      `${servicePath(slug)}/drafts/${requestId}/documents/${documentKey}`,
    )
  ).data;
