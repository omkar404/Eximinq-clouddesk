import { listActiveCatalog } from "../models/serviceCatalog.model.js";

export async function getServiceStoreCatalog() {
  const rows = await listActiveCatalog();
  const categories = [];
  const bySlug = new Map();

  for (const row of rows) {
    let category = bySlug.get(row.category_slug);
    if (!category) {
      category = {
        id: row.category_slug,
        title: row.category_name,
        eyebrow: row.eyebrow,
        description: row.category_description,
        iconKey: row.category_icon_key,
        sortOrder: row.category_sort_order,
        path: `/client/service-store/${row.category_slug}`,
        services: []
      };
      bySlug.set(row.category_slug, category);
      categories.push(category);
    }
    if (row.service_slug) {
      category.services.push({
        id: row.service_slug,
        title: row.service_name,
        subtitle: row.service_subtitle,
        caption: row.service_description,
        iconKey: row.service_icon_key,
        sortOrder: row.service_sort_order,
        path: `${category.path}/${row.service_slug}`
      });
    }
  }

  return { categories };
}
