import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { db, UPLOAD_DIR } from "../src/lib/db";
import {
  addEvidence,
  createDebate,
  createUser,
  toggleVote,
  upsertFiling,
} from "../src/lib/queries";
import type { Side } from "../src/lib/types";

/**
 * Seeds the docket with a few cases worth arguing about.
 * Run with: npm run seed
 */

const IMAGES = {
  hotDogBun:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Hot_dog_with_homemade_hot_dog_bun.jpg/960px-Hot_dog_with_homemade_hot_dog_bun.jpg",
  hotDogRoll:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Hot_Dog_Roll_2.jpg/812px-Hot_Dog_Roll_2.jpg",
  cerealBowl:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Froot-Loops-Cereal-Bowl.jpg/960px-Froot-Loops-Cereal-Bowl.jpg",
} as const;

/** Download an exhibit into the upload dir; a network hiccup must never block seeding. */
async function fetchImage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "pettifog-seed/1.0 (demo data)" },
    });
    if (!res.ok) return null;
    const type = res.headers.get("content-type") ?? "";
    const ext = type.includes("png")
      ? "png"
      : type.includes("gif")
        ? "gif"
        : type.includes("webp")
          ? "webp"
          : "jpg";
    const filename = `${randomUUID()}.${ext}`;
    await writeFile(path.join(UPLOAD_DIR, filename), Buffer.from(await res.arrayBuffer()));
    return filename;
  } catch {
    return null;
  }
}

type FilingInput = {
  debateId: string;
  userId: string;
  side: Side;
  body: string;
  image?: { url: string; caption: string } | null;
  links?: { url: string; caption: string }[];
};

function fileFiling(input: FilingInput): string {
  const filingId = upsertFiling({
    debateId: input.debateId,
    userId: input.userId,
    side: input.side,
    body: input.body,
  });
  if (input.image) {
    addEvidence({ filingId, kind: "image", url: input.image.url, caption: input.image.caption });
  }
  for (const link of input.links ?? []) {
    addEvidence({ filingId, kind: "link", url: link.url, caption: link.caption });
  }
  return filingId;
}

function count(sql: string): number {
  return Number((db.prepare(sql).get() as { c?: number }).c ?? 0);
}

async function main() {
  if (count("SELECT COUNT(*) AS c FROM debates") > 0) {
    console.log("Database already seeded — nothing to do.");
    return;
  }

  const [hotDogBun, hotDogRoll, cerealBowl] = await Promise.all([
    fetchImage(IMAGES.hotDogBun),
    fetchImage(IMAGES.hotDogRoll),
    fetchImage(IMAGES.cerealBowl),
  ]);

  const users = [
    "Ada Quibble",
    "Barrister Bong",
    "Pundit Naledi",
    "Clementine Clerk",
    "Max Moot",
  ].map((name) => createUser(name));
  const ids = new Map(users.map((u) => [u.displayName, u.id]));
  const uid = (name: string): string => {
    const id = ids.get(name);
    if (!id) throw new Error(`missing seeded user: ${name}`);
    return id;
  };

  /* -------------------------- Case 1: hot dog -------------------------- */
  const hotDog = createDebate({
    title: "Is a hot dog a sandwich?",
    statement:
      "A frankfurter in a split roll, sold as a sandwich on menus across the republic. The court must decide whether it belongs to the sandwich genus at all.",
    forLabel: "SANDWICH",
    againstLabel: "NOT A SANDWICH",
    creatorId: uid("Ada Quibble"),
  });

  const hdFor = fileFiling({
    debateId: hotDog.id,
    userId: uid("Ada Quibble"),
    side: "for",
    body: "Article I. A sandwich is bread around a filling; a hot dog is bread around a filling. The hinge does not repeal the definition — open-faced sandwiches have been sandwiches since long before opposing counsel learned to eat.\n\nExhibit A shows a single roll split down the middle: still two halves, divided by the cut, enclosing the filling on three sides. The court may take judicial notice of that.",
    image: hotDogBun ? { url: hotDogBun, caption: "A roll, split. Two halves. One filling." } : null,
    links: [
      { url: "https://en.wikipedia.org/wiki/Sandwich", caption: "Wikipedia: Sandwich (admissible)" },
    ],
  });

  const hdAgainst = fileFiling({
    debateId: hotDog.id,
    userId: uid("Barrister Bong"),
    side: "against",
    body: "Opposition. The two-slice requirement is not decoration, it is structure. A hot dog bun is one continuous piece of bread: you never remove a top slice, you open a hinge. On the appellant's logic a book is two boards and therefore a sandwich.\n\nExhibit A, the defendant in its native habitat. The hot dog is its own genus. Pretending otherwise is how civilisation ends.",
    image: hotDogRoll ? { url: hotDogRoll, caption: "One piece of bread. Hinge intact." } : null,
    links: [{ url: "https://en.wikipedia.org/wiki/Hot_dog", caption: "Wikipedia: Hot dog" }],
  });

  const hdFor2 = fileFiling({
    debateId: hotDog.id,
    userId: uid("Pundit Naledi"),
    side: "for",
    body: "Supplementary. Menus list the bun as served open. Open-faced sandwiches are sandwiches. The republic's own signage has already ruled on this, your honour, and we are merely catching up with it.",
    links: [{ url: "https://en.wikipedia.org/wiki/Hot_dog#Serving", caption: "Wikipedia: Hot dog — serving" }],
  });

  /* --------------------------- Case 2: cereal -------------------------- */
  const cereal = createDebate({
    title: "Is cereal a soup?",
    statement:
      "Served in a bowl, submerged in liquid, consumed with a spoon. The court must decide whether cereal is, in fact, soup.",
    forLabel: "IT'S SOUP",
    againstLabel: "NOT A SOUP",
    creatorId: uid("Pundit Naledi"),
  });

  const ceFor = fileFiling({
    debateId: cereal.id,
    userId: uid("Pundit Naledi"),
    side: "for",
    body: "Soup is ingredients in liquid, served hot or cold, in a bowl. Cereal is ingredients in liquid, served cold, in a bowl. Temperature is not an element of the definition — gazpacho settled that years ago.\n\nExhibit A: the bowl, the milk, the spoon. The only reason we hesitate is branding.",
    image: cerealBowl ? { url: cerealBowl, caption: "Bowl. Liquid. Spoon. The elements are all present." } : null,
    links: [{ url: "https://en.wikipedia.org/wiki/Soup", caption: "Wikipedia: Soup" }],
  });

  const ceAgainst1 = fileFiling({
    debateId: cereal.id,
    userId: uid("Ada Quibble"),
    side: "against",
    body: "The definition requires a broth with intent. Milk is not broth. Cereal is a porridge that has given up on itself, and porridge is not soup.\n\nExhibit A is offered and immediately distinguished: it is breakfast, not a first course.",
    links: [{ url: "https://en.wikipedia.org/wiki/Porridge", caption: "Wikipedia: Porridge" }],
  });

  const ceAgainst2 = fileFiling({
    debateId: cereal.id,
    userId: uid("Max Moot"),
    side: "against",
    body: "Also: cereal is eaten before the milk turns grey. Once the milk is grey we are in soup territory, and nobody wants that.",
    links: [{ url: "https://en.wikipedia.org/wiki/Cereal", caption: "Wikipedia: Cereal" }],
  });

  /* --------------------------- Case 3: water --------------------------- */
  const water = createDebate({
    title: "Is water wet?",
    statement: "Wetness is a property water confers on other things. Can the wetter be wet?",
    forLabel: "WET",
    againstLabel: "NOT WET",
    creatorId: uid("Clementine Clerk"),
  });

  const wtFor = fileFiling({
    debateId: water.id,
    userId: uid("Clementine Clerk"),
    side: "for",
    body: "Water makes things wet. The substance performing the wetting is, at the moment of performance, in the state it induces. To deny this is to give water a licence the rest of us do not enjoy.",
    links: [{ url: "https://en.wikipedia.org/wiki/Wetness", caption: "Wikipedia: Wetness" }],
  });

  const wtAgainst = fileFiling({
    debateId: water.id,
    userId: uid("Barrister Bong"),
    side: "against",
    body: "'Wet' describes something covered in water. Water cannot cover itself — that would be water covered in water, which is simply more water. Adjourned.",
    links: [{ url: "https://en.wikipedia.org/wiki/Water", caption: "Wikipedia: Water" }],
  });

  /* ----------------------------- Verdicts ------------------------------ */
  const vote = (filingId: string, names: string[]) => {
    for (const name of names) toggleVote(filingId, uid(name));
  };

  vote(hdFor, ["Barrister Bong", "Clementine Clerk", "Max Moot"]);
  vote(hdAgainst, ["Ada Quibble", "Clementine Clerk", "Max Moot", "Pundit Naledi"]);
  vote(hdFor2, ["Ada Quibble", "Barrister Bong"]);

  vote(ceFor, ["Ada Quibble", "Barrister Bong", "Clementine Clerk"]);
  vote(ceAgainst1, ["Pundit Naledi", "Max Moot", "Barrister Bong"]);
  vote(ceAgainst2, ["Ada Quibble"]);

  vote(wtFor, ["Ada Quibble"]);
  vote(wtAgainst, ["Ada Quibble", "Max Moot"]);

  console.log(
    `Seeded ${count("SELECT COUNT(*) AS c FROM debates")} cases, ` +
      `${count("SELECT COUNT(*) AS c FROM users")} pettifoggers, ` +
      `${count("SELECT COUNT(*) AS c FROM filings")} filings, ` +
      `${count("SELECT COUNT(*) AS c FROM votes")} verdicts, ` +
      `${count("SELECT COUNT(*) AS c FROM evidence")} exhibits.`,
  );
  if (!hotDogBun || !hotDogRoll || !cerealBowl) {
    console.log("Note: an image exhibit failed to download; that filing runs on link evidence.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
