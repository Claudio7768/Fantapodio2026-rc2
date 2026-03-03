import { NextResponse } from "next/server";
import getDb from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDb();
  console.log("Teams request received");
  try {
    const teams = db.prepare("SELECT * FROM teams ORDER BY total_points DESC").all();
    console.log("Found teams:", teams.length);
    return NextResponse.json(teams);
  } catch (error: any) {
    console.error("Teams error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
