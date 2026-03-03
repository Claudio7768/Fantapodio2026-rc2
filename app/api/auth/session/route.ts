import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export const dynamic = 'force-dynamic';

export async function GET() {
  console.log("Session request received");
  try {
    const session = await getSession();
    if (session) {
      console.log("Session found for:", session.team_name);
      return new Response(JSON.stringify(session), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
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
