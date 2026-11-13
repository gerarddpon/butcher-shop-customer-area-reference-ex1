import Link from "next/link";
import { ChevronDown, Heart, Phone, Search, ShoppingCart, UserRound, MessageCircle } from "lucide-react";
import { shop } from "@/lib/config";
import { shopNav } from "@/lib/catalog";
import { getCartCount } from "@/lib/cart";

export async function SiteHeader() {
  const cartCount = await getCartCount();
  const tel = shop.phone.replace(/\s/g, "");
  return (
    <header className="sticky top-0 z-40">
      <div className="bg-[#1f1a19] text-[12.5px] text-white/90">
        <div className="mx-auto flex h-7 max-w-[1240px] items-center justify-between px-4 md:px-8">
          <p className="truncate">
            <span className="mr-1.5 text-[#cdb27b]">◆</span>
            Saisi le matin en boutique : passez à l&apos;heure de votre retrait
          </p>
          <div className="hidden items-center gap-5 sm:flex">
            <a href={`tel:${tel}`} className="inline-flex items-center gap-1.5 hover:text-white">
              <Phone className="size-3" /> {shop.phone}
            </a>
            <a href={`mailto:${shop.email}`} className="inline-flex items-center gap-1.5 hover:text-white">
              <MessageCircle className="size-3" /> Contacter l&apos;atelier
            </a>
          </div>
        </div>
      </div>
      <div className="border-b border-line bg-[#fbf9f5]/95 backdrop-blur">
        <div className="mx-auto flex h-[52px] max-w-[1240px] items-center gap-8 px-4 md:px-8">
          <Link href="/compte" className="font-serif text-[22px] font-bold uppercase tracking-[0.02em] text-ink">
            {shop.name}
          </Link>
          <nav aria-label="Navigation principale" className="hidden items-center gap-6 lg:flex">
            {shopNav.map((item) => (
              <Link key={item.label} href={item.href} className="inline-flex items-center gap-1 text-[15px] font-semibold text-ink hover:text-burgundy">
                {item.label}
                {item.dropdown && <ChevronDown className="size-3.5" />}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-4">
            <Link href="/boutique" aria-label="Rechercher" className="text-ink hover:text-burgundy">
              <Search className="size-5" />
            </Link>
            <Link href="/compte" aria-label="Mon compte" className="hidden text-ink hover:text-burgundy sm:block">
              <UserRound className="size-5" />
            </Link>
            <Link href="/boutique" aria-label={`Panier : ${cartCount} article(s)`} className="relative text-ink hover:text-burgundy">
              <ShoppingCart className="size-5" />
              <span className="absolute -right-2 -top-2 flex size-4 items-center justify-center rounded-full bg-burgundy text-[10px] font-bold text-white">
                {cartCount}
              </span>
            </Link>
            <Link href="/compte/avis" aria-label="Favoris" className="hidden text-ink hover:text-burgundy sm:block">
              <Heart className="size-[18px]" />
            </Link>
            <Link href="/boutique" className="rounded-full bg-burgundy px-4 py-1.5 text-sm font-semibold text-white hover:bg-burgundy-dark">
              Panier{cartCount > 0 ? ` (${cartCount})` : ""}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
