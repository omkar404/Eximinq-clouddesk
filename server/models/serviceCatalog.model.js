import { pool } from "../database/pool.js";

export async function listActiveCatalog() {
  const result = await pool.query(
    `SELECT c.slug AS category_slug,
            c.name AS category_name,
            c.eyebrow,
            c.description AS category_description,
            c.icon_key AS category_icon_key,
            c.sort_order AS category_sort_order,
            s.slug AS service_slug,
            s.name AS service_name,
            s.description AS service_description,
            s.sort_order AS service_sort_order,
            COALESCE(s.config->>'subtitle', '') AS service_subtitle,
            COALESCE(s.config->>'iconKey', 'file-text') AS service_icon_key
       FROM service_store_categories c
       LEFT JOIN service_catalog s
         ON s.category = c.slug AND s.is_active = TRUE
      WHERE c.is_active = TRUE
      ORDER BY c.sort_order, c.slug, s.sort_order, s.name`
  );
  return result.rows;
}
