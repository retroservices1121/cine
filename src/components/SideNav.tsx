"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SIDE_LINKS = [
  { href: "/", icon: "theaters", label: "Premiere Markets" },
  { href: "/portfolio", icon: "pie_chart", label: "My Portfolio" },
  { href: "/explore", icon: "explore", label: "Explore All" },
];

export default function SideNav() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-surface flex-col py-8 pt-24 hidden lg:flex z-40">
      <div className="px-6 mb-8">
        <h2 className="font-headline font-bold text-white text-xl">The Noir Ledger</h2>
        <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] mt-1">High-Stakes Prediction</p>
      </div>

      <nav className="flex-1 space-y-1">
        {SIDE_LINKS.map((l) => {
          const active = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center gap-4 px-6 py-3 transition-all active:translate-x-1 ${
                active
                  ? "bg-surface-container-high text-primary-container font-semibold rounded-r-full"
                  : "text-white/50 hover:text-white hover:bg-white/5"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]" style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                {l.icon}
              </span>
              <span className="text-sm">{l.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-6 space-y-4">
        <Link
          href="/dashboard"
          className="block w-full py-3 px-4 text-center text-white/50 text-xs hover:text-white hover:bg-white/5 rounded-xl transition-all"
        >
          <span className="material-symbols-outlined text-[16px] mr-1 align-middle">settings</span>
          Admin
        </Link>
        <div className="pt-4 space-y-2" style={{ borderTop: "1px solid rgba(64,71,83,0.15)" }}>
          <p className="text-white/20 text-[10px] uppercase tracking-[0.15em]">
            Powered by Spredd Terminal
          </p>
        </div>
      </div>
    </aside>
  );
}
