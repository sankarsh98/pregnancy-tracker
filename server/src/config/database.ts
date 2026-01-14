import initSqlJs, { Database } from 'sql.js';
import path from 'path';
import fs from 'fs';

let db: Database | null = null;
const dbPath = path.join(__dirname, '../../data/pregnancy_tracker.db');

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export async function initDatabase(): Promise<Database> {
  if (db) return db;

  const SQL = await initSqlJs();

  // Load existing database or create new one
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON');

  // Initialize tables
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS pregnancies (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      lmp_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS daily_logs (
      id TEXT PRIMARY KEY,
      pregnancy_id TEXT NOT NULL,
      log_date TEXT NOT NULL,
      symptoms TEXT DEFAULT '[]',
      mood TEXT,
      notes TEXT,
      weight REAL,
      blood_pressure TEXT,
      blood_sugar REAL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (pregnancy_id) REFERENCES pregnancies(id) ON DELETE CASCADE,
      UNIQUE(pregnancy_id, log_date)
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      pregnancy_id TEXT NOT NULL,
      title TEXT NOT NULL,
      datetime TEXT NOT NULL,
      location TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (pregnancy_id) REFERENCES pregnancies(id) ON DELETE CASCADE
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS tracker_configs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      emoji TEXT NOT NULL,
      daily_goal INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Migrations for existing tables
  try {
    const columns = db.exec("PRAGMA table_info(daily_logs)")[0].values.map(c => c[1]);
    
    if (!columns.includes('water_intake')) {
      db.run("ALTER TABLE daily_logs ADD COLUMN water_intake INTEGER DEFAULT 0");
    }
    
    if (!columns.includes('custom_metrics')) {
      db.run("ALTER TABLE daily_logs ADD COLUMN custom_metrics TEXT DEFAULT '{}'");
    }
  } catch (e) {
    console.error('Migration error:', e);
  }

  db.run(`CREATE INDEX IF NOT EXISTS idx_pregnancies_user ON pregnancies(user_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_logs_pregnancy ON daily_logs(pregnancy_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_appointments_pregnancy ON appointments(pregnancy_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_trackers_user ON tracker_configs(user_id);`);

  // Save database
  saveDatabase();

  return db;
}

export function getDatabase(): Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export function saveDatabase(): void {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

// Helper functions for common operations
export function run(sql: string, params: any[] = []): void {
  const database = getDatabase();
  database.run(sql, params);
  saveDatabase();
}

export function get<T = any>(sql: string, params: any[] = []): T | undefined {
  const database = getDatabase();
  const stmt = database.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject() as T;
    stmt.free();
    return row;
  }
  stmt.free();
  return undefined;
}

export function all<T = any>(sql: string, params: any[] = []): T[] {
  const database = getDatabase();
  const stmt = database.prepare(sql);
  stmt.bind(params);
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return results;
}
