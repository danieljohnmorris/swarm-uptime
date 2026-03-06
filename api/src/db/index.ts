import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as schema from "./schema.js";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

const migrationClient = postgres(connectionString, { max: 1 });
const client = postgres(connectionString);
export const db = drizzle(client, { schema });

export async function runMigrations() {
  const migrationDb = drizzle(migrationClient);
  await migrate(migrationDb, { migrationsFolder: "./drizzle" });
  console.log("Migrations complete");
}
