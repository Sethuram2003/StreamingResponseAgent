import { useState, useRef, useEffect } from 'react';
import type { ChatMessage as ChatMessageType } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
}

function formatTime(ts?: number) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function ChatMessage({ message, isStreaming }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const tsRef = useRef<number>(Date.now());

  useEffect(() => {
    if (copied) {
      const t = setTimeout(() => setCopied(false), 1500);
      return () => clearTimeout(t);
    }
  }, [copied]);

  const isHuman = message.role === 'human';
  const content = message.content || (message.role === 'ai' && isStreaming ? '' : '');

  const handleCopy = async () => {
    if (!message.content) return;
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
    } catch {
      /* clipboard may be unavailable */
    }
  };

  return (
    <div
      className={`flex items-end gap-2 sm:gap-3 max-w-full animate-fade-in-up ${
        isHuman ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      {/* Avatar */}
      <div className="shrink-0">
        {isHuman ? (
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-amber-400 to-pink-500 flex items-center justify-center text-white text-sm font-bold shadow-[var(--shadow-soft)]">
            U
          </div>
        ) : (
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-400 flex items-center justify-center shadow-[var(--shadow-soft)] animate-gradient">
            <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor">
              <path d="M12 2 L14 9 L21 11 L14 13 L12 20 L10 13 L3 11 L10 9 Z" />
            </svg>
          </div>
        )}
      </div>

      {/* Bubble + actions */}
      <div className={`flex flex-col gap-1 min-w-0 max-w-[85%] sm:max-w-[75%] ${isHuman ? 'items-end' : 'items-start'}`}>
        <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-faint)] px-1">
          <span className="font-semibold text-[var(--color-text-muted)]">
            {isHuman ? 'You' : 'AI'}
          </span>
          <span>{formatTime(tsRef.current)}</span>
        </div>

        <div
          className={`relative group transition-base ${
            isHuman
              ? 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white rounded-2xl rounded-br-md shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-pop)]'
              : 'bg-[var(--color-bg-elev)] text-[var(--color-text)] border border-[var(--color-border)] rounded-2xl rounded-bl-md shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-pop)]'
          } px-4 py-3`}
        >
          {isHuman ? (
            <p className="whitespace-pre-wrap break-words leading-relaxed text-sm sm:text-[0.95rem]">
              {content}
            </p>
          ) : (
            <div className="msg-content text-sm sm:text-[0.95rem]">
              {content ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </span>
              )}
              {isStreaming && content && (
                <span className="inline-block w-1.5 h-4 ml-0.5 align-text-bottom bg-[var(--color-brand)] rounded-sm animate-blink" />
              )}
            </div>
          )}

          {/* Action buttons — appear on hover */}
          {!isHuman && message.content && (
            <div className="absolute -bottom-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-base">
              <button
                onClick={handleCopy}
                title={copied ? 'Copied!' : 'Copy message'}
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-[var(--color-bg-elev)] border border-[var(--color-border)] shadow-[var(--shadow-soft)] text-[11px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-border-strong)] transition-base"
              >
                {copied ? (
                  <>
                    <svg viewBox="0 0 24 24" className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    Copied
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
