import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AlertCircle, Check, FileDown, FileText, MapPin, Phone, TriangleAlert, X } from "lucide-react";
import { Badge, BackLink, Card, ProductThumb, btn } from "@/components/ui";
import { QrCode } from "@/components/qr-code";
import { ActionButton } from "@/components/action-button";
import { cancelOrderAction, payBalanceAction } from "../../actions";
import { OrderMessageButton, SlotChanger } from "./order-client";
import { getOrder, getOrderMessages, SLOT_OPTIONS } from "@/lib/services/orders";
import { getProduct } from "@/lib/catalog";
import { shop, today } from "@/lib/config";
import { orderActions, orderStatusMeta, orderTimeline, remainingCents } from "@/lib/domain";
import { addDays, cn, formatDate, formatEUR, formatLongDate, formatShortDayYear, formatSlot, formatTime } from "@/lib/format";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ ref: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ref } = await params;
  return { title: `Commande ${ref}` };
}

export default async function OrderDetailPage({ params }: Props) {
  const { ref } = await params;
  const order = await getOrder(ref);
  if (!order) notFound();
  const messages = await getOrderMessages(ref);
  const meta = orderStatusMeta[order.status];
  const t = today();
  const actions = orderActions(order, t);
  const due = remainingCents(order);
  const timeline = orderTimeline(order);
  const taxable = order.items.filter((i) => i.productId !== "carte-cadeau").reduce((s, i) => s + i.priceCents, 0);
  const vat = Math.round(taxable - taxable / 1.055);
  const isPickup = order.mode === "retrait";
  const tel = shop.phone.replace(/\s/g, "");

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px]">
      <div className="min-w-0 space-y-3">
        <BackLink href="/compte/commandes">Retour aux commandes</BackLink>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[30px] font-bold leading-tight">Commande {order.ref}</h1>
            <Badge className={cn("rounded-md", meta.className)}>{meta.label}</Badge>
          </div>
          <p className="text-[15px]">
            Passée le {formatDate(order.placedAt)} • {isPickup ? "Retrait prévu le" : "Livraison prévue le"} {formatLongDate(order.slotDate, false).toLowerCase()} (
            {formatSlot(order.slotStart, order.slotEnd)})
          </p>
        </div>

        {order.status === "annulee" && (
          <div className="flex items-center gap-2 rounded-lg border border-[#d8b4a8] bg-[#f8e8e2] p-3 text-sm">
            <AlertCircle className="size-4" /> Commande annulée le {formatDate(order.history.annulee ?? t)}. L&apos;acompte est remboursé sous 5 jours ouvrés.
          </div>
        )}

        <Card className="p-4">
          <div className="flex flex-wrap justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-semibold">{isPickup ? "Votre retrait" : "Votre livraison"}</h2>
              <p className="text-sm text-muted">Détails de votre {isPickup ? "retrait" : "livraison"}</p>
              <p className="mt-3 text-[22px] font-semibold leading-snug">
                {formatLongDate(order.slotDate)} •<br />
                {formatSlot(order.slotStart, order.slotEnd)}
              </p>
              <p className="mt-2 flex items-start gap-1.5 text-[15px]">
                <MapPin className="mt-0.5 size-4 shrink-0" />
                <span>
                  {order.shop} • Code retrait :<br />
                  <b className="font-mono">{order.pickupCode}</b>
                </span>
              </p>
              {actions.pay.allowed ? (
                <ActionButton action={payBalanceAction.bind(null, order.ref)} className={cn(btn.primary, "mt-4 rounded-md")} confirm={`Régler ${formatEUR(due)} par carte enregistrée ?`}>
                  Régler le solde ({formatEUR(due)})
                </ActionButton>
              ) : (
                <p className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-[#e3f0e3] px-3 py-1.5 text-sm font-semibold text-forest">
                  <Check className="size-4" /> {actions.pay.reason}
                </p>
              )}
            </div>
            <div className="flex flex-col items-center">
              <QrCode value={`${order.pickupCode}|${order.ref}`} size={96} />
              <p className="mt-1.5 text-center text-[13px] leading-tight">
                Présenter au
                <br />
                comptoir
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="text-xl font-semibold">Ce que contient la commande</h2>
          <ul className="mt-3 space-y-4">
            {order.items.map((item, idx) => {
              const product = getProduct(item.productId);
              return (
                <li key={`${item.productId}-${idx}`} className="flex gap-4">
                  <ProductThumb productId={item.productId} size={72} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap justify-between gap-2 text-[17px] font-medium">
                      <span>
                        {item.label}
                        {item.weight && ` • ${item.weight}`}
                      </span>
                      <span>{formatEUR(item.priceCents)}</span>
                    </div>
                    {product && product.origin !== "—" && (
                      <dl className="mt-0.5 grid grid-cols-1 gap-x-4 text-[14px] sm:grid-cols-2">
                        <div>
                          <dt className="inline">Origine : </dt>
                          <dd className="inline">{product.origin}</dd>
                        </div>
                        <div>
                          <dt className="inline">DLC : </dt>
                          <dd className="inline">{item.dlc === "—" ? "attribuée à la pesée" : formatDate(item.dlc)}</dd>
                        </div>
                        <div>
                          <dt className="inline">Lot : </dt>
                          <dd className="inline">{item.lot}</dd>
                        </div>
                        <div>
                          <dt className="inline">Allergène : </dt>
                          <dd className="inline">{product.allergens}</dd>
                        </div>
                        <div>
                          <dt className="inline">Conservation : </dt>
                          <dd className="inline">{product.conservation}</dd>
                        </div>
                      </dl>
                    )}
                    {product && (
                      <p className="mt-2 rounded-md border border-dashed border-[#b9c7b2] bg-[#eef2ea] px-2.5 py-1.5 text-[13px]">
                        {product.tipTitle} : {product.tip}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          <dl className="mt-4 divide-y divide-line border-t border-line text-[15px]">
            <div className="flex justify-between py-1.5">
              <dt>Total TTC</dt>
              <dd>{formatEUR(order.totalCents)}</dd>
            </div>
            <div className="flex justify-between py-1.5">
              <dt>Dont TVA (5,5 %) :</dt>
              <dd>{formatEUR(vat)}</dd>
            </div>
            <div className="flex justify-between py-1.5">
              <dt>{order.paidCents > order.depositCents ? "Déjà réglé" : "Acompte versé"}</dt>
              <dd>-{formatEUR(order.paidCents)}</dd>
            </div>
            <div className="flex justify-between py-2 text-lg font-bold">
              <dt>{isPickup ? "Solde à régler au retrait :" : "Solde à régler :"}</dt>
              <dd>{formatEUR(due)}</dd>
            </div>
          </dl>
          <Link href="/compte/factures" className={cn(btn.primary, "mt-2 rounded-md")}>
            <FileText className="size-4" /> Voir mes documents
          </Link>
        </Card>
      </div>

      <aside className="space-y-3 xl:pt-9">
        <Card className="p-3.5">
          <h2 className="text-lg font-semibold">Suivi de la commande</h2>
          <ol className="mt-2">
            {timeline.map((step, i) => (
              <li key={step.key} className="relative flex gap-2.5 pb-2.5 last:pb-0">
                {i < timeline.length - 1 && (
                  <span className={cn("absolute left-[7px] top-4 h-[calc(100%-12px)] w-px", step.state === "done" ? "bg-forest" : "bg-[#cfc6b6]")} />
                )}
                <span
                  className={cn(
                    "relative z-10 mt-0.5 flex size-[15px] shrink-0 items-center justify-center rounded-full",
                    step.state === "done" && "bg-forest text-white",
                    step.state === "current" && "bg-burgundy ring-2 ring-burgundy/25",
                    step.state === "todo" && "border border-[#9b9285] bg-white",
                  )}
                >
                  {step.state === "done" && <Check className="size-2.5" strokeWidth={4} />}
                </span>
                <div className="text-[14px] leading-tight">
                  <p className={cn(step.state === "current" && "font-bold", step.state === "todo" && "text-muted")}>{step.label}</p>
                  {step.state === "current" ? (
                    <p className="text-[12px]">
                      étape en cours
                      <br />
                      {formatShortDayYear(order.slotDate)}, {formatSlot(order.slotStart, order.slotEnd)} • {order.shop}
                    </p>
                  ) : (
                    step.date && <p className="text-[12px] text-muted">{formatDate(step.date)}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </Card>

        <Card className="space-y-2 p-3.5">
          <h2 className="text-lg font-semibold">Agir sur cette commande</h2>
          <SlotChanger
            orderRef={order.ref}
            currentDate={order.slotDate}
            currentSlot={`${order.slotStart}-${order.slotEnd}`}
            minDate={addDays(t, 1)}
            slots={SLOT_OPTIONS}
            disabledReason={actions.changeSlot.allowed ? undefined : actions.changeSlot.reason}
          />
          <a href={`tel:${tel}`} className={btn.slate}>
            <Phone className="size-4 shrink-0" />
            <span className="leading-tight">
              Contacter la boutique
              <span className="block text-[11px] opacity-80">({shop.phone})</span>
            </span>
          </a>
          {actions.claim.allowed && (
            <Link href={`/compte/reclamations/nouvelle?commande=${order.ref}`} className={btn.slate}>
              <TriangleAlert className="size-4 shrink-0" /> Signaler un problème
            </Link>
          )}
          {actions.cancel.allowed ? (
            <ActionButton
              action={cancelOrderAction.bind(null, order.ref)}
              confirm="Annuler définitivement cette commande ? L'acompte vous sera remboursé."
              className="flex items-center gap-2 px-1 py-1 text-sm font-medium text-burgundy hover:underline"
            >
              <X className="size-4" /> Annuler la commande
            </ActionButton>
          ) : (
            <div className="px-1 text-sm">
              <p className="flex items-center gap-2 font-medium text-muted line-through decoration-1">
                <X className="size-4" /> Annuler la commande
              </p>
              <p className="pl-6 text-[12px] text-muted">{actions.cancel.reason}</p>
            </div>
          )}
          <Link href="/compte/vie-privee#conditions" className="block px-1 text-[12px] font-medium underline">
            Conditions de rétractation et d&apos;annulation
          </Link>
        </Card>

        <Card className="space-y-2 p-3.5">
          <h2 className="text-lg font-semibold">Documents</h2>
          <a href={`/api/documents/bon-de-commande/${order.ref}`} target="_blank" rel="noreferrer" className={cn(btn.primarySm, "w-full justify-start rounded-md py-2 text-left")}>
            <FileDown className="size-4 shrink-0" /> Télécharger le bon de commande (PDF)
          </a>
          <a
            href={`/api/documents/${due > 0 ? "facture-acompte" : "facture"}/${order.ref}`}
            target="_blank"
            rel="noreferrer"
            className={cn(btn.primarySm, "w-full justify-start rounded-md py-2 text-left")}
          >
            <FileDown className="size-4 shrink-0" /> Télécharger la facture {due > 0 ? "d'acompte " : ""}(PDF)
          </a>
        </Card>

        <Card className="p-3.5">
          <h2 className="text-lg font-semibold leading-tight">Messages envoyés pour cette commande</h2>
          {messages.length === 0 ? (
            <p className="mt-1 text-sm">Aucun message envoyé pour cette commande</p>
          ) : (
            <ul className="mt-2 max-h-48 space-y-2 overflow-y-auto">
              {messages.map((m) => (
                <li key={m.id} className="rounded-md bg-sand-2 p-2 text-[13px]">
                  <p>{m.body}</p>
                  <p className="mt-0.5 text-[11px] text-muted">
                    {formatDate(m.createdAt.toISOString())} à {formatTime(m.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <OrderMessageButton orderRef={order.ref} />
        </Card>

        <Card className="p-3.5">
          <h2 className="text-lg font-semibold">Archives et consignes</h2>
          <p className="mt-1 text-[13px]">
            <b>Rappel des consignes de fraîcheur :</b> conservez vos produits entre 0°C et +4°C.
          </p>
          <p className="mt-1.5 text-[13px]">
            <b>Consigne bac isotherme :</b> 5,00 € remboursés au retour
          </p>
          <Link href="/compte/avoirs" className="mt-1 block text-[13px] font-semibold underline">
            Voir le détail des consignes
          </Link>
        </Card>
      </aside>
    </div>
  );
}
