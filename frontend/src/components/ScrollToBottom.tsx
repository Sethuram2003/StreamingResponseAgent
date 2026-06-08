import { useEffect, useState } from 'react';

interface ScrollToBottomProps {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  threshold?: number;
}

export function ScrollToBottom({ scrollRef, threshold = 200 }: ScrollToBottomProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => {
      const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
      setVisible(distance > threshold);
    };

    handleScroll();
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [scrollRef, threshold]);

  const scrollDown = () => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  };

  return (
    <button
      onClick={scrollDown}
      title="Scroll to latest"
      aria-label="Scroll to latest message"
      className={`absolute bottom-24 right-6 z-10 w-10 h-10 rounded-full bg-[var(--color-bg-elev)] border border-[var(--color-border)] shadow-[var(--shadow-pop)] text-[var(--color-text-muted)] hover:text-[var(--color-brand)] flex items-center justify-center transition-base ${
        visible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-2 pointer-events-none'
      }`}
    >
      <svg viewBox="0 0 24 24" className="w-4 h-4 animate-bounce-slow" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9l6 6 6-6" />
      </svg>
    </button>
  );
}
