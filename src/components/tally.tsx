type TallyProps = {
  forVotes: number;
  againstVotes: number;
  forLabel: string;
  againstLabel: string;
  compact?: boolean;
};

/**
 * The score sheet: two ink tallies either side of a rule, with the prevailing
 * party marked. Shared by the docket rows and the case page.
 */
export function Tally({ forVotes, againstVotes, forLabel, againstLabel, compact }: TallyProps) {
  const decided = forVotes !== againstVotes;
  const forLeads = forVotes > againstVotes;

  const cell = "flex flex-col items-center gap-0.5 px-3";
  const labelCls = compact
    ? "case-label text-[0.6rem] max-w-24 truncate"
    : "case-label max-w-32 truncate";
  const countCls = compact
    ? "font-display text-xl leading-none"
    : "font-display text-3xl leading-none";

  return (
    <div className="flex items-stretch divide-x divide-rule border border-rule bg-paper-raised">
      <div className={`${cell} ${decided && forLeads ? "text-for" : "text-ink-fade"}`}>
        <span className={labelCls} title={forLabel}>
          {forLabel}
        </span>
        <span className={countCls}>{forVotes}</span>
        {!compact && decided && forLeads && <span className="stamp stamp-sustained mt-1">prevails</span>}
      </div>
      <div
        className={`${cell} ${decided && !forLeads ? "text-against" : "text-ink-fade"}`}
      >
        <span className={labelCls} title={againstLabel}>
          {againstLabel}
        </span>
        <span className={countCls}>{againstVotes}</span>
        {!compact && decided && !forLeads && (
          <span
            className="stamp stamp-sustained mt-1"
            style={{ color: "var(--color-against)" }}
          >
            prevails
          </span>
        )}
      </div>
    </div>
  );
}
