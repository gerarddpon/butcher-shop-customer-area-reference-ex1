/**
 * Static reference data — would come from the shop's catalogue / CRM services.
 */

export type Product = {
  id: string;
  name: string;
  image: string | null;
  origin: string;
  conservation: string;
  allergens: string;
  tipTitle: string;
  tip: string;
  unitLabel: string;
  priceCents: number;
};

export const products: Record<string, Product> = {
  "cote-boeuf": {
    id: "cote-boeuf",
    name: "Côte de bœuf maturée",
    image: "/images/products/cote-de-boeuf.jpg",
    origin: "France (Val-d'Oise)",
    conservation: "0°C à +4°C",
    allergens: "Aucun",
    tipTitle: "Conseils de préparation",
    tip: "Sortez la viande de son emballage sous vide 30 min avant cuisson.",
    unitLabel: "1,2 kg",
    priceCents: 6943,
  },
  "cote-boeuf-28": {
    id: "cote-boeuf-28",
    name: "Côte de bœuf maturée 28 jours",
    image: "/images/products/cote-de-boeuf.jpg",
    origin: "France (Normandie)",
    conservation: "0°C à +4°C",
    allergens: "Aucun",
    tipTitle: "Conseils de cuisson",
    tip: "Saisir 3 min par face puis laisser reposer 10 min sous papier aluminium.",
    unitLabel: "1 kg",
    priceCents: 4836,
  },
  merguez: {
    id: "merguez",
    name: "Merguez maison",
    image: "/images/products/merguez.jpg",
    origin: "France (Val-d'Oise)",
    conservation: "0°C à +4°C",
    allergens: "Aucun",
    tipTitle: "Conseils de cuisson",
    tip: "Grillez-les sur braise ou à la plancha pour une saveur authentique.",
    unitLabel: "800 g",
    priceCents: 2237,
  },
  "roti-veau": {
    id: "roti-veau",
    name: "Rôti de veau fermier ficelé",
    image: "/images/products/roti-veau.jpg",
    origin: "France (Corrèze)",
    conservation: "0°C à +4°C",
    allergens: "Aucun",
    tipTitle: "Conseils de cuisson",
    tip: "Four à 180°C, 25 min par livre, arroser régulièrement avec le jus.",
    unitLabel: "1 kg",
    priceCents: 3776,
  },
  magret: {
    id: "magret",
    name: "Magret de canard du Sud-Ouest",
    image: "/images/products/magret.jpg",
    origin: "France (Gers)",
    conservation: "0°C à +4°C",
    allergens: "Aucun",
    tipTitle: "Conseils de cuisson",
    tip: "Quadriller la peau, démarrer côté gras à froid, 8 min puis 4 min côté chair.",
    unitLabel: "400 g",
    priceCents: 1690,
  },
  "carte-cadeau": {
    id: "carte-cadeau",
    name: "Carte cadeau Maison Annoix - 50 €",
    image: null,
    origin: "—",
    conservation: "—",
    allergens: "—",
    tipTitle: "Bon à savoir",
    tip: "Valable 12 mois en boutique et sur le site.",
    unitLabel: "",
    priceCents: 5000,
  },
};

export function getProduct(id: string): Product | undefined {
  return products[id];
}

export const customer = {
  id: "cus_marie_dupont",
  firstName: "Marie",
  lastName: "Dupont",
  email: "marie.dupont@email.fr",
  phone: "06 12 34 56 78",
  since: "2024-11-08",
  tier: "Client fidèle",
  retrievalsOnTime: 3,
  address: "12 rue des Vignes, 95110 Sannois",
  householdSize: 4,
  accountType: "Compte particulier",
};

export const atelierPreferences = [
  { id: "hache", label: "Haché menu au couteau (jamais pré-haché). Éviter les préparations avec crème." },
  { id: "rotir", label: "Cuisse saignante à rôtir (avec os, ficelée). Envoyer les tranches à 2 cm pour le gril." },
  { id: "epaisseur", label: "25 mm, parée, ficelée, salée, au point à fond" },
  { id: "volaille", label: "Sans gras, désossée, ficelée, sous-vide" },
];

export const subscription = {
  name: "Colis du mois · Famille",
  cadence: "Mensuel, 1er samedi du mois",
  nextDate: "2026-11-07",
  priceCents: 6900,
  content: ["Côte de bœuf maturée", "Merguez maison", "Volaille fermière", "Surprise de l'atelier"],
  status: "actif" as const,
};

export const shopNav = [
  { label: "Boutique", href: "/boutique", dropdown: true },
  { label: "Suivre", href: "/compte/commandes" },
  { label: "Atelier", href: "/compte/atelier" },
  { label: "La maison", href: "/boutique#maison" },
  { label: "À propos", href: "/boutique#apropos" },
];
