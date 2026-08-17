import "dotenv/config";
import process from "node:process";

const hasEmail = Boolean(process.env.ADMIN_EMAIL?.trim());
const hasPassword = Boolean(process.env.ADMIN_PASSWORD);

if (hasEmail && hasPassword) {
  await import("./seed.js");
} else {
  console.log(
    "Admin bootstrap skipped: set both ADMIN_EMAIL and ADMIN_PASSWORD to create the production admin account."
  );
}
