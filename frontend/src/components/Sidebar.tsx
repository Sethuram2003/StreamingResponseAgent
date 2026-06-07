import { useState } from 'react';

interface SidebarProps {
  sessionId: string;
  onNewChat: () => void;
}

export function Sidebar({ sessionId, onNewChat }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`h-full border-r bg-gray-50 transition-all ${collapsed ? 'w-12' : 'w-64'}`}>
      <div className="flex items-center justify-between p-2 border-b">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-500 hover:text-gray-700"
        >
          {collapsed ? '▶' : '◀'}
        </button>
        {!collapsed && <h2 className="text-sm font-bold">Chat</h2>}
      </div>
      {!collapsed && (
        <div className="p-2 space-y-2">
          <button
            onClick={onNewChat}
            className="w-full bg-blue-500 text-white py-1 px-3 rounded text-sm hover:bg-blue-600"
          >
            + New Chat
          </button>
          <p className="text-xs text-gray-500 break-all">Session: {sessionId}</p>
        </div>
      )}
    </div>
  );
}