import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Briefcase, CalendarDays, Check, FileText, Phone, PiggyBank, Scissors, ShoppingCart } from "lucide-react";
import { Badge, Card, PageTitle, btn } from "@/components/ui";
import { QrCode } from "@/components/qr-code";
import { ModalTrigger } from "@/components/modal";
import { atelierPreferences, customer, subscription } from "@/lib/catalog";
import { shop, today } from "@/lib/config";
import { DONE_STATUSES, isActive, orderStatusMeta, overviewProgress, remainingCents } from "@/lib/domain";
import { cn, formatDate, formatEUR, formatLongDate, formatSlot } from "@/lib/format";
import { getNextPickup, listOrders } from "@/lib/services/orders";
import { claimStats } from "@/lib/services/claims";
import { getLoyalty } from "@/lib/services/loyalty";

export const metadata: Metadata = { title: "Vue d'ensemble" };
export const dynamic = "force-dynamic";

const steps = ["Commande reçue", "En préparation", "Prête", "Retirée"];

export default async function OverviewPage() {
  const [orders, next, claims, loyalty] = await Promise.all([listOrders(), getNextPickup(), claimStats(), getLoyalty()]);
  const active = orders.filter(isActive).sort((a, b) => a.slotDate.localeCompare(b.slotDate));
  const done = orders.filter((o) => DONE_STATUSES.includes(o.status));
  const invoices = orders.filter((o) => o.paidCents > 0 && o.status !== "annulee").length;
  const totalDue = active.reduce((s, o) => s + remainingCents(o), 0) - claims.availableCreditCents;
  const sinceYear = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(customer.since));

  return (
    <div className="space-y-5">
      <header>
        <PageTitle>Votre maison, {customer.firstName}</PageTitle>
        <p className="mt-1 text-[15px] text-ink">
          Vos commandes, vos documents et vos préférences d&apos;atelier. Tout ce que le comptoir sait de vous est ici, et nulle part ailleurs.
        </p>
      </header>

      {next ? (
        <section className="grid gap-4 rounded-xl bg-[#d6c18f] p-4 shadow-card md:grid-cols-[minmax(0,1fr)_190px]">
          <div className="min-w-0">
            <p className="text-[12px] font-bold uppercase tracking-wide">Votre prochain retrait</p>
            <p className="text-xl font-bold">
              {formatLongDate(next.slotDate, false)} · {formatSlot(next.slotStart, next.slotEnd)}
            </p>
            <p className="text-sm">
              {next.shop} · Commande {next.ref}
            </p>
            <div className="mt-3 rounded-lg bg-white p-3.5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-lg font-bold">{formatEUR(remainingCents(next))} à régler au retrait</p>
                <Badge className={orderStatusMeta[next.status].className}>{orderStatusMeta[next.status].label}</Badge>
              </div>
              <p className="mt-1 text-[13px] leading-snug text-muted">
                Acompte de {formatEUR(next.paidCents)} déjà encaissé, solde dû au comptoir. Règlement par carte, titres-restaurant, espèces ou chèque. Le montant
                définitif sera pesé au comptoir, le jour du retrait.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href={`/compte/commandes/${next.ref}`} className={btn.primarySm}>
                  Payer et suivre la commande
                </Link>
                <Link href={`/compte/commandes/${next.ref}#creneau`} className="rounded-full border border-ink/70 bg-white px-3 py-1.5 text-[13px] font-medium hover:bg-sand-2">
                  Modifier le créneau
                </Link>
              </div>
            </div>
            <p className="mt-3 text-sm font-semibold">Où en est la commande</p>
            <ol className="mt-2 grid grid-cols-4">
              {steps.map((label, i) => {
                const reached = i < overviewProgress(next);
                return (
                  <li key={label} className="relative flex flex-col items-center text-center">
                    {i > 0 && (
                      <span
                        className={cn(
                          "absolute right-1/2 top-[11px] h-0.5 w-full",
                          reached ? "bg-burgundy" : "border-t-2 border-dashed border-[#8f7b52] bg-transparent",
                        )}
                      />
                    )}
                    <span
                      className={cn(
                        "relative z-10 flex size-6 items-center justify-center rounded-full border-2",
                        reached ? "border-burgundy bg-burgundy text-white" : "border-[#8f7b52] bg-[#e8dab6]",
                      )}
                    >
                      {reached && <Check className="size-3.5" strokeWidth={3} />}
                    </span>
                    <span className="mt-1 text-[12px] font-medium">
                      {i + 1}. {label}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
          <div className="flex flex-col items-center rounded-lg bg-white p-3 text-center shadow-sm">
            <p className="text-sm font-bold">Laissez-passer de retrait</p>
            <p className="text-[11px] leading-tight text-muted">À présenter au comptoir libre &amp; collecte, ou bien à gauche</p>
            <QrCode value={`${next.pickupCode}|${next.ref}`} size={112} className="my-2" />
            <p className="w-full rounded-md bg-sand-2 py-1 font-mono text-sm font-bold tracking-wide">{next.pickupCode}</p>
            <ModalTrigger label="Agrandir le code" title="Laissez-passer de retrait" className="mt-2 w-full rounded-full border border-ink/60 py-1 text-[13px] font-medium hover:bg-sand-2">
              <div className="flex flex-col items-center gap-3 py-2">
                <QrCode value={`${next.pickupCode}|${next.ref}`} size={260} />
                <p className="font-mono text-2xl font-bold tracking-widest">{next.pickupCode}</p>
                <p className="text-sm text-muted">
                  {formatLongDate(next.slotDate)} · {formatSlot(next.slotStart, next.slotEnd)} · {next.shop}
                </p>
              </div>
            </ModalTrigger>
          </div>
        </section>
      ) : (
        <Card className="p-5">
          <p className="font-semibold">Aucun retrait prévu pour le moment.</p>
          <Link href="/boutique" className={cn(btn.primarySm, "mt-3")}>
            Composer une commande
          </Link>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <h2 className="text-lg font-semibold">Total cumulé des commandes en cours</h2>
          <p className="text-3xl font-bold">{formatEUR(Math.max(0, totalDue))}</p>
          <ul className="mt-2 divide-y divide-line text-[13px]">
            {active.map((o) => (
              <li key={o.ref} className="flex items-center justify-between py-1.5">
                <span className="leading-tight">
                  Solde à régler au retrait
                  <br />
                  <span className="text-muted">
                    {o.ref} · {formatDate(o.slotDate)}
                  </span>
                </span>
                <span className="font-semibold">{formatEUR(remainingCents(o))}</span>
              </li>
            ))}
            {claims.availableCreditCents > 0 && (
              <li className="flex items-center justify-between py-1.5">
                <span className="leading-tight">
                  Avoir valable à la commande
                  <br />
                  <span className="text-muted">déduit au prochain retrait</span>
                </span>
                <span className="rounded-md bg-[#dcefdc] px-2 py-0.5 font-semibold text-forest">-{formatEUR(claims.availableCreditCents)}</span>
              </li>
            )}
          </ul>
          <Link href="/compte/avoirs" className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold hover:underline">
            Avoirs, consignes et acomptes <ArrowRight className="size-3.5" />
          </Link>
        </Card>

        <Card className="p-4">
          <h2 className="font-serif text-xl font-bold">Vos documents</h2>
          <ul className="mt-2 divide-y divide-line text-[13px]">
            {[
              { label: "Factures disponibles", value: String(invoices), href: "/compte/factures" },
              { label: "Avoirs ouverts", value: formatEUR(claims.availableCreditCents), href: "/compte/avoirs", highlight: true },
              { label: "Réclamations ouvertes", value: String(claims.open.length), href: "/compte/reclamations" },
              { label: "Commandes depuis l'ouverture du compte", value: String(orders.length), href: "/compte/commandes" },
            ].map((row) => (
              <li key={row.label}>
                <Link href={row.href} className="flex items-center justify-between py-2 hover:text-burgundy">
                  <span>{row.label}</span>
                  <span className={cn("inline-flex items-center gap-1 font-semibold", row.highlight && "rounded-md bg-[#f3dcc4] px-2 py-0.5")}>
                    {row.value} {!row.highlight && <ArrowRight className="size-3.5" />}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/compte/factures" className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold hover:underline">
            Ouvrir les documents récents <ArrowRight className="size-3.5" />
          </Link>
        </Card>

        <Card className="p-4">
          <h2 className="font-serif text-xl font-bold">Ce que le comptoir retient de vous</h2>
          <div className="mt-1 flex items-center justify-between">
            <p className="text-sm font-semibold">Vos préférences d&apos;atelier</p>
            <Link href="/compte/atelier" className="inline-flex items-center gap-1 text-[13px] font-semibold text-burgundy hover:underline">
              Modifier <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <p className="text-[13px] text-muted">
            L&apos;atelier prépare vos pièces en suivant ces indications. Le jour du retrait, votre boucher les confirme avec vous.
          </p>
          <span className="mt-2 inline-block rounded-full border border-ink/50 px-2.5 py-0.5 text-[12px] font-medium">Vos tailles &amp; découpes</span>
          <ul className="mt-2 list-disc space-y-1.5 pl-4 text-[13px]">
            {atelierPreferences.map((p) => (
              <li key={p.id}>{p.label}</li>
            ))}
          </ul>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between gap-2">
            <h2 className="font-serif text-xl font-bold">Votre statut</h2>
            <span className="rounded-md bg-burgundy px-2 py-0.5 text-[12px] font-bold uppercase tracking-wide text-white">{customer.tier}</span>
          </div>
          <p className="mt-1 text-[13px] text-muted">
            Au comptoir, votre nom suffit pour retirer une commande de la semaine, et vos préférences d&apos;atelier sont relues avant préparation.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-[13px]">
            <li>
              {customer.retrievalsOnTime} retraits honorés · Client depuis {sinceYear}
            </li>
            <li>Priorité d&apos;appel, et pièces réservées sur demande au comptoir</li>
          </ul>
          <p className="mt-3 text-sm font-semibold">Une question, un imprévu ?</p>
          <p className="text-[13px] text-muted">
            Le comptoir répond jusqu&apos;à 19h00, du mardi au samedi. C&apos;est plus rapide qu&apos;un formulaire et c&apos;est un vrai boucher qui décroche.
          </p>
          <a
            href={`tel:${shop.phone.replace(/\s/g, "")}`}
            className="mt-3 inline-flex items-center gap-2 rounded-full border border-ink/60 px-3 py-1.5 text-[13px] font-medium hover:bg-sand-2"
          >
            <Phone className="size-3.5" /> Appeler le comptoir : {shop.phone}
          </a>
        </Card>
      </div>

      <section>
        <h2 className="mb-3 font-serif text-2xl font-bold">Accès rapide</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { title: "Mes commandes", desc: "Suivre, détailler, télécharger et recommander commande par commande.", tag: `${active.length} en cours · ${done.length} retirées`, href: "/compte/commandes", icon: ShoppingCart },
            { title: "Cagnotte", desc: "Points fidélité, bons d'achat et cartes-cadeaux, cumulés à chaque passage.", tag: `${loyalty.points} points · ${formatEUR(loyalty.valueCents)}`, href: "/compte/cagnotte", icon: PiggyBank },
            { title: "Factures", desc: "Chaque facture, son avoir et son PDF, en un clic.", tag: `${invoices} documents`, href: "/compte/factures", icon: FileText, plain: true },
            { title: "Abonnements", desc: "Votre colis du mois : mettre en pause, modifier ou résilier sans appeler.", tag: subscription.status === "actif" ? "1 actif" : "Aucun", href: "/compte/abonnements", icon: CalendarDays },
            { title: "Préférences d'atelier", desc: "Épaisseurs, tailles, règles d'épluchage et de cuisson.", tag: `${atelierPreferences.length} préférences actives`, href: "/compte/atelier", icon: Scissors },
            { title: "Compte professionnel", desc: "SIRET, bons de commande et facturation mensuelle pour les restaurateurs.", tag: customer.accountType, href: "/compte/professionnel", icon: Briefcase, plain: true },
          ].map((q) => (
            <Link key={q.title} href={q.href} className="group rounded-xl border border-line bg-white p-3.5 shadow-card transition hover:-translate-y-0.5 hover:shadow-lg">
              <div className="flex items-start justify-between">
                <p className="inline-flex items-center gap-1 font-bold group-hover:text-burgundy">
                  {q.title} <ArrowRight className="size-3.5 opacity-0 transition group-hover:opacity-100" />
                </p>
                <span className="rounded-md bg-sand-2 p-1.5">
                  <q.icon className="size-4" />
                </span>
              </div>
              <p className="mt-1 text-[13px] leading-snug text-muted">{q.desc}</p>
              <span className={cn("mt-2 inline-block text-[12px] font-semibold", q.plain ? "text-muted" : "rounded-md bg-[#f3dcd4] px-2 py-0.5 text-ink")}>{q.tag}</span>
            </Link>
          ))}
        </div>
      </section>

      <p className="text-[12px] font-semibold leading-snug">
        Les statuts affichés sont ceux de la commande en boutique, proposés dans la messagerie du client. Aucun montant n&apos;est modifié ici : le poids, la TVA et les
        remises sont validés à la commande. Données au {formatDate(today())}.
      </p>
    </div>
  );
}
