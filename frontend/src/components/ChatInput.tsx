import { useState, useRef, useEffect, type FormEvent, type KeyboardEvent } from 'react';
import type { AgentType } from '../types';

interface Props {
  onSend: (message: string) => void;
  onStop?: () => void;
  disabled: boolean;
  isStreaming?: boolean;
  agentType?: AgentType;
  onAgentTypeChange?: (type: AgentType) => void;
}

const MAX_LENGTH = 4000;

export function ChatInput({
  onSend,
  onStop,
  disabled,
  isStreaming,
  agentType = 'single',
  onAgentTypeChange,
}: Props) {
  const [input, setInput] = useState('');
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  }, [input]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || disabled) return;
    onSend(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  };

  const charCount = input.length;
  const overLimit = charCount > MAX_LENGTH;

  return (
    <form
      onSubmit={handleSubmit}
      className="px-4 sm:px-6 pb-4 pt-2"
    >
      <div
        className={`relative flex items-end gap-2 p-2 rounded-2xl border bg-[var(--color-bg-elev)] transition-base ${
          focused
            ? 'border-[var(--color-brand)] shadow-[var(--shadow-glow)]'
            : 'border-[var(--color-border)] shadow-[var(--shadow-soft)]'
        }`}
      >
        {/* Agent mode selector */}
        <div className="shrink-0 flex flex-col justify-end pb-1">
          <label htmlFor="agent-mode" className="sr-only">Agent mode</label>
          <select
            id="agent-mode"
            value={agentType}
            onChange={e => onAgentTypeChange?.(e.target.value as AgentType)}
            disabled={isStreaming}
            className="h-9 px-2.5 text-xs font-medium rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-soft)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-brand)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <option value="single">Single agent</option>
            <option value="deep">Deep agents</option>
          </select>
        </div>

        {/* Textarea */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder={isStreaming ? 'AI is responding… (press Stop to interrupt)' : `Message the ${agentType === 'deep' ? 'deep agent team' : 'agent'}…`}
            disabled={disabled}
            rows={1}
            className="w-full resize-none bg-transparent px-3 py-2.5 text-sm sm:text-[0.95rem] text-[var(--color-text)] placeholder:text-[var(--color-text-faint)] focus:outline-none disabled:opacity-60 max-h-[200px] thin-scroll"
          />

          {/* Bottom row: char count + hint */}
          <div className="flex items-center justify-between px-3 pb-1 text-[10px] text-[var(--color-text-faint)]">
            <div className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded border border-[var(--color-border)] bg-[var(--color-bg-soft)] font-mono text-[10px]">
                Enter
              </kbd>
              <span>to send</span>
              <span className="mx-1">·</span>
              <kbd className="px-1.5 py-0.5 rounded border border-[var(--color-border)] bg-[var(--color-bg-soft)] font-mono text-[10px]">
                Shift+Enter
              </kbd>
              <span>new line</span>
            </div>
            {charCount > 0 && (
              <span
                className={`font-mono ${
                  overLimit ? 'text-rose-500 font-semibold' : charCount > MAX_LENGTH * 0.9 ? 'text-amber-500' : ''
                }`}
              >
                {charCount}/{MAX_LENGTH}
              </span>
            )}
          </div>
        </div>

        {/* Send / Stop button */}
        {isStreaming ? (
          <button
            type="button"
            onClick={onStop}
            title="Stop generating"
            className="shrink-0 w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-[var(--shadow-soft)] hover:bg-rose-600 hover:shadow-[var(--shadow-pop)] active:scale-95 transition-base"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          </button>
        ) : (
          <button
            type="submit"
            disabled={disabled || !input.trim() || overLimit}
            title="Send message"
            className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white flex items-center justify-center shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-pop)] hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-[var(--shadow-soft)] transition-base"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13" />
              <path d="M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
        )}
      </div>
    </form>
  );
}
