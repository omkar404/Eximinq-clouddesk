import { getClientOperations } from "../services/clientOperations.service.js";

export async function overview(req, res, next) {
  try {
    res.set("Cache-Control", "private, no-store, max-age=0");
    res.json(await getClientOperations(req.user.id));
  } catch (error) {
    next(error);
  }
}
