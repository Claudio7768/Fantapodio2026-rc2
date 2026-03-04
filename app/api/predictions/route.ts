import { NextResponse } from "next/server";
import getDb from "@/lib/db";
import { getSession } from "@/lib/session";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const db = await getDb();
  const { searchParams } = new URL(request.url);
  const gpId = searchParams.get("gpId");
  
  if (!gpId) return NextResponse.json({ error: "GP ID required" }, { status: 400 });

  const gpIdNum = parseInt(gpId);
  if (isNaN(gpIdNum)) return NextResponse.json({ error: "Invalid GP ID" }, { status: 400 });

  const predictions = await db.all(`
    SELECT p.*, t.name as team_name 
    FROM predictions p 
    JOIN teams t ON p.team_id = t.id 
    WHERE p.gp_id = ?
  `, [gpIdNum]);
  return NextResponse.json(predictions);
}

export async function POST(request: Request) {
  try {
    const db = await getDb();
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized (no session)" }, { status: 401 });

    const body = await request.json();
    const { gp_id, team_id, p1, p2, p3 } = body;
    
    console.log(`Saving prediction for team ${team_id}, GP ${gp_id}: ${p1}, ${p2}, ${p3}`);
    
    const gpIdNum = parseInt(gp_id);
    const teamIdNum = parseInt(team_id);

    if (isNaN(gpIdNum) || isNaN(teamIdNum)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    // Check deadline
    const gp = await db.get("SELECT start_time FROM gps WHERE id = ?", [gpIdNum]) as { start_time: string };
    if (!gp) return NextResponse.json({ error: "GP not found" }, { status: 404 });
    
    if (new Date() > new Date(gp.start_time)) {
      return NextResponse.json({ error: "Deadline passed" }, { status: 400 });
    }

    // Check attempts
    const existing = await db.get("SELECT attempts FROM predictions WHERE gp_id = ? AND team_id = ?", [gpIdNum, teamIdNum]) as { attempts: number } | undefined;
    if (existing && existing.attempts >= 3) {
      return NextResponse.json({ error: "Maximum attempts (3) reached for this GP" }, { status: 400 });
    }

    await db.run(`
      INSERT INTO predictions (gp_id, team_id, p1, p2, p3, attempts) 
      VALUES (?, ?, ?, ?, ?, 1)
      ON CONFLICT(gp_id, team_id) DO UPDATE SET 
        p1=excluded.p1, 
        p2=excluded.p2, 
        p3=excluded.p3,
        attempts = predictions.attempts + 1
    `, [gpIdNum, teamIdNum, p1, p2, p3]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Prediction error:", error);
    return NextResponse.json({ error: error.message || "Failed to save prediction" }, { status: 500 });
  }
}
