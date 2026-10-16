import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";

export const DATA_DIR = path.join(process.cwd(), "data");
export const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");
const DB_PATH = path.join(process.cwd(), "data", "pettifog.db");

/** Resolve an uploaded exhibit. Static prefix keeps the bundle trace scoped to data/uploads. */
export function uploadPath(filename: string): string {
  return path.join(process.cwd(), "data", "uploads", filename);
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id           TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  created_at   INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS debates (
  id            TEXT PRIMARY KEY,
  case_no       INTEGER NOT NULL,
  title         TEXT NOT NULL,
  statement     TEXT NOT NULL,
  for_label     TEXT NOT NULL DEFAULT 'FOR',
  against_label TEXT NOT NULL DEFAULT 'AGAINST',
  creator_id    TEXT NOT NULL REFERENCES users(id),
  created_at    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS filings (
  id         TEXT PRIMARY KEY,
  debate_id  TEXT NOT NULL REFERENCES debates(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL REFERENCES users(id),
  side       TEXT NOT NULL CHECK (side IN ('for', 'against')),
  body       TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE (debate_id, user_id)
);

CREATE TABLE IF NOT EXISTS evidence (
  id         TEXT PRIMARY KEY,
  filing_id  TEXT NOT NULL REFERENCES filings(id) ON DELETE CASCADE,
  kind       TEXT NOT NULL CHECK (kind IN ('image', 'link')),
  url        TEXT NOT NULL,
  caption    TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS votes (
  id         TEXT PRIMARY KEY,
  filing_id  TEXT NOT NULL REFERENCES filings(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL REFERENCES users(id),
  created_at INTEGER NOT NULL,
  UNIQUE (filing_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_filings_debate ON filings(debate_id);
CREATE INDEX IF NOT EXISTS idx_evidence_filing ON evidence(filing_id);
CREATE INDEX IF NOT EXISTS idx_votes_filing ON votes(filing_id);
CREATE INDEX IF NOT EXISTS idx_votes_user ON votes(user_id);
`;

function createDb(): DatabaseSync {
  mkdirSync(UPLOAD_DIR, { recursive: true });
  const database = new DatabaseSync(DB_PATH);
  database.exec("PRAGMA journal_mode = WAL;");
  database.exec("PRAGMA foreign_keys = ON;");
  database.exec(SCHEMA);
  return database;
}

// Reuse the connection across dev hot-reloads instead of leaking handles.
const globalForDb = globalThis as unknown as { __pettifogDb?: DatabaseSync };

export const db: DatabaseSync = globalForDb.__pettifogDb ?? createDb();

if (process.env.NODE_ENV !== "production") {
  globalForDb.__pettifogDb = db;
}
