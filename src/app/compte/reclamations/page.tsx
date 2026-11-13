import Link from "next/link";
import type { Metadata } from "next";
import { Bell, CircleCheck, CreditCard, ChevronRight } from "lucide-react";
import { BackLink, Card, PageTitle, Parchment } from "@/components/ui";
import { claimStats } from "@/lib/services/claims";
import { claimReasonLabel } from "@/lib/domain";
import { ClaimStatusBadge } from "./claim-badge";
import { formatDate, formatEUR } from "@/lib/format";
import { businessConfig } from "@/lib/config";

export const metadata: Metadata = { title: "Mes réclamations & SAV" };
export const dynamic = "force-dynamic";

export default async function ClaimsPage() {
  const { all, open, closed, availableCreditCents } = await claimStats();

  return (
    <div>
      <BackLink href="/compte/commandes">Retour aux commandes</BackLink>
      <PageTitle serif={false}>Mes réclamations &amp; SAV</PageTitle>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Parchment className="min-h-[230px]">
          <div className="flex items-start justify-between">
            <h2 className="text-[22px] font-medium">Dossiers en cours</h2>
            <span className="relative">
              <Bell className="size-6" strokeWidth={1.6} />
              {open.length > 0 && (
                <span className="absolute -right-1 -top-1 flex size-3.5 items-center justify-center rounded-full bg-burgundy text-[9px] font-bold text-white">
                  {open.length > 9 ? "9+" : open.filter((c) => c.status === "analyse").length || open.length}
                </span>
              )}
            </span>
          </div>
          <p className="mt-1 text-[52px] font-bold leading-none">{open.length}</p>
          <p className="text-[19px]">dossier{open.length > 1 ? "s" : ""} actif{open.length > 1 ? "s" : ""}</p>
          {open.length > 0 && (
            <ul className="mt-3 space-y-1 border-t border-[#b8a57c]/60 pt-2 pr-8 text-[15px]">
              {open.map((c) => (
                <li key={c.ref}>
                  <Link href={`/compte/reclamations/${c.ref}`} className="hover:underline">
                    {c.ref} - {claimReasonLabel(c.reason)} {c.productLabel.split(" ·")[0].toLowerCase()} ({c.orderRef})
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Parchment>

        <Parchment className="min-h-[230px]">
          <div className="flex items-start justify-between">
            <h2 className="text-[22px] font-medium">Dossiers résolus</h2>
            <CircleCheck className="size-7" strokeWidth={1.6} />
          </div>
          <p className="mt-1 text-[52px] font-bold leading-none">{closed.length}</p>
          <p className="text-[19px]">dossier{closed.length > 1 ? "s" : ""} clos</p>
          <p className="mt-3 max-w-xs text-[13px] text-muted">
            Délai moyen de résolution : 1,5 jour. Réponse de l&apos;atelier sous {businessConfig.claimSlaHours}h ouvrées.
          </p>
        </Parchment>

        <Parchment className="min-h-[230px]">
          <div className="flex items-start justify-between">
            <h2 className="text-[22px] font-medium">Avoirs disponibles</h2>
            <CreditCard className="size-7" strokeWidth={1.6} />
          </div>
          <p className="mt-2 text-[56px] font-bold leading-none tracking-tight">{formatEUR(availableCreditCents)}</p>
          <p className="text-[19px]">dans votre cagnotte</p>
          <Link href="/compte/cagnotte" className="mt-4 inline-block rounded-lg border-2 border-ink/80 px-4 py-1.5 text-[17px] hover:bg-white/40">
            Voir ma cagnotte
          </Link>
        </Parchment>

        <Parchment className="min-h-[230px]">
          <h2 className="text-[22px] font-medium">Action principale</h2>
          <p className="mt-2 text-[19px] font-medium">Nouveau problème ?</p>
          <p className="text-[36px] font-bold leading-[1.05]">
            Signaler
            <br />
            un problème
          </p>
          <Link
            href="/compte/reclamations/nouvelle"
            className="mt-4 flex w-full max-w-[250px] items-center justify-center rounded-md bg-burgundy-dark px-4 py-2 text-[17px] font-medium text-white shadow-md hover:bg-burgundy"
          >
            Ouvrir une réclamation
          </Link>
        </Parchment>
      </div>

      <Card className="mt-5 p-4">
        <h2 className="text-[24px] font-medium">Mes dernières demandes</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-[15px]">
            <thead>
              <tr className="border-b border-line text-[15px] font-semibold">
                <th className="py-2 pr-3 font-semibold">N° Dossier</th>
                <th className="py-2 pr-3 font-semibold">Commande</th>
                <th className="py-2 pr-3 font-semibold">Produit</th>
                <th className="py-2 pr-3 font-semibold">Motif</th>
                <th className="py-2 pr-3 font-semibold">Date</th>
                <th className="py-2 font-semibold">Statut</th>
              </tr>
            </thead>
            <tbody>
              {all.map((c) => (
                <tr key={c.ref} className="group border-b border-line last:border-0 hover:bg-sand-2/60">
                  <td className="py-2 pr-3">
                    <Link href={`/compte/reclamations/${c.ref}`} className="inline-flex items-center gap-1 font-medium group-hover:underline">
                      {c.ref}
                    </Link>
                  </td>
                  <td className="py-2 pr-3">{c.orderRef}</td>
                  <td className="py-2 pr-3">{c.productLabel.split(" ·")[0]}</td>
                  <td className="py-2 pr-3 leading-tight">{claimReasonLabel(c.reason)}</td>
                  <td className="whitespace-nowrap py-2 pr-3">{formatDate(c.createdAt)}</td>
                  <td className="py-2">
                    <Link href={`/compte/reclamations/${c.ref}`} className="inline-flex items-center gap-1">
                      <ClaimStatusBadge claim={c} />
                      <ChevronRight className="size-4 opacity-0 transition group-hover:opacity-60" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="mt-4 text-[12px] font-semibold leading-snug">
        Les statuts affichés sont ceux de l&apos;atelier, proposés dans la messagerie du client. Aucun montant n&apos;est modifié ici : le poids, la TVA et les avoirs
        sont validés à la résolution du dossier.
      </p>
    </div>
  );
}
