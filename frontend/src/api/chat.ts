const API_BASE = 'http://localhost:8000'; // adjust if needed

export async function streamChat(
  sessionId: string,
  messages: { role: string; content: string }[],
  agentType: 'single' | 'deep' = 'single'
): Promise<ReadableStreamDefaultReader<Uint8Array>> {
  const response = await fetch(`${API_BASE}/chat/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, messages, agent_type: agentType }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}`);
  }

  if (!response.body) {
    throw new Error('ReadableStream not supported');
  }

  return response.body.getReader();
}
