import { NextResponse } from "next/server";
import getDb from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = await getDb();
  console.log("Gps request received");
  try {
    const gps = await db.all("SELECT * FROM gps");
    console.log("Found gps:", gps.length);
    return NextResponse.json(gps);
  } catch (error: any) {
    console.error("Gps error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
