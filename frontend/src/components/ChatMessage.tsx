import type { ChatMessage as ChatMessageType } from '../types';
import { ToolCallCard } from './ToolCallCard';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function ChatMessage({ message }: { message: ChatMessageType }) {
  if (message.role === 'tool_call' && message.toolCall) {
    return <ToolCallCard toolCall={message.toolCall} />;
  }

  const isHuman = message.role === 'human';
  const align = isHuman ? 'self-end' : 'self-start';
  const bubbleColor = isHuman
    ? 'bg-blue-500 text-white'
    : 'bg-gray-100 text-gray-900';

  const content = message.content || (message.role === 'ai' ? '...' : '');

  return (
    <div className={`max-w-[85%] ${align} my-1`}>
      <div className={`p-3 rounded-lg ${bubbleColor}`}>
        {isHuman ? (
          <p className="whitespace-pre-wrap">{content}</p>
        ) : (
          <div className="ai-msg msg-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content || '...'}
            </ReactMarkdown>
          </div>
        )}
      </div>
      <div className="text-xs text-gray-400 mt-0.5 px-1">
        {isHuman ? 'You' : 'AI'}
      </div>
    </div>
  );
}