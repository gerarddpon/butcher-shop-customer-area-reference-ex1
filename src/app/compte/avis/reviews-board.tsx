"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Star, X } from "lucide-react";
import type { Review } from "@/db/schema";
import { ProductThumb, Stars, btn } from "@/components/ui";
import { useToast } from "@/components/toast";
import { ActionButton } from "@/components/action-button";
import { deleteReviewAction, publishReviewAction } from "../actions";
import { cn, formatDate } from "@/lib/format";

function StarInput({ value, onChange, size = 30 }: { value: number; onChange: (v: number) => void; size?: number }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="inline-flex gap-1" role="radiogroup" aria-label="Note" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={value === i}
          aria-label={`${i} étoile${i > 1 ? "s" : ""}`}
          onMouseEnter={() => setHover(i)}
          onClick={() => onChange(i)}
          className="transition hover:scale-110"
        >
          <Star style={{ width: size, height: size }} strokeWidth={1.3} className={i <= shown ? "fill-[#b8913e] text-[#9a7630]" : "fill-transparent text-ink/70"} />
        </button>
      ))}
    </div>
  );
}

type Draft = { review: Review; rating: number; criteria: string[]; comment: string; anonymous: boolean };

function ReviewDrawer({
  draft,
  onClose,
  criteriaList,
  reward,
  displayName,
}: {
  draft: Draft;
  onClose: () => void;
  criteriaList: string[];
  reward: number;
  displayName: string;
}) {
  const [rating, setRating] = useState(draft.rating);
  const [criteria, setCriteria] = useState<string[]>(draft.criteria);
  const [comment, setComment] = useState(draft.comment);
  const [anonymous, setAnonymous] = useState(draft.anonymous);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const isEdit = draft.review.status === "published";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const submit = () =>
    start(async () => {
      const res = await publishReviewAction({ id: draft.review.id, rating, criteria, comment, anonymous });
      toast(res.message, res.ok ? "success" : "error");
      if (res.ok) {
        onClose();
        router.refresh();
      }
    });

  return (
    <div className="fixed inset-0 z-50">
      <div className="animate-fade absolute inset-0 bg-[#3b3428]/45 backdrop-blur-[1px]" onClick={onClose} />
      <aside role="dialog" aria-modal="true" aria-label="Évaluer ce produit" className="animate-drawer absolute right-0 top-0 flex h-full w-full max-w-[360px] flex-col bg-[#f5efe3] shadow-2xl">
        <div className="flex items-center justify-between px-5 pb-3 pt-5">
          <h2 className="text-[26px] font-medium">{isEdit ? "Modifier mon avis" : "Évaluer ce produit"}</h2>
          <button onClick={onClose} aria-label="Fermer" className="rounded p-1 hover:bg-black/5">
            <X className="size-6" />
          </button>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto px-5 pb-5">
          <div className="flex gap-3 rounded-xl border border-line bg-white p-3 shadow-card">
            <ProductThumb productId={draft.review.productId} size={80} />
            <div className="min-w-0">
              <p className="text-[15px] font-medium leading-snug">{draft.review.productLabel}</p>
              <span className="mt-2 inline-block rounded-full bg-forest px-3 py-1 text-[13px] font-medium text-white">Achat vérifié · {draft.review.orderRef}</span>
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-lg font-medium">Ma note globale</p>
            <StarInput value={rating} onChange={setRating} size={34} />
          </div>
          <div>
            <p className="mb-2 text-lg font-medium">Critères d&apos;atelier</p>
            <div className="flex flex-wrap gap-2">
              {criteriaList.map((c) => {
                const on = criteria.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setCriteria((cur) => (on ? cur.filter((x) => x !== c) : [...cur, c]))}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[15px] transition",
                      on ? "bg-[#dcc396] ring-1 ring-[#b8913e]" : "bg-sand hover:bg-[#e2cfa6]",
                    )}
                  >
                    <Check className={cn("size-4", !on && "invisible")} /> {c}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label htmlFor="review-comment" className="mb-1.5 block text-lg font-medium">
              Mon commentaire (Optionnel)
            </label>
            <textarea
              id="review-comment"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, 800))}
              placeholder="Comment l'avez-vous cuisiné ? La pièce correspondait-elle à vos attentes ?"
              className="w-full rounded-md border border-[#bdb3a3] bg-white px-3 py-2 text-[15px] focus:border-burgundy focus:outline-none"
            />
            <div className="mt-2 flex items-center justify-between text-[15px]">
              <span>Publier sous : {anonymous ? "Client anonyme" : displayName}</span>
              <label className="inline-flex cursor-pointer items-center gap-2">
                <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} className="size-4 accent-burgundy" />
                Garder l&apos;anonymat
              </label>
            </div>
          </div>
          {!isEdit && (
            <div className="flex gap-3 rounded-lg bg-sand p-4">
              <Check className="mt-0.5 size-5 shrink-0" />
              <p className="text-[15px] leading-snug">
                <b>Encart fidélité</b>
                <br />
                <b>+{reward} points fidélité</b> crédités à la publication
              </p>
            </div>
          )}
        </div>
        <div className="space-y-2 border-t border-line bg-white px-5 py-4">
          <button type="button" onClick={submit} disabled={pending || rating === 0} className={cn(btn.primary, "w-full py-2.5")}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            {isEdit ? "Enregistrer les modifications" : `Publier mon avis (+${reward} pts)`}
          </button>
          {rating === 0 && <p className="text-center text-[12px] text-muted">Choisissez une note pour publier.</p>}
          <button type="button" onClick={onClose} className={cn(btn.outline, "w-full py-2.5")}>
            Annuler
          </button>
        </div>
      </aside>
    </div>
  );
}

export function ReviewsBoard({
  pending,
  published,
  average,
  reward,
  criteriaList,
  displayName,
  initialTab,
}: {
  pending: Review[];
  published: Review[];
  average: number;
  reward: number;
  criteriaList: string[];
  displayName: string;
  initialTab: "evaluer" | "publies";
}) {
  const [tab, setTab] = useState<"evaluer" | "publies">(initialTab);
  const [draft, setDraft] = useState<Draft | null>(null);

  const open = (review: Review, rating?: number) =>
    setDraft({
      review,
      rating: rating ?? review.rating ?? 0,
      criteria: review.criteria,
      comment: review.comment,
      anonymous: review.anonymous,
    });

  return (
    <>
      <div className="mt-3 rounded-md bg-sand px-3 py-2 text-[15px]">
        Publiez un avis vérifié et recevez <b>+{reward} points fidélité</b> directement dans votre cagnotte !
      </div>
      <p className="mt-2 text-[15px]">
        {pending.length} article{pending.length > 1 ? "s" : ""} à évaluer · {published.length} avis publiés · Note moyenne donnée :{" "}
        {average.toFixed(1).replace(".", ",")}/5
      </p>
      <div role="tablist" className="mt-3 flex gap-1 border-b border-[#cfc6b6]">
        {(
          [
            ["evaluer", `À évaluer (${pending.length})`],
            ["publies", `Avis publiés (${published.length})`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cn("rounded-t-md px-3 py-1.5 text-[15px] font-medium transition", tab === key ? "bg-burgundy text-white" : "hover:bg-sand-2")}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-3 space-y-3">
        {tab === "evaluer" &&
          (pending.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#c9bda6] bg-white/60 p-8 text-center">
              <p className="font-semibold">Tout est évalué, merci !</p>
              <p className="text-sm text-muted">Vos prochains achats apparaîtront ici après le retrait.</p>
            </div>
          ) : (
            pending.map((r) => (
              <article key={r.id} className="flex gap-3 rounded-xl border border-line bg-white p-3 shadow-card">
                <ProductThumb productId={r.productId} size={72} />
                <div className="min-w-0">
                  <h3 className="text-[17px] font-medium">{r.productLabel}</h3>
                  <p className="text-[13px]">
                    {r.orderRef} · {r.fulfilledLabel}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <StarInput value={0} onChange={(v) => open(r, v)} size={20} />
                    <span className="text-[15px]">Cliquez pour noter</span>
                  </div>
                  <button type="button" onClick={() => open(r)} className={cn(btn.primarySm, "mt-1 rounded-md")}>
                    Évaluer ce produit
                  </button>
                </div>
              </article>
            ))
          ))}

        {tab === "publies" &&
          published.map((r) => (
            <article key={r.id} className="flex gap-3 rounded-xl border border-line bg-white p-3 shadow-card">
              <ProductThumb productId={r.productId} size={72} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-[17px] font-medium">{r.productLabel}</h3>
                    <p className="text-[13px]">
                      {r.orderRef} · {r.fulfilledLabel}
                    </p>
                  </div>
                  <span className="rounded-full bg-forest px-3 py-1 text-[14px] font-semibold text-white">Publié</span>
                </div>
                <Stars value={r.rating ?? 0} size={22} className="mt-0.5" />
                {r.criteria.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {r.criteria.map((c) => (
                      <span key={c} className="rounded-full bg-sand px-3 py-0.5 text-[14px]">
                        {c}
                      </span>
                    ))}
                  </div>
                )}
                {r.comment && <p className="mt-2 text-[15px]">{r.comment}</p>}
                {r.anonymous && <p className="mt-1 text-[12px] text-muted">Publié anonymement</p>}
                {r.replyText && (
                  <div className="mt-2 rounded-md bg-sand-2 px-3 py-2 text-[14px]">
                    <p>
                      <b>Réponse de {r.replyAuthor}</b>
                      {r.replyDate && <i> · {formatDate(r.replyDate)}</i>} :
                    </p>
                    <p>« {r.replyText} »</p>
                  </div>
                )}
                <div className="mt-2 flex items-center gap-3">
                  <button type="button" onClick={() => open(r)} className={btn.primarySm}>
                    Modifier mon avis
                  </button>
                  <ActionButton
                    action={deleteReviewAction.bind(null, r.id)}
                    confirm="Supprimer cet avis ? Il ne sera plus visible sur la fiche produit."
                    className="inline-flex items-center gap-1.5 text-[15px] hover:underline"
                  >
                    Supprimer
                  </ActionButton>
                </div>
              </div>
            </article>
          ))}
      </div>

      {draft && <ReviewDrawer key={draft.review.id} draft={draft} onClose={() => setDraft(null)} criteriaList={criteriaList} reward={reward} displayName={displayName} />}
    </>
  );
}
