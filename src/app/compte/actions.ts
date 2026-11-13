"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import type { Attachment } from "@/db/schema";
import * as orderService from "@/lib/services/orders";
import * as claimService from "@/lib/services/claims";
import * as reviewService from "@/lib/services/reviews";
import * as loyaltyService from "@/lib/services/loyalty";
import { uploadService } from "@/lib/services/gateways";

export type ActionResult = { ok: boolean; message: string; redirectTo?: string };

const CART_COOKIE = "ma_cart";

async function addToCart(productIds: string[]) {
  const store = await cookies();
  let cart: string[] = [];
  try {
    cart = JSON.parse(store.get(CART_COOKIE)?.value ?? "[]");
  } catch {
    cart = [];
  }
  cart = [...cart, ...productIds].slice(-50);
  store.set(CART_COOKIE, JSON.stringify(cart), { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 14 });
  return cart.length;
}

export async function reorderAction(orderRef: string): Promise<ActionResult> {
  const order = await orderService.getOrder(orderRef);
  if (!order) return { ok: false, message: "Commande introuvable." };
  const ids = order.items.filter((i) => i.productId !== "carte-cadeau").map((i) => i.productId);
  const count = await addToCart(ids);
  revalidatePath("/", "layout");
  return { ok: true, message: `${ids.length} article(s) ajouté(s) au panier · ${count} au total.` };
}

export async function addProductToCartAction(productId: string): Promise<ActionResult> {
  const count = await addToCart([productId]);
  revalidatePath("/", "layout");
  return { ok: true, message: `Ajouté au panier · ${count} article(s).` };
}

export async function payBalanceAction(orderRef: string): Promise<ActionResult> {
  const res = await orderService.payBalance(orderRef);
  revalidatePath("/compte", "layout");
  return res;
}

export async function changeSlotAction(orderRef: string, date: string, slot: string): Promise<ActionResult> {
  const res = await orderService.changeSlot(orderRef, date, slot);
  revalidatePath("/compte", "layout");
  return res;
}

export async function cancelOrderAction(orderRef: string): Promise<ActionResult> {
  const res = await orderService.cancelOrder(orderRef);
  revalidatePath("/compte", "layout");
  return res;
}

export async function sendOrderMessageAction(orderRef: string, body: string): Promise<ActionResult> {
  const res = await orderService.sendOrderMessage(orderRef, body);
  revalidatePath(`/compte/commandes/${orderRef}`);
  return res;
}

export async function publishReviewAction(input: {
  id: number;
  rating: number;
  criteria: string[];
  comment: string;
  anonymous: boolean;
}): Promise<ActionResult> {
  const res = await reviewService.publishReview(input);
  revalidatePath("/compte", "layout");
  return res;
}

export async function deleteReviewAction(id: number): Promise<ActionResult> {
  const res = await reviewService.deleteReview(id);
  revalidatePath("/compte/avis");
  return res;
}

export async function toggleApplyPointsAction(): Promise<ActionResult> {
  const on = await loyaltyService.toggleApplyNextOrder();
  revalidatePath("/compte/cagnotte");
  return {
    ok: true,
    message: on ? "Vos points seront déduits de votre prochaine commande." : "Vos points sont conservés dans la cagnotte.",
  };
}

type FileMeta = { name: string; size: number; type: string };

export async function createClaimAction(input: {
  orderRef: string;
  items: claimService.ClaimItemInput[];
  resolutionPref: string;
  files: FileMeta[];
}): Promise<ActionResult> {
  const err = uploadService.validate(input.files);
  if (err) return { ok: false, message: err };
  const attachments: Attachment[] = await Promise.all(input.files.map((f) => uploadService.store(f)));
  const res = await claimService.createClaims({
    orderRef: input.orderRef,
    items: input.items,
    resolutionPref: input.resolutionPref,
    attachments,
  });
  if (!res.ok) return res;
  revalidatePath("/compte", "layout");
  return {
    ok: true,
    message: res.refs.length > 1 ? `Dossiers ${res.refs.join(", ")} créés.` : `Dossier ${res.refs[0]} créé.`,
    redirectTo: `/compte/reclamations/${res.refs[0]}`,
  };
}

export async function postClaimMessageAction(ref: string, body: string, files: FileMeta[] = []): Promise<ActionResult> {
  const err = uploadService.validate(files);
  if (err) return { ok: false, message: err };
  const attachments = await Promise.all(files.map((f) => uploadService.store(f)));
  const res = await claimService.postClaimMessage(ref, body, attachments);
  revalidatePath(`/compte/reclamations/${ref}`);
  return res;
}

export async function signOutAction(): Promise<ActionResult> {
  const store = await cookies();
  store.delete(CART_COOKIE);
  return { ok: true, message: "Session de démonstration réinitialisée.", redirectTo: "/compte" };
}
