"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/toast";

export function PrefToggle({ id, label, hint, defaultOn }: { id: string; label: string; hint?: string; defaultOn: boolean }) {
  const [on, setOn] = useState(defaultOn);
  const toast = useToast();
  useEffect(() => {
    try {
      const v = localStorage.getItem(`ma_pref_${id}`);
      if (v !== null) setOn(v === "1");
    } catch {}
  }, [id]);
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div>
        <p className="text-[15px] font-medium">{label}</p>
        {hint && <p className="text-[13px] text-muted">{hint}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={() => {
          const next = !on;
          setOn(next);
          try {
            localStorage.setItem(`ma_pref_${id}`, next ? "1" : "0");
          } catch {}
          toast(`${label} : ${next ? "activé" : "désactivé"}`);
        }}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? "bg-burgundy" : "bg-[#cfc6b6]"}`}
      >
        <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
      </button>
    </div>
  );
}
