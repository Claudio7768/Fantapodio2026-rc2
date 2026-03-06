import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import { hashSync } from "bcryptjs";

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ status: "ok", service: "register" });
}

export async function POST(request: NextRequest) {
  console.log("POST /api/auth/register started");
  try {
    const body = await request.json();
    console.log("Register body:", body);
    const { name: rawName, password } = body;
    const name = rawName?.trim();
    
    if (!name || !password) {
      return new Response(JSON.stringify({ error: "Nome e password sono obbligatori" }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    const db = await getDb();
    console.log(`Register attempt for team: "${name}" in DB type: ${db.type}`);
    let team = await db.get("SELECT * FROM teams WHERE name = ? COLLATE NOCASE", [name]) as any;
    
    if (!team) {
      // Create the team if it doesn't exist
      console.log(`Creating new team: "${name}"`);
      await db.run("INSERT INTO teams (name) VALUES (?)", [name]);
      team = await db.get("SELECT * FROM teams WHERE name = ? COLLATE NOCASE", [name]) as any;
    }
    
    if (team.password) {
      return new Response(JSON.stringify({ error: "Team già registrato. Se hai dimenticato la password contatta l'amministratore o usa un altro nome." }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // Use a try-catch specifically for bcrypt
    let hashedPassword;
    try {
      hashedPassword = hashSync(password, 10);
    } catch (bcryptError: any) {
      console.error("Bcrypt error:", bcryptError);
      return new Response(JSON.stringify({ error: "Errore durante la cifratura della password", details: bcryptError.message }), { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    const result = await db.run("UPDATE teams SET password = ? WHERE name = ?", [hashedPassword, name]);

    if (result.changes === 0) {
      return new Response(JSON.stringify({ error: "Impossibile aggiornare il database" }), { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    return new Response(JSON.stringify({ success: true, message: "Registrazione completata con successo" }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (error: any) {
    console.error("Register catch block:", error);
    return new Response(JSON.stringify({
      error: "Errore interno del server",
      message: error?.message || String(error),
      type: typeof error
    }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}
