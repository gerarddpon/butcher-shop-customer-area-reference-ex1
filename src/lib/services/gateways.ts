import { randomUUID } from "node:crypto";
import { businessConfig } from "@/lib/config";

/**
 * Mock adapters for third-party business services.
 * Swap implementations based on env (e.g. PAYMENT_PROVIDER=stripe) without touching callers.
 */

const latency = (ms = 250) => new Promise((r) => setTimeout(r, ms));

export type PaymentResult = { ok: true; transactionId: string } | { ok: false; error: string };

export const paymentGateway = {
  async charge(input: { amountCents: number; reference: string; description: string }): Promise<PaymentResult> {
    if (businessConfig.paymentProvider !== "mock") {
      // Real provider integration would go here, authenticated with businessConfig.paymentApiKey.
      return { ok: false, error: `Fournisseur de paiement « ${businessConfig.paymentProvider} » non configuré.` };
    }
    await latency();
    if (input.amountCents <= 0) return { ok: false, error: "Montant invalide." };
    return { ok: true, transactionId: `txn_${randomUUID().slice(0, 12)}` };
  },
};

export const uploadService = {
  validate(files: { name: string; size: number; type: string }[]): string | null {
    if (files.length > businessConfig.uploadMaxFiles) return `Maximum ${businessConfig.uploadMaxFiles} photos.`;
    const max = businessConfig.uploadMaxMb * 1024 * 1024;
    for (const f of files) {
      if (!f.type.startsWith("image/")) return `« ${f.name} » n'est pas une image.`;
      if (f.size > max) return `« ${f.name} » dépasse ${businessConfig.uploadMaxMb} Mo.`;
    }
    return null;
  },
  async store(file: { name: string; size: number }) {
    await latency(80);
    // Mock object storage: files are acknowledged but not persisted.
    return { name: file.name, size: file.size, url: undefined as string | undefined };
  },
};

export const notificationService = {
  async notifyAtelier(subject: string, body: string) {
    await latency(50);
    if (process.env.NODE_ENV !== "production") console.info(`[notify:atelier] ${subject} — ${body.slice(0, 80)}`);
    return { delivered: true };
  },
};
