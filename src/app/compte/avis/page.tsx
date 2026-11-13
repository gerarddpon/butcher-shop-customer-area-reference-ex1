import type { Metadata } from "next";
import { PageTitle } from "@/components/ui";
import { ReviewsBoard } from "./reviews-board";
import { listReviews } from "@/lib/services/reviews";
import { businessConfig } from "@/lib/config";
import { reviewCriteria } from "@/lib/domain";
import { customer } from "@/lib/catalog";

export const metadata: Metadata = { title: "Mes avis" };
export const dynamic = "force-dynamic";

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<{ onglet?: string }> }) {
  const [{ pending, published, average }, sp] = await Promise.all([listReviews(), searchParams]);
  return (
    <div>
      <PageTitle>Mes avis</PageTitle>
      <ReviewsBoard
        pending={pending}
        published={published}
        average={average}
        reward={businessConfig.reviewRewardPoints}
        criteriaList={reviewCriteria}
        displayName={`${customer.firstName} ${customer.lastName.charAt(0)}.`}
        initialTab={sp.onglet === "publies" ? "publies" : "evaluer"}
      />
      <p className="mt-6 text-[12px] font-semibold leading-snug">
        Seuls les achats retirés ou livrés peuvent être évalués. Les avis sont modérés par l&apos;atelier sous 48h ; les points fidélité sont crédités dès la
        publication.
      </p>
    </div>
  );
}
