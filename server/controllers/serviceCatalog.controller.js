import { getServiceStoreCatalog } from "../services/serviceCatalog.service.js";

export async function catalog(_req, res, next) {
  try {
    res.json(await getServiceStoreCatalog());
  } catch (error) {
    next(error);
  }
}
