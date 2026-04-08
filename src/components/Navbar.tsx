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
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/explore?search=${encodeURIComponent(search.trim())}`);
      setSearch("");
      setShowMobileSearch(false);
    }
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-surface/60 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(9,136,240,0.06)]">
      <div className="flex justify-between items-center px-4 md:px-8 h-16 md:h-20">
        {/* Logo */}
        <div className="flex items-center gap-4 md:gap-12">
          <Link href="/" className="text-lg md:text-2xl font-black text-[#0988F0] tracking-[-0.04em] font-headline uppercase">
            THE CINEMATIC EXCHANGE
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex gap-6 lg:gap-8 items-center">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`font-headline tracking-[-0.04em] uppercase text-sm transition-colors ${
                  pathname === l.href
                    ? "text-white border-b-2 border-[#0988F0] pb-1"
                    : "text-white/50 hover:text-white"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-6">
          {/* Mobile search toggle */}
          <button
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="md:hidden"
          >
            <span className="material-symbols-outlined text-on-surface-variant text-[22px]">search</span>
          </button>

          {/* Desktop search */}
          <form onSubmit={handleSearch} className="hidden md:block">
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

          {/* Auth */}
          {!ready ? (
            <div className="w-8 h-8 md:w-32 md:h-10 skeleton rounded-full md:rounded-xl" />
          ) : authenticated ? (
            <>
              {/* Mobile: avatar */}
              <button onClick={logout} className="md:hidden w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center">
                <span className="material-symbols-outlined text-[16px] text-primary-container">person</span>
              </button>
              {/* Desktop: address + logout */}
              <div className="hidden md:flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-high rounded-xl">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-container" />
                  <span className="text-xs font-mono text-white/60">
                    {user?.wallet?.address ? shortAddr(user.wallet.address) : "Connected"}
                  </span>
                </div>
                <button onClick={logout} className="text-xs text-white/40 hover:text-white transition-colors">
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Mobile: compact connect */}
              <button onClick={login} className="md:hidden w-8 h-8 rounded-full noir-gradient flex items-center justify-center active:scale-95 transition-transform">
                <span className="material-symbols-outlined text-on-primary text-[16px]">account_balance_wallet</span>
              </button>
              {/* Desktop: full button */}
              <button
                onClick={login}
                className="hidden md:block noir-gradient text-on-primary px-6 py-2.5 rounded-xl font-headline font-bold text-sm tracking-tight active:scale-95 transition-all"
              >
                Connect Wallet
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile search bar (expandable) */}
      {showMobileSearch && (
        <div className="md:hidden px-4 pb-3 fade-in">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-[18px]">search</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search markets..."
                autoFocus
                className="w-full bg-surface-container-high border-none rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </form>
        </div>
      )}
    </nav>
  );
}
