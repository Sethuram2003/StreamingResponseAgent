import type { SubAgentData, ToolCallData } from '../types';
import { useState } from 'react';

const STATUS_STYLES = {
  started: {
    label: 'Running',
    gradient: 'from-indigo-400 to-violet-500',
    bg: 'bg-indigo-50 dark:bg-indigo-500/10',
    border: 'border-indigo-200 dark:border-indigo-500/30',
    text: 'text-indigo-700 dark:text-indigo-300',
    iconColor: 'text-indigo-500',
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

function formatJson(value: unknown): string {
  if (value === undefined) return '';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function StatusIcon({ status }: { status: SubAgentData['status'] }) {
  if (status === 'started') {
    return (
      <span className="relative inline-flex items-center justify-center">
        <span className="absolute w-5 h-5 rounded-full bg-indigo-400/30 animate-status-pulse" />
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-indigo-500 animate-spin-slow" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
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

function ToolStatusIcon({ status }: { status: ToolCallData['status'] }) {
  if (status === 'started') {
    return (
      <span className="w-2 h-2 rounded-full bg-amber-400 animate-status-pulse" />
    );
  }
  if (status === 'completed') {
    return (
      <svg viewBox="0 0 24 24" className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6L9 17l-5-5" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="w-3 h-3 text-rose-500" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

export function SubAgentCard({ subAgent }: { subAgent: SubAgentData }) {
  const [expanded, setExpanded] = useState(subAgent.status !== 'started');
  const style = STATUS_STYLES[subAgent.status];
  const tools = subAgent.tools || [];

  return (
    <div
      className={`my-2 rounded-xl border ${style.border} ${style.bg} overflow-hidden animate-fade-in-up transition-base hover:shadow-[var(--shadow-soft)]`}
    >
      <div className={`h-1 bg-gradient-to-r ${style.gradient}`} />

      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-base hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
      >
        <span className="shrink-0 w-7 h-7 rounded-lg bg-[var(--color-bg-elev)] border border-[var(--color-border)] flex items-center justify-center">
          <StatusIcon status={subAgent.status} />
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-faint)]">
              Sub-Agent
            </span>
            <span className={`text-sm font-semibold ${style.text} truncate`}>
              {subAgent.agentName}
            </span>
          </div>
          <div className="text-[11px] text-[var(--color-text-faint)] font-mono truncate">
            {style.label} · {subAgent.runId.slice(0, 8)}
            {tools.length > 0 && ` · ${tools.length} tool call${tools.length === 1 ? '' : 's'}`}
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
          <div className="px-3.5 pb-3.5 pt-1 space-y-3 text-xs">
            {subAgent.content && (
              <div>
                <div className="font-semibold text-[var(--color-text-muted)] mb-1 flex items-center gap-1.5">
                  <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  Streamed response
                </div>
                <div className="bg-[var(--color-bg-elev)] border border-[var(--color-border)] p-2.5 rounded-lg max-h-40 overflow-auto text-[12px] leading-relaxed whitespace-pre-wrap">
                  {subAgent.content}
                </div>
              </div>
            )}

            {subAgent.input != null && (
              <div>
                <div className="font-semibold text-[var(--color-text-muted)] mb-1 flex items-center gap-1.5">
                  <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                  Task / Input
                </div>
                <pre className="bg-[var(--color-bg-elev)] border border-[var(--color-border)] p-2 rounded-lg max-h-40 overflow-auto text-[11px] font-mono leading-relaxed">
                  {formatJson(subAgent.input)}
                </pre>
              </div>
            )}

            {tools.length > 0 && (
              <div>
                <div className="font-semibold text-[var(--color-text-muted)] mb-1.5 flex items-center gap-1.5">
                  <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                  </svg>
                  Tool calls
                </div>
                <div className="space-y-2 pl-2 border-l-2 border-[var(--color-border)]">
                  {tools.map(tool => (
                    <div
                      key={tool.runId}
                      className="bg-[var(--color-bg-elev)] border border-[var(--color-border)] rounded-lg overflow-hidden"
                    >
                      <div className="flex items-center gap-2 px-2.5 py-2 bg-black/[0.02] dark:bg-white/[0.02]">
                        <ToolStatusIcon status={tool.status} />
                        <span className="font-semibold text-[11px] text-[var(--color-text)]">
                          {tool.toolName}
                        </span>
                        <span className="ml-auto text-[10px] font-mono text-[var(--color-text-faint)]">
                          {tool.runId.slice(0, 8)}
                        </span>
                      </div>
                      <div className="px-2.5 pb-2.5 pt-1 space-y-1.5 text-[11px]">
                        {tool.input != null && (
                          <div>
                            <span className="font-medium text-[var(--color-text-muted)]">Input</span>
                            <pre className="mt-0.5 bg-[var(--color-bg)] border border-[var(--color-border)] p-1.5 rounded max-h-24 overflow-auto font-mono leading-relaxed">
                              {formatJson(tool.input)}
                            </pre>
                          </div>
                        )}
                        {tool.output != null && (
                          <div>
                            <span className="font-medium text-[var(--color-text-muted)]">Output</span>
                            <pre className="mt-0.5 bg-[var(--color-bg)] border border-[var(--color-border)] p-1.5 rounded max-h-24 overflow-auto font-mono leading-relaxed">
                              {formatJson(tool.output)}
                            </pre>
                          </div>
                        )}
                        {tool.error && (
                          <div>
                            <span className="font-medium text-rose-600 dark:text-rose-400">Error</span>
                            <pre className="mt-0.5 bg-rose-100/60 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 p-1.5 rounded max-h-24 overflow-auto font-mono text-rose-700 dark:text-rose-300 leading-relaxed">
                              {tool.error}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {subAgent.output != null && (
              <div>
                <div className="font-semibold text-[var(--color-text-muted)] mb-1 flex items-center gap-1.5">
                  <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12h16M4 6h16M4 18h16" />
                  </svg>
                  Final output
                </div>
                <pre className="bg-[var(--color-bg-elev)] border border-[var(--color-border)] p-2 rounded-lg max-h-40 overflow-auto text-[11px] font-mono leading-relaxed">
                  {formatJson(subAgent.output)}
                </pre>
              </div>
            )}

            {subAgent.error && (
              <div>
                <div className="font-semibold text-rose-600 dark:text-rose-400 mb-1 flex items-center gap-1.5">
                  <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4M12 16h.01" />
                  </svg>
                  Error
                </div>
                <pre className="bg-rose-100/60 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 p-2 rounded-lg max-h-32 overflow-auto text-[11px] font-mono text-rose-700 dark:text-rose-300 leading-relaxed">
                  {subAgent.error}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
