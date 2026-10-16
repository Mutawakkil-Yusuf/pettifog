import { getSessionUser } from "@/lib/auth";
import { NewCaseForm } from "@/components/new-case-form";

export default async function NewCasePage() {
  const user = await getSessionUser();

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-8">
      <section className="rule-double pb-6">
        <p className="case-label">In the Pettifog Tribunal · Form 1A</p>
        <h2 className="font-display text-3xl sm:text-4xl font-bold mt-2">
          Bring a case before the court
        </h2>
        <p className="mt-3 text-ink-fade">
          Every case needs a caption, a matter in dispute, and two parties willing to waste their
          time on it.
        </p>
      </section>

      {!user && (
        <p className="border border-verdict/50 bg-verdict/5 px-4 py-3 font-mono text-xs text-verdict">
          Enter your appearance in the masthead above before filing.
        </p>
      )}

      <NewCaseForm />
    </div>
  );
}
