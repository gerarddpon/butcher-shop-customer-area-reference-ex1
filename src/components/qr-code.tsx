import QRCode from "qrcode";
import { cn } from "@/lib/format";

export async function QrCode({ value, size = 120, className }: { value: string; size?: number; className?: string }) {
  const svg = await QRCode.toString(value, {
    type: "svg",
    margin: 0,
    errorCorrectionLevel: "M",
    color: { dark: "#141414", light: "#ffffff" },
  });
  return (
    <div
      role="img"
      aria-label={`QR code ${value}`}
      style={{ width: size, height: size }}
      className={cn("[&>svg]:h-full [&>svg]:w-full", className)}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
