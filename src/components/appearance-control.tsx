"use client";

import { useActionState, useState } from "react";
import { setAppearance, type ActionState } from "@/lib/actions";

/**
 * The session cookie is set inside the action, which makes Next re-render the
 * layout with the new name. The parent keys this component on that name, so a
 * successful filing remounts us with `editing` reset — no state syncing needed.
 */
export function AppearanceControl({ user }: { user: { displayName: string } | null }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(setAppearance, {});
  const [editing, setEditing] = useState(!user);

  if (user && !editing) {
    return (
      <div className="flex items-center gap-3">
        <span className="case-label">Appearing as</span>
        <span className="font-mono text-xs uppercase tracking-[0.18em] border-b border-ink/40 pb-0.5">
          {user.displayName}
        </span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="case-label link-underline"
        >
          change
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-1">
      <div className="flex items-end gap-2">
        <label className="flex flex-col gap-1">
          <span className="case-label">Enter your appearance</span>
          <span className="w-44 block">
            <input
              name="displayName"
              defaultValue={user?.displayName ?? ""}
              placeholder="name to be called"
              maxLength={32}
              required
              autoFocus={!user}
              className="field"
            />
          </span>
        </label>
        <button
          type="submit"
          disabled={pending}
          className="stamp border-ink text-ink hover:border-verdict hover:text-verdict disabled:opacity-50"
        >
          {pending ? "Filing…" : "Appear"}
        </button>
        {user && (
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="case-label pb-2 hover:text-ink"
          >
            cancel
          </button>
        )}
        {state.ok && <span className="case-label pb-2 text-verdict">recorded</span>}
      </div>
      {state.error && <p className="font-mono text-[0.65rem] text-verdict">{state.error}</p>}
    </form>
  );
}
