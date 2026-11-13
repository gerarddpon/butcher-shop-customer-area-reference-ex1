import type { Metadata } from "next";
import Link from "next/link";
import { BackLink, PageTitle, btn } from "@/components/ui";
import { ClaimWizard, type WizardOrder } from "./claim-wizard";
import { listOrders } from "@/lib/services/orders";
import { DONE_STATUSES, claimReasons, resolutionOptions } from "@/lib/domain";
import { businessConfig } from "@/lib/config";
import { formatDate, formatShortDayYear } from "@/lib/format";

export const metadata: Metadata = { title: "Assistant de création de réclamation" };
export const dynamic = "force-dynamic";

export default async function NewClaimPage({ searchParams }: { searchParams: Promise<{ commande?: string }> }) {
  const [orders, sp] = await Promise.all([listOrders(), searchParams]);
  const eligible: WizardOrder[] = orders
    .filter((o) => DONE_STATUSES.includes(o.status))
    .map((o) => ({
      ref: o.ref,
      dateLabel: `${o.mode === "livraison" ? "Livrée" : "Retirée"} le ${formatShortDayYear(o.slotDate)}`,
      items: o.items
        .filter((i) => i.productId !== "carte-cadeau")
        .map((i) => ({
          productId: i.productId,
          label: i.label,
          weight: i.weight,
          lot: i.lot,
          dlcLabel: i.dlc === "—" ? "—" : formatDate(i.dlc),
        })),
    }));
  const initialRef = eligible.find((o) => o.ref === sp.commande)?.ref ?? null;

  return (
    <div>
      <BackLink href="/compte/reclamations">Retour aux réclamations</BackLink>
      <PageTitle serif={false}>Assistant de création de réclamation</PageTitle>
      {eligible.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-[#c9bda6] bg-white/60 p-8 text-center">
          <p className="font-semibold">Aucune commande retirée ou livrée pour le moment.</p>
          <p className="text-sm text-muted">Une réclamation s&apos;ouvre après le retrait ou la livraison.</p>
          <Link href="/compte/commandes" className={`${btn.outline} mt-3`}>
            Voir mes commandes
          </Link>
        </div>
      ) : (
        <ClaimWizard
          orders={eligible}
          initialRef={initialRef}
          reasons={claimReasons.map((r) => ({ key: r.key, label: r.label }))}
          resolutions={resolutionOptions.map((r) => ({ key: r.key, label: r.label, hint: r.hint }))}
          maxFiles={businessConfig.uploadMaxFiles}
          maxMb={businessConfig.uploadMaxMb}
          slaHours={businessConfig.claimSlaHours}
        />
      )}
    </div>
  );
}
