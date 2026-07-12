import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "./schema"

// Neon/serverless-friendly: allow fewer idle connections on Vercel
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  ssl:
    process.env.DATABASE_URL?.includes("sslmode=require") ||
    process.env.DATABASE_URL?.includes("neon.tech")
      ? { rejectUnauthorized: false }
      : undefined,
})
export const db = drizzle(pool, { schema })
