"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { shortAddr } from "@/lib/utils";
import { useState } from "react";

const NAV_LINKS = [
  { href: "/", label: "Markets" },
  { href: "/explore", label: "Explore" },
  { href: "/portfolio", label: "Portfolio" },
];

export default function Navbar() {
  const { login, logout, ready, authenticated, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [search, setSearch] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/explore?search=${encodeURIComponent(search.trim())}`);
      setSearch("");
    }
  };

  return (
    <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-6 lg:px-8 h-20 bg-surface/60 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(9,136,240,0.06)]">
      <div className="flex items-center gap-8 lg:gap-12">
        <Link href="/" className="text-xl lg:text-2xl font-bold tracking-tighter text-white font-headline">
          THE CINEMATIC EXCHANGE
        </Link>
        <div className="hidden md:flex gap-6 lg:gap-8 items-center">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`font-headline tracking-[-0.04em] uppercase text-sm transition-colors ${
                pathname === l.href
                  ? "text-white border-b-2 border-primary-container pb-1"
                  : "text-white/50 hover:text-white"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4 lg:gap-6">
        {/* Search - desktop */}
        <form onSubmit={handleSearch} className="hidden lg:block">
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-[18px] group-focus-within:text-primary transition-colors">search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search markets..."
              className="bg-surface-container-high border-none rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-primary w-56 transition-all"
            />
          </div>
        </form>

        {!ready ? (
          <div className="w-32 h-10 skeleton rounded-xl" />
        ) : authenticated ? (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-surface-container-high rounded-xl">
              <div className="w-1.5 h-1.5 rounded-full bg-primary-container" />
              <span className="text-xs font-mono text-white/60">
                {user?.wallet?.address ? shortAddr(user.wallet.address) : "Connected"}
              </span>
            </div>
            <button onClick={logout} className="text-xs text-white/40 hover:text-white transition-colors">
              Logout
            </button>
          </div>
        ) : (
          <button
            onClick={login}
            className="noir-gradient text-on-primary px-6 py-2.5 rounded-xl font-headline font-bold text-sm tracking-tight active:scale-95 transition-all"
          >
            Connect Wallet
          </button>
        )}
      </div>
    </nav>
  );
}
