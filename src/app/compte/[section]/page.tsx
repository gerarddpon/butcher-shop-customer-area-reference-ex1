import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { FileDown, ShieldCheck } from "lucide-react";
import { Badge, Card, PageTitle, btn } from "@/components/ui";
import { PrefToggle } from "./pref-toggle";
import { atelierPreferences, customer, subscription } from "@/lib/catalog";
import { shop } from "@/lib/config";
import { listOrders } from "@/lib/services/orders";
import { listClaims } from "@/lib/services/claims";
import { claimReasonLabel, orderStatusMeta } from "@/lib/domain";
import { cn, formatDate, formatEUR, formatLongDate } from "@/lib/format";

export const dynamic = "force-dynamic";

type Section = { title: string; intro: string; render: () => Promise<ReactNode> | ReactNode };

function Rows({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="divide-y divide-line">
      {rows.map(([k, v]) => (
        <div key={k} className="flex flex-wrap justify-between gap-2 py-2 text-[15px]">
          <dt className="text-muted">{k}</dt>
          <dd className="font-medium">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function Block({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <Card className="p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </Card>
  );
}

const callShop = (
  <a href={`tel:${shop.phone.replace(/\s/g, "")}`} className="text-sm font-semibold text-burgundy hover:underline">
    Modifier avec le comptoir →
  </a>
);

const sections: Record<string, Section> = {
  factures: {
    title: "Factures",
    intro: "Chaque facture est conservée dix ans. Téléchargez-la au format imprimable ou enregistrez-la en PDF.",
    render: async () => {
      const orders = (await listOrders()).filter((o) => o.paidCents > 0 && o.status !== "annulee");
      return (
        <Card className="overflow-x-auto p-4">
          <table className="w-full min-w-[560px] text-left text-[15px]">
            <thead>
              <tr className="border-b border-line">
                <th className="py-2 font-semibold">Commande</th>
                <th className="py-2 font-semibold">Date</th>
                <th className="py-2 font-semibold">Statut</th>
                <th className="py-2 text-right font-semibold">Montant</th>
                <th className="py-2 text-right font-semibold">Document</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const full = o.paidCents >= o.totalCents;
                return (
                  <tr key={o.ref} className="border-b border-line last:border-0">
                    <td className="py-2">
                      <Link href={`/compte/commandes/${o.ref}`} className="font-medium hover:underline">
                        {o.ref}
                      </Link>
                    </td>
                    <td className="py-2">{formatDate(o.placedAt)}</td>
                    <td className="py-2">
                      <Badge className={orderStatusMeta[o.status].className}>{orderStatusMeta[o.status].label}</Badge>
                    </td>
                    <td className="py-2 text-right">{formatEUR(full ? o.totalCents : o.paidCents)}</td>
                    <td className="py-2 text-right">
                      <a href={`/api/documents/${full ? "facture" : "facture-acompte"}/${o.ref}`} target="_blank" rel="noreferrer" className={btn.primarySm}>
                        <FileDown className="size-3.5" /> {full ? "Facture" : "Acompte"}
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      );
    },
  },
  avoirs: {
    title: "Avoirs & consignes",
    intro: "Vos avoirs issus des réclamations, et les consignes de bacs isothermes en cours.",
    render: async () => {
      const credits = (await listClaims()).filter((c) => c.creditCents > 0);
      return (
        <div className="space-y-4">
          <Block title="Avoirs">
            <ul className="divide-y divide-line">
              {credits.map((c) => (
                <li key={c.ref} className="flex flex-wrap items-center justify-between gap-2 py-2 text-[15px]">
                  <span>
                    <Link href={`/compte/reclamations/${c.ref}`} className="font-medium hover:underline">
                      {c.ref}
                    </Link>{" "}
                    · {claimReasonLabel(c.reason)} · {c.productLabel}
                  </span>
                  <span className="flex items-center gap-2">
                    <b>{formatEUR(c.creditCents)}</b>
                    <Badge
                      className={
                        c.creditStatus === "issued" ? "bg-[#dcefdc] text-forest" : c.creditStatus === "proposed" ? "bg-[#f6e6c4] text-[#7a5410]" : "bg-stone-200 text-stone-600"
                      }
                    >
                      {c.creditStatus === "issued" ? "Disponible" : c.creditStatus === "proposed" ? "Proposé" : "Utilisé"}
                    </Badge>
                  </span>
                </li>
              ))}
            </ul>
          </Block>
          <Block title="Consignes">
            <Rows
              rows={[
                ["Bac isotherme · CMD-9003", "5,00 € — à rapporter"],
                ["Bac isotherme · CMD-2452", "5,00 € — remboursé le 31 oct. 2026"],
                ["Rappel fraîcheur", "Conservez vos produits entre 0°C et +4°C"],
              ]}
            />
          </Block>
          <div id="garantie">
            <Block title="Garantie fraîcheur">
              <p className="flex gap-2 text-[15px]">
                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-forest" />
                Si un produit ne vous donne pas satisfaction avant sa DLC, signalez-le avec une photo : l&apos;atelier vérifie la traçabilité du lot et vous propose
                un avoir, un remplacement ou un remboursement sous 24h.
              </p>
            </Block>
          </div>
        </div>
      );
    },
  },
  abonnements: {
    title: "Abonnements",
    intro: "Votre colis du mois, préparé par l'atelier et prêt au retrait le premier samedi.",
    render: () => (
      <Block title={subscription.name} action={<Badge className="bg-forest text-white">Actif</Badge>}>
        <Rows
          rows={[
            ["Rythme", subscription.cadence],
            ["Prochain colis", formatLongDate(subscription.nextDate)],
            ["Prix", `${formatEUR(subscription.priceCents)} / mois`],
            ["Contenu", subscription.content.join(" · ")],
          ]}
        />
        <div className="mt-3 flex flex-wrap gap-2">{callShop}</div>
      </Block>
    ),
  },
  paiements: {
    title: "Paiements",
    intro: "Moyens de paiement enregistrés et historique des acomptes.",
    render: async () => {
      const orders = await listOrders();
      return (
        <div className="space-y-4">
          <Block title="Moyen de paiement">
            <Rows rows={[["Carte bancaire", "Visa •••• 4242 — exp. 09/28"], ["Titres-restaurant", "Acceptés au comptoir"]]} />
          </Block>
          <Block title="Acomptes et règlements">
            <Rows rows={orders.map((o) => [`${o.ref} · ${formatDate(o.placedAt)}`, `${formatEUR(o.paidCents)} / ${formatEUR(o.totalCents)}`] as [string, string])} />
          </Block>
        </div>
      );
    },
  },
  preferences: {
    title: "Préférences",
    intro: "Comment le comptoir vous contacte et prépare vos retraits.",
    render: () => (
      <Block title="Préférences générales">
        <PrefToggle id="sms" label="SMS quand la commande est prête" defaultOn />
        <PrefToggle id="paper" label="Ticket papier au comptoir" hint="Sinon, uniquement par e-mail" defaultOn={false} />
        <PrefToggle id="substitution" label="Accepter une pièce équivalente si rupture" defaultOn />
      </Block>
    ),
  },
  atelier: {
    title: "Préférences d'atelier",
    intro: "L'atelier prépare vos pièces en suivant ces indications. Le jour du retrait, votre boucher les confirme avec vous.",
    render: () => (
      <Block title="Vos tailles & découpes" action={callShop}>
        <ul className="list-disc space-y-2 pl-5 text-[15px]">
          {atelierPreferences.map((p) => (
            <li key={p.id}>{p.label}</li>
          ))}
        </ul>
      </Block>
    ),
  },
  foyer: {
    title: "Foyer",
    intro: "Pour ajuster les quantités conseillées et les portions.",
    render: () => (
      <Block title="Composition" action={callShop}>
        <Rows rows={[["Personnes", `${customer.householdSize}`], ["Régime", "Aucune restriction"], ["Portion conseillée", "180 g par adulte"]]} />
      </Block>
    ),
  },
  adresses: {
    title: "Adresses",
    intro: "Adresse de livraison et boutique de retrait habituelle.",
    render: () => (
      <Block title="Carnet d'adresses" action={callShop}>
        <Rows rows={[["Domicile (livraison)", customer.address], ["Boutique de retrait", shop.location], ["Téléphone", customer.phone]]} />
      </Block>
    ),
  },
  notifications: {
    title: "Notifications",
    intro: "Choisissez ce que l'atelier vous envoie.",
    render: () => (
      <Block title="Canaux">
        <PrefToggle id="n_ready" label="Commande prête" hint="SMS + e-mail" defaultOn />
        <PrefToggle id="n_claim" label="Réponses aux réclamations" hint="E-mail" defaultOn />
        <PrefToggle id="n_arrivals" label="Arrivages et pièces rares" hint="E-mail hebdomadaire" defaultOn={false} />
        <PrefToggle id="n_loyalty" label="Points fidélité crédités" defaultOn />
      </Block>
    ),
  },
  securite: {
    title: "Sécurité & accès",
    intro: "Identifiants et appareils connectés à votre espace.",
    render: () => (
      <Block title="Connexion">
        <Rows rows={[["E-mail", customer.email], ["Mot de passe", "Modifié il y a 3 mois"], ["Double authentification", "Par SMS — activée"], ["Dernière connexion", "Aujourd'hui · Sannois"]]} />
      </Block>
    ),
  },
  professionnel: {
    title: "Compte professionnel",
    intro: "Restaurateurs et traiteurs : bons de commande, facturation mensuelle et tarifs dédiés.",
    render: () => (
      <Block title={customer.accountType}>
        <p className="text-[15px]">
          Vous disposez d&apos;un compte particulier. Pour passer en compte professionnel, munissez-vous de votre SIRET et contactez le comptoir.
        </p>
        <a href={`mailto:${shop.email}?subject=Compte%20professionnel`} className={cn(btn.primarySm, "mt-3")}>
          Demander l&apos;ouverture
        </a>
      </Block>
    ),
  },
  "vie-privee": {
    title: "Vie privée",
    intro: "Vos données restent chez nous : elles servent uniquement à préparer vos commandes.",
    render: () => (
      <div className="space-y-4">
        <Block title="Vos données">
          <PrefToggle id="analytics" label="Mesure d'audience anonyme" defaultOn={false} />
          <a href={`mailto:${shop.email}?subject=Export%20RGPD`} className={cn(btn.outline, "mt-2")}>
            Demander l&apos;export de mes données
          </a>
        </Block>
        <div id="conditions">
          <Block title="Conditions de rétractation et d'annulation">
            <p className="text-[15px]">
              Les denrées périssables préparées à la demande sont exclues du droit de rétractation (art. L221-28 du Code de la consommation). Une commande peut
              être annulée sans frais tant que la découpe n&apos;a pas commencé ; l&apos;acompte est alors remboursé sous 5 jours ouvrés.
            </p>
          </Block>
        </div>
      </div>
    ),
  },
};

type Props = { params: Promise<{ section: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { section } = await params;
  return { title: sections[section]?.title ?? "Espace client" };
}

export default async function SectionPage({ params }: Props) {
  const { section } = await params;
  const def = sections[section];
  if (!def) notFound();
  return (
    <div className="space-y-4">
      <div>
        <PageTitle>{def.title}</PageTitle>
        <p className="mt-1 text-[15px]">{def.intro}</p>
      </div>
      {await def.render()}
    </div>
  );
}
