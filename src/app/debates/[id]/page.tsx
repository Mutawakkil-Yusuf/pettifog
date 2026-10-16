import Link from "next/link";
import { notFound } from "next/navigation";
import { getDebateDetail } from "@/lib/queries";
import { getSessionUser } from "@/lib/auth";
import { FilingCard } from "@/components/filing-card";
import { FilingForm } from "@/components/filing-form";
import { Tally } from "@/components/tally";
import { caseNo, formatDate, plural } from "@/lib/format";

export default async function CasePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ appearance?: string }>;
}) {
  const { id } = await params;
  const { appearance } = await searchParams;
  const user = await getSessionUser();
  const debate = getDebateDetail(id, user?.id ?? null);
  if (!debate) notFound();

  const ownFiling = debate.filings.find((f) => f.author.id === user?.id) ?? null;
  const forFilings = debate.filings.filter((f) => f.side === "for");
  const againstFilings = debate.filings.filter((f) => f.side === "against");
  const totalVotes = debate.forVotes + debate.againstVotes;

  const column = (
    label: string,
    side: "for" | "against",
    votes: number,
    filings: typeof forFilings,
  ) => (
    <section className="flex flex-col">
      <div className="flex items-baseline justify-between gap-3 border-b-2 border-ink pb-2">
        <h3
          className="font-display text-2xl font-bold tracking-wide"
          style={{ color: side === "for" ? "var(--color-for)" : "var(--color-against)" }}
        >
          {label}
        </h3>
        <span className="case-label text-right">
          {votes} verdicts · {plural(filings.length, "filing")}
        </span>
      </div>

      <div className="flex flex-col gap-5 pt-5">
        {filings.length === 0 ? (
          <p className="border border-dashed border-rule bg-paper-raised/60 px-4 py-8 text-center text-sm text-ink-fade">
            {side === "for" ? "The motion is unrepresented." : "Nobody has opposed the motion."}
          </p>
        ) : (
          filings.map((filing) => (
            <FilingCard key={filing.id} filing={filing} sideLabel={label} viewerId={user?.id ?? null} />
          ))
        )}
      </div>
    </section>
  );

  return (
    <div className="flex flex-col gap-10">
      <div>
        <Link href="/" className="case-label link-underline">
          ← All cases
        </Link>
      </div>

      <section className="text-center flex flex-col items-center gap-4 pb-6 rule-double">
        <p className="case-label">
          In the Pettifog Tribunal · Case {caseNo(debate.caseNo)} · Filed {formatDate(debate.createdAt)}
        </p>
        <h2 className="font-display text-3xl sm:text-5xl font-bold leading-tight max-w-3xl">
          {debate.title}
        </h2>
        <p className="max-w-2xl text-ink-fade italic text-lg">{debate.statement}</p>
        <p className="case-label normal-case tracking-[0.1em]">
          Originated by {debate.creator.displayName}
        </p>
      </section>

      <section className="flex flex-col items-center gap-3">
        <p className="case-label">The Tally {totalVotes > 0 && `· ${plural(totalVotes, "verdict")} cast`}</p>
        <Tally
          forVotes={debate.forVotes}
          againstVotes={debate.againstVotes}
          forLabel={debate.forLabel}
          againstLabel={debate.againstLabel}
        />
        {appearance === "required" && (
          <p className="font-mono text-xs text-verdict border border-verdict/40 bg-verdict/5 px-3 py-2">
            Enter your appearance above before casting a verdict.
          </p>
        )}
      </section>

      <FilingForm
        debateId={debate.id}
        forLabel={debate.forLabel}
        againstLabel={debate.againstLabel}
        current={ownFiling ? { side: ownFiling.side, body: ownFiling.body } : null}
        hasAppearance={!!user}
      />

      <div className="grid gap-10 md:grid-cols-2 md:gap-8">
        {column(debate.forLabel, "for", debate.forVotes, forFilings)}
        {column(debate.againstLabel, "against", debate.againstVotes, againstFilings)}
      </div>
    </div>
  );
}
