import API from "./api";

export const getClientOperationsOverview = async () =>
  (await API.get("/client/operations/overview")).data;
