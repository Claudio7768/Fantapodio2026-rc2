import { sql } from '@vercel/postgres';
import { put, head } from "@vercel/blob";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

let sqliteDb: Database.Database | null = null;
let lastBlobSync = 0;
const BLOB_SYNC_INTERVAL = 60000; // 1 minute
const DB_FILENAME = "fantapodio.db";

async function syncFromBlob(tmpPath: string) {
  const token = process.env.FANTAPODIO2026_READ_WRITE_TOKEN;
  if (!token) return false;

  try {
    console.log("Checking for DB in Vercel Blob...");
    const blobHead = await head(DB_FILENAME, { token });
    if (blobHead) {
      console.log("Found DB in Blob, downloading...");
      const response = await fetch(blobHead.url);
      const buffer = await response.arrayBuffer();
      fs.writeFileSync(tmpPath, Buffer.from(buffer));
      console.log("DB synced from Blob successfully");
      return true;
    }
  } catch (e) {
    console.log("No DB found in Blob or error syncing:", e);
  }
  return false;
}

async function syncToBlob(tmpPath: string) {
  const token = process.env.FANTAPODIO2026_READ_WRITE_TOKEN;
  if (!token) return;

  try {
    const fileBuffer = fs.readFileSync(tmpPath);
    await put(DB_FILENAME, fileBuffer, {
      access: 'private',
      addRandomSuffix: false,
      token
    });
    console.log("DB synced TO Blob successfully");
    lastBlobSync = Date.now();
  } catch (e) {
    console.error("Error syncing DB to Blob:", e);
  }
}

export async function getDb() {
  const isPostgres = !!process.env.POSTGRES_URL;

  if (isPostgres) {
    // Initialize Postgres tables if needed
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS teams (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) UNIQUE,
          password VARCHAR(255),
          total_points INTEGER DEFAULT 0
        );
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS gps (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255),
          location VARCHAR(255),
          date VARCHAR(255),
          start_time VARCHAR(255),
          completed INTEGER DEFAULT 0
        );
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS predictions (
          id SERIAL PRIMARY KEY,
          gp_id INTEGER,
          team_id INTEGER,
          p1 VARCHAR(255),
          p2 VARCHAR(255),
          p3 VARCHAR(255),
          attempts INTEGER DEFAULT 0,
          UNIQUE(gp_id, team_id)
        );
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS results (
          id SERIAL PRIMARY KEY,
          gp_id INTEGER UNIQUE,
          p1 VARCHAR(255),
          p2 VARCHAR(255),
          p3 VARCHAR(255),
          dnfs TEXT,
          penalties TEXT,
          rimonte TEXT
        );
      `;

      // Seed teams
      const { rows: teamRows } = await sql`SELECT COUNT(*) as count FROM teams`;
      if (parseInt(teamRows[0].count) === 0) {
        await sql`INSERT INTO teams (name) VALUES ('CL'), ('ML'), ('FL')`;
      }

      // Seed GPs
      const { rows: gpRows } = await sql`SELECT COUNT(*) as count FROM gps`;
      if (parseInt(gpRows[0].count) === 0) {
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
        for (const gp of gps) {
          await sql`INSERT INTO gps (name, location, date, start_time) VALUES (${gp[0]}, ${gp[1]}, ${gp[2]}, ${gp[3]})`;
        }
      }
    } catch (e) {
      console.error("Postgres init error:", e);
    }

    return {
      type: 'postgres',
      get: async (text: string, params: any[] = []) => {
        let i = 1;
        const pgText = text.replace(/\?/g, () => `$${i++}`).replace(/COLLATE NOCASE/g, '');
        const { rows } = await sql.query(pgText, params);
        return rows[0];
      },
      all: async (text: string, params: any[] = []) => {
        let i = 1;
        const pgText = text.replace(/\?/g, () => `$${i++}`).replace(/COLLATE NOCASE/g, '');
        const { rows } = await sql.query(pgText, params);
        return rows;
      },
      run: async (text: string, params: any[] = []) => {
        let i = 1;
        // Postgres uses EXCLUDED.col instead of excluded.col in ON CONFLICT DO UPDATE
        // Also handle table name prefix in SET clause for Postgres
        const pgText = text
          .replace(/\?/g, () => `$${i++}`)
          .replace(/COLLATE NOCASE/g, '')
          .replace(/excluded\./g, 'EXCLUDED.')
          .replace(/predictions\.attempts/g, 'attempts'); // Postgres SET clause doesn't like table prefix for the target column
        
        const result = await sql.query(pgText, params);
        return { changes: result.rowCount };
      }
    };
  } else {
    // SQLite logic
    if (!sqliteDb) {
      let dbPath = path.join(process.cwd(), DB_FILENAME);
      const isVercel = process.env.VERCEL === "1";
      if (isVercel) {
        const tmpPath = path.join("/tmp", DB_FILENAME);
        if (!fs.existsSync(tmpPath)) {
          // Try to sync from Vercel Blob first
          const synced = await syncFromBlob(tmpPath);
          if (!synced && fs.existsSync(dbPath)) {
            fs.copyFileSync(dbPath, tmpPath);
          }
        }
        dbPath = tmpPath;
      }
      sqliteDb = new Database(dbPath);
      console.log("sqliteDb created:", typeof sqliteDb, Object.keys(sqliteDb));
      sqliteDb.pragma('journal_mode = WAL');
      sqliteDb.exec(`
        CREATE TABLE IF NOT EXISTS teams (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE COLLATE NOCASE,
          password TEXT,
          total_points INTEGER DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS gps (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT,
          location TEXT,
          date TEXT,
          start_time TEXT,
          completed INTEGER DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS predictions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          gp_id INTEGER,
          team_id INTEGER,
          p1 TEXT,
          p2 TEXT,
          p3 TEXT,
          attempts INTEGER DEFAULT 0,
          UNIQUE(gp_id, team_id)
        );
        CREATE TABLE IF NOT EXISTS results (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          gp_id INTEGER UNIQUE,
          p1 TEXT,
          p2 TEXT,
          p3 TEXT,
          dnfs TEXT,
          penalties TEXT,
          rimonte TEXT
        );
      `);

      const teamCount = sqliteDb.prepare("SELECT COUNT(*) as count FROM teams").get() as any;
      if (teamCount.count === 0) {
        const insertTeam = sqliteDb.prepare("INSERT INTO teams (name) VALUES (?)");
        ["CL", "ML", "FL"].forEach(name => insertTeam.run(name));
      }

      const gpCount = sqliteDb.prepare("SELECT COUNT(*) as count FROM gps").get() as any;
      if (gpCount.count === 0) {
        const insertGP = sqliteDb.prepare("INSERT INTO gps (name, location, date, start_time) VALUES (?, ?, ?, ?)");
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
    }

    return {
      type: 'sqlite',
      get: async (text: string, params: any[] = []) => {
        return sqliteDb!.prepare(text).get(...params);
      },
      all: async (text: string, params: any[] = []) => {
        return sqliteDb!.prepare(text).all(...params);
      },
      run: async (text: string, params: any[] = []) => {
        const result = sqliteDb!.prepare(text).run(...params);
        
        // If it's a write operation and we're on Vercel, sync to Blob
        const isVercel = process.env.VERCEL === "1";
        const isWrite = !text.trim().toUpperCase().startsWith('SELECT');
        if (isVercel && isWrite) {
          const tmpPath = path.join("/tmp", DB_FILENAME);
          // Debounce sync to avoid too many requests
          if (Date.now() - lastBlobSync > 5000) {
            syncToBlob(tmpPath);
          }
        }
        
        return result;
      }
    };
  }
}

export default getDb;
