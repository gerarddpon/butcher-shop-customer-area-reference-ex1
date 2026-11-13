const eur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

export function formatEUR(cents: number): string {
  return eur.format(cents / 100).replace(/\u202f/g, "\u00a0");
}

function toDate(iso: string): Date {
  return new Date(`${iso.slice(0, 10)}T12:00:00Z`);
}

const fmt = (opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("fr-FR", { timeZone: "UTC", ...opts });

/** 31 oct. 2026 */
export function formatDate(iso: string): string {
  return fmt({ day: "numeric", month: "short", year: "numeric" }).format(toDate(iso));
}

/** sam. 31 oct. */
export function formatShortDay(iso: string): string {
  return fmt({ weekday: "short", day: "numeric", month: "short" }).format(toDate(iso));
}

/** sam. 31 oct. 2026 */
export function formatShortDayYear(iso: string): string {
  return fmt({ weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(toDate(iso));
}

/** Samedi 31 octobre 2026 */
export function formatLongDate(iso: string, withYear = true): string {
  const s = fmt({ weekday: "long", day: "numeric", month: "long", ...(withYear ? { year: "numeric" } : {}) }).format(
    toDate(iso),
  );
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** 10h00 – 10h30 */
export function formatSlot(start: string, end: string): string {
  return `${start.replace(":", "h")} – ${end.replace(":", "h")}`;
}

export function formatPoints(points: number): string {
  return `${new Intl.NumberFormat("fr-FR").format(points)} points`;
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((toDate(toIso).getTime() - toDate(fromIso).getTime()) / 86_400_000);
}

export function addDays(iso: string, days: number): string {
  const d = toDate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }).format(date);
}

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
