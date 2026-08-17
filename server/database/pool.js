import "dotenv/config";
import pg from "pg";
import process from "node:process";

const rawDatabaseUrl = process.env.DATABASE_URL?.trim();

if (!rawDatabaseUrl) {
  throw new Error("DATABASE_URL is required");
}

let databaseUrl;

try {
  databaseUrl = new URL(rawDatabaseUrl);
} catch {
  throw new Error("DATABASE_URL must be a valid PostgreSQL connection URL");
}

if (!["postgres:", "postgresql:"].includes(databaseUrl.protocol)) {
  throw new Error(
    "DATABASE_URL must use the postgres:// or postgresql:// protocol",
  );
}

const environment = process.env.NODE_ENV || "development";
const sslPreference = (process.env.DATABASE_SSL || "auto").trim().toLowerCase();

if (!["auto", "true", "false"].includes(sslPreference)) {
  throw new Error("DATABASE_SSL must be auto, true, or false");
}

const sslMode = databaseUrl.searchParams.get("sslmode")?.toLowerCase();
const channelBinding = databaseUrl.searchParams
  .get("channel_binding")
  ?.toLowerCase();
const isNeon = databaseUrl.hostname.endsWith(".neon.tech");
const useSsl =
  sslPreference === "true" ||
  (sslPreference === "auto" &&
    (environment === "production" ||
      isNeon ||
      ["require", "verify-ca", "verify-full"].includes(sslMode)));

if (
  environment === "production" &&
  ["localhost", "127.0.0.1", "::1"].includes(databaseUrl.hostname)
) {
  throw new Error(
    "Production DATABASE_URL must not point to a local PostgreSQL server",
  );
}

// Normalize URL SSL options so the explicit, verified TLS configuration wins.
databaseUrl.searchParams.delete("sslmode");
databaseUrl.searchParams.delete("channel_binding");

export const pool = new pg.Pool({
  connectionString: databaseUrl.toString(),
  ssl: useSsl ? { rejectUnauthorized: true } : false,
  enableChannelBinding: useSsl && channelBinding === "require",
  max: Number(process.env.DATABASE_POOL_MAX || 10),
  idleTimeoutMillis: Number(process.env.DATABASE_IDLE_TIMEOUT_MS || 30_000),
  connectionTimeoutMillis: Number(
    process.env.DATABASE_CONNECTION_TIMEOUT_MS || 10_000,
  ),
});
