/**
 * Centralised, typed access to environment configuration.
 * Every value has a safe default so the portal boots even with a minimal .env.
 */

function num(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && value !== undefined && value !== "" ? parsed : fallback;
}

export const shop = {
  name: process.env.NEXT_PUBLIC_SHOP_NAME ?? "Maison Annoix",
  location: process.env.NEXT_PUBLIC_SHOP_LOCATION ?? "Boutique de Sannois",
  phone: process.env.NEXT_PUBLIC_SHOP_PHONE ?? "01 39 47 12 12",
  email: process.env.NEXT_PUBLIC_SHOP_EMAIL ?? "atelier@maison-annoix.fr",
};

export const businessConfig = {
  customerId: process.env.DEMO_CUSTOMER_ID ?? "cus_marie_dupont",
  pointsPerEuro: num(process.env.LOYALTY_POINTS_PER_EURO, 1),
  pointValueCents: num(process.env.LOYALTY_POINT_VALUE_CENTS, 10),
  reviewRewardPoints: num(process.env.REVIEW_REWARD_POINTS, 15),
  claimSlaHours: num(process.env.CLAIM_RESPONSE_SLA_HOURS, 24),
  slotChangeCutoffHours: num(process.env.SLOT_CHANGE_CUTOFF_HOURS, 24),
  paymentProvider: process.env.PAYMENT_PROVIDER ?? "mock",
  paymentApiKey: process.env.PAYMENT_API_KEY ?? "",
  uploadMaxFiles: num(process.env.UPLOAD_MAX_FILES, 3),
  uploadMaxMb: num(process.env.UPLOAD_MAX_MB, 5),
};

/** The reference "today" for the demo dataset (ISO yyyy-mm-dd). */
export function today(): string {
  const demo = process.env.DEMO_TODAY;
  if (demo && /^\d{4}-\d{2}-\d{2}$/.test(demo)) return demo;
  return new Date().toISOString().slice(0, 10);
}
