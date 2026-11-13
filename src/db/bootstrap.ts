import { sql } from "drizzle-orm";
import { db } from "./index";
import {
  claimMessages,
  claims,
  loyaltyMovements,
  orders,
  reviews,
  vouchers,
  type Attachment,
  type OrderItem,
} from "./schema";
import { businessConfig } from "@/lib/config";

const DDL = sql`
CREATE TABLE IF NOT EXISTS orders (
  ref text PRIMARY KEY, customer_id text NOT NULL, status text NOT NULL, placed_at text NOT NULL,
  mode text NOT NULL, shop text NOT NULL, slot_date text NOT NULL, slot_start text NOT NULL, slot_end text NOT NULL,
  items jsonb NOT NULL, total_cents integer NOT NULL, deposit_cents integer NOT NULL DEFAULT 0,
  paid_cents integer NOT NULL DEFAULT 0, pickup_code text NOT NULL, history jsonb NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS order_messages (
  id serial PRIMARY KEY, order_ref text NOT NULL, body text NOT NULL, created_at timestamp NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS reviews (
  id serial PRIMARY KEY, customer_id text NOT NULL, order_ref text NOT NULL, product_id text NOT NULL,
  product_label text NOT NULL, fulfilled_label text NOT NULL, status text NOT NULL, rating integer,
  criteria jsonb NOT NULL DEFAULT '[]'::jsonb, comment text NOT NULL DEFAULT '', anonymous boolean NOT NULL DEFAULT false,
  published_at text, reply_author text, reply_date text, reply_text text
);
CREATE TABLE IF NOT EXISTS claims (
  ref text PRIMARY KEY, customer_id text NOT NULL, order_ref text NOT NULL, product_id text NOT NULL,
  product_label text NOT NULL, lot text NOT NULL, dlc text NOT NULL, reason text NOT NULL, quantity text NOT NULL,
  description text NOT NULL, resolution_pref text NOT NULL, status text NOT NULL, created_at text NOT NULL,
  updated_at text NOT NULL, credit_cents integer NOT NULL DEFAULT 0, credit_status text NOT NULL DEFAULT 'none',
  credit_valid_until text, resolution_text text, attachments jsonb NOT NULL DEFAULT '[]'::jsonb
);
CREATE TABLE IF NOT EXISTS claim_messages (
  id serial PRIMARY KEY, claim_ref text NOT NULL, author text NOT NULL, body text NOT NULL,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb, created_at timestamp NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS loyalty_movements (
  id serial PRIMARY KEY, customer_id text NOT NULL, kind text NOT NULL, label text NOT NULL, order_ref text,
  product_id text, points integer NOT NULL, occurred_at text NOT NULL
);
CREATE TABLE IF NOT EXISTS vouchers (
  code text PRIMARY KEY, customer_id text NOT NULL, kind text NOT NULL, label text NOT NULL,
  amount_cents integer NOT NULL, valid_until text NOT NULL, status text NOT NULL DEFAULT 'active'
);
CREATE TABLE IF NOT EXISTS settings ( key text PRIMARY KEY, value jsonb NOT NULL );
`;

const SHOP = "Boutique de Sannois";
const it = (productId: string, label: string, weight: string, priceCents: number, lot: string, dlc: string): OrderItem => ({
  productId,
  label,
  weight,
  priceCents,
  lot,
  dlc,
});

type Executor = Pick<typeof db, "insert">;

async function seed(x: Executor) {
  const c = businessConfig.customerId;
  const full = (placed: string, done: string, mid: string) => ({
    recue: placed,
    acompte: placed,
    confirmee: mid,
    en_preparation: mid,
    pesee: mid,
    prete: done,
    terminee: done,
  });

  await x.insert(orders).values([
    {
      ref: "CMD-2483", customerId: c, status: "en_preparation", placedAt: "2026-10-26", mode: "retrait", shop: SHOP,
      slotDate: "2026-11-07", slotStart: "10:00", slotEnd: "10:30",
      items: [
        it("cote-boeuf", "Côte de bœuf maturée", "1,2 kg", 6943, "900050007", "2026-11-11"),
        it("merguez", "Merguez maison", "800 g", 2237, "800125078", "2026-11-09"),
      ],
      totalCents: 9180, depositCents: 4000, paidCents: 4000, pickupCode: "MA-2483-SVU",
      history: { recue: "2026-10-26", acompte: "2026-10-29", confirmee: "2026-10-29", en_preparation: "2026-11-04" },
    },
    {
      ref: "CMD-2489", customerId: c, status: "pesee", placedAt: "2026-10-30", mode: "retrait", shop: SHOP,
      slotDate: "2026-11-06", slotStart: "17:00", slotEnd: "17:30",
      items: [
        it("cote-boeuf", "Côte de bœuf maturée sur os", "1,1 kg", 5422, "900050011", "2026-11-10"),
        it("merguez", "Merguez maison", "800 g", 2237, "800125090", "2026-11-08"),
      ],
      totalCents: 7659, depositCents: 2300, paidCents: 2300, pickupCode: "MA-2489-PLZ",
      history: { recue: "2026-10-30", acompte: "2026-10-30", confirmee: "2026-10-31", en_preparation: "2026-11-03", pesee: "2026-11-04" },
    },
    {
      ref: "CMD-2492", customerId: c, status: "confirmee", placedAt: "2026-11-02", mode: "retrait", shop: SHOP,
      slotDate: "2026-11-14", slotStart: "10:00", slotEnd: "10:30",
      items: [
        it("cote-boeuf", "Côte de bœuf maturée sur os", "1 kg", 5389, "à attribuer", "—"),
        it("merguez", "Merguez maison", "800 g", 2237, "à attribuer", "—"),
      ],
      totalCents: 7626, depositCents: 2301, paidCents: 2301, pickupCode: "MA-2492-KRT",
      history: { recue: "2026-11-02", acompte: "2026-11-02", confirmee: "2026-11-03" },
    },
    {
      ref: "CMD-2452", customerId: c, status: "retiree", placedAt: "2026-10-24", mode: "retrait", shop: SHOP,
      slotDate: "2026-10-31", slotStart: "10:00", slotEnd: "10:30",
      items: [
        it("cote-boeuf", "Côte de bœuf maturée", "1,2 kg", 6943, "900050007", "2026-11-04"),
        it("merguez", "Merguez maison", "800 g", 2237, "900155078", "2026-10-31"),
      ],
      totalCents: 9180, depositCents: 4000, paidCents: 9180, pickupCode: "MA-2452-QDN",
      history: full("2026-10-24", "2026-10-31", "2026-10-29"),
    },
    {
      ref: "CMD-9003", customerId: c, status: "livree", placedAt: "2026-10-30", mode: "livraison", shop: SHOP,
      slotDate: "2026-11-01", slotStart: "14:00", slotEnd: "18:00",
      items: [
        it("roti-veau", "Rôti de veau fermier", "600 g", 2266, "700330012", "2026-11-05"),
        it("merguez", "Merguez maison", "400 g", 1119, "800125061", "2026-11-04"),
        it("magret", "Magret de canard du Sud-Ouest", "400 g", 1690, "600220145", "2026-11-06"),
        it("cote-boeuf", "Côte de bœuf maturée (steak)", "350 g", 1264, "900050002", "2026-11-05"),
      ],
      totalCents: 6339, depositCents: 0, paidCents: 6339, pickupCode: "MA-9003-LVR",
      history: full("2026-10-30", "2026-11-01", "2026-10-31"),
    },
    {
      ref: "CMD-9001", customerId: c, status: "retiree", placedAt: "2026-10-28", mode: "retrait", shop: SHOP,
      slotDate: "2026-10-31", slotStart: "09:30", slotEnd: "10:00",
      items: [
        it("carte-cadeau", "Carte cadeau Maison Annoix - 50 €", "", 5000, "—", "—"),
        it("cote-boeuf-28", "Côte de bœuf maturée 28 jours", "1 kg", 4836, "900028004", "2026-11-05"),
      ],
      totalCents: 9836, depositCents: 0, paidCents: 9836, pickupCode: "MA-9001-GFT",
      history: full("2026-10-28", "2026-10-31", "2026-10-29"),
    },
    {
      ref: "CMD-2449", customerId: c, status: "retiree", placedAt: "2026-10-25", mode: "retrait", shop: SHOP,
      slotDate: "2026-10-27", slotStart: "17:00", slotEnd: "17:30",
      items: [
        it("cote-boeuf", "Côte de bœuf maturée sur os", "1,1 kg", 5422, "900049987", "2026-10-31"),
        it("merguez", "Merguez maison", "800 g", 2237, "800124990", "2026-10-30"),
      ],
      totalCents: 7659, depositCents: 2300, paidCents: 7659, pickupCode: "MA-2449-BTS",
      history: full("2026-10-25", "2026-10-27", "2026-10-26"),
    },
    {
      ref: "CMD-2446", customerId: c, status: "retiree", placedAt: "2026-10-24", mode: "retrait", shop: SHOP,
      slotDate: "2026-10-26", slotStart: "10:00", slotEnd: "10:30",
      items: [it("roti-veau", "Rôti de veau fermier ficelé", "1 kg", 3776, "700329870", "2026-10-30")],
      totalCents: 3776, depositCents: 0, paidCents: 3776, pickupCode: "MA-2446-RVF",
      history: full("2026-10-24", "2026-10-26", "2026-10-25"),
    },
  ]);

  const reply = { replyAuthor: "L'Atelier de Sannois" };
  await x.insert(reviews).values([
    { customerId: c, orderRef: "CMD-2452", productId: "cote-boeuf", productLabel: "Côte de bœuf maturée · 1,2 kg", fulfilledLabel: "Retirée le 31 oct. 2026", status: "pending" },
    { customerId: c, orderRef: "CMD-9001", productId: "cote-boeuf-28", productLabel: "Côte de bœuf maturée 28 jours · 1 kg", fulfilledLabel: "Retirée le 31 oct. 2026", status: "pending" },
    { customerId: c, orderRef: "CMD-2449", productId: "merguez", productLabel: "Merguez maison · 800 g", fulfilledLabel: "Retirée le 27 oct. 2026", status: "pending" },
    { customerId: c, orderRef: "CMD-2449", productId: "cote-boeuf", productLabel: "Côte de bœuf maturée · 1,1 kg", fulfilledLabel: "Retirée le 27 oct. 2026", status: "published", rating: 5, criteria: ["Qualité de la découpe", "Tendreté / Maturation"], comment: "La pièce était parfaite, la maturation idéale pour la cuisson. Un régal !", publishedAt: "2026-10-28", ...reply, replyDate: "2026-11-01", replyText: "Merci Marie, ravi que la découpe vous ait plu !" },
    { customerId: c, orderRef: "CMD-2446", productId: "roti-veau", productLabel: "Rôti de veau fermier ficelé", fulfilledLabel: "Retirée le 26 oct. 2026", status: "published", rating: 4, criteria: ["Préférences respectées"], comment: "Respect des préférences, cuisson parfaite.", publishedAt: "2026-10-27" },
    { customerId: c, orderRef: "CMD-9003", productId: "merguez", productLabel: "Merguez maison · 400 g", fulfilledLabel: "Livrée le 1 nov. 2026", status: "published", rating: 5, criteria: ["Fraîcheur & conservation", "Conseils de cuisson"], comment: "Fraîcheur & conservation impeccable. Super pour le BBQ !", publishedAt: "2026-11-02" },
    { customerId: c, orderRef: "CMD-9003", productId: "magret", productLabel: "Magret de canard du Sud-Ouest · 400 g", fulfilledLabel: "Livrée le 1 nov. 2026", status: "published", rating: 5, criteria: ["Qualité de la découpe"], comment: "Magret généreux, la peau croustille à merveille.", publishedAt: "2026-11-02", ...reply, replyDate: "2026-11-03", replyText: "Merci pour ce retour, le Gers vous salue !" },
    { customerId: c, orderRef: "CMD-9003", productId: "roti-veau", productLabel: "Rôti de veau fermier · 600 g", fulfilledLabel: "Livrée le 1 nov. 2026", status: "published", rating: 5, criteria: ["Conditionnement"], comment: "Livraison soignée, bac isotherme impeccable.", publishedAt: "2026-11-02" },
    { customerId: c, orderRef: "CMD-9003", productId: "cote-boeuf", productLabel: "Côte de bœuf maturée (steak) · 350 g", fulfilledLabel: "Livrée le 1 nov. 2026", status: "published", rating: 5, criteria: ["Tendreté / Maturation"], comment: "Steak fondant, persillé parfait.", publishedAt: "2026-11-03" },
  ]);

  const photo: Attachment = { name: "photo_merguez.jpg", size: 1_240_000, url: "/images/products/merguez.jpg" };
  const resolved = (
    ref: string, orderRef: string, productId: string, productLabel: string, reason: string, date: string,
    credit: number, creditStatus: "used" | "issued" | "none", resolutionPref = "avoir",
  ) => ({
    ref, customerId: c, orderRef, productId, productLabel, lot: "—", dlc: date, reason, quantity: "—",
    description: "Dossier traité par l'atelier.", resolutionPref, status: "clos" as const, createdAt: date, updatedAt: date,
    creditCents: credit, creditStatus, creditValidUntil: credit ? `${Number(date.slice(0, 4)) + 1}${date.slice(4)}` : null,
    resolutionText: credit ? "Avoir émis dans votre cagnotte." : "Pièce remplacée lors du retrait suivant.",
  });

  await x.insert(claims).values([
    {
      ref: "SAV-2026-042", customerId: c, orderRef: "CMD-2452", productId: "merguez", productLabel: "Merguez maison · 800 g",
      lot: "900155078", dlc: "2026-10-31", reason: "fraicheur", quantity: "800 g",
      description: "Bonjour, les merguez reçues sentaient mauvais à l'ouverture de l'emballage, alors que la DLC n'était pas dépassée. Je joins une photo du lot.",
      resolutionPref: "avoir", status: "analyse", createdAt: "2026-11-02", updatedAt: "2026-11-02",
      creditCents: 1500, creditStatus: "proposed", attachments: [photo],
    },
    {
      ref: "SAV-2026-043", customerId: c, orderRef: "CMD-9003", productId: "magret", productLabel: "Magret de canard du Sud-Ouest · 400 g",
      lot: "600220145", dlc: "2026-11-06", reason: "manquant", quantity: "1 pièce",
      description: "Il manquait le second magret dans le colis livré dimanche.", resolutionPref: "remplacement",
      status: "recu", createdAt: "2026-11-03", updatedAt: "2026-11-03", creditStatus: "none",
    },
    resolved("SAV-2026-041", "CMD-2449", "merguez", "Lot merguez", "poids", "2026-10-28", 1500, "issued"),
    resolved("SAV-2026-040", "CMD-2446", "roti-veau", "Rôti de veau", "poids", "2026-10-27", 420, "used"),
    resolved("SAV-2026-039", "CMD-2398", "cote-boeuf", "Côte de bœuf", "decoupe", "2026-09-18", 650, "used"),
    resolved("SAV-2026-038", "CMD-2311", "magret", "Magret de canard", "conditionnement", "2026-08-02", 0, "none", "remplacement"),
    resolved("SAV-2026-037", "CMD-2270", "merguez", "Lot merguez", "poids", "2026-06-14", 380, "used"),
  ]);

  const at = (iso: string) => new Date(iso);
  await x.insert(claimMessages).values([
    { claimRef: "SAV-2026-042", author: "client", body: "Bonjour, je vous signale un problème de fraîcheur sur les merguez de ma commande CMD-2452 retirée samedi. Photo jointe.", attachments: [photo], createdAt: at("2026-11-02T09:12:00+01:00") },
    { claimRef: "SAV-2026-042", author: "atelier", body: "Bonjour Marie, notre équipe qualité a bien reçu votre demande. Nous vérifions la traçabilité du lot 900155078 et la chaîne du froid de votre retrait. Réponse sous 24h.", createdAt: at("2026-11-02T10:05:00+01:00") },
    { claimRef: "SAV-2026-042", author: "client", body: "Merci. Dois-je rapporter le reste du lot en boutique ?", createdAt: at("2026-11-02T18:40:00+01:00") },
    { claimRef: "SAV-2026-042", author: "atelier", body: "Bonjour Marie, inutile de rapporter le produit. Après une première analyse, un écart de température a été relevé sur ce lot. Nous vous proposerons un avoir de 15,00 € valable 12 mois, sous réserve de validation par notre responsable qualité. Nous revenons vers vous très vite pour clôturer le dossier.", createdAt: at("2026-11-03T08:30:00+01:00") },
    { claimRef: "SAV-2026-043", author: "client", body: "Bonjour, il manquait le second magret dans mon colis livré dimanche.", createdAt: at("2026-11-03T11:20:00+01:00") },
    { claimRef: "SAV-2026-043", author: "atelier", body: "Bonjour Marie, votre dossier est bien enregistré. L'atelier vérifie le bon de préparation et revient vers vous sous 24h.", createdAt: at("2026-11-03T11:21:00+01:00") },
    { claimRef: "SAV-2026-041", author: "client", body: "Le lot de merguez pesait 680 g au lieu de 800 g.", createdAt: at("2026-10-28T12:00:00+01:00") },
    { claimRef: "SAV-2026-041", author: "atelier", body: "Écart confirmé à la pesée de contrôle. Un avoir de 15,00 € a été crédité dans votre cagnotte. Toutes nos excuses.", createdAt: at("2026-10-28T16:00:00+01:00") },
  ]);

  await x.insert(loyaltyMovements).values([
    { customerId: c, kind: "earn_order", label: "Gagnés : Commande CMD-9003", orderRef: "CMD-9003", productId: "merguez", points: 63, occurredAt: "2026-11-01" },
    { customerId: c, kind: "earn_review", label: "Gagnés : Avis vérifié", productId: "merguez", points: 15, occurredAt: "2026-11-02" },
    { customerId: c, kind: "earn_order", label: "Gagnés : Commande CMD-2452", orderRef: "CMD-2452", productId: "cote-boeuf", points: 91, occurredAt: "2026-10-31" },
    { customerId: c, kind: "earn_order", label: "Gagnés : Commande CMD-9001", orderRef: "CMD-9001", productId: "cote-boeuf-28", points: 98, occurredAt: "2026-10-31" },
    { customerId: c, kind: "earn_review", label: "Gagnés : Avis vérifié", productId: "cote-boeuf", points: 15, occurredAt: "2026-10-28" },
    { customerId: c, kind: "earn_order", label: "Gagnés : Commande CMD-2449", orderRef: "CMD-2449", productId: "merguez", points: 76, occurredAt: "2026-10-27" },
    { customerId: c, kind: "earn_order", label: "Gagnés : Commande CMD-2446", orderRef: "CMD-2446", productId: "roti-veau", points: 37, occurredAt: "2026-10-26" },
    { customerId: c, kind: "convert", label: "Convertis : Bon 10 € utilisé", points: -100, occurredAt: "2026-10-15" },
    { customerId: c, kind: "gift", label: "Gagnés : Bonus de bienvenue", points: 25, occurredAt: "2024-11-08" },
  ]);

  await x.insert(vouchers).values([
    { code: "CC-2026-4418", customerId: c, kind: "gift_card", label: "Carte-cadeau 50 €", amountCents: 5000, validUntil: "2027-12-12" },
    { code: "BD-10-2449", customerId: c, kind: "voucher", label: "Bon d'achat 10 €", amountCents: 1000, validUntil: "2027-01-01" },
  ]);
}

const globalForBoot = globalThis as typeof globalThis & { __annoixBoot?: Promise<void> };

async function bootstrap() {
  await db.execute(DDL);
  const [{ count }] = (await db.execute<{ count: string }>(sql`select count(*)::text as count from orders`)).rows;
  if (count === "0") {
    await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(424242)`);
      const again = (await tx.execute<{ count: string }>(sql`select count(*)::text as count from orders`)).rows[0];
      if (again.count === "0") await seed(tx);
    });
  }
}

/** Ensures tables exist and the demo dataset is loaded. Safe to call on every request. */
export function ensureDatabase(): Promise<void> {
  if (!globalForBoot.__annoixBoot) {
    globalForBoot.__annoixBoot = bootstrap().catch((err) => {
      globalForBoot.__annoixBoot = undefined;
      throw err;
    });
  }
  return globalForBoot.__annoixBoot;
}
