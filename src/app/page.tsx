import Link from "next/link";
import { listDocket, stats } from "@/lib/queries";
import { caseNo, formatDate, plural } from "@/lib/format";
import { Tally } from "@/components/tally";

export default function DocketPage() {
  const entries = listDocket();
  const counters = stats();

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between rule-double pb-6">
        <div>
          <p className="case-label">The Docket</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold mt-2 leading-tight">
            Matters currently before the court
          </h2>
          <p className="mt-3 max-w-2xl text-ink-fade">
            Low-stakes disputes, tried properly. Take a side, enter your evidence, and let the
            gallery render a verdict on the most convincing filing.
          </p>
        </div>
        <Link
          href="/new"
          className="stamp shrink-0 border-ink text-ink hover:border-verdict hover:text-verdict px-3 py-2"
        >
          + File a case
        </Link>
      </section>

      <section className="flex flex-wrap gap-x-10 gap-y-3 case-label">
        <span>{plural(counters.cases, "case")} docketed</span>
        <span>{plural(counters.filings, "filing")}</span>
        <span>{plural(counters.verdicts, "verdict")} rendered</span>
        <span>{plural(counters.pettifoggers, "pettifogger")} in attendance</span>
      </section>

      {entries.length === 0 ? (
        <section className="border border-rule bg-paper-raised px-6 py-16 text-center">
          <p className="font-display text-2xl">No cases on the docket</p>
          <p className="mt-2 text-ink-fade">
            Somebody has to ask whether a hot dog is a sandwich.
          </p>
          <Link href="/new" className="stamp mt-6 border-ink text-ink hover:text-verdict inline-flex">
            File the first case
          </Link>
        </section>
      ) : (
        <section className="border-t-2 border-ink">
          <div className="hidden sm:grid grid-cols-[7rem_1fr_auto] gap-6 py-3 case-label border-b border-rule">
            <span>Case No.</span>
            <span>Caption</span>
            <span className="justify-self-end">The Tally</span>
          </div>
          <ul className="divide-y divide-rule">
            {entries.map((entry) => (
              <li key={entry.id}>
                <Link
                  href={`/debates/${entry.id}`}
                  className="group grid grid-cols-1 sm:grid-cols-[7rem_1fr_auto] gap-3 sm:gap-6 py-5 px-3 -mx-3 hover:bg-manila/50 transition-colors items-start sm:items-center"
                >
                  <span className="font-mono text-sm text-ink-fade group-hover:text-verdict">
                    {caseNo(entry.caseNo)}
                  </span>
                  <span className="min-w-0">
                    <span className="font-display text-xl font-bold group-hover:underline decoration-rule decoration-1 underline-offset-4">
                      {entry.title}
                    </span>
                    <span className="block text-sm text-ink-fade italic mt-1 line-clamp-2">
                      {entry.statement}
                    </span>
                    <span className="block case-label mt-2">
                      Filed by {entry.creator.displayName} · {formatDate(entry.createdAt)} ·{" "}
                      {plural(entry.filingCount, "filing")}
                    </span>
                  </span>
                  <span className="justify-self-start sm:justify-self-end">
                    <Tally
                      compact
                      forVotes={entry.forVotes}
                      againstVotes={entry.againstVotes}
                      forLabel={entry.forLabel}
                      againstLabel={entry.againstLabel}
                    />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
