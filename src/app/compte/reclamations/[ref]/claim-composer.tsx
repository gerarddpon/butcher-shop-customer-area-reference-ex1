"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { useToast } from "@/components/toast";
import { postClaimMessageAction } from "../../actions";

export function ClaimComposer({ claimRef, closed }: { claimRef: string; closed: boolean }) {
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();

  if (closed) {
    return <p className="mt-4 rounded-md bg-sand-2 p-3 text-sm">Ce dossier est clôturé. Pour un nouveau souci, ouvrez une nouvelle réclamation.</p>;
  }
  return (
    <form
      className="mt-4 border-t border-line pt-3"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await postClaimMessageAction(claimRef, body);
          toast(res.message, res.ok ? "success" : "error");
          if (res.ok) {
            setBody("");
            router.refresh();
          }
        });
      }}
    >
      <label htmlFor="claim-msg" className="sr-only">
        Votre message
      </label>
      <textarea
        id="claim-msg"
        rows={3}
        value={body}
        onChange={(e) => setBody(e.target.value.slice(0, 1000))}
        placeholder="Répondre à l'atelier…"
        className="w-full rounded-md border border-[#bdb3a3] bg-white px-3 py-2 text-[15px] focus:border-burgundy focus:outline-none focus:ring-2 focus:ring-burgundy/20"
      />
      <div className="mt-1 flex items-center justify-between">
        <span className="text-[12px] text-muted">{body.length}/1000</span>
        <button
          type="submit"
          disabled={pending || body.trim().length < 2}
          className="inline-flex items-center gap-2 rounded-md bg-navy px-4 py-1.5 text-sm font-medium text-white hover:bg-[#13203f] disabled:opacity-50"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Envoyer
        </button>
      </div>
    </form>
  );
}
