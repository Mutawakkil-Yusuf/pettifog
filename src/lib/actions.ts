"use server";

import { writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { SESSION_COOKIE, getSessionUser } from "./auth";
import { uploadPath } from "./db";
import {
  addEvidence,
  createDebate,
  createUser,
  deleteEvidence,
  getDebateDetail,
  getEvidenceOwner,
  getFilingById,
  getUserById,
  renameUser,
  toggleVote,
  upsertFiling,
} from "./queries";
import type { Side } from "./types";

export type ActionState = { error?: string; ok?: boolean };

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

const appearanceSchema = z
  .string()
  .trim()
  .min(2, "Your appearance must be at least 2 characters.")
  .max(32, "Keep your appearance under 32 characters.")
  .regex(/^[\p{L}\p{N} .'-]+$/u, "Letters, numbers, spaces and . ' - only.");

const caseSchema = z.object({
  title: z.string().trim().min(4, "Give the case a caption.").max(120, "Caption is too long."),
  statement: z.string().trim().min(5, "State the matter in dispute.").max(400, "Keep the statement under 400 characters."),
  forLabel: z.string().trim().max(24).optional(),
  againstLabel: z.string().trim().max(24).optional(),
});

const filingSchema = z.object({
  debateId: z.string().uuid(),
  side: z.enum(["for", "against"]),
  body: z.string().trim().min(5, "Enter your filing.").max(2000, "Filing is too long."),
  linkUrl: z.string().trim().max(500).optional(),
  caption: z.string().trim().max(160).optional(),
});

function httpUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol === "http:" || url.protocol === "https:") return url.toString();
  } catch {
    /* not a URL */
  }
  return null;
}

export async function setAppearance(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = appearanceSchema.safeParse(formData.get("displayName"));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid appearance." };
  }

  const store = await cookies();
  const existingId = store.get(SESSION_COOKIE)?.value;
  const existing = existingId ? getUserById(existingId) : null;

  if (existing) {
    renameUser(existing.id, parsed.data);
  } else {
    const user = createUser(parsed.data);
    store.set(SESSION_COOKIE, user.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function fileCase(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getSessionUser();
  if (!user) return { error: "Enter your appearance before filing a case." };

  const parsed = caseSchema.safeParse({
    title: formData.get("title"),
    statement: formData.get("statement"),
    forLabel: formData.get("forLabel") || undefined,
    againstLabel: formData.get("againstLabel") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid case." };
  }

  const debate = createDebate({
    title: parsed.data.title,
    statement: parsed.data.statement,
    forLabel: parsed.data.forLabel || "FOR",
    againstLabel: parsed.data.againstLabel || "AGAINST",
    creatorId: user.id,
  });

  revalidatePath("/", "layout");
  redirect(`/debates/${debate.id}`);
}

export async function enterFiling(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getSessionUser();
  if (!user) return { error: "Enter your appearance before filing." };

  const rawLink = String(formData.get("linkUrl") ?? "").trim();
  const parsed = filingSchema.safeParse({
    debateId: formData.get("debateId"),
    side: formData.get("side"),
    body: formData.get("body"),
    linkUrl: rawLink || undefined,
    caption: formData.get("caption") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid filing." };
  }

  const debate = getDebateDetail(parsed.data.debateId, user.id);
  if (!debate) return { error: "That case is not on the docket." };

  let filingId: string;
  try {
    filingId = upsertFiling({
      debateId: parsed.data.debateId,
      userId: user.id,
      side: parsed.data.side as Side,
      body: parsed.data.body,
    });
  } catch {
    return { error: "Your filing could not be entered." };
  }

  const caption = parsed.data.caption || null;

  if (parsed.data.linkUrl) {
    const url = httpUrl(parsed.data.linkUrl);
    if (!url) return { error: "Evidence links must be a valid http(s) URL." };
    addEvidence({ filingId, kind: "link", url, caption });
  }

  const image = formData.get("image");
  if (image instanceof File && image.size > 0) {
    if (image.size > MAX_UPLOAD_BYTES) {
      return { error: "Exhibits must be 5MB or smaller." };
    }
    const ext = IMAGE_TYPES[image.type];
    if (!ext) {
      return { error: "Exhibits must be a JPEG, PNG, GIF or WebP image." };
    }
    const filename = `${randomUUID()}.${ext}`;
    const bytes = Buffer.from(await image.arrayBuffer());
    await writeFile(uploadPath(filename), bytes);
    addEvidence({ filingId, kind: "image", url: filename, caption });
  }

  revalidatePath(`/debates/${parsed.data.debateId}`);
  redirect(`/debates/${parsed.data.debateId}`);
}

export async function renderVerdict(formData: FormData): Promise<void> {
  const user = await getSessionUser();
  const filingId = String(formData.get("filingId") ?? "");
  const filing = getFilingById(filingId);
  if (!filing) return;

  if (!user) {
    redirect(`/debates/${filing.debateId}?appearance=required`);
  }
  if (filing.userId === user.id) return; // no one rules on their own filing

  toggleVote(filing.id, user.id);
  revalidatePath(`/debates/${filing.debateId}`);
  revalidatePath("/");
}

export async function removeEvidence(formData: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!user) return;

  const evidenceId = String(formData.get("evidenceId") ?? "");
  const owner = getEvidenceOwner(evidenceId);
  if (!owner || owner.userId !== user.id) return;

  deleteEvidence(evidenceId);
  const filing = getFilingById(owner.filingId);
  if (filing) revalidatePath(`/debates/${filing.debateId}`);
}
