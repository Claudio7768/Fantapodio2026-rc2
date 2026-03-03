import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

export async function GET() {
  (await cookies()).set("session", "", { 
    expires: new Date(0),
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/'
  });
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
