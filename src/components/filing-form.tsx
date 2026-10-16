"use client";

import { useActionState } from "react";
import { enterFiling, type ActionState } from "@/lib/actions";

type FilingFormProps = {
  debateId: string;
  forLabel: string;
  againstLabel: string;
  current: { side: "for" | "against"; body: string } | null;
  hasAppearance: boolean;
};

export function FilingForm({
  debateId,
  forLabel,
  againstLabel,
  current,
  hasAppearance,
}: FilingFormProps) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(enterFiling, {});

  if (!hasAppearance) {
    return (
      <div className="border border-rule bg-paper-raised px-5 py-6">
        <p className="font-display text-xl font-bold">Make your case</p>
        <p className="mt-2 text-sm text-ink-fade">
          Enter your appearance in the masthead above, then the clerk will let you file.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="border border-rule bg-paper-raised px-5 py-5 flex flex-col gap-5">
      <input type="hidden" name="debateId" value={debateId} />

      <div>
        <p className="font-display text-xl font-bold">
          {current ? "Amend your filing" : "Make your case"}
        </p>
        <p className="mt-1 text-sm text-ink-fade">
          One filing per party. Enter your argument, then add evidence.
        </p>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="case-label mb-1">1. Take a side</legend>
        <div className="flex flex-wrap gap-3">
          <label className="stamp cursor-pointer border-ink text-ink has-[:checked]:border-verdict has-[:checked]:text-verdict has-[:checked]:shadow-[inset_0_0_0_1px_var(--color-verdict)]">
            <input
              type="radio"
              name="side"
              value="for"
              defaultChecked={current?.side !== "against"}
              className="sr-only"
            />
            {forLabel}
          </label>
          <label className="stamp cursor-pointer border-ink text-ink has-[:checked]:border-verdict has-[:checked]:text-verdict has-[:checked]:shadow-[inset_0_0_0_1px_var(--color-verdict)]">
            <input
              type="radio"
              name="side"
              value="against"
              defaultChecked={current?.side === "against"}
              className="sr-only"
            />
            {againstLabel}
          </label>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="case-label mb-2">2. Your argument</legend>
        <textarea
          name="body"
          required
          rows={5}
          maxLength={2000}
          defaultValue={current?.body ?? ""}
          placeholder="State your position. The gallery rewards the most convincing argument, not the loudest."
          className="field resize-y leading-relaxed"
        />
      </fieldset>

      <fieldset className="flex flex-col gap-3 border-t border-rule pt-4">
        <legend className="case-label mb-1">3. Enter evidence (optional)</legend>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="case-label">Exhibit — image</span>
            <input
              type="file"
              name="image"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="field file:mr-2 file:border-0 file:bg-manila file:px-2 file:font-mono file:text-[0.65rem]"
            />
            <span className="text-[0.65rem] text-ink-fade italic">JPEG, PNG, GIF or WebP · 5MB max</span>
          </label>

          <label className="flex flex-col gap-1">
            <span className="case-label">Exhibit — link</span>
            <input
              type="url"
              name="linkUrl"
              placeholder="https://…"
              maxLength={500}
              className="field"
            />
            <span className="text-[0.65rem] text-ink-fade italic">An article, image URL or citation</span>
          </label>
        </div>

        <label className="flex flex-col gap-1">
          <span className="case-label">Caption (optional)</span>
          <input
            name="caption"
            maxLength={160}
            placeholder="What this exhibit proves"
            className="field"
          />
        </label>
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
        {pending ? "Entering…" : current ? "Amend filing" : "Enter filing"}
      </button>
    </form>
  );
}
