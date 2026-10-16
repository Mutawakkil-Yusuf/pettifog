import { renderVerdict } from "@/lib/actions";
import { EvidenceView } from "./evidence-view";
import { formatDate } from "@/lib/format";
import type { Filing } from "@/lib/types";

function exhibitLetter(index: number): string {
  return String.fromCharCode(65 + (index % 26));
}

export function FilingCard({
  filing,
  sideLabel,
  viewerId,
}: {
  filing: Filing;
  sideLabel: string;
  viewerId: string | null;
}) {
  const isOwn = filing.author.id === viewerId;
  const sideCls = filing.side === "for" ? "text-for" : "text-against";

  return (
    <article className="border border-rule bg-paper-raised flex flex-col">
      <header className="px-4 pt-4 pb-3 border-b border-rule flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className={`case-label ${sideCls}`}>{sideLabel}</span>
          <p className="font-mono text-[0.8rem] mt-1 truncate">
            {isOwn && <span className="text-verdict">[you] </span>}
            {filing.author.displayName}
          </p>
        </div>
        <span className="case-label whitespace-nowrap">{filing.votes} verdicts</span>
      </header>

      <div className="px-4 py-4 flex-1">
        <p className="text-[0.95rem] leading-relaxed whitespace-pre-wrap">{filing.body}</p>

        {filing.evidence.length > 0 && (
          <div className="mt-4 flex flex-col gap-4">
            {filing.evidence.map((ev, i) => (
              <EvidenceView
                key={ev.id}
                evidence={ev}
                letter={exhibitLetter(i)}
                canRemove={isOwn}
              />
            ))}
          </div>
        )}
      </div>

      <footer className="px-4 py-3 border-t border-rule flex flex-wrap items-center justify-between gap-3">
        {isOwn ? (
          <span className="stamp border-rule text-ink-fade" title="You cannot rule on your own filing.">
            No self-ruling
          </span>
        ) : (
          <form action={renderVerdict} className="flex items-center gap-3">
            <input type="hidden" name="filingId" value={filing.id} />
            <button
              type="submit"
              className={
                filing.hasVoted
                  ? "stamp stamp-sustained"
                  : "stamp border-ink text-ink hover:border-verdict hover:text-verdict"
              }
            >
              {filing.hasVoted ? "Sustained ✓" : "Render verdict"}
            </button>
            <span className="font-mono text-xs text-ink-fade">{filing.votes} of the gallery</span>
          </form>
        )}

        <span className="case-label normal-case tracking-[0.1em]">
          {formatDate(filing.createdAt)}
          {filing.updatedAt !== filing.createdAt && " · amended"}
        </span>
      </footer>
    </article>
  );
}
