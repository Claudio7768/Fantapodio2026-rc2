import { NextResponse } from "next/server";
import getDb from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = await getDb();
  console.log("Stats request received");
  try {
    const teams = await db.all("SELECT * FROM teams") as any[];
    const gps = await db.all("SELECT * FROM gps WHERE completed = 1 ORDER BY date ASC") as any[];
    console.log("Found teams:", teams.length, "Completed gps:", gps.length);
    const results = await db.all("SELECT * FROM results") as any[];
    
    const stats = await Promise.all(teams.map(async (team) => {
      let cumulative = 0;
      const gpBreakdown = await Promise.all(gps.map(async (gp) => {
        const result = results.find(r => r.gp_id === gp.id);
        const prediction = await db.get("SELECT * FROM predictions WHERE gp_id = ? AND team_id = ?", [gp.id, team.id]) as any;
        
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
      }));

      return {
        team_id: team.id,
        team_name: team.name,
        total_points: team.total_points,
        gpBreakdown
      };
    }));

    return NextResponse.json({ gps, stats });
  } catch (error: any) {
    console.error("Stats error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
