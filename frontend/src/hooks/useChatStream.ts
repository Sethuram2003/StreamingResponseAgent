import { useState, useCallback, useRef } from 'react';
import { streamChat } from '../api/chat';
import type { ChatMessage, ToolCallData } from '../types';

export function useChatStream(sessionId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  // Track the active reader so we can cancel mid-stream
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  // Track the active AI message id so we can append tool messages correctly
  const aiMsgIdRef = useRef<string | null>(null);

  const stop = useCallback(() => {
    if (readerRef.current) {
      try { readerRef.current.cancel(); } catch { /* noop */ }
      readerRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const clear = useCallback(() => {
    stop();
    setMessages([]);
  }, [stop]);

  const sendMessage = useCallback(
    async (content: string) => {
      // Add human message
      const humanMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'human',
        content,
      };
      setMessages(prev => [...prev, humanMsg]);

      setIsStreaming(true);

      // Prepare AI placeholder
      const aiMsgId = crypto.randomUUID();
      aiMsgIdRef.current = aiMsgId;
      const aiMsg: ChatMessage = { id: aiMsgId, role: 'ai', content: '' };
      setMessages(prev => [...prev, aiMsg]);

      // Track tool runs for matching end/error events
      const toolRuns = new Map<string, ToolCallData>();

      try {
        const reader = await streamChat(sessionId, [
          { role: 'human', content },
        ]);
        readerRef.current = reader;

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          // Keep the last incomplete line in the buffer
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const dataStr = line.slice(6).trim();
            if (dataStr === '[DONE]') continue;
            if (!dataStr) continue;

            try {
              const event = JSON.parse(dataStr);

              switch (event.event) {
                case 'on_chat_model_stream':
                  // Append content to current AI message
                  setMessages(prev => {
                    const updated = [...prev];
                    const aiIndex = updated.findIndex(m => m.id === aiMsgId);
                    if (aiIndex !== -1) {
                      updated[aiIndex] = {
                        ...updated[aiIndex],
                        content:
                          updated[aiIndex].content + event.data.chunk.content,
                      };
                    }
                    return updated;
                  });
                  break;

                case 'on_tool_start': {
                  const toolData: ToolCallData = {
                    runId: event.run_id,
                    toolName: event.name,
                    status: 'started',
                    input: event.data.input,
                  };
                  toolRuns.set(event.run_id, toolData);
                  const toolMsg: ChatMessage = {
                    id: crypto.randomUUID(),
                    role: 'tool_call',
                    toolCall: toolData,
                  };
                  setMessages(prev => {
                    // Insert tool message *before* the AI placeholder
                    const aiIndex = prev.findIndex(m => m.id === aiMsgId);
                    if (aiIndex !== -1) {
                      const newMsgs = [...prev];
                      newMsgs.splice(aiIndex, 0, toolMsg);
                      return newMsgs;
                    }
                    // Fallback: append at the end
                    return [...prev, toolMsg];
                  });
                  break;
                }

                case 'on_tool_end': {
                  const tool = toolRuns.get(event.run_id);
                  if (tool) {
                    tool.status = 'completed';
                    tool.output = event.data.output;
                    setMessages(prev =>
                      prev.map(m =>
                        m.toolCall?.runId === event.run_id
                          ? { ...m, toolCall: { ...m.toolCall!, ...tool } }
                          : m
                      )
                    );
                  }
                  break;
                }

                case 'on_tool_error': {
                  const tool = toolRuns.get(event.run_id);
                  if (tool) {
                    tool.status = 'error';
                    tool.error = event.data.error;
                    setMessages(prev =>
                      prev.map(m =>
                        m.toolCall?.runId === event.run_id
                          ? { ...m, toolCall: { ...m.toolCall!, ...tool } }
                          : m
                      )
                    );
                  }
                  break;
                }

                default:
                  console.warn('Unknown event', event);
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      } catch (error) {
        // Ignore the "aborted" error thrown by reader.cancel()
        if ((error as Error)?.name !== 'AbortError') {
          console.error('Stream error:', error);
          setMessages(prev =>
            prev.map(m =>
              m.id === aiMsgId
                ? { ...m, content: m.content ? `${m.content}\n\n*Error: ${(error as Error).message}*` : `Error: ${(error as Error).message}` }
                : m
            )
          );
        }
      } finally {
        readerRef.current = null;
        aiMsgIdRef.current = null;
        setIsStreaming(false);
      }
    },
    [sessionId]
  );

  return { messages, sendMessage, isStreaming, stop, clear };
}
