import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    // Dynamically import to avoid crashing at build time when DATABASE_URL is absent
    const { db } = await import("@/db");
    const result = await db.execute(sql`SELECT 1 AS ok`);

    return NextResponse.json({
      status: "ok",
      database: "connected",
      timestamp: new Date().toISOString(),
      result: result[0],
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown database error";

    return NextResponse.json(
      {
        status: "error",
        database: "disconnected",
        timestamp: new Date().toISOString(),
        error: message,
      },
      { status: 500 }
    );
  }
}
