import type { ToolCallData } from '../types';
import { useState } from 'react';

const STATUS_STYLES = {
  started: {
    label: 'Running',
    gradient: 'from-amber-400 to-orange-500',
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    border: 'border-amber-200 dark:border-amber-500/30',
    text: 'text-amber-700 dark:text-amber-300',
    iconColor: 'text-amber-500',
  },
  completed: {
    label: 'Completed',
    gradient: 'from-emerald-400 to-teal-500',
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    border: 'border-emerald-200 dark:border-emerald-500/30',
    text: 'text-emerald-700 dark:text-emerald-300',
    iconColor: 'text-emerald-500',
  },
  error: {
    label: 'Error',
    gradient: 'from-rose-500 to-red-600',
    bg: 'bg-rose-50 dark:bg-rose-500/10',
    border: 'border-rose-200 dark:border-rose-500/30',
    text: 'text-rose-700 dark:text-rose-300',
    iconColor: 'text-rose-500',
  },
} as const;

function StatusIcon({ status }: { status: ToolCallData['status'] }) {
  if (status === 'started') {
    return (
      <span className="relative inline-flex items-center justify-center">
        <span className="absolute w-5 h-5 rounded-full bg-amber-400/30 animate-status-pulse" />
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-amber-500 animate-spin-slow" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <path d="M21 12a9 9 0 1 1-6.2-8.55" />
        </svg>
      </span>
    );
  }
  if (status === 'completed') {
    return (
      <svg viewBox="0 0 24 24" className="w-4 h-4 text-emerald-500 animate-scale-in" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6L9 17l-5-5" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 text-rose-500 animate-scale-in" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

export function ToolCallCard({ toolCall }: { toolCall: ToolCallData }) {
  const [expanded, setExpanded] = useState(toolCall.status !== 'started');
  const style = STATUS_STYLES[toolCall.status];

  return (
    <div
      className={`my-2 rounded-xl border ${style.border} ${style.bg} overflow-hidden animate-fade-in-up transition-base hover:shadow-[var(--shadow-soft)]`}
    >
      {/* Accent gradient bar at top */}
      <div className={`h-1 bg-gradient-to-r ${style.gradient}`} />

      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-base hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
      >
        <span className="shrink-0 w-7 h-7 rounded-lg bg-[var(--color-bg-elev)] border border-[var(--color-border)] flex items-center justify-center">
          <StatusIcon status={toolCall.status} />
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-faint)]">
              Tool
            </span>
            <span className={`text-sm font-semibold ${style.text} truncate`}>
              {toolCall.toolName}
            </span>
          </div>
          <div className="text-[11px] text-[var(--color-text-faint)] font-mono truncate">
            {style.label} · {toolCall.runId.slice(0, 8)}
          </div>
        </div>

        <svg
          viewBox="0 0 24 24"
          className={`w-4 h-4 text-[var(--color-text-faint)] transition-transform duration-300 ${
            expanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      <div
        className={`grid transition-all duration-300 ease-out ${
          expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-3.5 pb-3.5 pt-1 space-y-2 text-xs">
            {toolCall.input != null && (
              <div>
                <div className="font-semibold text-[var(--color-text-muted)] mb-1 flex items-center gap-1.5">
                  <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                  Input
                </div>
                <pre className="bg-[var(--color-bg-elev)] border border-[var(--color-border)] p-2 rounded-lg max-h-32 overflow-auto text-[11px] font-mono">
                  {JSON.stringify(toolCall.input, null, 2)}
                </pre>
              </div>
            )}

            {toolCall.output != null && (
              <div>
                <div className="font-semibold text-[var(--color-text-muted)] mb-1 flex items-center gap-1.5">
                  <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12h16M4 6h16M4 18h16" />
                  </svg>
                  Output
                </div>
                <pre className="bg-[var(--color-bg-elev)] border border-[var(--color-border)] p-2 rounded-lg max-h-32 overflow-auto text-[11px] font-mono">
                  {typeof toolCall.output === 'string'
                    ? toolCall.output
                    : JSON.stringify(toolCall.output, null, 2)}
                </pre>
              </div>
            )}

            {toolCall.error && (
              <div>
                <div className="font-semibold text-rose-600 dark:text-rose-400 mb-1 flex items-center gap-1.5">
                  <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4M12 16h.01" />
                  </svg>
                  Error
                </div>
                <pre className="bg-rose-100/60 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 p-2 rounded-lg max-h-32 overflow-auto text-[11px] font-mono text-rose-700 dark:text-rose-300">
                  {toolCall.error}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
