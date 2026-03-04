import { NextResponse } from "next/server";
import getDb from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const db = await getDb();
    const body = await request.json();
    const { gp_id, p1, p2, p3, dnfs, penalties, rimonte } = body;
    
    // Save result
    await db.run(`
      INSERT INTO results (gp_id, p1, p2, p3, dnfs, penalties, rimonte)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(gp_id) DO UPDATE SET 
        p1=excluded.p1, p2=excluded.p2, p3=excluded.p3, 
        dnfs=excluded.dnfs, penalties=excluded.penalties, rimonte=excluded.rimonte
    `, [gp_id, p1, p2, p3, JSON.stringify(dnfs || []), JSON.stringify(penalties || []), JSON.stringify(rimonte || [])]);

    // Mark GP as completed
    await db.run("UPDATE gps SET completed = 1 WHERE id = ?", [gp_id]);

    // Recalculate all scores
    await db.run("UPDATE teams SET total_points = 0");
    
    const allResults = await db.all("SELECT * FROM results") as any[];
    for (const resObj of allResults) {
      const predictions = await db.all("SELECT * FROM predictions WHERE gp_id = ?", [resObj.gp_id]) as any[];
      const realPodium = [resObj.p1, resObj.p2, resObj.p3];
      const dnfsArr = JSON.parse(resObj.dnfs || "[]");
      const penaltiesArr = JSON.parse(resObj.penalties || "[]");
      const rimonteArr = JSON.parse(resObj.rimonte || "[]");

      for (const pred of predictions) {
        let gpPoints = 0;
        const predPodium = [pred.p1, pred.p2, pred.p3];

        // Basic points
        predPodium.forEach((driver, idx) => {
          if (driver === realPodium[idx]) {
            gpPoints += 25;
          } else if (realPodium.includes(driver)) {
            gpPoints += 10;
          }
        });

        // En Plein Bonus
        if (pred.p1 === resObj.p1 && pred.p2 === resObj.p2 && pred.p3 === resObj.p3) {
          gpPoints += 20;
        }

        // Rimonta Killer Bonus
        predPodium.forEach(driver => {
          if (realPodium.includes(driver) && rimonteArr.includes(driver)) {
            gpPoints += 10;
          }
        });

        // DNF Malus
        predPodium.forEach(driver => {
          if (dnfsArr.includes(driver)) {
            gpPoints -= 10;
          }
        });

        // Penalty Malus
        predPodium.forEach(driver => {
          if (penaltiesArr.includes(driver)) {
            gpPoints -= 5;
          }
        });

        await db.run("UPDATE teams SET total_points = total_points + ? WHERE id = ?", [gpPoints, pred.team_id]);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Results error:", error);
    return NextResponse.json({ error: error.message || "Failed to save results" }, { status: 500 });
  }
}
