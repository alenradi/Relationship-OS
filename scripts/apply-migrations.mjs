/**
 * Applies supabase/migrations/*.sql in order.
 *
 * Prefers DATABASE_URL (postgres connection string from Supabase →
 * Project Settings → Database). Falls back to SUPABASE_ACCESS_TOKEN
 * (Account → Access Tokens) via the Management API.
 *
 * Usage:
 *   DATABASE_URL='postgresql://postgres:...@db.xxx.supabase.co:5432/postgres' node scripts/apply-migrations.mjs
 *   SUPABASE_ACCESS_TOKEN='sbp_...' node scripts/apply-migrations.mjs
 */

import { config } from "dotenv";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

const PROJECT_REF =
  process.env.SUPABASE_PROJECT_REF ||
  new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "https://bhcazcldjpwvqikvgndh.supabase.co")
    .hostname.split(".")[0];

async function loadMigrations() {
  const dir = resolve(process.cwd(), "supabase/migrations");
  const files = (await readdir(dir))
    .filter((f) => f.endsWith(".sql"))
    .sort();
  return Promise.all(
    files.map(async (file) => ({
      file,
      sql: await readFile(resolve(dir, file), "utf8"),
    })),
  );
}

async function applyViaPostgres(databaseUrl, migrations) {
  const { default: pg } = await import("pg");
  const client = new pg.Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  console.log("Connected via DATABASE_URL");

  await client.query(`
    create schema if not exists supabase_migrations;
    create table if not exists supabase_migrations.schema_migrations (
      version text primary key,
      name text,
      statements text[],
      created_by text default 'apply-migrations.mjs',
      applied_at timestamptz default now()
    );
  `);

  for (const { file, sql } of migrations) {
    const version = file.replace(/\.sql$/, "");
    const { rows } = await client.query(
      `select 1 from supabase_migrations.schema_migrations where version = $1`,
      [version],
    );
    if (rows.length) {
      console.log(`skip  ${file}`);
      continue;
    }
    console.log(`apply ${file}`);
    try {
      await client.query("begin");
      await client.query(sql);
      await client.query(
        `insert into supabase_migrations.schema_migrations (version, name) values ($1, $2)`,
        [version, file],
      );
      await client.query("commit");
    } catch (error) {
      await client.query("rollback");
      throw new Error(`${file}: ${error.message}`);
    }
  }

  await client.end();
}

async function applyViaManagementApi(accessToken, migrations) {
  for (const { file, sql } of migrations) {
    console.log(`apply ${file}`);
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: sql }),
      },
    );
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`${file}: ${response.status} ${text}`);
    }
    console.log(`  ok`);
  }
}

async function main() {
  const migrations = await loadMigrations();
  console.log(`Found ${migrations.length} migrations for project ${PROJECT_REF}`);

  if (process.env.DATABASE_URL) {
    await applyViaPostgres(process.env.DATABASE_URL, migrations);
  } else if (process.env.SUPABASE_ACCESS_TOKEN) {
    await applyViaManagementApi(process.env.SUPABASE_ACCESS_TOKEN, migrations);
  } else {
    console.error(`
Missing credentials to apply SQL.

Provide ONE of:
  1) DATABASE_URL  — Supabase → Project Settings → Database → Connection string (URI)
     Example: postgresql://postgres.[ref]:YOUR_PASSWORD@aws-0-eu-central-1.pooler.supabase.com:6543/postgres

  2) SUPABASE_ACCESS_TOKEN — https://supabase.com/dashboard/account/tokens

Then re-run: node scripts/apply-migrations.mjs
`);
    process.exit(1);
  }

  console.log("All migrations applied.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
