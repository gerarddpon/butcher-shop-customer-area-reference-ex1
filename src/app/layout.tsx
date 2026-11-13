import type { Metadata } from "next";
import type { ReactNode } from "react";
import { shop } from "@/lib/config";
import { ToastProvider } from "@/components/toast";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: `Espace client · ${shop.name}`, template: `%s · ${shop.name}` },
  description: `Commandes, factures, cagnotte et réclamations — l'espace client de ${shop.name}, boucherie artisanale.`,
};

const readingComfortScript = `try{if(localStorage.getItem('ma_reading_comfort')==='1'){document.documentElement.classList.add('reading-comfort')}}catch(e){}`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Roboto+Condensed:wght@400;500;600;700;800&family=Source+Serif+4:opsz,wght@8..60,600;8..60,700&display=swap"
        />
        <script dangerouslySetInnerHTML={{ __html: readingComfortScript }} />
      </head>
      <body className="min-h-screen antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
