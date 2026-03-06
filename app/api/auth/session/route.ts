import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import getDb from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
  console.log("Session request received");
  try {
    const session = await getSession();
    if (session) {
      const db = await getDb();
      const team = await db.get("SELECT id, name FROM teams WHERE id = ?", [session.team_id]) as any;
      
      if (team) {
        console.log("Session verified for:", team.name);
        return NextResponse.json({
          ...session,
          team_name: team.name // Ensure name is up to date
        });
      } else {
        console.log("Session team no longer exists in DB, invalidating");
        return NextResponse.json({ error: "Session invalid" }, { status: 401 });
      }
    } else {
      console.log("No session found");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
  } catch (e: any) {
    console.error("Session route error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
