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
        return new Response(JSON.stringify({
          ...session,
          team_name: team.name // Ensure name is up to date
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        console.log("Session team no longer exists in DB, invalidating");
        // We don't have an easy way to clear the cookie from here without NextResponse
        // but returning 401 will make the client clear its state
        return new Response(JSON.stringify({ error: "Session invalid" }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } else {
      console.log("No session found");
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (e: any) {
    console.error("Session route error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
