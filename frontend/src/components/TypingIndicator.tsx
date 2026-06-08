export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-1" aria-label="AI is typing">
      <span className="typing-dot" />
      <span className="typing-dot" />
      <span className="typing-dot" />
    </div>
  );
}
