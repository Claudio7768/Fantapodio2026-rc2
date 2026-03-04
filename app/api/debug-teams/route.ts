import { NextResponse } from "next/server";
import getDb from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = await getDb();
    const teams = await db.all("SELECT id, name, password IS NOT NULL as registered, password FROM teams");
    return NextResponse.json({ 
      teams, 
      cwd: process.cwd(),
      dbPath: "fantapodio.db"
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
