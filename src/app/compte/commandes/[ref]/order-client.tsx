"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Loader2 } from "lucide-react";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast";
import { btn, inputCls } from "@/components/ui";
import { changeSlotAction, sendOrderMessageAction } from "../../actions";

export function SlotChanger({
  orderRef,
  currentDate,
  currentSlot,
  minDate,
  slots,
  disabledReason,
}: {
  orderRef: string;
  currentDate: string;
  currentSlot: string;
  minDate: string;
  slots: string[];
  disabledReason?: string;
}) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(currentDate);
  const [slot, setSlot] = useState(currentSlot);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  return (
    <>
      <button id="creneau" type="button" className={btn.slate} disabled={!!disabledReason} onClick={() => setOpen(true)} title={disabledReason}>
        <CalendarDays className="size-4 shrink-0" />
        <span className="leading-tight">
          Modifier le créneau de retrait
          <span className="block text-[11px] opacity-80">{disabledReason ?? "Possible jusqu'à 24h avant le retrait"}</span>
        </span>
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Modifier le créneau">
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const res = await changeSlotAction(orderRef, date, slot);
              toast(res.message, res.ok ? "success" : "error");
              if (res.ok) {
                setOpen(false);
                router.refresh();
              }
            });
          }}
        >
          <div>
            <label htmlFor="slot-date" className="mb-1 block text-sm font-semibold">
              Jour de retrait
            </label>
            <input id="slot-date" type="date" min={minDate} value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} required />
          </div>
          <fieldset>
            <legend className="mb-1 text-sm font-semibold">Créneau</legend>
            <div className="grid grid-cols-2 gap-2">
              {slots.map((s) => (
                <label
                  key={s}
                  className={`cursor-pointer rounded-md border px-3 py-2 text-center text-sm ${slot === s ? "border-burgundy bg-burgundy text-white" : "border-[#c9bda6] bg-white hover:bg-sand-2"}`}
                >
                  <input type="radio" name="slot" value={s} checked={slot === s} onChange={() => setSlot(s)} className="sr-only" />
                  {s.replace("-", " – ").replace(/:/g, "h")}
                </label>
              ))}
            </div>
          </fieldset>
          <p className="text-[12px] text-muted">La boutique de Sannois est ouverte du mardi au samedi. Un e-mail confirme le nouveau créneau.</p>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className={btn.outline} onClick={() => setOpen(false)}>
              Annuler
            </button>
            <button type="submit" className={btn.primary} disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />} Confirmer
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function OrderMessageButton({ orderRef }: { orderRef: string }) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  return (
    <>
      <button type="button" className={`${btn.primarySm} mt-2 w-full rounded-md`} onClick={() => setOpen(true)}>
        Envoyer un message à l&apos;atelier
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={`Message · ${orderRef}`}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const res = await sendOrderMessageAction(orderRef, body);
              toast(res.message, res.ok ? "success" : "error");
              if (res.ok) {
                setBody("");
                setOpen(false);
                router.refresh();
              }
            });
          }}
        >
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, 1000))}
            rows={5}
            placeholder="Une précision sur la découpe, un changement de dernière minute…"
            className={inputCls}
            required
          />
          <p className="mt-1 text-right text-[12px] text-muted">{body.length}/1000</p>
          <div className="mt-2 flex justify-end gap-2">
            <button type="button" className={btn.outline} onClick={() => setOpen(false)}>
              Annuler
            </button>
            <button type="submit" className={btn.primary} disabled={pending || body.trim().length < 3}>
              {pending && <Loader2 className="size-4 animate-spin" />} Envoyer
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
