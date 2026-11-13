import type { ReactNode } from "react";
import { SiteHeader } from "@/components/shell/site-header";
import { ClientBar } from "@/components/shell/client-bar";
import { Sidebar } from "@/components/shell/sidebar";
import { customer } from "@/lib/catalog";
import { listOrders } from "@/lib/services/orders";
import { listClaims } from "@/lib/services/claims";
import { isActive } from "@/lib/domain";

export const dynamic = "force-dynamic";

export default async function CompteLayout({ children }: { children: ReactNode }) {
  const [orders, claims] = await Promise.all([listOrders(), listClaims()]);
  const badges = {
    orders: orders.filter(isActive).length,
    claims: claims.filter((c) => c.status !== "clos").length,
  };
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <ClientBar firstName={customer.firstName} email={customer.email} />
      <div className="mx-auto grid max-w-[1240px] gap-6 px-4 pb-16 md:px-8 lg:grid-cols-[180px_minmax(0,1fr)] lg:gap-7">
        <aside className="min-w-0">
          <Sidebar badges={badges} />
        </aside>
        <main id="contenu" className="min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
