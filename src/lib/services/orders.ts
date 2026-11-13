import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { ensureDatabase } from "@/db/bootstrap";
import { orderMessages, orders, type Order, type OrderStatus } from "@/db/schema";
import { businessConfig, today } from "@/lib/config";
import { ACTIVE_STATUSES, DONE_STATUSES, orderActions, remainingCents } from "@/lib/domain";
import { addDays } from "@/lib/format";
import { notificationService, paymentGateway } from "./gateways";

const cid = () => businessConfig.customerId;

export type OrderFilters = {
  q?: string;
  state?: "toutes" | "en_cours" | "terminees" | "annulees";
  period?: "tout" | "30j" | "90j" | "annee";
  sort?: "recentes" | "anciennes" | "montant";
};

export async function listOrders(filters: OrderFilters = {}): Promise<Order[]> {
  await ensureDatabase();
  const rows = await db.select().from(orders).where(eq(orders.customerId, cid())).orderBy(desc(orders.placedAt));
  const t = today();
  const q = filters.q?.trim().toLowerCase();
  let list = rows.filter((o) => {
    if (q && !(o.ref.toLowerCase().includes(q) || o.items.some((i) => i.label.toLowerCase().includes(q)))) return false;
    if (filters.state === "en_cours" && !ACTIVE_STATUSES.includes(o.status)) return false;
    if (filters.state === "terminees" && !DONE_STATUSES.includes(o.status)) return false;
    if (filters.state === "annulees" && o.status !== "annulee") return false;
    if (filters.period === "30j" && o.placedAt < addDays(t, -30)) return false;
    if (filters.period === "90j" && o.placedAt < addDays(t, -90)) return false;
    if (filters.period === "annee" && o.placedAt.slice(0, 4) !== t.slice(0, 4)) return false;
    return true;
  });
  if (filters.sort === "anciennes") list = [...list].reverse();
  if (filters.sort === "montant") list = [...list].sort((a, b) => b.totalCents - a.totalCents);
  return list;
}

export async function getOrder(ref: string): Promise<Order | null> {
  await ensureDatabase();
  const [row] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.ref, ref), eq(orders.customerId, cid())));
  return row ?? null;
}

export async function getOrderMessages(ref: string) {
  await ensureDatabase();
  return db.select().from(orderMessages).where(eq(orderMessages.orderRef, ref)).orderBy(asc(orderMessages.createdAt));
}

export async function getNextPickup(): Promise<Order | null> {
  const list = await listOrders();
  const t = today();
  return (
    list
      .filter((o) => ACTIVE_STATUSES.includes(o.status) && o.slotDate >= t)
      .sort((a, b) => (a.slotDate + a.slotStart).localeCompare(b.slotDate + b.slotStart))[0] ?? null
  );
}

type Result = { ok: boolean; message: string };

export async function payBalance(ref: string): Promise<Result> {
  const order = await getOrder(ref);
  if (!order) return { ok: false, message: "Commande introuvable." };
  const rule = orderActions(order, today()).pay;
  if (!rule.allowed) return { ok: false, message: rule.reason ?? "Paiement impossible." };
  const amount = remainingCents(order);
  const res = await paymentGateway.charge({ amountCents: amount, reference: ref, description: `Solde ${ref}` });
  if (!res.ok) return { ok: false, message: res.error };
  await db.update(orders).set({ paidCents: order.totalCents }).where(eq(orders.ref, ref));
  return { ok: true, message: `Paiement accepté (${res.transactionId}). Votre solde est réglé.` };
}

export const SLOT_OPTIONS = ["09:30-10:00", "10:00-10:30", "10:30-11:00", "11:00-11:30", "17:00-17:30", "17:30-18:00", "18:00-18:30"];

export async function changeSlot(ref: string, date: string, slot: string): Promise<Result> {
  const order = await getOrder(ref);
  if (!order) return { ok: false, message: "Commande introuvable." };
  const rule = orderActions(order, today()).changeSlot;
  if (!rule.allowed) return { ok: false, message: rule.reason ?? "Modification impossible." };
  if (!SLOT_OPTIONS.includes(slot)) return { ok: false, message: "Créneau invalide." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date <= addDays(today(), 0)) {
    return { ok: false, message: "Choisissez une date à partir de demain." };
  }
  const [start, end] = slot.split("-");
  await db.update(orders).set({ slotDate: date, slotStart: start, slotEnd: end }).where(eq(orders.ref, ref));
  await notificationService.notifyAtelier(`Créneau modifié ${ref}`, `${date} ${slot}`);
  return { ok: true, message: "Créneau de retrait modifié. Un e-mail de confirmation vous a été envoyé." };
}

export async function cancelOrder(ref: string): Promise<Result> {
  const order = await getOrder(ref);
  if (!order) return { ok: false, message: "Commande introuvable." };
  const rule = orderActions(order, today()).cancel;
  if (!rule.allowed) return { ok: false, message: rule.reason ?? "Annulation impossible." };
  await db
    .update(orders)
    .set({ status: "annulee" as OrderStatus, history: { ...order.history, annulee: today() } })
    .where(eq(orders.ref, ref));
  return { ok: true, message: "Commande annulée. L'acompte sera remboursé sous 5 jours ouvrés." };
}

export async function sendOrderMessage(ref: string, body: string): Promise<Result> {
  const text = body.trim();
  if (text.length < 3) return { ok: false, message: "Votre message est trop court." };
  if (text.length > 1000) return { ok: false, message: "1000 caractères maximum." };
  const order = await getOrder(ref);
  if (!order) return { ok: false, message: "Commande introuvable." };
  await db.insert(orderMessages).values({ orderRef: ref, body: text });
  await notificationService.notifyAtelier(`Message ${ref}`, text);
  return { ok: true, message: "Message envoyé à l'atelier." };
}
