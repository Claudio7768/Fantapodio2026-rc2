import { NextResponse } from "next/server";
import getDb from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();
    const { gp_id, p1, p2, p3, dnfs, penalties, rimonte } = body;
    
    db.transaction(() => {
      // Save result
      const upsertResult = db.prepare(`
        INSERT INTO results (gp_id, p1, p2, p3, dnfs, penalties, rimonte)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(gp_id) DO UPDATE SET 
          p1=excluded.p1, p2=excluded.p2, p3=excluded.p3, 
          dnfs=excluded.dnfs, penalties=excluded.penalties, rimonte=excluded.rimonte
      `);
      upsertResult.run(gp_id, p1, p2, p3, JSON.stringify(dnfs || []), JSON.stringify(penalties || []), JSON.stringify(rimonte || []));

      // Mark GP as completed
      db.prepare("UPDATE gps SET completed = 1 WHERE id = ?").run(gp_id);

      // Recalculate all scores
      db.prepare("UPDATE teams SET total_points = 0").run();
      
      const allResults = db.prepare("SELECT * FROM results").all() as any[];
      allResults.forEach(resObj => {
        const predictions = db.prepare("SELECT * FROM predictions WHERE gp_id = ?").all(resObj.gp_id) as any[];
        const realPodium = [resObj.p1, resObj.p2, resObj.p3];
        const dnfsArr = JSON.parse(resObj.dnfs || "[]");
        const penaltiesArr = JSON.parse(resObj.penalties || "[]");
        const rimonteArr = JSON.parse(resObj.rimonte || "[]");

        predictions.forEach(pred => {
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

          db.prepare("UPDATE teams SET total_points = total_points + ? WHERE id = ?").run(gpPoints, pred.team_id);
        });
      });
    })();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Results error:", error);
    return NextResponse.json({ error: error.message || "Failed to save results" }, { status: 500 });
  }
}
