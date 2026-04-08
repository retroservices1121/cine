export function formatUsd(n: number | undefined | null): string {
  if (n == null || isNaN(n)) return "$0";
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

export function formatPct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

export function priceColor(price: number): string {
  if (price > 0.7) return "text-primary";
  if (price < 0.3) return "text-secondary";
  return "text-on-surface-variant";
}

export function pnlColor(n: number): string {
  if (n > 0) return "text-primary-container";
  if (n < 0) return "text-secondary";
  return "text-on-surface-variant";
}

export function pnlSign(n: number): string {
  return n >= 0 ? `+${formatUsd(n)}` : formatUsd(n);
}

export function shortAddr(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function relativeTime(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
