import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";
import SideNav from "@/components/SideNav";

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
          <SideNav />
          <main className="ml-0 lg:ml-64 pt-20 min-h-screen">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
