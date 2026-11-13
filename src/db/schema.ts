import { boolean, integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export type OrderStatus = "confirmee" | "en_preparation" | "pesee" | "prete" | "retiree" | "livree" | "annulee";
export type FulfilmentMode = "retrait" | "livraison";

export type OrderItem = {
  productId: string;
  label: string;
  weight: string;
  priceCents: number;
  lot: string;
  dlc: string;
};

/** Dates (ISO) at which each timeline step was reached. */
export type OrderHistory = Partial<
  Record<"recue" | "acompte" | "confirmee" | "en_preparation" | "pesee" | "prete" | "terminee" | "annulee", string>
>;

export const orders = pgTable("orders", {
  ref: text("ref").primaryKey(),
  customerId: text("customer_id").notNull(),
  status: text("status").$type<OrderStatus>().notNull(),
  placedAt: text("placed_at").notNull(),
  mode: text("mode").$type<FulfilmentMode>().notNull(),
  shop: text("shop").notNull(),
  slotDate: text("slot_date").notNull(),
  slotStart: text("slot_start").notNull(),
  slotEnd: text("slot_end").notNull(),
  items: jsonb("items").$type<OrderItem[]>().notNull(),
  totalCents: integer("total_cents").notNull(),
  depositCents: integer("deposit_cents").notNull().default(0),
  paidCents: integer("paid_cents").notNull().default(0),
  pickupCode: text("pickup_code").notNull(),
  history: jsonb("history").$type<OrderHistory>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orderMessages = pgTable("order_messages", {
  id: serial("id").primaryKey(),
  orderRef: text("order_ref").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ReviewStatus = "pending" | "published";

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  customerId: text("customer_id").notNull(),
  orderRef: text("order_ref").notNull(),
  productId: text("product_id").notNull(),
  productLabel: text("product_label").notNull(),
  fulfilledLabel: text("fulfilled_label").notNull(),
  status: text("status").$type<ReviewStatus>().notNull(),
  rating: integer("rating"),
  criteria: jsonb("criteria").$type<string[]>().notNull().default([]),
  comment: text("comment").notNull().default(""),
  anonymous: boolean("anonymous").notNull().default(false),
  publishedAt: text("published_at"),
  replyAuthor: text("reply_author"),
  replyDate: text("reply_date"),
  replyText: text("reply_text"),
});

export type ClaimStatus = "recu" | "analyse" | "solution" | "clos";
export type CreditStatus = "none" | "proposed" | "issued" | "used";
export type Attachment = { name: string; size: number; url?: string };

export const claims = pgTable("claims", {
  ref: text("ref").primaryKey(),
  customerId: text("customer_id").notNull(),
  orderRef: text("order_ref").notNull(),
  productId: text("product_id").notNull(),
  productLabel: text("product_label").notNull(),
  lot: text("lot").notNull(),
  dlc: text("dlc").notNull(),
  reason: text("reason").notNull(),
  quantity: text("quantity").notNull(),
  description: text("description").notNull(),
  resolutionPref: text("resolution_pref").notNull(),
  status: text("status").$type<ClaimStatus>().notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  creditCents: integer("credit_cents").notNull().default(0),
  creditStatus: text("credit_status").$type<CreditStatus>().notNull().default("none"),
  creditValidUntil: text("credit_valid_until"),
  resolutionText: text("resolution_text"),
  attachments: jsonb("attachments").$type<Attachment[]>().notNull().default([]),
});

export const claimMessages = pgTable("claim_messages", {
  id: serial("id").primaryKey(),
  claimRef: text("claim_ref").notNull(),
  author: text("author").$type<"client" | "atelier">().notNull(),
  body: text("body").notNull(),
  attachments: jsonb("attachments").$type<Attachment[]>().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type LoyaltyKind = "earn_order" | "earn_review" | "bonus" | "convert" | "gift";

export const loyaltyMovements = pgTable("loyalty_movements", {
  id: serial("id").primaryKey(),
  customerId: text("customer_id").notNull(),
  kind: text("kind").$type<LoyaltyKind>().notNull(),
  label: text("label").notNull(),
  orderRef: text("order_ref"),
  productId: text("product_id"),
  points: integer("points").notNull(),
  occurredAt: text("occurred_at").notNull(),
});

export const vouchers = pgTable("vouchers", {
  code: text("code").primaryKey(),
  customerId: text("customer_id").notNull(),
  kind: text("kind").$type<"gift_card" | "voucher">().notNull(),
  label: text("label").notNull(),
  amountCents: integer("amount_cents").notNull(),
  validUntil: text("valid_until").notNull(),
  status: text("status").$type<"active" | "used">().notNull().default("active"),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<unknown>().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Claim = typeof claims.$inferSelect;
export type ClaimMessage = typeof claimMessages.$inferSelect;
export type LoyaltyMovement = typeof loyaltyMovements.$inferSelect;
export type Voucher = typeof vouchers.$inferSelect;
export type OrderMessage = typeof orderMessages.$inferSelect;
