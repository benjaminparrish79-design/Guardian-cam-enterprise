import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import path from "path";

const connectionString = process.env.DATABASE_URL;

export const client = connectionString ? postgres(connectionString, { max: 1 }) : null;
export const db = client ? drizzle(client, { schema }) : null;

// Self-healing programmatic migrator
let migrationPromise: Promise<void> | null = null;
export async function runMigrations() {
  if (!db || !connectionString) return;
  if (!migrationPromise) {
    migrationPromise = (async () => {
      try {
        console.log("Running pending Drizzle migrations...");
        await migrate(db, { migrationsFolder: path.join(process.cwd(), "src/db/migrations") });
        console.log("Drizzle migrations completed successfully.");
      } catch (err) {
        console.error("Drizzle migration execution failed:", err);
      }
    })();
  }
  await migrationPromise;
}

// Trigger migration on import if database is connected and not during build phase
if (db && process.env.NEXT_PHASE !== "phase-production-build") {
  runMigrations().catch((err) => {
    console.error("Failure triggering auto-migration:", err);
  });
}

export * from "./schema";
