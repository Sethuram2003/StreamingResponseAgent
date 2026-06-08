interface HeaderProps {
  sessionId: string;
  isStreaming: boolean;
  onToggleTheme: () => void;
  isDark: boolean;
  onClearChat: () => void;
  messageCount: number;
}

export function Header({
  sessionId,
  isStreaming,
  onToggleTheme,
  isDark,
  onClearChat,
  messageCount,
}: HeaderProps) {
  const shortId = sessionId.replace('session-', '').slice(-6);

  return (
    <header className="glass sticky top-0 z-20 flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-[var(--color-border)]">
      <div className="flex items-center gap-3 min-w-0">
        {/* Logo */}
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-cyan-400 flex items-center justify-center shadow-[var(--shadow-pop)] animate-gradient">
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2 L13.5 8.5 L20 10 L13.5 11.5 L12 18 L10.5 11.5 L4 10 L10.5 8.5 Z" />
              <circle cx="19" cy="5" r="1.2" fill="currentColor" />
              <circle cx="5" cy="19" r="1.2" fill="currentColor" />
            </svg>
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[var(--color-bg-elev)]" />
        </div>

        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-bold leading-tight gradient-text">
            Streaming Response Agent
          </h1>
          <div className="flex items-center gap-2 text-[11px] sm:text-xs text-[var(--color-text-muted)]">
            <span className="flex items-center gap-1.5">
              <span
                className={`inline-block w-1.5 h-1.5 rounded-full ${
                  isStreaming ? 'bg-emerald-500 animate-pulse' : 'bg-[var(--color-text-faint)]'
                }`}
              />
              {isStreaming ? 'Streaming…' : 'Ready'}
            </span>
            <span className="text-[var(--color-text-faint)]">·</span>
            <span className="font-mono">#{shortId}</span>
            <span className="text-[var(--color-text-faint)]">·</span>
            <span>{messageCount} msg{messageCount === 1 ? '' : 's'}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Model selector (visual only) */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-bg-soft)] border border-[var(--color-border)] text-xs font-medium text-[var(--color-text-muted)]">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2a10 10 0 1 0 10 10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <span>GPT-4o</span>
          <svg viewBox="0 0 24 24" className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>

        {/* Clear chat */}
        <button
          onClick={onClearChat}
          title="Clear conversation"
          className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-soft)] transition-base"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18" />
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          </svg>
        </button>

        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-soft)] transition-base"
        >
          {isDark ? (
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}
