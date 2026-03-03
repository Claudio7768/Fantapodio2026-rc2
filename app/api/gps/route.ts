import { NextResponse } from "next/server";
import getDb from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDb();
  console.log("Gps request received");
  try {
    const gps = db.prepare("SELECT * FROM gps").all();
    console.log("Found gps:", gps.length);
    return NextResponse.json(gps);
  } catch (error: any) {
    console.error("Gps error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
