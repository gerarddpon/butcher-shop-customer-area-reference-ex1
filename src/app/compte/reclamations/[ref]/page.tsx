import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Camera, Check, ChevronLeft, ExternalLink, History, PackageCheck, X } from "lucide-react";
import { BackLink, Card, Parchment, ProductThumb } from "@/components/ui";
import { ClaimStatusBadge } from "../claim-badge";
import { ClaimComposer } from "./claim-composer";
import { getClaim } from "@/lib/services/claims";
import { getOrder } from "@/lib/services/orders";
import { businessConfig } from "@/lib/config";
import { claimReasonLabel, claimSteps, resolutionLabel } from "@/lib/domain";
import { cn, formatDate, formatEUR, formatShortDayYear, formatTime } from "@/lib/format";
import type { ClaimStatus } from "@/db/schema";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ ref: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ref } = await params;
  return { title: `Dossier ${ref}` };
}

const RANK: Record<ClaimStatus, number> = { recu: 0, analyse: 1, solution: 2, clos: 4 };
const STEP_ICONS = [Check, Camera, PackageCheck, History];

export default async function ClaimDetailPage({ params }: Props) {
  const { ref } = await params;
  const found = await getClaim(ref);
  if (!found) notFound();
  const { claim, messages } = found;
  const order = await getOrder(claim.orderRef);
  const rank = RANK[claim.status];
  const issued = claim.creditStatus === "issued" || claim.creditStatus === "used";
  const proposed = claim.creditStatus === "proposed";
  const photo = claim.attachments[0];

  return (
    <div>
      <BackLink href="/compte/reclamations">Retour aux réclamations</BackLink>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h1 className="text-[30px] font-bold leading-tight">Dossier de réclamation : {claim.ref}</h1>
        <div className="text-right">
          <ClaimStatusBadge claim={claim} />
          <p className="mt-0.5 text-[13px]">Dernière mise à jour : {formatDate(claim.updatedAt)}</p>
        </div>
      </div>

      <div className="mt-3 rounded-lg bg-navy px-4 py-3 text-white shadow-card">
        <Link href="/compte/reclamations" className="inline-flex items-center gap-1 text-[14px] text-white/85 hover:text-white">
          <ChevronLeft className="size-4" /> Retour aux réclamations
        </Link>
        <p className="text-[26px] font-bold leading-tight">
          {order ? (
            <Link href={`/compte/commandes/${order.ref}`} className="hover:underline">
              Commande : {order.ref}
            </Link>
          ) : (
            <>Commande : {claim.orderRef}</>
          )}
          {order && <span className="font-medium"> • {formatShortDayYear(order.slotDate)}</span>}
        </p>
      </div>

      <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
        <div className="min-w-0 space-y-3">
          <Card className="p-3.5">
            <h2 className="text-[22px] font-medium">
              Détail de la demande <span className="text-[14px]">({claim.orderRef})</span>
            </h2>
            <div className="mt-2 flex items-center gap-3 border-b border-line pb-3">
              <ProductThumb productId={claim.productId} size={52} />
              <p className="text-[17px] leading-snug">
                {claim.productLabel}
                <br />
                <span className="text-[16px]">
                  Lot : {claim.lot} | DLC : {/^\d{4}-/.test(claim.dlc) ? formatDate(claim.dlc) : claim.dlc}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-3 border-b border-line py-3">
              {photo?.url ? (
                <Image src={photo.url} alt={photo.name} width={104} height={104} className="size-[52px] rounded-lg object-cover" />
              ) : (
                <ProductThumb productId={claim.productId} size={52} />
              )}
              <div className="text-[16px] leading-snug">
                <p className="font-semibold">Motif de la demande :</p>
                <p className="flex items-center gap-2">
                  {claimReasonLabel(claim.reason)}
                  <span className="inline-flex size-5 items-center justify-center rounded-[3px] bg-burgundy text-white">
                    <X className="size-3.5" strokeWidth={3} />
                  </span>
                </p>
              </div>
            </div>
            <div className="pt-3 text-[16px]">
              <p className="font-semibold">Description détaillée :</p>
              <p>{claim.description}</p>
              <dl className="mt-2 grid gap-x-4 text-[14px] text-muted sm:grid-cols-2">
                <div>
                  <dt className="inline">Quantité concernée : </dt>
                  <dd className="inline">{claim.quantity}</dd>
                </div>
                <div>
                  <dt className="inline">Résolution souhaitée : </dt>
                  <dd className="inline">{resolutionLabel(claim.resolutionPref)}</dd>
                </div>
              </dl>
            </div>
          </Card>

          <Card className="p-3.5">
            <h2 className="text-[22px] font-medium">Fil de discussion avec l&apos;atelier</h2>
            <ol className="mt-3 space-y-4">
              {messages.map((m) => {
                const mine = m.author === "client";
                return (
                  <li key={m.id} className={cn("flex items-start gap-2.5", mine ? "flex-row-reverse pl-6 sm:pl-12" : "pr-6 sm:pr-12")}>
                    <Image
                      src={mine ? "/images/avatars/client.png" : "/images/avatars/atelier.png"}
                      alt={mine ? "Vous" : "L'atelier"}
                      width={72}
                      height={72}
                      className="size-9 shrink-0 rounded-full border border-line object-cover"
                    />
                    <div className={cn("max-w-[320px] rounded-lg px-3 py-2 text-[15px] leading-snug text-white shadow-sm", mine ? "bg-navy" : "bg-[#272522]")}>
                      <p className="whitespace-pre-line">{m.body}</p>
                      {m.attachments.map((a) => (
                        <span key={a.name} className="mt-2 flex w-fit items-center gap-2 rounded bg-[#f1ece2] pr-2 text-[14px] text-ink">
                          {a.url ? (
                            <Image src={a.url} alt="" width={56} height={56} className="size-7 rounded-l object-cover" />
                          ) : (
                            <span className="flex size-7 items-center justify-center rounded-l bg-sand">
                              <Camera className="size-3.5" />
                            </span>
                          )}
                          {a.name}
                        </span>
                      ))}
                      <p className="mt-1 text-[11px] text-white/60">
                        {mine ? "Vous" : "L'atelier de Sannois"} · {formatDate(m.createdAt.toISOString())} à {formatTime(m.createdAt)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
            <ClaimComposer claimRef={claim.ref} closed={claim.status === "clos"} />
          </Card>
        </div>

        <aside className="space-y-4">
          <Parchment>
            <h2 className="text-[21px] font-medium leading-tight">
              Suivi de statut <span className="text-[16px]">({claim.ref})</span>
            </h2>
            <ol className="mt-3">
              {claimSteps.map((s, i) => {
                const done = i < rank;
                const current = i === rank;
                const Icon = done ? Check : STEP_ICONS[i];
                return (
                  <li key={s.key} className="relative flex gap-3 pb-5 last:pb-1">
                    {i < claimSteps.length - 1 && <span className={cn("absolute left-[15px] top-8 h-[calc(100%-28px)] w-0.5", done || current ? "bg-burgundy-dark" : "bg-[#b8a57c]/60")} />}
                    <span
                      className={cn(
                        "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full",
                        done && "bg-burgundy-dark text-white",
                        current && "bg-burgundy text-white ring-4 ring-burgundy/15",
                        !done && !current && "border-2 border-[#b8a57c] text-[#a8956b]",
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <div className={cn("leading-tight", !done && !current && "text-[#8e7d5c]")}>
                      <p className={cn("text-[18px]", current && "font-bold")}>{s.label}</p>
                      {i === 0 && <p className="text-[15px]">{formatDate(claim.createdAt)}</p>}
                      {current && i > 0 && <p className="text-[15px]">{formatDate(claim.updatedAt)}</p>}
                      {current && <p className="text-[15px]">étape en cours</p>}
                    </div>
                  </li>
                );
              })}
            </ol>
          </Parchment>

          <Parchment>
            <h2 className="text-[21px] font-medium">Carte de résolution</h2>
            <dl className="mt-2 space-y-1 text-[16px]">
              <div>
                <dt className="inline">Résolution : </dt>
                <dd className="inline">[{claim.status === "clos" ? (claim.resolutionText ?? "Clôturé") : proposed ? "Avoir proposé" : "En attente"}]</dd>
              </div>
              <div>
                <dt className="inline">Avoir émis : </dt>
                <dd className="inline">[{issued ? formatEUR(claim.creditCents) : formatEUR(0)}]</dd>
              </div>
              <div>
                <dt className="inline">Date de validité : </dt>
                <dd className="inline">[{claim.creditValidUntil ? formatDate(claim.creditValidUntil) : "J+12 mois"}]</dd>
              </div>
            </dl>
            {issued ? (
              <a
                href={`/api/documents/avoir/${claim.ref}`}
                target="_blank"
                rel="noreferrer"
                className="mt-4 mb-2 block rounded-md bg-burgundy-dark px-3 py-2 text-center text-[15px] text-white shadow hover:bg-burgundy"
              >
                Télécharger mon avoir PDF
              </a>
            ) : (
              <button
                type="button"
                disabled
                title="Disponible après validation de l'avoir"
                className="mt-4 mb-2 w-full cursor-not-allowed rounded-md bg-[#7d6c63] px-3 py-2 text-[15px] text-white/90 shadow"
              >
                Télécharger mon avoir PDF
              </button>
            )}
          </Parchment>

          {(proposed || issued) && (
            <Parchment>
              <h2 className="text-[21px] font-medium">{issued ? "Avoir émis" : "Avoir proposé"}</h2>
              <p className="mt-1 text-[16px]">{issued ? "Crédité dans votre cagnotte :" : "Conditionnel proposé :"}</p>
              <p className="text-[40px] font-bold leading-tight">{formatEUR(claim.creditCents)}</p>
              <p className="text-[16px]">Date de validité : [{claim.creditValidUntil ? formatDate(claim.creditValidUntil) : "J+12 mois"}]</p>
              <Link href="/compte/avoirs#garantie" className="mt-3 inline-flex items-center gap-1.5 text-[17px] underline underline-offset-4">
                Garantie fraîcheur <ExternalLink className="size-4" />
              </Link>
            </Parchment>
          )}

          <p className="text-[12px] font-semibold leading-snug">
            Les éléments détaillés de votre réclamation sont analysés par l&apos;atelier. Une réponse vous est apportée dans la messagerie du client sous{" "}
            {businessConfig.claimSlaHours}h. Le cas échéant, la traçabilité des lots et les justificatifs seront indispensables.
          </p>
        </aside>
      </div>
    </div>
  );
}
