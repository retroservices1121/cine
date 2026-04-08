"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", icon: "movie_filter", label: "Markets" },
  { href: "/explore", icon: "explore", label: "Explore" },
  { href: "/portfolio", icon: "account_balance_wallet", label: "Portfolio" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 w-full z-50 bg-surface/60 backdrop-blur-2xl flex justify-around items-center h-20 px-4 pb-4 md:hidden shadow-[0_-4px_24px_rgba(0,0,0,0.3)]">
      {TABS.map((tab) => {
        const active = tab.href === "/"
          ? pathname === "/"
          : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-col items-center justify-center relative active:scale-90 transition-transform ${
              active ? "text-[#0988F0]" : "text-gray-500 hover:text-[#0988F0]"
            }`}
          >
            {active && (
              <span className="absolute -bottom-1 w-1 h-1 bg-[#0988F0] rounded-full" />
            )}
            <span className="material-symbols-outlined mb-1 text-[22px]">{tab.icon}</span>
            <span className="text-[10px] uppercase tracking-[0.1em] font-medium">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
