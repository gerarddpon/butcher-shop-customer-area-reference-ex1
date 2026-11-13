import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/shell/site-header";
import { ProductThumb, btn } from "@/components/ui";
import { ActionButton } from "@/components/action-button";
import { addProductToCartAction } from "../compte/actions";
import { products } from "@/lib/catalog";
import { shop } from "@/lib/config";
import { formatEUR } from "@/lib/format";
import { getCartCount } from "@/lib/cart";

export const metadata: Metadata = { title: "Boutique" };
export const dynamic = "force-dynamic";

export default async function BoutiquePage() {
  const count = await getCartCount();
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-[1240px] px-4 py-8 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-serif text-4xl font-bold">La boutique</h1>
            <p className="mt-1 text-[15px]">Commandez avant 18h, retirez dès le surlendemain à la {shop.location}.</p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span>
              Panier : <b>{count}</b> article{count > 1 ? "s" : ""}
            </span>
            <Link href="/compte" className={btn.outline}>
              Mon espace client
            </Link>
          </div>
        </div>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.values(products).map((p) => (
            <li key={p.id} className="flex gap-4 rounded-xl border border-line bg-white p-4 shadow-card">
              <ProductThumb productId={p.id} size={96} />
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="text-lg font-semibold leading-tight">{p.name}</p>
                <p className="text-sm text-muted">
                  {p.unitLabel && `${p.unitLabel} · `}
                  {p.origin !== "—" ? p.origin : "Valable 12 mois"}
                </p>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <b>{formatEUR(p.priceCents)}</b>
                  <ActionButton action={addProductToCartAction.bind(null, p.id)} className={btn.primarySm}>
                    Ajouter
                  </ActionButton>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <section id="maison" className="mt-12 rounded-xl bg-[#d6c18f] p-6">
          <h2 className="font-serif text-2xl font-bold">La maison</h2>
          <p className="mt-2 max-w-3xl text-[15px]">
            Depuis trois générations, {shop.name} sélectionne ses bêtes chez des éleveurs du Val-d&apos;Oise et de Normandie, mature ses côtes en cave et prépare
            chaque commande à la main, le matin même du retrait.
          </p>
        </section>
        <section id="apropos" className="mt-4 rounded-xl border border-line bg-white p-6">
          <h2 className="font-serif text-2xl font-bold">À propos</h2>
          <p className="mt-2 text-[15px]">
            {shop.location} · {shop.phone} · {shop.email} · Ouvert du mardi au samedi, 8h30 – 19h30.
          </p>
        </section>
      </main>
    </div>
  );
}
