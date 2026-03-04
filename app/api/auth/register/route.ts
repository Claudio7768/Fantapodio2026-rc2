import { NextResponse } from "next/server";
import getDb from "@/lib/db";
import { hashSync } from "bcryptjs";

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ status: "ok", service: "register" });
}

export async function POST(request: Request) {
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

    const db = getDb();
    const team = db.prepare("SELECT * FROM teams WHERE name = ? COLLATE NOCASE").get(name) as any;
    
    if (!team) {
      return new Response(JSON.stringify({ error: `Team "${name}" non trovato. Scegli tra CL, ML, FL.` }), { 
        status: 404, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }
    
    if (team.password) {
      return new Response(JSON.stringify({ error: "Team già registrato. Effettua il login." }), { 
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

    const result = db.prepare("UPDATE teams SET password = ? WHERE name = ?").run(hashedPassword, name);

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
    const errObj = {
      error: "Errore interno del server",
      message: error?.message || String(error),
      type: typeof error
    };
    return new Response(JSON.stringify(errObj), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}
