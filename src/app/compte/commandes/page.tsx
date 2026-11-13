import Link from "next/link";
import type { Metadata } from "next";
import { Search } from "lucide-react";
import { Badge, PageTitle, SectionHeading, btn, inputCls } from "@/components/ui";
import { ActionButton } from "@/components/action-button";
import { reorderAction } from "../actions";
import { listOrders, type OrderFilters } from "@/lib/services/orders";
import { ACTIVE_STATUSES, orderStatusMeta, remainingCents } from "@/lib/domain";
import { cn, formatDate, formatEUR, formatShortDay } from "@/lib/format";
import type { Order } from "@/db/schema";

export const metadata: Metadata = { title: "Vos commandes" };
export const dynamic = "force-dynamic";

const selectCls = cn(inputCls, "py-1.5 cursor-pointer");

function slotLine(o: Order) {
  if (o.mode === "livraison") return `Livraison - ${o.slotStart.replace(":00", " h")} à ${o.slotEnd.replace(":00", " h")}`;
  return `${formatShortDay(o.slotDate)} - ${o.slotStart.replace(":", "h")} - ${o.slotEnd.replace(":", "h")}`;
}

function OrderCard({ order }: { order: Order }) {
  const meta = orderStatusMeta[order.status];
  const due = remainingCents(order);
  const active = ACTIVE_STATUSES.includes(order.status);
  const names = order.items.map((i) => i.label);
  const summary = names.slice(0, 3).join(" - ") + (names.length > 3 ? ` - +${names.length - 3}` : "");
  return (
    <article className="overflow-hidden rounded-xl border border-line bg-white shadow-card">
      <div className="flex flex-wrap justify-between gap-3 p-3.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{order.ref}</h3>
            <Badge className={cn("rounded-full", meta.className)}>{meta.label}</Badge>
          </div>
          <p className="text-sm">
            <b>{order.mode === "livraison" ? "Livraison" : "Retrait"}</b> - {order.shop}
          </p>
          <p className="text-sm">{slotLine(order)}</p>
          <p className="truncate text-sm">{summary}</p>
        </div>
        <div className="text-right text-sm">
          <p>
            Total <b className="text-base">{formatEUR(order.totalCents)}</b>
          </p>
          {order.status === "annulee" ? (
            <p className="text-muted">Annulée · acompte remboursé</p>
          ) : due > 0 ? (
            <p>
              Reste à régler : <span className="font-semibold text-[#a97a12]">{formatEUR(due)}</span>
            </p>
          ) : (
            <p className="font-semibold text-forest">Réglée</p>
          )}
          <p>Commandé le {formatDate(order.placedAt)}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-line px-3.5 py-2">
        <ActionButton action={reorderAction.bind(null, order.ref)} className={active ? btn.primarySm : "inline-flex items-center gap-1.5 px-1 text-[13px] font-semibold underline underline-offset-4 hover:text-burgundy"}>
          Recommander ces articles
        </ActionButton>
        <Link href={`/compte/commandes/${order.ref}`} className={btn.primarySm}>
          Voir le détail
        </Link>
      </div>
    </article>
  );
}

export default async function OrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const pick = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const filters: OrderFilters = {
    q: pick("q"),
    state: (pick("etat") as OrderFilters["state"]) ?? "toutes",
    period: (pick("periode") as OrderFilters["period"]) ?? "tout",
    sort: (pick("tri") as OrderFilters["sort"]) ?? "recentes",
  };
  const list = await listOrders(filters);
  const current = list.filter((o) => ACTIVE_STATUSES.includes(o.status));
  const finished = list.filter((o) => !ACTIVE_STATUSES.includes(o.status));

  return (
    <div>
      <PageTitle>Vos commandes</PageTitle>
      <p className="mt-1 text-[15px] font-medium leading-snug">
        Chaque commande garde son détail : ce qui a été pesé, d&apos;où vient la pièce, quel lot, quelle facture. C&apos;est ce qui permet de traiter une réclamation
        sans vous demander de tout réexpliquer.
      </p>

      <form method="get" className="mt-4 rounded-xl border border-line bg-white p-3.5 shadow-card">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="q" className="mb-1 block text-[13px] font-semibold">
              Numéro ou produit
            </label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <input id="q" name="q" defaultValue={filters.q} placeholder="CMD-2452, côte de bœuf…" className={cn(inputCls, "py-1.5 pl-8")} />
            </div>
          </div>
          <div>
            <label htmlFor="etat" className="mb-1 block text-[13px] font-semibold">
              État
            </label>
            <select id="etat" name="etat" defaultValue={filters.state} className={selectCls}>
              <option value="toutes">Toutes</option>
              <option value="en_cours">En cours</option>
              <option value="terminees">Terminées</option>
              <option value="annulees">Annulées</option>
            </select>
          </div>
          <div>
            <label htmlFor="periode" className="mb-1 block text-[13px] font-semibold">
              Période
            </label>
            <select id="periode" name="periode" defaultValue={filters.period} className={selectCls}>
              <option value="tout">Tout l&apos;historique</option>
              <option value="30j">30 derniers jours</option>
              <option value="90j">90 derniers jours</option>
              <option value="annee">Cette année</option>
            </select>
          </div>
          <div>
            <label htmlFor="tri" className="mb-1 block text-[13px] font-semibold">
              Tri
            </label>
            <select id="tri" name="tri" defaultValue={filters.sort} className={selectCls}>
              <option value="recentes">Récentes d&apos;abord</option>
              <option value="anciennes">Anciennes d&apos;abord</option>
              <option value="montant">Montant décroissant</option>
            </select>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button type="submit" className="rounded-md bg-gold px-3 py-1.5 text-sm font-semibold text-ink shadow-sm hover:bg-gold-dark">
            Filtrer
          </button>
          <span className="text-sm">
            {list.length} commande{list.length > 1 ? "s" : ""} au total
          </span>
          {(filters.q || filters.state !== "toutes" || filters.period !== "tout") && (
            <Link href="/compte/commandes" className="text-sm underline">
              Réinitialiser
            </Link>
          )}
        </div>
      </form>

      {current.length > 0 && (
        <>
          <SectionHeading title="En cours" count={`${current.length} commande${current.length > 1 ? "s" : ""}`} hint="Commandes à préparer, prêtes ou à retirer" />
          <div className="space-y-3">
            {current.map((o) => (
              <OrderCard key={o.ref} order={o} />
            ))}
          </div>
        </>
      )}
      {finished.length > 0 && (
        <>
          <SectionHeading
            title="Terminées"
            count={`${finished.length} commande${finished.length > 1 ? "s" : ""}`}
            hint="Retirées ou livrées : vos documents restent disponibles dix ans"
          />
          <div className="space-y-3">
            {finished.map((o) => (
              <OrderCard key={o.ref} order={o} />
            ))}
          </div>
        </>
      )}
      {list.length === 0 && (
        <div className="mt-6 rounded-xl border border-dashed border-[#c9bda6] bg-white/60 p-8 text-center">
          <p className="font-semibold">Aucune commande ne correspond à ces filtres.</p>
          <Link href="/compte/commandes" className={cn(btn.outline, "mt-3")}>
            Voir toutes les commandes
          </Link>
        </div>
      )}

      <p className="mt-5 text-[13px] font-semibold leading-snug">
        Une action absente n&apos;est jamais une erreur d&apos;affichage : le détail de chaque commande indique, pour chaque geste impossible, la raison et l&apos;étape
        suivante.
      </p>
    </div>
  );
}
