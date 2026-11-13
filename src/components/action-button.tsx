"use client";

import { useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useToast } from "./toast";
import type { ActionResult } from "@/app/compte/actions";

/**
 * Runs a bound server action, surfaces its result as a toast and refreshes server data.
 */
export function ActionButton({
  action,
  children,
  className,
  confirm,
  disabled,
  title,
  onDone,
}: {
  action: () => Promise<ActionResult>;
  children: ReactNode;
  className?: string;
  confirm?: string;
  disabled?: boolean;
  title?: string;
  onDone?: (res: ActionResult) => void;
}) {
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  return (
    <button
      type="button"
      title={title}
      disabled={disabled || pending}
      className={className}
      onClick={() => {
        if (confirm && !window.confirm(confirm)) return;
        start(async () => {
          try {
            const res = await action();
            toast(res.message, res.ok ? "success" : "error");
            onDone?.(res);
            if (res.redirectTo) router.push(res.redirectTo);
            else router.refresh();
          } catch {
            toast("Une erreur est survenue. Réessayez dans un instant.", "error");
          }
        });
      }}
    >
      {pending && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
}
