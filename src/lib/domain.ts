import type { ClaimStatus, Order, OrderStatus } from "@/db/schema";
import { businessConfig } from "./config";
import { daysBetween } from "./format";

/* ------------------------------------------------------------------ Orders */

export const ACTIVE_STATUSES: OrderStatus[] = ["confirmee", "en_preparation", "pesee", "prete"];
export const DONE_STATUSES: OrderStatus[] = ["retiree", "livree"];

export const orderStatusMeta: Record<OrderStatus, { label: string; className: string }> = {
  confirmee: { label: "Confirmée", className: "bg-[#1d5fb8] text-white" },
  en_preparation: { label: "En préparation", className: "bg-burgundy text-white" },
  pesee: { label: "Pesée", className: "bg-[#e3a82b] text-[#2b1a00]" },
  prete: { label: "Prête au retrait", className: "bg-[#2f7a3e] text-white" },
  retiree: { label: "Retirée", className: "bg-[#2f6b3a] text-white" },
  livree: { label: "Livrée", className: "bg-[#2f6b3a] text-white" },
  annulee: { label: "Annulée", className: "bg-stone-400 text-white" },
};

export function isActive(order: Pick<Order, "status">) {
  return ACTIVE_STATUSES.includes(order.status);
}

export function remainingCents(order: Pick<Order, "totalCents" | "paidCents">) {
  return Math.max(0, order.totalCents - order.paidCents);
}

export type TimelineStep = { key: string; label: string; date?: string; state: "done" | "current" | "todo" };

const STATUS_RANK: Record<OrderStatus, number> = {
  confirmee: 2,
  en_preparation: 3,
  pesee: 4,
  prete: 5,
  retiree: 6,
  livree: 6,
  annulee: -1,
};

export function orderTimeline(order: Order): TimelineStep[] {
  const final = order.mode === "livraison" ? "Livrée" : "Retirée";
  const defs = [
    { key: "recue", label: "Commande reçue" },
    { key: "acompte", label: "Paiement de l'acompte" },
    { key: "confirmee", label: "Confirmée" },
    { key: "en_preparation", label: "En préparation" },
    { key: "pesee", label: "Pesée · montant définitif" },
    { key: "prete", label: order.mode === "livraison" ? "En livraison" : "Prête au retrait" },
    { key: "terminee", label: final },
  ] as const;
  const rank = STATUS_RANK[order.status];
  return defs.map((d, i) => {
    let state: TimelineStep["state"] = "todo";
    if (rank === 6 || i < rank) state = "done";
    else if (i === rank) state = "current";
    return { key: d.key, label: d.label, date: order.history[d.key], state };
  });
}

/** Simplified 4-step tracker used on the overview */
export function overviewProgress(order: Order): number {
  const rank = STATUS_RANK[order.status];
  if (rank >= 6) return 4;
  if (rank >= 5) return 3;
  if (rank >= 3) return 2;
  return 1;
}

export type ActionRule = { allowed: boolean; reason?: string };

function hoursUntilSlot(order: Order, todayIso: string) {
  const days = daysBetween(todayIso, order.slotDate);
  const [h] = order.slotStart.split(":").map(Number);
  return days * 24 + (h - 12);
}

/** Every impossible action exposes a reason and the next step. */
export function orderActions(order: Order, todayIso: string) {
  const active = isActive(order);
  const hours = hoursUntilSlot(order, todayIso);
  const cutoff = businessConfig.slotChangeCutoffHours;

  const changeSlot: ActionRule = !active
    ? { allowed: false, reason: "Commande terminée : le créneau n'est plus modifiable." }
    : hours < cutoff
      ? { allowed: false, reason: `Moins de ${cutoff}h avant le retrait : appelez la boutique.` }
      : { allowed: true };

  const cancel: ActionRule = !active
    ? { allowed: false, reason: "Commande déjà terminée." }
    : order.status === "confirmee"
      ? { allowed: true }
      : { allowed: false, reason: "La découpe a commencé : contactez la boutique pour toute modification." };

  const pay: ActionRule =
    remainingCents(order) === 0
      ? { allowed: false, reason: "Commande réglée." }
      : order.status === "annulee"
        ? { allowed: false, reason: "Commande annulée." }
        : { allowed: true };

  const claim: ActionRule = DONE_STATUSES.includes(order.status)
    ? { allowed: true }
    : { allowed: false, reason: "Une réclamation s'ouvre après le retrait ou la livraison." };

  return { changeSlot, cancel, pay, claim };
}

/* ------------------------------------------------------------------ Claims */

export const claimReasons = [
  { key: "manquant", label: "Article manquant" },
  { key: "decoupe", label: "Erreur de découpe" },
  { key: "poids", label: "Poids incorrect" },
  { key: "fraicheur", label: "Problème fraîcheur" },
  { key: "conditionnement", label: "Problème conditionnement" },
  { key: "autre", label: "Autre" },
] as const;

export function claimReasonLabel(key: string) {
  return claimReasons.find((r) => r.key === key)?.label ?? key;
}

export const resolutionOptions = [
  { key: "avoir", label: "Avoir dans ma cagnotte", hint: "Crédité immédiatement après validation, valable 12 mois." },
  { key: "remplacement", label: "Remplacement au prochain retrait", hint: "L'atelier prépare une pièce équivalente." },
  { key: "remboursement", label: "Remboursement sur mon moyen de paiement", hint: "Sous 5 à 7 jours ouvrés." },
] as const;

export function resolutionLabel(key: string) {
  return resolutionOptions.find((r) => r.key === key)?.label ?? key;
}

export const claimStatusMeta: Record<ClaimStatus, { label: string; className: string }> = {
  recu: { label: "Dossier reçu", className: "bg-[#d9a23a] text-[#2b1a00]" },
  analyse: { label: "En cours d'analyse", className: "bg-[#d9a23a] text-[#2b1a00]" },
  solution: { label: "Solution proposée", className: "bg-[#1d5fb8] text-white" },
  clos: { label: "Résolu", className: "bg-[#4f7a4a] text-white" },
};

export const claimSteps: { key: ClaimStatus; label: string }[] = [
  { key: "recu", label: "Dossier Reçu" },
  { key: "analyse", label: "Analyse de l'Atelier" },
  { key: "solution", label: "Solution Proposée" },
  { key: "clos", label: "Clôture du Dossier" },
];

/* ------------------------------------------------------------------ Reviews */

export const reviewCriteria = [
  "Qualité de la découpe",
  "Fraîcheur & conservation",
  "Tendreté / Maturation",
  "Préférences respectées",
  "Conseils de cuisson",
  "Conditionnement",
];
