import { NextResponse } from "next/server";
import getDb from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = await getDb();
  const isVercel = process.env.VERCEL === "1";
  const hasPostgres = !!process.env.POSTGRES_URL;
  const hasBlob = !!process.env.FANTAPODIO2026_READ_WRITE_TOKEN;
  
  return NextResponse.json({
    dbType: db.type,
    isVercel,
    hasPostgres,
    hasBlob,
    isPersistent: !isVercel || hasPostgres || hasBlob
  });
}
