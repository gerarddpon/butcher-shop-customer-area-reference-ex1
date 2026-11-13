"use client";

import { btn } from "@/components/ui";

export default function CompteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="rounded-xl border border-[#d8b4a8] bg-[#fbefe9] p-8 text-center">
      <h1 className="font-serif text-2xl font-bold">Le comptoir ne répond pas</h1>
      <p className="mt-2 text-[15px]">Nos services sont momentanément indisponibles. Vos commandes et documents ne sont pas affectés.</p>
      <button type="button" onClick={reset} className={`${btn.primary} mt-4`}>
        Réessayer
      </button>
    </div>
  );
}
