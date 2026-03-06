import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

export async function GET() {
  return handleLogout();
}

export async function POST() {
  return handleLogout();
}

async function handleLogout() {
  (await cookies()).set("session", "", { 
    expires: new Date(0),
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/'
  });
  return NextResponse.json({ success: true });
}
