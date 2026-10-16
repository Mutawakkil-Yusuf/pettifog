"use client";

import { useActionState } from "react";
import { fileCase, type ActionState } from "@/lib/actions";

export function NewCaseForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(fileCase, {});

  return (
    <form action={formAction} className="flex flex-col gap-7">
      <fieldset className="flex flex-col gap-2">
        <legend className="case-label mb-1">1. Caption of the case</legend>
        <input
          name="title"
          required
          maxLength={120}
          placeholder="e.g. Is a hot dog a sandwich?"
          className="field text-base"
        />
        <p className="text-xs text-ink-fade italic">The question the court will decide.</p>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="case-label mb-1">2. Statement of the matter in dispute</legend>
        <textarea
          name="statement"
          required
          rows={3}
          maxLength={400}
          placeholder="Set out the controversy in a sentence or two."
          className="field resize-y"
        />
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="case-label mb-1">3. Names of the parties (optional)</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="case-label">For the motion</span>
            <input name="forLabel" maxLength={24} placeholder="FOR" className="field" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="case-label">Against the motion</span>
            <input name="againstLabel" maxLength={24} placeholder="AGAINST" className="field" />
          </label>
        </div>
        <p className="text-xs text-ink-fade italic">
          Leave blank for the default FOR / AGAINST. Custom names help on cases like
          &ldquo;Team Cake&rdquo; v. &ldquo;Team Pie.&rdquo;
        </p>
      </fieldset>

      {state.error && (
        <p className="font-mono text-xs text-verdict border border-verdict/40 bg-verdict/5 px-3 py-2">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="stamp self-start border-ink text-ink hover:border-verdict hover:text-verdict px-4 py-2 text-xs disabled:opacity-50"
      >
        {pending ? "Filing…" : "File the case"}
      </button>
    </form>
  );
}
