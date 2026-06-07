import type { ToolCallData } from '../types';
import { useState } from 'react';

export function ToolCallCard({ toolCall }: { toolCall: ToolCallData }) {
  const [expanded, setExpanded] = useState(false);

  const statusIcon = {
    started: '⏳',
    completed: '✅',
    error: '❌',
  }[toolCall.status];

  const bgColor = {
    started: 'bg-yellow-50 border-yellow-300',
    completed: 'bg-green-50 border-green-300',
    error: 'bg-red-50 border-red-300',
  }[toolCall.status];

  return (
    <div className={`border rounded-lg p-3 my-2 ${bgColor}`}>
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="font-medium text-sm">
          {statusIcon} Tool: {toolCall.toolName}
        </span>
        <span className="text-xs text-gray-500">{toolCall.status}</span>
      </div>

      {expanded && (
        <div className="mt-2 text-xs space-y-1">
          {toolCall.input != null && (
            <div>
              <span className="font-semibold">Input:</span>
              <pre className="bg-gray-100 p-1 rounded mt-1 max-h-24 overflow-auto">
                {JSON.stringify(toolCall.input, null, 2)}
              </pre>
            </div>
          )}
          {toolCall.output != null && (
            <div>
              <span className="font-semibold">Output:</span>
              <pre className="bg-gray-100 p-1 rounded mt-1 max-h-24 overflow-auto">
                {typeof toolCall.output === 'string'
                  ? toolCall.output
                  : JSON.stringify(toolCall.output, null, 2)}
              </pre>
            </div>
          )}
          {toolCall.error && (
            <div>
              <span className="font-semibold text-red-600">Error:</span>
              <pre className="bg-red-50 p-1 rounded mt-1 text-red-700 max-h-24 overflow-auto">
                {toolCall.error}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}