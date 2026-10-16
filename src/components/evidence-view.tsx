import Image from "next/image";
import { removeEvidence } from "@/lib/actions";
import type { Evidence } from "@/lib/types";

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function ExhibitLabel({ letter }: { letter: string }) {
  return <span className="exhibit self-start shrink-0">Exhibit {letter}</span>;
}

function RemoveButton({ evidenceId }: { evidenceId: string }) {
  return (
    <form
      action={removeEvidence}
      className="mt-2 flex justify-end"
      aria-label="Withdraw this exhibit"
    >
      <input type="hidden" name="evidenceId" value={evidenceId} />
      <button type="submit" className="case-label link-underline hover:text-verdict">
        withdraw exhibit
      </button>
    </form>
  );
}

export function EvidenceView({
  evidence,
  letter,
  canRemove,
}: {
  evidence: Evidence;
  letter: string;
  canRemove: boolean;
}) {
  if (evidence.kind === "image") {
    return (
      <figure className="border border-rule bg-paper px-3 pt-4 pb-3">
        <div className="relative w-full aspect-[4/3] bg-manila/60 border border-rule">
          <Image
            src={`/uploads/${encodeURIComponent(evidence.url)}`}
            alt={evidence.caption ?? `Exhibit ${letter}`}
            fill
            sizes="(max-width: 768px) 100vw, 640px"
            className="object-contain"
          />
        </div>
        <figcaption className="mt-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
          {evidence.caption && (
            <span className="case-label normal-case tracking-[0.1em] text-ink-fade">
              {evidence.caption}
            </span>
          )}
          <span className="exhibit ml-auto" aria-hidden>
            Exhibit {letter}
          </span>
        </figcaption>
        {canRemove && <RemoveButton evidenceId={evidence.id} />}
      </figure>
    );
  }

  return (
    <div className="border border-rule bg-paper-raised p-3 flex items-start gap-3">
      <ExhibitLabel letter={letter} />
      <div className="min-w-0 flex-1">
        <a
          href={evidence.url}
          target="_blank"
          rel="noopener noreferrer"
          className="link-underline font-mono text-xs break-all"
        >
          {hostname(evidence.url)}
        </a>
        {evidence.caption && (
          <p className="mt-1 text-sm text-ink-fade">{evidence.caption}</p>
        )}
        {canRemove && <RemoveButton evidenceId={evidence.id} />}
      </div>
    </div>
  );
}
