interface WelcomeScreenProps {
  onPrompt: (text: string) => void;
}

const SUGGESTIONS = [
  {
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" />
      </svg>
    ),
    title: 'Web search',
    prompt: "Search the web for the latest news on AI agents and summarize the top 3 results.",
    gradient: 'from-cyan-400 to-blue-500',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
      </svg>
    ),
    title: 'Summarize a doc',
    prompt: 'Read my latest uploaded document and give me a 5-bullet executive summary.',
    gradient: 'from-violet-500 to-fuchsia-500',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      </svg>
    ),
    title: 'Brainstorm ideas',
    prompt: 'Brainstorm 10 creative product names for a developer-focused AI notebook.',
    gradient: 'from-amber-400 to-orange-500',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    title: 'Explain a concept',
    prompt: 'Explain how streaming responses work in modern LLM APIs, with a simple analogy.',
    gradient: 'from-emerald-400 to-teal-500',
  },
];

export function WelcomeScreen({ onPrompt }: WelcomeScreenProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-8 animate-fade-in">
      {/* Hero */}
      <div className="max-w-2xl w-full text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-[var(--shadow-pop)] mb-5 animate-gradient">
          <svg viewBox="0 0 24 24" className="w-8 h-8 text-white" fill="currentColor">
            <path d="M12 2 L14 9 L21 11 L14 13 L12 20 L10 13 L3 11 L10 9 Z" />
          </svg>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold gradient-text mb-2 tracking-tight">
          How can I help you today?
        </h1>
        <p className="text-sm sm:text-base text-[var(--color-text-muted)] max-w-md mx-auto">
          I can use tools, search the web, and stream answers back in real time. Pick a starter prompt or type your own below.
        </p>
      </div>

      {/* Suggestion grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full">
        {SUGGESTIONS.map((s, i) => (
          <button
            key={s.title}
            onClick={() => onPrompt(s.prompt)}
            style={{ animationDelay: `${i * 80}ms` }}
            className="group text-left p-4 rounded-xl bg-[var(--color-bg-elev)] border border-[var(--color-border)] shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-pop)] hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] transition-base animate-fade-in-up"
          >
            <div className="flex items-center gap-3 mb-2">
              <span
                className={`w-9 h-9 rounded-lg bg-gradient-to-br ${s.gradient} text-white flex items-center justify-center shadow-[var(--shadow-soft)] group-hover:scale-110 transition-base`}
              >
                {s.icon}
              </span>
              <span className="text-sm font-semibold text-[var(--color-text)]">
                {s.title}
              </span>
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4 ml-auto text-[var(--color-text-faint)] group-hover:text-[var(--color-brand)] group-hover:translate-x-0.5 transition-base"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
              {s.prompt}
            </p>
          </button>
        ))}
      </div>

      <div className="mt-8 text-[11px] text-[var(--color-text-faint)] flex items-center gap-1.5">
        <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
        Responses are generated by AI. Verify important information.
      </div>
    </div>
  );
}
