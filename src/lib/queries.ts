import { randomUUID } from "node:crypto";
import { db } from "./db";
import type {
  Debate,
  DebateDetail,
  DocketEntry,
  Evidence,
  Filing,
  Side,
  User,
} from "./types";

type Row = Record<string, unknown>;

const str = (v: unknown): string => String(v);
const num = (v: unknown): number => Number(v);
const strOrNull = (v: unknown): string | null => (v == null ? null : String(v));

/* ----------------------------- users ----------------------------- */

export function getUserById(id: string): User | null {
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as Row | undefined;
  if (!row) return null;
  return {
    id: str(row.id),
    displayName: str(row.display_name),
    createdAt: num(row.created_at),
  };
}

export function createUser(displayName: string): User {
  const user: User = {
    id: randomUUID(),
    displayName,
    createdAt: Date.now(),
  };
  db.prepare("INSERT INTO users (id, display_name, created_at) VALUES (?, ?, ?)").run(
    user.id,
    user.displayName,
    user.createdAt,
  );
  return user;
}

export function renameUser(id: string, displayName: string): void {
  db.prepare("UPDATE users SET display_name = ? WHERE id = ?").run(displayName, id);
}

/* ---------------------------- debates ---------------------------- */

function mapDebate(row: Row): Debate {
  return {
    id: str(row.id),
    caseNo: num(row.case_no),
    title: str(row.title),
    statement: str(row.statement),
    forLabel: str(row.for_label),
    againstLabel: str(row.against_label),
    createdAt: num(row.created_at),
    creator: {
      id: str(row.creator_id),
      displayName: str(row.creator_name),
    },
  };
}

export function nextCaseNo(): number {
  const row = db.prepare("SELECT COALESCE(MAX(case_no), 0) + 1 AS next FROM debates").get() as Row;
  return num(row.next);
}

export function createDebate(input: {
  title: string;
  statement: string;
  forLabel: string;
  againstLabel: string;
  creatorId: string;
}): Debate {
  const id = randomUUID();
  const createdAt = Date.now();
  const caseNo = nextCaseNo();
  db.prepare(
    `INSERT INTO debates (id, case_no, title, statement, for_label, against_label, creator_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    caseNo,
    input.title,
    input.statement,
    input.forLabel,
    input.againstLabel,
    input.creatorId,
    createdAt,
  );
  return {
    id,
    caseNo,
    title: input.title,
    statement: input.statement,
    forLabel: input.forLabel,
    againstLabel: input.againstLabel,
    createdAt,
    creator: { id: input.creatorId, displayName: "" },
  };
}

const TALLY_SQL = `
  SELECT f.debate_id AS debate_id, f.side AS side, COUNT(v.id) AS votes
  FROM filings f
  LEFT JOIN votes v ON v.filing_id = f.id
  GROUP BY f.debate_id, f.side
`;

const FILING_COUNT_SQL = `
  SELECT debate_id, COUNT(*) AS c FROM filings GROUP BY debate_id
`;

export function listDocket(): DocketEntry[] {
  const rows = db
    .prepare(
      `SELECT d.*, u.display_name AS creator_name
       FROM debates d
       JOIN users u ON u.id = d.creator_id
       ORDER BY d.created_at DESC`,
    )
    .all() as Row[];

  const tallies = new Map<string, { for: number; against: number }>();
  for (const t of db.prepare(TALLY_SQL).all() as Row[]) {
    const key = str(t.debate_id);
    const entry = tallies.get(key) ?? { for: 0, against: 0 };
    entry[str(t.side) === "for" ? "for" : "against"] = num(t.votes);
    tallies.set(key, entry);
  }

  const counts = new Map<string, number>();
  for (const c of db.prepare(FILING_COUNT_SQL).all() as Row[]) {
    counts.set(str(c.debate_id), num(c.c));
  }

  return rows.map((row) => {
    const debate = mapDebate(row);
    const tally = tallies.get(debate.id) ?? { for: 0, against: 0 };
    return {
      ...debate,
      filingCount: counts.get(debate.id) ?? 0,
      forVotes: tally.for,
      againstVotes: tally.against,
    };
  });
}

export function getDebateDetail(debateId: string, viewerId: string | null): DebateDetail | null {
  const row = db
    .prepare(
      `SELECT d.*, u.display_name AS creator_name
       FROM debates d
       JOIN users u ON u.id = d.creator_id
       WHERE d.id = ?`,
    )
    .get(debateId) as Row | undefined;
  if (!row) return null;

  const debate = mapDebate(row);

  const filingRows = db
    .prepare(
      `SELECT f.*, u.display_name AS author_name,
              (SELECT COUNT(*) FROM votes v WHERE v.filing_id = f.id) AS votes
       FROM filings f
       JOIN users u ON u.id = f.user_id
       WHERE f.debate_id = ?
       ORDER BY votes DESC, f.created_at ASC`,
    )
    .all(debateId) as Row[];

  const evidenceRows = db
    .prepare(
      `SELECT e.* FROM evidence e
       JOIN filings f ON f.id = e.filing_id
       WHERE f.debate_id = ?
       ORDER BY e.created_at ASC`,
    )
    .all(debateId) as Row[];

  const evidenceByFiling = new Map<string, Evidence[]>();
  for (const e of evidenceRows) {
    const filingId = str(e.filing_id);
    const list = evidenceByFiling.get(filingId) ?? [];
    list.push({
      id: str(e.id),
      filingId,
      kind: str(e.kind) === "image" ? "image" : "link",
      url: str(e.url),
      caption: strOrNull(e.caption),
      createdAt: num(e.created_at),
    });
    evidenceByFiling.set(filingId, list);
  }

  const voted = new Set<string>();
  if (viewerId) {
    const voteRows = db
      .prepare(
        `SELECT v.filing_id AS filing_id FROM votes v
         JOIN filings f ON f.id = v.filing_id
         WHERE f.debate_id = ? AND v.user_id = ?`,
      )
      .all(debateId, viewerId) as Row[];
    for (const v of voteRows) voted.add(str(v.filing_id));
  }

  const filings: Filing[] = filingRows.map((f) => {
    const id = str(f.id);
    return {
      id,
      debateId,
      side: (str(f.side) === "for" ? "for" : "against") as Side,
      body: str(f.body),
      createdAt: num(f.created_at),
      updatedAt: num(f.updated_at),
      author: { id: str(f.user_id), displayName: str(f.author_name) },
      votes: num(f.votes),
      hasVoted: voted.has(id),
      evidence: evidenceByFiling.get(id) ?? [],
    };
  });

  return {
    ...debate,
    filings,
    forVotes: filings.filter((f) => f.side === "for").reduce((n, f) => n + f.votes, 0),
    againstVotes: filings.filter((f) => f.side === "against").reduce((n, f) => n + f.votes, 0),
  };
}

/* ---------------------------- filings ---------------------------- */

export function getFilingById(id: string): { id: string; debateId: string; userId: string; side: Side } | null {
  const row = db.prepare("SELECT * FROM filings WHERE id = ?").get(id) as Row | undefined;
  if (!row) return null;
  return {
    id: str(row.id),
    debateId: str(row.debate_id),
    userId: str(row.user_id),
    side: (str(row.side) === "for" ? "for" : "against") as Side,
  };
}

export function upsertFiling(input: {
  debateId: string;
  userId: string;
  side: Side;
  body: string;
}): string {
  const now = Date.now();
  const existing = db
    .prepare("SELECT id FROM filings WHERE debate_id = ? AND user_id = ?")
    .get(input.debateId, input.userId) as Row | undefined;

  if (existing) {
    const id = str(existing.id);
    db.prepare("UPDATE filings SET side = ?, body = ?, updated_at = ? WHERE id = ?").run(
      input.side,
      input.body,
      now,
      id,
    );
    return id;
  }

  const id = randomUUID();
  db.prepare(
    `INSERT INTO filings (id, debate_id, user_id, side, body, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, input.debateId, input.userId, input.side, input.body, now, now);
  return id;
}

/* --------------------------- evidence ---------------------------- */

export function addEvidence(input: {
  filingId: string;
  kind: "image" | "link";
  url: string;
  caption: string | null;
}): void {
  db.prepare(
    `INSERT INTO evidence (id, filing_id, kind, url, caption, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(randomUUID(), input.filingId, input.kind, input.url, input.caption, Date.now());
}

export function getEvidenceOwner(evidenceId: string): { filingId: string; userId: string } | null {
  const row = db
    .prepare(
      `SELECT e.id, e.filing_id, f.user_id
       FROM evidence e JOIN filings f ON f.id = e.filing_id
       WHERE e.id = ?`,
    )
    .get(evidenceId) as Row | undefined;
  if (!row) return null;
  return { filingId: str(row.filing_id), userId: str(row.user_id) };
}

export function deleteEvidence(evidenceId: string): void {
  db.prepare("DELETE FROM evidence WHERE id = ?").run(evidenceId);
}

/* ----------------------------- votes ----------------------------- */

export function toggleVote(filingId: string, userId: string): void {
  const existing = db
    .prepare("SELECT id FROM votes WHERE filing_id = ? AND user_id = ?")
    .get(filingId, userId) as Row | undefined;
  if (existing) {
    db.prepare("DELETE FROM votes WHERE id = ?").run(str(existing.id));
    return;
  }
  db.prepare("INSERT INTO votes (id, filing_id, user_id, created_at) VALUES (?, ?, ?, ?)").run(
    randomUUID(),
    filingId,
    userId,
    Date.now(),
  );
}

/* ----------------------------- stats ----------------------------- */

export function stats(): { cases: number; pettifoggers: number; filings: number; verdicts: number } {
  const one = (sql: string): number => num((db.prepare(sql).get() as Row).c);
  return {
    cases: one("SELECT COUNT(*) AS c FROM debates"),
    pettifoggers: one("SELECT COUNT(*) AS c FROM users"),
    filings: one("SELECT COUNT(*) AS c FROM filings"),
    verdicts: one("SELECT COUNT(*) AS c FROM votes"),
  };
}
