/**
 * Runs the Squad checkout migration against the live Supabase project.
 * Usage: node scripts/run-migration.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dir, "..", ".env.local");
const envContent = readFileSync(envPath, "utf8");

const serviceKey = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();
const supabaseUrl = "https://sdglvhxonvpewhkwyjuy.supabase.co";

const client = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

/**
 * Supabase JS doesn't expose raw SQL directly, but we can hit the
 * /rest/v1/rpc/query endpoint if we create a pg function, OR use the
 * Management API with the service role key.
 * 
 * The simplest approach for one-off migrations: use the Postgres REST
 * endpoint directly.
 */

const SQL_STATEMENTS = [
  `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS squad_checkout_url TEXT`,
  // squad_transaction_ref already exists from initial migration, but guard:
  `DO $$ BEGIN
    ALTER TABLE transactions ADD COLUMN squad_transaction_ref TEXT;
  EXCEPTION WHEN duplicate_column THEN NULL; END $$`,
  // Webhook-matching index
  `CREATE INDEX IF NOT EXISTS idx_transactions_squad_ref
    ON transactions(squad_transaction_ref)
    WHERE squad_transaction_ref IS NOT NULL`,
  // Update bounty status constraint  
  `DO $$
  BEGIN
    ALTER TABLE bounties DROP CONSTRAINT IF EXISTS bounties_status_check;
  EXCEPTION WHEN undefined_object THEN null; END $$`,
  `ALTER TABLE bounties ADD CONSTRAINT bounties_status_check
    CHECK (status IN ('open', 'in_progress', 'paid', 'funded', 'completed', 'cancelled'))`,
];

// Use the Supabase Management API to run raw SQL
async function runSQL(sql) {
  const projectRef = "sdglvhxonvpewhkwyjuy";
  const managementKey = serviceKey; // same key works for the management API in some setups

  // Try via pg-meta endpoint (available on Supabase projects)
  const res = await fetch(
    `https://${projectRef}.supabase.co/rest/v1/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ query: sql }),
    },
  );
  return { status: res.status, body: await res.text() };
}

// Alternative: use the Supabase client .from() to probe column existence
async function checkColumnExists(table, column) {
  const { data, error } = await client.from(table).select(column).limit(1);
  if (error && error.message.includes("does not exist")) return false;
  return true;
}

async function main() {
  console.log("🔌 Connecting to Supabase:", supabaseUrl);

  // Test connection
  const { error: pingErr } = await client.from("transactions").select("id").limit(1);
  if (pingErr) {
    console.error("❌ DB connection failed:", pingErr.message);
    process.exit(1);
  }
  console.log("✅ Connected");

  // Check if squad_checkout_url already exists
  const hasCheckoutUrl = await checkColumnExists("transactions", "squad_checkout_url");
  console.log(`\n📋 squad_checkout_url column exists: ${hasCheckoutUrl}`);

  if (hasCheckoutUrl) {
    console.log("✅ Migration already applied — nothing to do");
    return;
  }

  console.log("\n⚠️  Cannot run raw DDL via Supabase JS client.");
  console.log("Please run the following SQL in your Supabase Dashboard SQL Editor:");
  console.log("\n" + "─".repeat(60));
  
  const migrationSql = readFileSync(
    join(__dir, "..", "supabase", "migrations", "20260515000001_squad_checkout_columns.sql"),
    "utf8"
  );
  console.log(migrationSql);
  console.log("─".repeat(60));
  console.log("\n👆 Copy the SQL above → Supabase Dashboard → SQL Editor → Run");
}

main().catch(console.error);
