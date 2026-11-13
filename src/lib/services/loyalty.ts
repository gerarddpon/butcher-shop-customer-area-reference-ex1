import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { ensureDatabase } from "@/db/bootstrap";
import { loyaltyMovements, settings, vouchers } from "@/db/schema";
import { businessConfig, today } from "@/lib/config";

const cid = () => businessConfig.customerId;
const APPLY_KEY = () => `${cid()}:apply_points_next_order`;

export async function getLoyalty() {
  await ensureDatabase();
  const movements = await db
    .select()
    .from(loyaltyMovements)
    .where(eq(loyaltyMovements.customerId, cid()))
    .orderBy(desc(loyaltyMovements.occurredAt), desc(loyaltyMovements.id));
  const cards = await db.select().from(vouchers).where(eq(vouchers.customerId, cid()));
  const points = movements.reduce((s, m) => s + m.points, 0);
  const [setting] = await db.select().from(settings).where(eq(settings.key, APPLY_KEY()));
  return {
    points,
    valueCents: points * businessConfig.pointValueCents,
    movements,
    vouchers: cards.filter((v) => v.status === "active"),
    applyNextOrder: setting?.value === true,
  };
}

export async function addPoints(input: { kind: "earn_review" | "earn_order" | "gift"; label: string; points: number; productId?: string; orderRef?: string }) {
  await db.insert(loyaltyMovements).values({
    customerId: cid(),
    kind: input.kind,
    label: input.label,
    points: input.points,
    productId: input.productId ?? null,
    orderRef: input.orderRef ?? null,
    occurredAt: today(),
  });
}

export async function toggleApplyNextOrder() {
  await ensureDatabase();
  const current = (await getLoyalty()).applyNextOrder;
  await db
    .insert(settings)
    .values({ key: APPLY_KEY(), value: !current })
    .onConflictDoUpdate({ target: settings.key, set: { value: !current } });
  return !current;
}
