import { NextResponse } from "next/server";
import getDb from "@/lib/db";
import { getSession } from "@/lib/session";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const gpId = searchParams.get("gpId");
  
  if (!gpId) return NextResponse.json({ error: "GP ID required" }, { status: 400 });

  const predictions = db.prepare(`
    SELECT p.*, t.name as team_name 
    FROM predictions p 
    JOIN teams t ON p.team_id = t.id 
    WHERE p.gp_id = ?
  `).all(gpId);
  return NextResponse.json(predictions);
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized (no session)" }, { status: 401 });

    const body = await request.json();
    const { gp_id, team_id, p1, p2, p3 } = body;
    
    // Check deadline
    const gp = db.prepare("SELECT start_time FROM gps WHERE id = ?").get(gp_id) as { start_time: string };
    if (!gp) return NextResponse.json({ error: "GP not found" }, { status: 404 });
    
    if (new Date() > new Date(gp.start_time)) {
      return NextResponse.json({ error: "Deadline passed" }, { status: 400 });
    }

    const upsert = db.prepare(`
      INSERT INTO predictions (gp_id, team_id, p1, p2, p3) 
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(gp_id, team_id) DO UPDATE SET p1=excluded.p1, p2=excluded.p2, p3=excluded.p3
    `);
    upsert.run(gp_id, team_id, p1, p2, p3);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Prediction error:", error);
    return NextResponse.json({ error: error.message || "Failed to save prediction" }, { status: 500 });
  }
}
