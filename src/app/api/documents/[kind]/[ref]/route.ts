import { getOrder } from "@/lib/services/orders";
import { getClaim } from "@/lib/services/claims";
import { customer } from "@/lib/catalog";
import { shop, today } from "@/lib/config";
import { claimReasonLabel, remainingCents } from "@/lib/domain";
import { formatDate, formatEUR } from "@/lib/format";

export const dynamic = "force-dynamic";

const TITLES: Record<string, string> = {
  "bon-de-commande": "Bon de commande",
  "facture-acompte": "Facture d'acompte",
  facture: "Facture",
  avoir: "Avoir",
};

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string);

function page(title: string, ref: string, body: string) {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${esc(title)} ${esc(ref)} · ${esc(shop.name)}</title>
<style>
body{font-family:"Roboto Condensed",Arial,sans-serif;color:#1c1917;max-width:760px;margin:40px auto;padding:0 24px}
header{display:flex;justify-content:space-between;border-bottom:2px solid #4a0e1b;padding-bottom:12px;margin-bottom:24px}
h1{font-family:Georgia,serif;margin:0;font-size:26px;text-transform:uppercase}
h2{font-size:20px;margin:0 0 4px}
table{width:100%;border-collapse:collapse;margin-top:16px}
th,td{text-align:left;padding:8px;border-bottom:1px solid #e3d9c7;font-size:14px}
td.r,th.r{text-align:right}
.tot td{font-weight:700;font-size:16px}
.muted{color:#5b544b;font-size:13px}
.btn{background:#4a0e1b;color:#fff;border:0;border-radius:999px;padding:8px 16px;cursor:pointer;font-size:14px}
@media print{.btn{display:none}}
</style></head><body>
<header><div><h1>${esc(shop.name)}</h1><div class="muted">${esc(shop.location)} · ${esc(shop.phone)} · ${esc(shop.email)}</div></div>
<div style="text-align:right"><h2>${esc(title)}</h2><div>${esc(ref)}</div><div class="muted">Édité le ${formatDate(today())}</div></div></header>
<p><b>${esc(customer.firstName)} ${esc(customer.lastName)}</b><br><span class="muted">${esc(customer.address)} · ${esc(customer.email)}</span></p>
${body}
<p style="margin-top:32px"><button class="btn" onclick="window.print()">Imprimer / Enregistrer en PDF</button></p>
<p class="muted">Document généré par le service documentaire de démonstration. TVA alimentaire 5,5 %. Conservez vos produits entre 0°C et +4°C.</p>
</body></html>`;
}

export async function GET(_req: Request, ctx: { params: Promise<{ kind: string; ref: string }> }) {
  const { kind, ref } = await ctx.params;
  const title = TITLES[kind];
  if (!title) return new Response("Type de document inconnu", { status: 404 });

  if (kind === "avoir") {
    const found = await getClaim(ref);
    if (!found || !["issued", "used"].includes(found.claim.creditStatus)) return new Response("Avoir indisponible", { status: 404 });
    const c = found.claim;
    const body = `<table><tr><th>Dossier</th><th>Motif</th><th class="r">Montant</th></tr>
<tr><td>${esc(c.ref)} · ${esc(c.productLabel)} (${esc(c.orderRef)})</td><td>${esc(claimReasonLabel(c.reason))}</td><td class="r">${formatEUR(c.creditCents)}</td></tr>
<tr class="tot"><td colspan="2">Avoir à valoir</td><td class="r">${formatEUR(c.creditCents)}</td></tr></table>
<p class="muted">Valable jusqu'au ${c.creditValidUntil ? formatDate(c.creditValidUntil) : "—"} en boutique et en ligne.</p>`;
    return new Response(page(title, `AV-${c.ref}`, body), { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  const order = await getOrder(ref);
  if (!order) return new Response("Commande introuvable", { status: 404 });
  const taxable = order.items.filter((i) => i.productId !== "carte-cadeau").reduce((s, i) => s + i.priceCents, 0);
  const vat = Math.round(taxable - taxable / 1.055);
  const rows = order.items
    .map((i) => `<tr><td>${esc(i.label)}${i.weight ? ` · ${esc(i.weight)}` : ""}</td><td>${esc(i.lot)}</td><td class="r">${formatEUR(i.priceCents)}</td></tr>`)
    .join("");
  const deposit =
    kind === "facture-acompte"
      ? `<tr class="tot"><td colspan="2">Acompte encaissé</td><td class="r">${formatEUR(order.paidCents)}</td></tr><tr><td colspan="2">Solde restant dû</td><td class="r">${formatEUR(remainingCents(order))}</td></tr>`
      : `<tr class="tot"><td colspan="2">Total TTC</td><td class="r">${formatEUR(order.totalCents)}</td></tr>`;
  const body = `<p>Commande du ${formatDate(order.placedAt)} · ${order.mode === "retrait" ? "Retrait" : "Livraison"} le ${formatDate(order.slotDate)} (${order.slotStart}–${order.slotEnd})</p>
<table><tr><th>Article</th><th>Lot</th><th class="r">Prix TTC</th></tr>${rows}
<tr><td colspan="2">Dont TVA 5,5 %</td><td class="r">${formatEUR(vat)}</td></tr>${deposit}</table>`;
  return new Response(page(title, order.ref, body), { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
