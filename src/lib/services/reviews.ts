import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { ensureDatabase } from "@/db/bootstrap";
import { reviews } from "@/db/schema";
import { businessConfig, today } from "@/lib/config";
import { reviewCriteria } from "@/lib/domain";
import { addPoints } from "./loyalty";

const cid = () => businessConfig.customerId;

export async function listReviews() {
  await ensureDatabase();
  const rows = await db.select().from(reviews).where(eq(reviews.customerId, cid())).orderBy(desc(reviews.publishedAt), desc(reviews.id));
  const pending = rows.filter((r) => r.status === "pending").sort((a, b) => a.id - b.id);
  const published = rows.filter((r) => r.status === "published");
  const rated = published.filter((r) => r.rating);
  const average = rated.length ? rated.reduce((s, r) => s + (r.rating ?? 0), 0) / rated.length : 0;
  return { pending, published, average };
}

export async function publishReview(input: {
  id: number;
  rating: number;
  criteria: string[];
  comment: string;
  anonymous: boolean;
}): Promise<{ ok: boolean; message: string }> {
  await ensureDatabase();
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) return { ok: false, message: "Choisissez une note de 1 à 5 étoiles." };
  if (input.comment.length > 800) return { ok: false, message: "Commentaire limité à 800 caractères." };
  const criteria = input.criteria.filter((c) => reviewCriteria.includes(c));
  const [row] = await db.select().from(reviews).where(and(eq(reviews.id, input.id), eq(reviews.customerId, cid())));
  if (!row) return { ok: false, message: "Avis introuvable." };
  const firstPublication = row.status === "pending";
  await db
    .update(reviews)
    .set({
      rating: input.rating,
      criteria,
      comment: input.comment.trim(),
      anonymous: input.anonymous,
      status: "published",
      publishedAt: firstPublication ? today() : row.publishedAt,
    })
    .where(eq(reviews.id, row.id));
  if (firstPublication) {
    await addPoints({ kind: "earn_review", label: "Gagnés : Avis vérifié", points: businessConfig.reviewRewardPoints, productId: row.productId });
    return { ok: true, message: `Merci ! Avis publié · +${businessConfig.reviewRewardPoints} points crédités dans votre cagnotte.` };
  }
  return { ok: true, message: "Votre avis a été mis à jour." };
}

export async function deleteReview(id: number) {
  await ensureDatabase();
  await db
    .update(reviews)
    .set({ status: "pending", rating: null, criteria: [], comment: "", publishedAt: null, replyAuthor: null, replyDate: null, replyText: null })
    .where(and(eq(reviews.id, id), eq(reviews.customerId, cid())));
  return { ok: true, message: "Avis retiré. Le produit revient dans « À évaluer »." };
}
