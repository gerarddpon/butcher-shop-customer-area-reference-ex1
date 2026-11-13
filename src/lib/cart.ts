import { cookies } from "next/headers";

export async function getCartCount(): Promise<number> {
  const store = await cookies();
  try {
    const parsed = JSON.parse(store.get("ma_cart")?.value ?? "[]");
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}
