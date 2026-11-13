import { and, asc, desc, eq, like } from "drizzle-orm";
import { db } from "@/db";
import { ensureDatabase } from "@/db/bootstrap";
import { claimMessages, claims, type Attachment, type Claim } from "@/db/schema";
import { businessConfig, today } from "@/lib/config";
import { claimReasons, orderActions, resolutionOptions } from "@/lib/domain";
import { getOrder } from "./orders";
import { notificationService } from "./gateways";

const cid = () => businessConfig.customerId;

export async function listClaims(): Promise<Claim[]> {
  await ensureDatabase();
  return db.select().from(claims).where(eq(claims.customerId, cid())).orderBy(desc(claims.createdAt), desc(claims.ref));
}

export async function getClaim(ref: string) {
  await ensureDatabase();
  const [claim] = await db
    .select()
    .from(claims)
    .where(and(eq(claims.ref, ref), eq(claims.customerId, cid())));
  if (!claim) return null;
  const messages = await db
    .select()
    .from(claimMessages)
    .where(eq(claimMessages.claimRef, ref))
    .orderBy(asc(claimMessages.createdAt), asc(claimMessages.id));
  return { claim, messages };
}

export async function claimStats() {
  const all = await listClaims();
  const open = all.filter((c) => c.status !== "clos");
  const closed = all.filter((c) => c.status === "clos");
  const availableCreditCents = all.filter((c) => c.creditStatus === "issued").reduce((s, c) => s + c.creditCents, 0);
  return { all, open, closed, availableCreditCents };
}

async function nextRef(): Promise<string> {
  const year = today().slice(0, 4);
  const rows = await db.select({ ref: claims.ref }).from(claims).where(like(claims.ref, `SAV-${year}-%`));
  const max = rows.reduce((m, r) => Math.max(m, Number(r.ref.split("-")[2]) || 0), 0);
  return `SAV-${year}-${String(max + 1).padStart(3, "0")}`;
}

export type ClaimItemInput = { productId: string; reason: string; quantity: string; description: string };

export async function createClaims(input: {
  orderRef: string;
  items: ClaimItemInput[];
  resolutionPref: string;
  attachments: Attachment[];
}): Promise<{ ok: true; refs: string[] } | { ok: false; message: string }> {
  await ensureDatabase();
  const order = await getOrder(input.orderRef);
  if (!order) return { ok: false, message: "Commande introuvable." };
  const rule = orderActions(order, today()).claim;
  if (!rule.allowed) return { ok: false, message: rule.reason ?? "Réclamation impossible." };
  if (input.items.length === 0) return { ok: false, message: "Sélectionnez au moins un article." };
  if (!resolutionOptions.some((r) => r.key === input.resolutionPref)) return { ok: false, message: "Choisissez une résolution." };

  const refs: string[] = [];
  for (const item of input.items) {
    const line = order.items.find((i) => i.productId === item.productId);
    if (!line) return { ok: false, message: "Article introuvable dans la commande." };
    if (!claimReasons.some((r) => r.key === item.reason)) return { ok: false, message: `Type de problème manquant pour ${line.label}.` };
    if (item.description.trim().length < 10) return { ok: false, message: `Décrivez le problème (10 caractères min.) pour ${line.label}.` };
    if (item.description.length > 1000) return { ok: false, message: "Description limitée à 1000 caractères." };

    const ref = await nextRef();
    const t = today();
    await db.insert(claims).values({
      ref,
      customerId: cid(),
      orderRef: order.ref,
      productId: line.productId,
      productLabel: `${line.label}${line.weight ? ` · ${line.weight}` : ""}`,
      lot: line.lot,
      dlc: line.dlc,
      reason: item.reason,
      quantity: item.quantity.trim() || line.weight,
      description: item.description.trim(),
      resolutionPref: input.resolutionPref,
      status: "recu",
      createdAt: t,
      updatedAt: t,
      attachments: input.attachments,
    });
    await db.insert(claimMessages).values([
      { claimRef: ref, author: "client", body: item.description.trim(), attachments: input.attachments },
      {
        claimRef: ref,
        author: "atelier",
        body: `Bonjour, votre dossier ${ref} est bien enregistré. L'atelier analyse la traçabilité du lot ${line.lot} et vous répond sous ${businessConfig.claimSlaHours}h.`,
      },
    ]);
    await notificationService.notifyAtelier(`Nouvelle réclamation ${ref}`, item.description);
    refs.push(ref);
  }
  return { ok: true, refs };
}

export async function postClaimMessage(ref: string, body: string, attachments: Attachment[] = []) {
  const text = body.trim();
  if (text.length < 2) return { ok: false, message: "Message vide." };
  if (text.length > 1000) return { ok: false, message: "1000 caractères maximum." };
  const found = await getClaim(ref);
  if (!found) return { ok: false, message: "Dossier introuvable." };
  if (found.claim.status === "clos") return { ok: false, message: "Ce dossier est clôturé." };
  await db.insert(claimMessages).values({ claimRef: ref, author: "client", body: text, attachments });
  await db.update(claims).set({ updatedAt: today() }).where(eq(claims.ref, ref));
  await notificationService.notifyAtelier(`Message ${ref}`, text);
  return { ok: true, message: "Message transmis à l'atelier." };
}
