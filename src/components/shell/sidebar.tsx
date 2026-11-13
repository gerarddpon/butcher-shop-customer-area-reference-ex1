"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  CalendarDays,
  CreditCard,
  FileText,
  Home,
  ListChecks,
  MapPin,
  Package,
  PiggyBank,
  ReceiptText,
  Scissors,
  SlidersHorizontal,
  Star,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/format";

type Item = { label: string; href: string; icon?: LucideIcon; badgeKey?: "orders" | "claims" };

const groups: { title: string; items: Item[] }[] = [
  {
    title: "Vos commandes",
    items: [
      { label: "Vue d'ensemble", href: "/compte", icon: ListChecks },
      { label: "Commandes", href: "/compte/commandes", icon: Package, badgeKey: "orders" },
      { label: "Abonnements", href: "/compte/abonnements", icon: CalendarDays },
      { label: "Mes avis", href: "/compte/avis", icon: Star },
    ],
  },
  {
    title: "Paiements et documents",
    items: [
      { label: "Factures", href: "/compte/factures", icon: FileText },
      { label: "Paiements", href: "/compte/paiements", icon: CreditCard },
      { label: "Avoirs & consignes", href: "/compte/avoirs", icon: ReceiptText },
      { label: "Cagnotte", href: "/compte/cagnotte", icon: PiggyBank },
    ],
  },
  {
    title: "Vos préférences",
    items: [
      { label: "Préférences", href: "/compte/preferences", icon: SlidersHorizontal },
      { label: "Atelier", href: "/compte/atelier", icon: Scissors },
      { label: "Foyer", href: "/compte/foyer", icon: Home },
      { label: "Adresses", href: "/compte/adresses", icon: MapPin },
      { label: "Notifications", href: "/compte/notifications", icon: Bell },
    ],
  },
  {
    title: "Compte et aide",
    items: [
      { label: "Sécurité & accès", href: "/compte/securite" },
      { label: "Réclamations", href: "/compte/reclamations", badgeKey: "claims" },
      { label: "Professionnel", href: "/compte/professionnel" },
      { label: "Vie privée", href: "/compte/vie-privee" },
    ],
  },
];

export function Sidebar({ badges }: { badges: { orders: number; claims: number } }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/compte" ? pathname === "/compte" : pathname.startsWith(href));

  return (
    <nav aria-label="Espace client" className="gold-panel rounded-lg px-3 py-4 lg:sticky lg:top-[100px]">
      <div className="no-scrollbar flex gap-4 overflow-x-auto lg:block lg:overflow-visible">
        {groups.map((group, gi) => (
          <div key={group.title} className={cn("shrink-0", gi > 0 && "lg:mt-3 lg:border-t lg:border-[#a98d55]/40 lg:pt-3")}>
            <p className="mb-1.5 px-2 text-[12px] font-bold uppercase tracking-wide text-[#2c2213]">{group.title}</p>
            <ul className="flex gap-1 lg:block lg:space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                const badge = item.badgeKey ? badges[item.badgeKey] : 0;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative flex items-center gap-2 whitespace-nowrap rounded-md px-2 py-1 text-[14px] font-medium text-[#1f170c] transition",
                        active ? "bg-[#fbf8f1] shadow-sm" : "hover:bg-white/30",
                      )}
                    >
                      {active && <span className="absolute -left-3 top-0 hidden h-full w-1 rounded-r bg-burgundy lg:block" />}
                      {Icon ? <Icon className="size-4" strokeWidth={1.8} /> : <span className="mx-1.5 size-1 rounded-full bg-[#5c4a2a]" />}
                      <span className="flex-1">{item.label}</span>
                      {badge > 0 && (
                        <span className="rounded-full bg-[#c98f7d] px-1.5 text-[11px] font-bold leading-4 text-white">({badge})</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
