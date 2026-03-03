import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "fantapodio.db");
const db = new Database(dbPath);

try {
  const teams = db.prepare("SELECT * FROM teams").all();
  console.log("Teams in DB:", JSON.stringify(teams, null, 2));
  
  const gps = db.prepare("SELECT * FROM gps").all();
  console.log("GPs in DB:", gps.length);
} catch (e) {
  console.error("DB Check failed:", e);
}
