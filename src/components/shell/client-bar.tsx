"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Plus } from "lucide-react";
import { signOutAction } from "@/app/compte/actions";
import { useToast } from "../toast";

export function ReadingComfortToggle() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    setOn(document.documentElement.classList.contains("reading-comfort"));
  }, []);
  const toggle = () => {
    const next = !on;
    setOn(next);
    document.documentElement.classList.toggle("reading-comfort", next);
    try {
      localStorage.setItem("ma_reading_comfort", next ? "1" : "0");
    } catch {}
  };
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={toggle}
      className="inline-flex items-center gap-2 rounded-md border border-[#cdbfa6] bg-[#f7f1e5] px-2.5 py-1 text-[13px] font-semibold text-ink shadow-sm hover:bg-white"
    >
      <Plus className="size-3.5" /> Confort de lecture
      <span className={`relative h-4 w-7 rounded-full transition ${on ? "bg-burgundy" : "bg-[#cfc6b6]"}`}>
        <span className={`absolute top-0.5 size-3 rounded-full bg-white shadow transition-all ${on ? "left-3.5" : "left-0.5"}`} />
      </span>
    </button>
  );
}

export function ClientBar({ firstName, email }: { firstName: string; email: string }) {
  const router = useRouter();
  const toast = useToast();
  return (
    <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-3 px-4 pb-4 pt-5 md:px-8">
      <p className="text-[13px] font-semibold uppercase tracking-wide text-ink">
        Espace client — <span className="normal-case">Bonjour {firstName} ({email})</span>
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <ReadingComfortToggle />
        <Link
          href="/boutique"
          className="inline-flex items-center gap-1.5 rounded-md border border-[#cdbfa6] bg-[#f7f1e5] px-2.5 py-1 text-[13px] font-semibold text-ink shadow-sm hover:bg-white"
        >
          <Plus className="size-3.5" /> Composer une commande
        </Link>
        <button
          type="button"
          onClick={async () => {
            const res = await signOutAction();
            toast(res.message);
            router.push(res.redirectTo ?? "/compte");
            router.refresh();
          }}
          className="inline-flex items-center gap-1.5 rounded-md border border-[#cdbfa6] bg-[#f7f1e5] px-2.5 py-1 text-[13px] font-semibold text-ink shadow-sm hover:bg-white"
        >
          <LogOut className="size-3.5" /> Se déconnecter
        </button>
      </div>
    </div>
  );
}
