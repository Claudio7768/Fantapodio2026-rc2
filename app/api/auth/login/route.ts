import { NextResponse } from "next/server";
import getDb from "@/lib/db";
import { compareSync } from "bcryptjs";
import { encrypt } from "@/lib/session";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ status: "ok", service: "login" });
}

export async function POST(request: Request) {
  console.log("POST /api/auth/login started");
  try {
    const body = await request.json();
    const { name: rawName, password } = body;
    const name = rawName?.trim();
    
    if (!name || !password) {
      return new Response(JSON.stringify({ error: "Nome e password sono obbligatori" }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    const db = getDb();
    console.log(`Login attempt for team: "${name}"`);
    const team = db.prepare("SELECT * FROM teams WHERE name = ? COLLATE NOCASE").get(name) as any;
    
    if (!team) {
      console.log(`Team not found: "${name}"`);
      return new Response(JSON.stringify({ error: "Credenziali non valide. Team non trovato." }), { 
        status: 401, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    if (!team.password) {
      console.log(`Team found but not registered: "${name}"`);
      return new Response(JSON.stringify({ error: "Credenziali non valide. Team non ancora registrato." }), { 
        status: 401, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    let isMatch = false;
    try {
      isMatch = compareSync(password, team.password);
    } catch (bcryptError: any) {
      console.error("Bcrypt compare error:", bcryptError);
      return new Response(JSON.stringify({ error: "Errore durante la verifica della password", details: bcryptError.message }), { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    if (isMatch) {
      const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      const session = await encrypt({ team_id: team.id, team_name: team.name, expires });

      (await cookies()).set("session", session, { 
        expires, 
        httpOnly: true, 
        secure: true, 
        sameSite: 'none',
        path: '/'
      });

      return new Response(JSON.stringify({ id: team.id, name: team.name, message: "Login successful" }), { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      });
    } else {
      return new Response(JSON.stringify({ error: "Credenziali non valide. Password errata." }), { 
        status: 401, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }
  } catch (error: any) {
    console.error("Login catch block:", error);
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
