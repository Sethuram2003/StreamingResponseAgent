import { useChatStream } from './hooks/useChatStream';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ToolCallCard } from './components/ToolCallCard';
import { SubAgentCard } from './components/SubAgentCard';
import { TypingIndicator } from './components/TypingIndicator';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ScrollToBottom } from './components/ScrollToBottom';
import { AnimatedBackground } from './components/AnimatedBackground';
import { useEffect, useRef, useState, useCallback } from 'react';
import type { AgentType } from './types';

const THEME_KEY = 'sra-theme';
const SESSION_KEY = 'sra-session-id';
const AGENT_KEY = 'sra-agent-type';

function App() {
  // Theme
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = useCallback(() => setIsDark(d => !d), []);

  // Session
  const [sessionId, setSessionId] = useState<string>(
    () => localStorage.getItem(SESSION_KEY) ?? `session-${Date.now()}`
  );

  useEffect(() => {
    localStorage.setItem(SESSION_KEY, sessionId);
  }, [sessionId]);

  // Agent mode (single / deep)
  const [agentType, setAgentType] = useState<AgentType>(() => {
    if (typeof window === 'undefined') return 'single';
    const saved = localStorage.getItem(AGENT_KEY);
    return saved === 'deep' ? 'deep' : 'single';
  });

  useEffect(() => {
    localStorage.setItem(AGENT_KEY, agentType);
  }, [agentType]);

  const { messages, sendMessage, isStreaming, stop, clear } = useChatStream({
    sessionId,
    agentType,
  });

  const handleNewChat = useCallback(() => {
    clear();
    setSessionId(`session-${Date.now()}`);
  }, [clear]);

  const handleClearChat = useCallback(() => {
    if (messages.length === 0) return;
    if (window.confirm('Clear this conversation?')) {
      clear();
    }
  }, [clear, messages.length]);

  // Auto-scroll to bottom on new content while streaming or new messages
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
      stickToBottom.current = distance < 100;
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (stickToBottom.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, isStreaming]);

  // Build a lookup so we know which AI message is currently streaming
  const lastMsg = messages[messages.length - 1];
  const lastIsStreamingAi =
    isStreaming && lastMsg && lastMsg.role === 'ai';

  return (
    <div className="relative h-screen flex bg-[var(--color-bg)] text-[var(--color-text)] overflow-hidden">
      <AnimatedBackground />

      {/* App shell */}
      <div className="relative z-10 flex w-full h-full">
        <Sidebar
          sessionId={sessionId}
          onNewChat={handleNewChat}
          onSwitchSession={id => setSessionId(id)}
        />

        <main className="flex-1 flex flex-col min-w-0">
          <Header
            sessionId={sessionId}
            isStreaming={isStreaming}
            isDark={isDark}
            onToggleTheme={toggleTheme}
            onClearChat={handleClearChat}
            messageCount={messages.filter(m => m.role !== 'tool_call' && m.role !== 'sub_agent').length}
          />

          {/* Messages area */}
          <div className="relative flex-1 min-h-0">
            <div
              ref={scrollRef}
              className="absolute inset-0 overflow-y-auto thin-scroll"
            >
              {messages.length === 0 ? (
                <WelcomeScreen
                  onPrompt={text => {
                    sendMessage(text);
                  }}
                />
              ) : (
                <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">
                  {messages.map((msg, i) => {
                    const isLast = i === messages.length - 1;
                    if (msg.role === 'tool_call' && msg.toolCall) {
                      // Align tool cards to the left (AI side) with a slight indent
                      return (
                        <div key={msg.id} className="pl-0 sm:pl-12 animate-fade-in-up">
                          <ToolCallCard toolCall={msg.toolCall} />
                        </div>
                      );
                    }
                    if (msg.role === 'sub_agent' && msg.subAgent) {
                      return (
                        <div key={msg.id} className="pl-0 sm:pl-12 animate-fade-in-up">
                          <SubAgentCard subAgent={msg.subAgent} />
                        </div>
                      );
                    }
                    return (
                      <ChatMessage
                        key={msg.id}
                        message={msg}
                        isStreaming={lastIsStreamingAi && isLast}
                      />
                    );
                  })}

                  {isStreaming && !lastIsStreamingAi && (
                    <div className="flex items-end gap-3 animate-fade-in">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-400 flex items-center justify-center shadow-[var(--shadow-soft)] animate-gradient">
                        <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
                          <path d="M12 2 L14 9 L21 11 L14 13 L12 20 L10 13 L3 11 L10 9 Z" />
                        </svg>
                      </div>
                      <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-[var(--color-bg-elev)] border border-[var(--color-border)] shadow-[var(--shadow-soft)]">
                        <TypingIndicator />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <ScrollToBottom scrollRef={scrollRef} />
          </div>

          <ChatInput
            onSend={sendMessage}
            onStop={stop}
            disabled={isStreaming}
            isStreaming={isStreaming}
            agentType={agentType}
            onAgentTypeChange={setAgentType}
          />
        </main>
      </div>
    </div>
  );
}

export default App;
