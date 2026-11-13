import type { Metadata } from "next";
import { Check, CircleCheck, Gift, Minus, Plus, Sparkles, Star, Ticket } from "lucide-react";
import { Card, PageTitle, ProductThumb } from "@/components/ui";
import { ModalTrigger } from "@/components/modal";
import { QrCode } from "@/components/qr-code";
import { ActionButton } from "@/components/action-button";
import { toggleApplyPointsAction } from "../actions";
import { getLoyalty } from "@/lib/services/loyalty";
import { businessConfig } from "@/lib/config";
import { cn, formatDate, formatEUR } from "@/lib/format";
import type { LoyaltyMovement } from "@/db/schema";

export const metadata: Metadata = { title: "Cagnotte" };
export const dynamic = "force-dynamic";

function MovementIcon({ m }: { m: LoyaltyMovement }) {
  if (m.kind === "earn_order" && m.productId) return <ProductThumb productId={m.productId} size={72} />;
  const Icon = m.kind === "convert" ? Ticket : m.kind === "earn_review" ? Star : m.kind === "gift" ? Gift : Sparkles;
  return (
    <div className="flex size-[72px] shrink-0 items-center justify-center rounded-lg bg-sand">
      <Icon className="size-9" strokeWidth={1.3} />
    </div>
  );
}

export default async function CagnottePage() {
  const loyalty = await getLoyalty();
  const fmtPts = (n: number) => new Intl.NumberFormat("fr-FR").format(n);

  return (
    <div className="space-y-4">
      <PageTitle>Cagnotte</PageTitle>
      <div className="rounded-lg bg-sand/80 px-3 py-2.5 text-[17px] leading-snug">
        <p>
          Gagnez des points à chaque achat ({businessConfig.pointsPerEuro} € dépensé = {businessConfig.pointsPerEuro} point) et profitez de vos bons d&apos;achat et
          cartes-cadeaux !
        </p>
        <p className="mt-2 border-t border-[#d7c7a2] pt-2">
          Votre solde de points : <b>{fmtPts(loyalty.points)} points</b> (Équivalent à {formatEUR(loyalty.valueCents)})
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Card className="flex flex-col p-4">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-sand px-3 py-0.5 text-[15px]">{loyalty.applyNextOrder ? "Réservés" : "En cours"}</span>
            <CircleCheck className="size-7 fill-burgundy-dark text-white" />
          </div>
          <p className="mt-2 text-[22px] font-bold">Solde Récapitulatif</p>
          <p className="text-[30px] font-bold leading-tight">
            {fmtPts(loyalty.points)} points · {formatEUR(loyalty.valueCents)}
          </p>
          <div className="mt-auto pt-4">
            <ActionButton
              action={toggleApplyPointsAction}
              disabled={loyalty.points <= 0}
              className={cn(
                "inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-lg font-medium shadow-md transition",
                loyalty.applyNextOrder ? "border-2 border-burgundy-dark bg-white text-burgundy-dark hover:bg-sand-2" : "bg-burgundy-dark text-white hover:bg-burgundy",
              )}
            >
              {loyalty.applyNextOrder ? (
                <>
                  <Check className="size-5" /> Déduits de la prochaine commande · annuler
                </>
              ) : (
                "Utiliser à la prochaine commande"
              )}
            </ActionButton>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[22px] font-bold">Bons et cartes-cadeaux</h2>
            <CircleCheck className="size-7 fill-burgundy-dark text-white" />
          </div>
          <ul className="mt-2 space-y-3">
            {loyalty.vouchers.length === 0 && <li className="text-sm text-muted">Aucun bon actif pour le moment.</li>}
            {loyalty.vouchers.map((v) => {
              const Icon = v.kind === "gift_card" ? Gift : Ticket;
              return (
                <li key={v.code} className="flex gap-3">
                  <div className="flex size-[72px] shrink-0 items-center justify-center rounded-lg bg-sand">
                    <Icon className="size-9" strokeWidth={1.3} />
                  </div>
                  <div className="text-[15px] leading-tight">
                    <p className="text-[17px]">{v.label}</p>
                    <p className="font-mono text-[14px]">{v.code}</p>
                    <p>Validité : {formatDate(v.validUntil)}</p>
                    <ModalTrigger label="Afficher" title={v.label} className="mt-1.5 rounded-full border border-ink px-6 py-1 text-[15px] hover:bg-sand-2">
                      <div className="flex flex-col items-center gap-3 py-2 text-center">
                        <QrCode value={`${v.code}|${v.amountCents}`} size={200} />
                        <p className="font-mono text-xl font-bold tracking-widest">{v.code}</p>
                        <p className="text-sm text-muted">
                          {formatEUR(v.amountCents)} · valable jusqu&apos;au {formatDate(v.validUntil)} en boutique et en ligne.
                        </p>
                      </div>
                    </ModalTrigger>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <Card className="p-4">
        <h2 className="text-[22px] font-bold">Historique des mouvements</h2>
        <ul className="mt-3 grid gap-x-8 md:grid-cols-2">
          {loyalty.movements.map((m) => {
            const positive = m.points >= 0;
            return (
              <li key={m.id} className="flex gap-3 border-b border-line py-3">
                <MovementIcon m={m} />
                <div className="min-w-0 flex-1 text-[17px] leading-tight">
                  <p>{m.label}</p>
                  {m.kind === "earn_order" && (
                    <span className="mt-1 inline-flex size-6 items-center justify-center rounded-full bg-burgundy-dark text-white">
                      <Check className="size-3.5" strokeWidth={3} />
                    </span>
                  )}
                  <p className="mt-1">
                    <b className={positive ? "text-forest" : "text-ink"}>
                      {positive ? "+" : ""}
                      {m.points} pts
                    </b>{" "}
                    · {formatDate(m.occurredAt)}
                  </p>
                </div>
                <span className={cn("mt-1 flex size-6 shrink-0 items-center justify-center rounded-full text-white", positive ? "bg-forest" : "bg-burgundy-dark")}>
                  {positive ? <Plus className="size-4" /> : <Minus className="size-4" />}
                </span>
              </li>
            );
          })}
        </ul>
      </Card>

      <p className="text-[12px] font-semibold leading-snug">
        1 point = {formatEUR(businessConfig.pointValueCents)}. Les points sont crédités au retrait de la commande et restent valables 24 mois. Les cartes-cadeaux
        sont nominatives et utilisables en boutique comme en ligne.
      </p>
    </div>
  );
}
