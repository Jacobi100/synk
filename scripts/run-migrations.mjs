/**
 * Applies SQL files in supabase/migrations/ (sorted by name) using Postgres.
 *
 * Requires DATABASE_URL in .env.local (Supabase → Project Settings → Database
 * → Connection string → URI). Use the "direct" or "session" connection; include
 * sslmode=require if not already in the URI.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadEnvLocal() {
  const p = path.join(root, ".env.local");
  if (!fs.existsSync(p)) {
    console.error("Missing .env.local");
    process.exit(1);
  }
  const env = {};
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

const env = loadEnvLocal();
const connectionString = env.DATABASE_URL;
if (!connectionString) {
  console.error(
    "DATABASE_URL is not set in .env.local.\n" +
      "Add the Postgres URI from Supabase → Settings → Database (URI tab), then run:\n" +
      "  npm run db:migrate\n" +
      "\nAlternatively (CLI):\n" +
      "  npx supabase login\n" +
      "  npx supabase link --project-ref <your-project-ref>\n" +
      "  npx supabase db push",
  );
  process.exit(1);
}

const migrationsDir = path.join(root, "supabase", "migrations");
const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();

if (files.length === 0) {
  console.error("No .sql files in supabase/migrations");
  process.exit(1);
}

const client = new pg.Client({
  connectionString,
  ssl: connectionString.includes("localhost") ? false : { rejectUnauthorized: false },
});

await client.connect();
console.log("Connected. Running", files.length, "migration(s)…");

for (const file of files) {
  const full = path.join(migrationsDir, file);
  const sql = fs.readFileSync(full, "utf8");
  console.log("→", file);
  await client.query(sql);
}

await client.end();
console.log("Done.");
