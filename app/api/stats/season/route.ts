import { NextResponse } from "next/server";
import getDb from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDb();
  console.log("Stats request received");
  try {
    const teams = db.prepare("SELECT * FROM teams").all() as any[];
    const gps = db.prepare("SELECT * FROM gps WHERE completed = 1 ORDER BY date ASC").all() as any[];
    console.log("Found teams:", teams.length, "Completed gps:", gps.length);
    const results = db.prepare("SELECT * FROM results").all() as any[];
    
    const stats = teams.map(team => {
      let cumulative = 0;
      const gpBreakdown = gps.map(gp => {
        const result = results.find(r => r.gp_id === gp.id);
        const prediction = db.prepare("SELECT * FROM predictions WHERE gp_id = ? AND team_id = ?").get(gp.id, team.id) as any;
        
        let points = 0;
        if (result && prediction) {
          const realPodium = [result.p1, result.p2, result.p3];
          const predPodium = [prediction.p1, prediction.p2, prediction.p3];
          const dnfsArr = JSON.parse(result.dnfs || "[]");
          const penaltiesArr = JSON.parse(result.penalties || "[]");
          const rimonteArr = JSON.parse(result.rimonte || "[]");

          // Basic points
          predPodium.forEach((driver, idx) => {
            if (driver === realPodium[idx]) points += 25;
            else if (realPodium.includes(driver)) points += 10;
          });

          // En Plein
          if (prediction.p1 === result.p1 && prediction.p2 === result.p2 && prediction.p3 === result.p3) points += 20;

          // Rimonta Killer
          predPodium.forEach(driver => {
            if (realPodium.includes(driver) && rimonteArr.includes(driver)) points += 10;
          });

          // DNF Malus
          predPodium.forEach(driver => {
            if (dnfsArr.includes(driver)) points -= 10;
          });

          // Penalty Malus
          predPodium.forEach(driver => {
            if (penaltiesArr.includes(driver)) points -= 5;
          });
        }
        
        cumulative += points;
        return {
          gp_id: gp.id,
          gp_name: gp.name,
          points: points,
          cumulative: cumulative
        };
      });

      return {
        team_id: team.id,
        team_name: team.name,
        total_points: team.total_points,
        gpBreakdown
      };
    });

    return NextResponse.json({ gps, stats });
  } catch (error: any) {
    console.error("Stats error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
