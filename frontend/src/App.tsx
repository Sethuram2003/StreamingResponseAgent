import { useChatStream } from './hooks/useChatStream';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { Sidebar } from './components/Sidebar';
import { useRef, useState, useCallback } from 'react';

function App() {
  const [sessionId, setSessionId] = useState<string>(`session-${Date.now()}`);
  const { messages, sendMessage, isStreaming } = useChatStream(sessionId);

  const handleNewChat = useCallback(() => {
    // Trigger new session by generating a fresh ID
    setSessionId(`session-${Date.now()}`);
    // Clear messages – the hook must support resetting messages,
    // so we’ll need to expose a reset function from the hook.
    // For now, just reload the page (or we can extend the hook).
    window.location.reload();
  }, []);

  return (
    <div className="h-screen flex">
      <Sidebar sessionId={sessionId} onNewChat={handleNewChat} />
      <div className="flex-1 flex flex-col">
        <h1 className="text-xl font-bold p-4 border-b">AI Chat with Tool Calls</h1>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {messages.map(msg => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          {isStreaming && (
            <div className="self-start text-sm text-gray-400 italic">
              AI is typing...
            </div>
          )}
        </div>
        <ChatInput onSend={sendMessage} disabled={isStreaming} />
      </div>
    </div>
  );
}

export default App;