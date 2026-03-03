import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

let dbInstance: Database.Database | null = null;

export function getDb(): Database.Database {
  if (dbInstance) return dbInstance;

  const isVercel = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
  let dbPath = path.join(process.cwd(), "fantapodio.db");
  
  if (isVercel) {
    const tmpPath = path.join("/tmp", "fantapodio.db");
    // If the db doesn't exist in /tmp, copy the bundled one there if it exists
    if (!fs.existsSync(tmpPath)) {
      console.log("Vercel environment detected. Copying database to /tmp...");
      try {
        if (fs.existsSync(dbPath)) {
          fs.copyFileSync(dbPath, tmpPath);
          console.log("Database copied to /tmp successfully.");
        } else {
          console.log("Initial database file not found in bundle, will create new one in /tmp.");
        }
      } catch (err) {
        console.error("Failed to copy database to /tmp:", err);
      }
    }
    dbPath = tmpPath;
  }

  console.log("Initializing database at:", dbPath);
  
  try {
    const db = new Database(dbPath);
    
    // Enable WAL mode for better performance
    db.pragma('journal_mode = WAL');
    db.exec(`
      CREATE TABLE IF NOT EXISTS teams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,
        password TEXT,
        total_points INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS gps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        location TEXT,
        date TEXT,
        start_time TEXT, -- ISO string UTC
        completed INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS predictions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        gp_id INTEGER,
        team_id INTEGER,
        p1 TEXT,
        p2 TEXT,
        p3 TEXT,
        UNIQUE(gp_id, team_id)
      );

      CREATE TABLE IF NOT EXISTS results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        gp_id INTEGER UNIQUE,
        p1 TEXT,
        p2 TEXT,
        p3 TEXT,
        dnfs TEXT, -- JSON array of drivers
        penalties TEXT, -- JSON array of drivers
        rimonte TEXT -- JSON array of drivers who started 11th+
      );
    `);

    // Seed teams if empty
    const teamCount = db.prepare("SELECT COUNT(*) as count FROM teams").get() as { count: number };
    console.log("Current team count in DB:", teamCount.count);
    if (teamCount.count === 0) {
      const insertTeam = db.prepare("INSERT INTO teams (name) VALUES (?)");
      ["CL", "ML", "FL"].forEach(name => {
        console.log(`Seeding team: ${name}`);
        insertTeam.run(name);
      });
    } else {
      const allTeams = db.prepare("SELECT name FROM teams").all();
      console.log("Existing teams in DB:", allTeams.map((t: any) => t.name).join(", "));
    }

    // Seed some 2026 GPs
    const gpCount = db.prepare("SELECT COUNT(*) as count FROM gps").get() as { count: number };
    if (gpCount.count === 0) {
      const insertGP = db.prepare("INSERT INTO gps (name, location, date, start_time) VALUES (?, ?, ?, ?)");
      const gps = [
        ["Australian GP", "Melbourne", "2026-03-08", "2026-03-08T04:00:00Z"],
        ["Chinese GP*", "Shanghai", "2026-03-15", "2026-03-15T07:00:00Z"],
        ["Japanese GP", "Suzuka", "2026-03-29", "2026-03-29T05:00:00Z"],
        ["Bahrain GP", "Sakhir", "2026-04-12", "2026-04-12T15:00:00Z"],
        ["Saudi Arabian GP", "Jeddah", "2026-04-19", "2026-04-19T17:00:00Z"],
        ["Miami GP*", "Miami", "2026-05-03", "2026-05-03T20:00:00Z"],
        ["Canadian GP*", "Montreal", "2026-05-24", "2026-05-24T20:00:00Z"],
        ["Monaco GP", "Monte Carlo", "2026-06-07", "2026-06-07T13:00:00Z"],
        ["Spanish GP", "Barcelona", "2026-06-14", "2026-06-14T13:00:00Z"],
        ["Austrian GP", "Spielberg", "2026-06-28", "2026-06-28T13:00:00Z"],
        ["British GP*", "Silverstone", "2026-07-05", "2026-07-05T14:00:00Z"],
        ["Belgian GP", "Spa", "2026-07-19", "2026-07-19T13:00:00Z"],
        ["Hungarian GP", "Budapest", "2026-07-26", "2026-07-26T13:00:00Z"],
        ["Dutch GP*", "Zandvoort", "2026-08-23", "2026-08-23T13:00:00Z"],
        ["Italian GP", "Monza", "2026-09-06", "2026-09-06T13:00:00Z"],
        ["Madrid GP", "Madrid", "2026-09-13", "2026-09-13T13:00:00Z"],
        ["Azerbaijan GP", "Baku", "2026-09-27", "2026-09-27T11:00:00Z"],
        ["Singapore GP*", "Singapore", "2026-10-11", "2026-10-11T12:00:00Z"],
        ["United States GP", "Austin", "2026-10-25", "2026-10-25T20:00:00Z"],
        ["Mexico City GP", "Mexico City", "2026-11-01", "2026-11-01T20:00:00Z"],
        ["Sao Paulo GP", "Interlagos", "2026-11-08", "2026-11-08T17:00:00Z"],
        ["Las Vegas GP", "Las Vegas", "2026-11-21", "2026-11-21T04:00:00Z"],
        ["Qatar GP", "Lusail", "2026-11-29", "2026-11-29T16:00:00Z"],
        ["Abu Dhabi GP", "Yas Marina", "2026-12-06", "2026-12-06T13:00:00Z"]
      ];
      gps.forEach(gp => insertGP.run(gp[0], gp[1], gp[2], gp[3]));
    }
    
    dbInstance = db;
    return db;
  } catch (error) {
    console.error("Database initialization failed:", error);
    throw error;
  }
}

export default getDb;
