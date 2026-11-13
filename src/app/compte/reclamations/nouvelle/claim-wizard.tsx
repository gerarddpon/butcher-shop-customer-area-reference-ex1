"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Check, ChevronLeft, ChevronRight, History, Loader2, Upload, X } from "lucide-react";
import { ProductThumb, btn, inputCls } from "@/components/ui";
import { useToast } from "@/components/toast";
import { createClaimAction } from "../../actions";
import { cn } from "@/lib/format";

export type WizardOrder = {
  ref: string;
  dateLabel: string;
  items: { productId: string; label: string; weight: string; lot: string; dlcLabel: string }[];
};

type ItemForm = { reason: string; quantity: string; description: string };
type LocalFile = { id: string; file: File; preview: string };

const STEPS = [
  { label: "Commande et Article", icon: Check },
  { label: "Problème et Photos", icon: Camera },
  { label: "Résolution", icon: History },
];

function Stepper({ step }: { step: number }) {
  return (
    <ol className="mx-auto mt-4 grid max-w-2xl grid-cols-3">
      {STEPS.map((s, i) => {
        const done = i < step;
        const current = i === step;
        const Icon = done ? Check : s.icon;
        return (
          <li key={s.label} className="relative flex flex-col items-center text-center">
            {i > 0 && <span className={cn("absolute right-1/2 top-[18px] h-0.5 w-[calc(100%-44px)] -translate-x-[22px]", i <= step ? "bg-burgundy" : "bg-[#cfc6b6]")} />}
            <span
              className={cn(
                "relative z-10 flex size-9 items-center justify-center rounded-full",
                done || current ? "bg-burgundy text-white" : "border-2 border-[#cfc6b6] bg-cream text-[#a49b8d]",
              )}
            >
              <Icon className="size-[18px]" strokeWidth={2} />
            </span>
            <span className={cn("mt-1.5 text-[16px]", current ? "font-bold" : "font-normal", !done && !current && "text-ink/80")}>{s.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

function Box({ checked }: { checked: boolean }) {
  return (
    <span
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded-[3px] border",
        checked ? "border-burgundy bg-burgundy text-white" : "border-[#8d857a] bg-white",
      )}
    >
      {checked && <X className="size-3.5" strokeWidth={3} />}
    </span>
  );
}

export function ClaimWizard({
  orders,
  initialRef,
  reasons,
  resolutions,
  maxFiles,
  maxMb,
  slaHours,
}: {
  orders: WizardOrder[];
  initialRef: string | null;
  reasons: { key: string; label: string }[];
  resolutions: { key: string; label: string; hint: string }[];
  maxFiles: number;
  maxMb: number;
  slaHours: number;
}) {
  const [step, setStep] = useState(initialRef ? 1 : 0);
  const [orderRef, setOrderRef] = useState(initialRef ?? orders[0].ref);
  const order = useMemo(() => orders.find((o) => o.ref === orderRef) ?? orders[0], [orders, orderRef]);
  const [selected, setSelected] = useState<string[]>([]);
  const [forms, setForms] = useState<Record<string, ItemForm>>({});
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [resolution, setResolution] = useState(resolutions[0].key);
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();

  const filesRef = useRef<LocalFile[]>([]);
  filesRef.current = files;
  useEffect(() => () => filesRef.current.forEach((f) => URL.revokeObjectURL(f.preview)), []);

  const formFor = (productId: string): ItemForm => {
    const item = order.items.find((i) => i.productId === productId);
    return forms[productId] ?? { reason: "", quantity: item?.weight ?? "", description: "" };
  };
  const patch = (productId: string, p: Partial<ItemForm>) => setForms((f) => ({ ...f, [productId]: { ...formFor(productId), ...p } }));

  const toggleItem = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const incoming = Array.from(list);
    const errors: string[] = [];
    const accepted: LocalFile[] = [];
    for (const file of incoming) {
      if (files.length + accepted.length >= maxFiles) {
        errors.push(`Maximum ${maxFiles} photos.`);
        break;
      }
      if (!file.type.startsWith("image/")) errors.push(`« ${file.name} » n'est pas une image.`);
      else if (file.size > maxMb * 1024 * 1024) errors.push(`« ${file.name} » dépasse ${maxMb} Mo.`);
      else accepted.push({ id: `${file.name}-${file.size}-${Math.random()}`, file, preview: URL.createObjectURL(file) });
    }
    if (errors.length) toast(errors[0], "error");
    setFiles((f) => [...f, ...accepted]);
  };

  const validateStep2 = (): string | null => {
    if (selected.length === 0) return "Sélectionnez au moins un article concerné.";
    for (const id of selected) {
      const f = formFor(id);
      const label = order.items.find((i) => i.productId === id)?.label ?? id;
      if (!f.reason) return `Choisissez le type de problème pour « ${label} ».`;
      if (f.description.trim().length < 10) return `Décrivez le problème pour « ${label} » (10 caractères minimum).`;
      if (f.reason === "fraicheur" && files.length === 0) return "Une photo est indispensable pour un problème de fraîcheur.";
    }
    return null;
  };

  const next = () => {
    if (step === 1) {
      const err = validateStep2();
      if (err) return toast(err, "error");
    }
    setStep((s) => Math.min(2, s + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = () =>
    start(async () => {
      const res = await createClaimAction({
        orderRef: order.ref,
        items: selected.map((id) => ({ productId: id, ...formFor(id) })),
        resolutionPref: resolution,
        files: files.map((f) => ({ name: f.file.name, size: f.file.size, type: f.file.type })),
      });
      toast(res.message, res.ok ? "success" : "error");
      if (res.ok && res.redirectTo) router.push(res.redirectTo);
    });

  return (
    <div>
      <Stepper step={step} />

      {step === 0 && (
        <section className="mt-5 rounded-xl border border-line bg-white p-4 shadow-card">
          <h2 className="text-[22px] font-medium">Quelle commande est concernée ?</h2>
          <p className="text-sm text-muted">Seules les commandes retirées ou livrées peuvent faire l&apos;objet d&apos;une réclamation.</p>
          <ul className="mt-3 divide-y divide-line">
            {orders.map((o) => (
              <li key={o.ref}>
                <label className="flex cursor-pointer items-center gap-3 py-3">
                  <input
                    type="radio"
                    name="order"
                    className="size-4 accent-burgundy"
                    checked={orderRef === o.ref}
                    onChange={() => {
                      setOrderRef(o.ref);
                      setSelected([]);
                      setForms({});
                    }}
                  />
                  <div className="flex -space-x-3">
                    {o.items.slice(0, 3).map((i) => (
                      <ProductThumb key={i.productId} productId={i.productId} size={44} className="ring-2 ring-white" />
                    ))}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[17px] font-semibold">{o.ref}</p>
                    <p className="truncate text-sm">
                      {o.dateLabel} · {o.items.map((i) => i.label).join(", ")}
                    </p>
                  </div>
                </label>
              </li>
            ))}
          </ul>
        </section>
      )}

      {step === 1 && (
        <>
          <section className="mt-5 rounded-xl border border-line bg-white p-3.5 shadow-card">
            <h2 className="text-[22px] font-medium">{order.ref}</h2>
            <ul className="mt-1 divide-y divide-line">
              {order.items.map((i) => {
                const checked = selected.includes(i.productId);
                return (
                  <li key={i.productId}>
                    <button type="button" onClick={() => toggleItem(i.productId)} aria-pressed={checked} className="flex w-full items-center gap-3 py-2.5 text-left">
                      <Box checked={checked} />
                      <ProductThumb productId={i.productId} size={54} />
                      <span className="text-[17px] leading-snug">
                        {i.label}
                        {i.weight && ` • ${i.weight}`}
                        <br />
                        <span className="text-[16px]">
                          Lot : {i.lot} | DLC : {i.dlcLabel}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          {selected.map((id) => {
            const item = order.items.find((i) => i.productId === id);
            if (!item) return null;
            const f = formFor(id);
            const unit = item.weight.match(/(kg|g)$/)?.[1] ?? "";
            return (
              <section key={id} className="mt-3 rounded-xl border border-line bg-white p-3.5 shadow-card">
                <h3 className="text-[22px] font-medium">{item.label}</h3>
                <p className="mb-1 mt-2 text-[16px] font-semibold">Type de problème</p>
                <div role="radiogroup" className="rounded-md border border-ink/80 p-1">
                  {reasons.map((r) => {
                    const on = f.reason === r.key;
                    return (
                      <button
                        key={r.key}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => patch(id, { reason: r.key })}
                        className={cn("flex w-full items-center gap-2 rounded px-1.5 py-0.5 text-left text-[16px]", on ? "bg-[#7a675f] text-white" : "hover:bg-sand-2")}
                      >
                        <span className={cn("flex size-4 items-center justify-center rounded-[2px] border", on ? "border-white bg-white/10" : "border-[#8d857a] bg-white")}>
                          {on && <X className="size-3" strokeWidth={3} />}
                        </span>
                        {r.label}
                      </button>
                    );
                  })}
                </div>
                <label htmlFor={`qty-${id}`} className="mb-1 mt-3 block text-[16px] font-semibold">
                  Poids ou quantité concernée
                </label>
                <div className="relative">
                  <input id={`qty-${id}`} value={f.quantity} onChange={(e) => patch(id, { quantity: e.target.value })} className={cn(inputCls, "pr-8")} />
                  {unit && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[15px]">{unit}</span>}
                </div>
                <label htmlFor={`desc-${id}`} className="mb-1 mt-3 block text-[16px] font-semibold">
                  Description détaillée
                </label>
                <textarea
                  id={`desc-${id}`}
                  rows={3}
                  value={f.description}
                  onChange={(e) => patch(id, { description: e.target.value.slice(0, 1000) })}
                  placeholder="Précisez votre demande ici..."
                  className={inputCls}
                />
                <p className="text-right text-[13px]">{f.description.length}/1000</p>
              </section>
            );
          })}

          <section className="mt-3 rounded-xl border border-line bg-white p-3.5 shadow-card">
            <p className="mb-1.5 text-[16px] font-semibold">Joindre des photos (crucial pour les problèmes de fraîcheur)</p>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => fileInput.current?.click()} className="inline-flex items-center gap-2 rounded-md bg-burgundy-dark px-3 py-1.5 text-[15px] text-white hover:bg-burgundy">
                <Upload className="size-4" /> Joindre un fichier
              </button>
              <span className="text-[15px]">
                Max {maxFiles} photos, {maxMb}Mo
              </span>
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>
            {files.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
                {files.map((f) => (
                  <li key={f.id} className="flex items-center gap-2 rounded-md bg-[#e9ebe4] pr-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.preview} alt="" className="size-12 rounded-l-md object-cover" />
                    <span className="max-w-[160px] truncate text-[15px]">{f.file.name}</span>
                    <button type="button" aria-label={`Retirer ${f.file.name}`} onClick={() => {
                        URL.revokeObjectURL(f.preview);
                        setFiles((all) => all.filter((x) => x.id !== f.id));
                      }}>
                      <X className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                addFiles(e.dataTransfer.files);
              }}
              className={cn(
                "mt-3 flex h-20 w-full flex-col items-center justify-center rounded-md border border-dashed border-[#a39883] text-[13px] text-muted transition",
                dragOver ? "bg-sand" : "bg-sand-2/70 hover:bg-sand-2",
              )}
            >
              <Upload className="size-5 text-ink" />
              <span className="mt-1">Glissez vos photos ici</span>
            </button>
          </section>
        </>
      )}

      {step === 2 && (
        <>
          <section className="mt-5 rounded-xl border border-line bg-white p-4 shadow-card">
            <h2 className="text-[22px] font-medium">Quelle résolution préférez-vous ?</h2>
            <p className="text-sm text-muted">L&apos;atelier valide la solution après analyse. Votre préférence est prise en compte en priorité.</p>
            <div className="mt-3 space-y-2">
              {resolutions.map((r) => (
                <label
                  key={r.key}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition",
                    resolution === r.key ? "border-burgundy bg-[#f8f1ee]" : "border-line hover:bg-sand-2",
                  )}
                >
                  <input type="radio" name="resolution" className="mt-1 size-4 accent-burgundy" checked={resolution === r.key} onChange={() => setResolution(r.key)} />
                  <span>
                    <span className="block text-[16px] font-semibold">{r.label}</span>
                    <span className="text-sm text-muted">{r.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </section>
          <section className="mt-3 rounded-xl border border-line bg-white p-4 shadow-card">
            <h3 className="text-lg font-semibold">Récapitulatif · {order.ref}</h3>
            <ul className="mt-2 divide-y divide-line">
              {selected.map((id) => {
                const item = order.items.find((i) => i.productId === id);
                const f = formFor(id);
                return (
                  <li key={id} className="flex gap-3 py-2.5">
                    <ProductThumb productId={id} size={48} />
                    <div className="min-w-0 text-[15px]">
                      <p className="font-medium">
                        {item?.label} · {f.quantity}
                      </p>
                      <p>{reasons.find((r) => r.key === f.reason)?.label}</p>
                      <p className="line-clamp-2 text-muted">{f.description}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="mt-1 text-sm">
              {files.length} photo{files.length > 1 ? "s" : ""} jointe{files.length > 1 ? "s" : ""}
            </p>
          </section>
        </>
      )}

      <div className="mt-4 flex items-center justify-between">
        {step > 0 ? (
          <button type="button" className={btn.outline} onClick={() => setStep((s) => s - 1)}>
            <ChevronLeft className="size-4" /> Étape précédente
          </button>
        ) : (
          <span />
        )}
        {step < 2 ? (
          <button type="button" className={btn.primary} onClick={next}>
            Continuer <ChevronRight className="size-4" />
          </button>
        ) : (
          <button type="button" className={btn.primary} onClick={submit} disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />} Envoyer ma réclamation
          </button>
        )}
      </div>

      <p className="mt-4 text-[12px] font-semibold leading-snug">
        Les éléments détaillés de votre réclamation seront analysés par l&apos;atelier. Une réponse vous sera apportée dans la messagerie du client sous {slaHours}h.
        Le cas échéant, la traçabilité des lots et les justificatifs seront indispensables.
      </p>
    </div>
  );
}
