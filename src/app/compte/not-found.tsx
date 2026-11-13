import Link from "next/link";
import { btn } from "@/components/ui";

export default function CompteNotFound() {
  return (
    <div className="rounded-xl border border-dashed border-[#c9bda6] bg-white/70 p-10 text-center">
      <h1 className="font-serif text-3xl font-bold">Introuvable</h1>
      <p className="mt-2 text-[15px]">Ce dossier ou cette commande n&apos;existe pas, ou n&apos;est pas rattaché à votre compte.</p>
      <div className="mt-4 flex justify-center gap-2">
        <Link href="/compte" className={btn.primary}>
          Vue d&apos;ensemble
        </Link>
        <Link href="/compte/commandes" className={btn.outline}>
          Mes commandes
        </Link>
      </div>
    </div>
  );
}
