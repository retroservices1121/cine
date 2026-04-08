export default function Footer() {
  return (
    <footer className="border-t border-border mt-auto">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-muted">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-accent/20 flex items-center justify-center text-[10px] font-bold text-accent">
            PC
          </div>
          <span>PopcornCine</span>
        </div>
        <div>
          Powered by{" "}
          <a
            href="https://docs.spreddterminal.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:text-accent-hover transition-colors"
          >
            Spredd Terminal API
          </a>
          {" | "}Built on Base
        </div>
      </div>
    </footer>
  );
}
