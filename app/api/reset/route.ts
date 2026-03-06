import { NextResponse } from "next/server";
import getDb from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = body;

    if (password !== "FANTAPODIO2026") {
      return NextResponse.json({ error: "Password errata" }, { status: 401 });
    }

    const db = await getDb();
    
    // Clear results and predictions
    await db.run("DELETE FROM results");
    await db.run("DELETE FROM predictions");
    
    // Reset GPs
    await db.run("UPDATE gps SET completed = 0");
    
    // Reset Team points and passwords
    await db.run("UPDATE teams SET total_points = 0, password = NULL");

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Reset error:", error);
    return NextResponse.json({ error: error.message || "Failed to reset app" }, { status: 500 });
  }
}
