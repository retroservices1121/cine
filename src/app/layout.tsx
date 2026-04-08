import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "THE CINEMATIC EXCHANGE — Prediction Markets",
  description: "High-stakes prediction markets on Base chain. The Noir Ledger.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col bg-surface text-on-surface font-body">
        <Providers>
          <Navbar />
          <main className="pt-16 md:pt-20 pb-24 md:pb-0 min-h-screen">{children}</main>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
