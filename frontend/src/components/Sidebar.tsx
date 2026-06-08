import { useState } from 'react';

interface SessionMeta {
  id: string;
  title: string;
  preview: string;
  active: boolean;
}

interface SidebarProps {
  sessionId: string;
  onNewChat: () => void;
  onSwitchSession?: (id: string) => void;
}

const seedSessions = (currentId: string): SessionMeta[] => [
  { id: currentId, title: 'New conversation', preview: 'Start typing to begin…', active: true },
];

export function Sidebar({ sessionId, onNewChat, onSwitchSession }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  // Keep an internal list so the UI feels alive. The current session is always present.
  const [sessions] = useState<SessionMeta[]>(() => seedSessions(sessionId));

  return (
    <aside
      className={`relative h-full shrink-0 transition-all duration-300 ease-out ${
        collapsed ? 'w-16' : 'w-72'
      }`}
    >
      {/* Decorative gradient edge */}
      <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[var(--color-border-strong)] to-transparent" />

      <div className="h-full flex flex-col bg-[var(--color-bg-elev)] border-r border-[var(--color-border)]">
        {/* Top bar */}
        <div className="flex items-center justify-between p-3 border-b border-[var(--color-border)]">
          <div
            className={`flex items-center gap-2.5 overflow-hidden transition-all ${
              collapsed ? 'w-0 opacity-0' : 'w-full opacity-100'
            }`}
          >
            <div className="w-8 h-8 shrink-0 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-[var(--shadow-soft)]">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="currentColor">
                <path d="M12 2 L14 9 L21 11 L14 13 L12 20 L10 13 L3 11 L10 9 Z" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold gradient-text truncate">AI Workspace</div>
              <div className="text-[10px] text-[var(--color-text-faint)] uppercase tracking-wider">
                Streaming
              </div>
            </div>
          </div>

          <button
            onClick={() => setCollapsed(c => !c)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-soft)] transition-base"
          >
            <svg
              viewBox="0 0 24 24"
              className={`w-4 h-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        </div>

        {/* New chat button */}
        <div className="p-3">
          <button
            onClick={onNewChat}
            className={`group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-semibold text-sm shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-pop)] transition-base hover:scale-[1.02] active:scale-[0.98] ${
              collapsed ? 'px-0 py-2.5' : 'px-4 py-2.5'
            }`}
            title="Start a new chat"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              {!collapsed && <span>New Chat</span>}
            </span>
            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
          </button>
        </div>

        {/* Sessions list */}
        {!collapsed && (
          <div className="flex-1 overflow-y-auto thin-scroll px-2 pb-3 animate-fade-in">
            <div className="px-2 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-faint)]">
              Recent
            </div>
            <div className="space-y-1">
              {sessions.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => onSwitchSession?.(s.id)}
                  style={{ animationDelay: `${i * 40}ms` }}
                  className={`group w-full text-left rounded-lg p-2.5 transition-base border border-transparent animate-slide-left ${
                    s.active
                      ? 'bg-[var(--color-bg-soft)] border-[var(--color-border)]'
                      : 'hover:bg-[var(--color-bg-soft)]'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={`mt-1 shrink-0 w-1.5 h-1.5 rounded-full ${
                        s.active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-[var(--color-text-faint)]'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div
                        className={`text-sm font-medium truncate ${
                          s.active ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'
                        }`}
                      >
                        {s.title}
                      </div>
                      <div className="text-xs text-[var(--color-text-faint)] truncate">
                        {s.preview}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div
          className={`border-t border-[var(--color-border)] p-3 transition-all ${
            collapsed ? 'opacity-0 h-0 overflow-hidden p-0' : 'opacity-100'
          }`}
        >
          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-[var(--color-bg-soft)]">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
              U
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-[var(--color-text)]">You</div>
              <div className="text-[10px] text-[var(--color-text-faint)] flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Online
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
