import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { ChevronLeft, Gift, Star } from "lucide-react";
import { cn } from "@/lib/format";
import { getProduct } from "@/lib/catalog";

export const btn = {
  primary:
    "inline-flex items-center justify-center gap-2 rounded-full bg-burgundy px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-burgundy-dark disabled:cursor-not-allowed disabled:opacity-50",
  primarySm:
    "inline-flex items-center justify-center gap-1.5 rounded-full bg-burgundy px-3 py-1.5 text-[13px] font-medium text-white transition hover:bg-burgundy-dark disabled:cursor-not-allowed disabled:opacity-50",
  outline:
    "inline-flex items-center justify-center gap-2 rounded-full border border-ink/70 bg-white px-4 py-2 text-sm font-medium text-ink transition hover:bg-sand-2 disabled:opacity-50",
  ghost: "inline-flex items-center gap-1.5 text-sm font-medium text-ink underline-offset-4 hover:underline",
  slate:
    "flex w-full items-center gap-3 rounded-lg bg-[#4b4f55] px-3 py-2.5 text-left text-sm text-white transition hover:bg-[#3b3f45] disabled:cursor-not-allowed disabled:opacity-60",
  chip: "inline-flex items-center gap-1 rounded-md border border-[#c9bda6] bg-sand-2 px-2.5 py-1 text-xs font-semibold text-ink shadow-sm transition hover:bg-sand",
};

export function Card({ children, className, as: Tag = "section" }: { children: ReactNode; className?: string; as?: "section" | "div" | "article" }) {
  return <Tag className={cn("rounded-xl border border-line bg-white shadow-card", className)}>{children}</Tag>;
}

export function Parchment({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn("parchment p-4", className)}>
      {children}
      <Stamp />
    </section>
  );
}

export function Stamp() {
  return (
    <svg className="parchment-stamp" viewBox="0 0 40 40" aria-hidden>
      <circle cx="20" cy="20" r="17" fill="none" stroke="#5a4320" strokeWidth="1.5" />
      <circle cx="20" cy="20" r="12.5" fill="none" stroke="#5a4320" strokeWidth="0.8" strokeDasharray="2 1.5" />
      <text x="20" y="22.5" textAnchor="middle" fontSize="6.5" fontFamily="serif" fill="#5a4320" fontWeight="700">
        MA
      </text>
    </svg>
  );
}

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center whitespace-nowrap rounded-md px-2 py-0.5 text-[13px] font-medium", className)}>{children}</span>;
}

export function PageTitle({ children, serif = true, className }: { children: ReactNode; serif?: boolean; className?: string }) {
  return (
    <h1 className={cn(serif ? "font-serif text-[34px] font-bold tracking-tight" : "text-[32px] font-bold tracking-tight", "leading-tight text-ink", className)}>
      {children}
    </h1>
  );
}

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="mb-2 inline-flex items-center gap-1 text-[15px] text-ink hover:underline">
      <ChevronLeft className="size-4" />
      {children}
    </Link>
  );
}

export function ProductThumb({ productId, size = 64, className }: { productId: string | null | undefined; size?: number; className?: string }) {
  const product = productId ? getProduct(productId) : undefined;
  if (!product?.image) {
    return (
      <div
        style={{ width: size, height: size }}
        className={cn("flex shrink-0 items-center justify-center rounded-lg bg-sand text-ink", className)}
      >
        <Gift className="size-1/2" strokeWidth={1.4} />
      </div>
    );
  }
  return (
    <Image
      src={product.image}
      alt={product.name}
      width={size * 2}
      height={size * 2}
      style={{ width: size, height: size }}
      className={cn("shrink-0 rounded-lg object-cover", className)}
    />
  );
}

export function Stars({ value, size = 22, className }: { value: number; size?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${value} sur 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          style={{ width: size, height: size }}
          className={i <= value ? "fill-[#b8913e] text-[#9a7630]" : "fill-transparent text-ink/70"}
          strokeWidth={1.3}
        />
      ))}
    </span>
  );
}

export function SectionHeading({ title, count, hint }: { title: string; count?: string; hint?: string }) {
  return (
    <div className="mb-2 mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <h2 className="font-serif text-2xl font-bold">{title}</h2>
      {count && <span className="text-[15px] font-medium">{count}</span>}
      {hint && <span className="text-[15px] text-muted">{hint}</span>}
    </div>
  );
}

export function FieldLabel({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-[15px] font-semibold text-ink">
      {children}
    </label>
  );
}

export const inputCls =
  "w-full rounded-md border border-[#bdb3a3] bg-white px-3 py-2 text-[15px] text-ink placeholder:text-[#8d857a] focus:border-burgundy focus:outline-none focus:ring-2 focus:ring-burgundy/20";
