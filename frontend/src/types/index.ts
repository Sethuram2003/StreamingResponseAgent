export interface ChatMessage {
  id: string;
  role: 'human' | 'ai' | 'tool_call' | 'sub_agent';
  content?: string;
  toolCall?: ToolCallData;
  subAgent?: SubAgentData;
}

export interface ToolCallData {
  runId: string;
  toolName: string;
  status: 'started' | 'completed' | 'error';
  input?: unknown;
  output?: unknown;
  error?: string;
  parentIds?: string[];
}

export interface SubAgentData {
  runId: string;
  agentName: string;
  status: 'started' | 'completed' | 'error';
  input?: unknown;
  output?: unknown;
  error?: string;
  /** Streamed tokens produced inside this sub-agent (deep mode). */
  content?: string;
  /** Tool calls made by this sub-agent. */
  tools?: ToolCallData[];
}

// SSE event structures
export interface ChatModelStreamEvent {
  event: 'on_chat_model_stream';
  run_id?: string;
  parent_ids?: string[];
  data: { chunk: { content: string; done?: boolean } };
}

export interface ToolStartEvent {
  event: 'on_tool_start';
  name: string;
  run_id: string;
  parent_ids?: string[];
  data: { input: unknown };
}

export interface ToolEndEvent {
  event: 'on_tool_end';
  run_id: string;
  parent_ids?: string[];
  data: { output: unknown };
}

export interface ToolErrorEvent {
  event: 'on_tool_error';
  run_id: string;
  parent_ids?: string[];
  data: { error: string };
}

export interface ChainStartEvent {
  event: 'on_chain_start';
  name: string;
  run_id: string;
  parent_ids?: string[];
  data: { input: unknown };
}

export interface ChainEndEvent {
  event: 'on_chain_end';
  name: string;
  run_id: string;
  parent_ids?: string[];
  data: { output: unknown };
}

export interface ChainErrorEvent {
  event: 'on_chain_error';
  name: string;
  run_id: string;
  parent_ids?: string[];
  data: { error: string };
}

export type StreamEvent =
  | ChatModelStreamEvent
  | ToolStartEvent
  | ToolEndEvent
  | ToolErrorEvent
  | ChainStartEvent
  | ChainEndEvent
  | ChainErrorEvent;

export type AgentType = 'single' | 'deep';
