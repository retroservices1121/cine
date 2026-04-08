"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { shortAddr } from "@/lib/utils";
import { useState } from "react";

const NAV_LINKS = [
  { href: "/explore", label: "Explore" },
  { href: "/arbitrage", label: "Arbitrage" },
  { href: "/news", label: "News" },
  { href: "/portfolio", label: "Portfolio" },
];

export default function Navbar() {
  const { login, logout, ready, authenticated, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/explore?search=${encodeURIComponent(search.trim())}`);
      setSearch("");
    }
  };

  return (
    <nav className="border-b border-border bg-bg/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center font-bold text-white text-xs">
              PC
            </div>
            <span className="text-base font-bold hidden sm:block">PopcornCine</span>
          </Link>

          {/* Nav links - desktop */}
          <div className="hidden md:flex items-center gap-0.5">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
                  pathname === l.href || pathname.startsWith(l.href + "/")
                    ? "bg-accent/10 text-accent"
                    : "text-text-muted hover:text-text hover:bg-card"
                }`}
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/dashboard"
              className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
                pathname === "/dashboard"
                  ? "bg-amber/10 text-amber"
                  : "text-text-muted hover:text-text hover:bg-card"
              }`}
            >
              Dashboard
            </Link>
          </div>

          {/* Search - desktop */}
          <form onSubmit={handleSearch} className="hidden md:block flex-1 max-w-xs">
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search markets..."
                className="w-full bg-card border border-border rounded-md pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-accent/50 transition-colors placeholder:text-text-muted"
              />
            </div>
          </form>

          {/* Auth */}
          <div className="flex items-center gap-2 shrink-0">
            {!ready ? (
              <div className="w-20 h-8 skeleton rounded-md" />
            ) : authenticated ? (
              <>
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-card rounded-md border border-border">
                  <div className="w-1.5 h-1.5 rounded-full bg-green" />
                  <span className="text-xs font-mono text-text-muted">
                    {user?.wallet?.address ? shortAddr(user.wallet.address) : "Connected"}
                  </span>
                </div>
                <button onClick={logout} className="text-xs text-text-muted hover:text-text transition-colors">
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={login}
                className="px-4 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded-md transition-colors"
              >
                Connect
              </button>
            )}

            {/* Mobile menu */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-1.5 text-text-muted hover:text-text"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden pb-3 border-t border-border pt-3 space-y-1 fade-in">
            <form onSubmit={handleSearch} className="mb-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search markets..."
                className="w-full bg-card border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent/50"
              />
            </form>
            {[...NAV_LINKS, { href: "/dashboard", label: "Dashboard" }].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === l.href ? "bg-accent/10 text-accent" : "text-text-muted"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
