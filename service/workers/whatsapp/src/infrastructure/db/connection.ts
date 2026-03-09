import pg from "pg";
import type { Pool as PoolType } from "pg";
import { envs } from "../../config/envs";

let pool: PoolType | null = null;

export async function connectDB(): Promise<PoolType> {
  if (pool) {
    return pool;
  }

  const connectionString = envs.URL_DB;
  console.log("Connecting to the database...", connectionString);
  if (!connectionString) {
    throw new Error("DB_URL_WORKER or DB_URL must be set");
  }

  pool = new pg.Pool({ connectionString });
  await pool.query("SELECT 1");
  console.log("Connected to the database successfully");
  return pool;
}
