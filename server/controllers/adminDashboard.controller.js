import { getAdminDashboard } from "../services/adminDashboard.service.js";

export async function dashboard(req, res, next) {
  try { res.json(await getAdminDashboard()); } catch (error) { next(error); }
}
