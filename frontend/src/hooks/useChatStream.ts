import { useState, useCallback, useRef } from 'react';
import { streamChat } from '../api/chat';
import type { ChatMessage, ToolCallData, SubAgentData, AgentType } from '../types';

const SUB_AGENT_NAMES = new Set([
  'search_specialist',
  'offer_summary_specialist',
  'alternatives_specialist',
]);

interface UseChatStreamOptions {
  sessionId: string;
  agentType?: AgentType;
}

export function useChatStream({ sessionId, agentType = 'single' }: UseChatStreamOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  // Track the active reader so we can cancel mid-stream
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  // Track the active AI message id so we can append tool/sub-agent messages correctly
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

  const insertBeforeAi = useCallback(
    (aiMsgId: string, newMsg: ChatMessage, msgs: ChatMessage[]) => {
      const aiIndex = msgs.findIndex(m => m.id === aiMsgId);
      if (aiIndex !== -1) {
        const next = [...msgs];
        next.splice(aiIndex, 0, newMsg);
        return next;
      }
      return [...msgs, newMsg];
    },
    []
  );

  // Find which known sub-agent run (if any) a tool run belongs to.
  const findSubAgentRunId = useCallback(
    (parentIds: string[] = [], subAgentRuns: Map<string, SubAgentData>) => {
      for (const pid of parentIds) {
        if (subAgentRuns.has(pid)) return pid;
      }
      return null;
    },
    []
  );

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
      // Track sub-agent runs for matching stream/end/error events
      const subAgentRuns = new Map<string, SubAgentData>();

      try {
        const reader = await streamChat(sessionId, [{ role: 'human', content }], agentType);
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
              const runId = event.run_id || '';
              const parentIds = event.parent_ids || [];

              switch (event.event) {
                case 'on_chat_model_stream': {
                  const token = event.data?.chunk?.content || '';
                  const isDoneMarker = event.data?.chunk?.done === true;

                  if (runId && subAgentRuns.has(runId)) {
                    const subAgent = subAgentRuns.get(runId)!;
                    subAgent.content = (subAgent.content || '') + token;
                    setMessages(prev =>
                      prev.map(m =>
                        m.subAgent?.runId === runId
                          ? { ...m, subAgent: { ...subAgent } }
                          : m
                      )
                    );
                  } else {
                    setMessages(prev => {
                      const updated = [...prev];
                      const aiIndex = updated.findIndex(m => m.id === aiMsgId);
                      if (aiIndex !== -1) {
                        updated[aiIndex] = {
                          ...updated[aiIndex],
                          content: updated[aiIndex].content + token,
                        };
                      }
                      return updated;
                    });
                  }

                  if (isDoneMarker && !token) {
                    setIsStreaming(false);
                  }
                  break;
                }

                case 'on_tool_start': {
                  const toolName = event.name;
                  const toolData: ToolCallData = {
                    runId: runId || crypto.randomUUID(),
                    toolName,
                    status: 'started',
                    input: event.data.input,
                    parentIds,
                  };

                  const parentSubAgentRunId = findSubAgentRunId(parentIds, subAgentRuns);
                  if (parentSubAgentRunId) {
                    // Tool belongs to a sub-agent: nest it inside that sub-agent card.
                    const subAgent = subAgentRuns.get(parentSubAgentRunId)!;
                    subAgent.tools = [...(subAgent.tools || []), toolData];
                    setMessages(prev =>
                      prev.map(m =>
                        m.subAgent?.runId === parentSubAgentRunId
                          ? { ...m, subAgent: { ...subAgent } }
                          : m
                      )
                    );
                  } else if (SUB_AGENT_NAMES.has(toolName)) {
                    // The sub-agent itself was invoked as a tool by the coordinator.
                    const subAgentData: SubAgentData = {
                      runId: toolData.runId,
                      agentName: toolName,
                      status: 'started',
                      input: event.data.input,
                      content: '',
                      tools: [],
                    };
                    subAgentRuns.set(subAgentData.runId, subAgentData);
                    const subMsg: ChatMessage = {
                      id: crypto.randomUUID(),
                      role: 'sub_agent',
                      subAgent: subAgentData,
                    };
                    setMessages(prev => insertBeforeAi(aiMsgId, subMsg, prev));
                  } else {
                    // Standalone tool call: show as its own card.
                    toolRuns.set(toolData.runId, toolData);
                    const toolMsg: ChatMessage = {
                      id: crypto.randomUUID(),
                      role: 'tool_call',
                      toolCall: toolData,
                    };
                    setMessages(prev => insertBeforeAi(aiMsgId, toolMsg, prev));
                  }
                  break;
                }

                case 'on_tool_end': {
                  const parentSubAgentRunId = findSubAgentRunId(parentIds, subAgentRuns);
                  if (parentSubAgentRunId) {
                    const subAgent = subAgentRuns.get(parentSubAgentRunId)!;
                    const nestedTool = subAgent.tools?.find(t => t.runId === runId);
                    if (nestedTool) {
                      nestedTool.status = 'completed';
                      nestedTool.output = event.data.output;
                      setMessages(prev =>
                        prev.map(m =>
                          m.subAgent?.runId === parentSubAgentRunId
                            ? { ...m, subAgent: { ...subAgent } }
                            : m
                        )
                      );
                      break;
                    }
                  }

                  const subAgent = subAgentRuns.get(runId);
                  if (subAgent) {
                    subAgent.status = 'completed';
                    subAgent.output = event.data.output;
                    setMessages(prev =>
                      prev.map(m =>
                        m.subAgent?.runId === runId
                          ? { ...m, subAgent: { ...subAgent } }
                          : m
                      )
                    );
                    break;
                  }

                  const tool = toolRuns.get(runId);
                  if (tool) {
                    tool.status = 'completed';
                    tool.output = event.data.output;
                    setMessages(prev =>
                      prev.map(m =>
                        m.toolCall?.runId === runId
                          ? { ...m, toolCall: { ...m.toolCall!, ...tool } }
                          : m
                      )
                    );
                  }
                  break;
                }

                case 'on_tool_error': {
                  const parentSubAgentRunId = findSubAgentRunId(parentIds, subAgentRuns);
                  if (parentSubAgentRunId) {
                    const subAgent = subAgentRuns.get(parentSubAgentRunId)!;
                    const nestedTool = subAgent.tools?.find(t => t.runId === runId);
                    if (nestedTool) {
                      nestedTool.status = 'error';
                      nestedTool.error = event.data.error;
                      setMessages(prev =>
                        prev.map(m =>
                          m.subAgent?.runId === parentSubAgentRunId
                            ? { ...m, subAgent: { ...subAgent } }
                            : m
                        )
                      );
                      break;
                    }
                  }

                  const subAgent = subAgentRuns.get(runId);
                  if (subAgent) {
                    subAgent.status = 'error';
                    subAgent.error = event.data.error;
                    setMessages(prev =>
                      prev.map(m =>
                        m.subAgent?.runId === runId
                          ? { ...m, subAgent: { ...subAgent } }
                          : m
                      )
                    );
                    break;
                  }

                  const tool = toolRuns.get(runId);
                  if (tool) {
                    tool.status = 'error';
                    tool.error = event.data.error;
                    setMessages(prev =>
                      prev.map(m =>
                        m.toolCall?.runId === runId
                          ? { ...m, toolCall: { ...m.toolCall!, ...tool } }
                          : m
                      )
                    );
                  }
                  break;
                }

                case 'on_chain_start': {
                  const agentName = event.name;
                  if (!SUB_AGENT_NAMES.has(agentName)) break;

                  const subAgentData: SubAgentData = {
                    runId,
                    agentName,
                    status: 'started',
                    input: event.data.input,
                    content: '',
                    tools: [],
                  };
                  if (!subAgentRuns.has(runId)) {
                    subAgentRuns.set(runId, subAgentData);
                    const subMsg: ChatMessage = {
                      id: crypto.randomUUID(),
                      role: 'sub_agent',
                      subAgent: subAgentData,
                    };
                    setMessages(prev => insertBeforeAi(aiMsgId, subMsg, prev));
                  } else {
                    subAgentRuns.set(runId, subAgentData);
                  }
                  break;
                }

                case 'on_chain_end': {
                  const subAgent = subAgentRuns.get(runId);
                  if (subAgent) {
                    subAgent.status = 'completed';
                    subAgent.output = event.data.output;
                    setMessages(prev =>
                      prev.map(m =>
                        m.subAgent?.runId === runId
                          ? { ...m, subAgent: { ...subAgent } }
                          : m
                      )
                    );
                  }
                  break;
                }

                case 'on_chain_error': {
                  const subAgent = subAgentRuns.get(runId);
                  if (subAgent) {
                    subAgent.status = 'error';
                    subAgent.error = event.data.error;
                    setMessages(prev =>
                      prev.map(m =>
                        m.subAgent?.runId === runId
                          ? { ...m, subAgent: { ...subAgent } }
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

        // Ensure an empty AI placeholder gets a fallback message so the UI isn't blank.
        setMessages(prev =>
          prev.map(m =>
            m.id === aiMsgId && m.role === 'ai' && !m.content?.trim()
              ? { ...m, content: m.content + '\n\n*(No response from agent)*' }
              : m
          )
        );
      }
    },
    [sessionId, agentType, insertBeforeAi, findSubAgentRunId]
  );

  return { messages, sendMessage, isStreaming, stop, clear };
}
