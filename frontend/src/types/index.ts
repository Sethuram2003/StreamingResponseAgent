export interface ChatMessage {
  id: string;
  role: 'human' | 'ai' | 'tool_call';
  content?: string;
  toolCall?: ToolCallData;
}

export interface ToolCallData {
  runId: string;
  toolName: string;
  status: 'started' | 'completed' | 'error';
  input?: unknown;
  output?: unknown;
  error?: string;
}

// SSE event structures
export interface ChatModelStreamEvent {
  event: 'on_chat_model_stream';
  data: { chunk: { content: string } };
}

export interface ToolStartEvent {
  event: 'on_tool_start';
  name: string;
  run_id: string;
  data: { input: unknown };
}

export interface ToolEndEvent {
  event: 'on_tool_end';
  run_id: string;
  data: { output: unknown };
}

export interface ToolErrorEvent {
  event: 'on_tool_error';
  run_id: string;
  data: { error: string };
}

export type StreamEvent =
  | ChatModelStreamEvent
  | ToolStartEvent
  | ToolEndEvent
  | ToolErrorEvent;