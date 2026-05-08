import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Please add it to your .env.local file.\n" +
      "Example: DATABASE_URL=postgresql://user:pass@host:5432/nekonomi"
  );
}

// Connection pool — use `max: 1` in serverless environments like Vercel
const client = postgres(connectionString, { max: 10 });

export const db = drizzle(client, { schema });
