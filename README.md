# Pettifog

**Court is in session for the world's dumbest questions.**

A small arena for low-stakes arguments — *Is a hot dog a sandwich?* — where users don't
just vote. Each side files a case with evidence (images or links), and the gallery renders
a verdict on the most convincing filing.

The whole thing is dressed as a vintage legal docket: filings, exhibits, ruled paper,
and rubber stamps.

## The loop

1. **Enter your appearance** — pick a display name (no password). A signed-in-style
   session cookie keeps it.
2. **File a case** — a caption (*"Is a hot dog a sandwich?"*), a statement of the matter
   in dispute, and optional names for the two parties (defaults to `FOR` / `AGAINST`).
3. **Make your case** — one filing per person per case. Pick a side, argue it, and attach
   evidence: an uploaded image exhibit or a link.
4. **Render a verdict** — vote for the filings you find most convincing. You cannot rule on
   your own filing, and votes can be withdrawn.
5. **The tally** — side totals across all filings, with the prevailing party stamped.

People can amend their filing and add or withdraw exhibits later.

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + TypeScript
- **Tailwind CSS v4** with a manila-and-ink theme; Old Standard TT, Source Serif 4 and
  Courier Prime via `next/font`
- **SQLite via Node's built-in `node:sqlite`** — no native modules, no ORM, no external
  services
- Server Components + Server Actions for every read and write; no separate API layer
- Uploaded exhibits served through a route handler (`/uploads/[file]`) with a strict
  filename allowlist

## Getting started

```bash
npm install
npm run seed   # optional: three seeded cases with real exhibits
npm run dev
```

Then open http://localhost:3000.

### Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run seed` | Seed the docket (only runs on an empty database) |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |

## Where the data lives

Everything local, nothing hosted:

```
data/
  pettifog.db      SQLite database
  uploads/         uploaded image exhibits (uuid-named)
```

`data/` is gitignored. Deleting it and re-running `npm run seed` resets the court.
Image uploads are capped at 5MB and restricted to JPEG, PNG, GIF and WebP; the request
body limit for actions is raised to 6MB in `next.config.ts` to leave multipart headroom.

## Structure

```
src/
  app/
    layout.tsx              masthead, fonts, theme
    page.tsx                the docket (case list)
    new/page.tsx            file a case
    debates/[id]/page.tsx   a case: caption, tally, filings
    uploads/[file]/route.ts serves uploaded exhibits
    globals.css             manila & ink theme
  components/               appearance control, filing card, forms, evidence
  lib/
    db.ts                   node:sqlite connection + schema
    queries.ts              all reads and writes
    actions.ts              server actions (appear, file, enter evidence, vote)
    auth.ts                 session cookie -> user
    format.ts               docket-style formatting
  types/node-sqlite.d.ts    minimal types for node:sqlite (not in @types/node 20)
scripts/seed.ts             demo data
```

## Notes

- **Auth is a display name by design.** This is for jokes, not for anything that needs
  real accounts.
- `node:sqlite` is still marked experimental by Node and logs a warning on startup. It
  works on Node 22+.
- Votes are per filing, one per person, and never for your own filing.
