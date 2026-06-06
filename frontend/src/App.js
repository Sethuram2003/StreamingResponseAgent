import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

// ---------- Tool Message Component ----------
function ToolMessage({ toolName, input, output, status }) {
  const [expanded, setExpanded] = useState(false);
  const toggle = () => setExpanded(!expanded);

  // Convert input/output to pretty JSON strings if they are objects
  const inputStr =
    typeof input === "object" ? JSON.stringify(input, null, 2) : String(input);
  const outputStr =
    typeof output === "object"
      ? JSON.stringify(output, null, 2)
      : String(output);

  return (
    <div
      style={{
        backgroundColor: "#f0f9ff",
        border: "1px solid #bae6fd",
        borderRadius: "6px",
        padding: "8px 12px",
        margin: "6px 0",
        fontSize: "0.9rem",
        fontFamily: "monospace",
        color: "#0c4a6e",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
        }}
        onClick={toggle}
      >
        <strong>
          🔧 Tool: {toolName}
          {status === "running" && (
            <span style={{ marginLeft: 8, fontStyle: "italic" }}>running…</span>
          )}
          {status === "error" && (
            <span style={{ marginLeft: 8, color: "red" }}>error</span>
          )}
        </strong>
        <span style={{ fontSize: "0.8rem" }}>{expanded ? "▲" : "▼"}</span>
      </div>
      {expanded && (
        <div style={{ marginTop: 6 }}>
          <div>
            <strong>Input:</strong>
            <pre
              style={{
                margin: "2px 0",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {inputStr}
            </pre>
          </div>
          {output !== null && output !== undefined && (
            <div style={{ marginTop: 4 }}>
              <strong>Output:</strong>
              <pre
                style={{
                  margin: "2px 0",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {outputStr}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------- Main App ----------
export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(crypto.randomUUID()); // Unique session per mount
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startNewChat = () => {
    setMessages([]);
    setSessionId(crypto.randomUUID()); // new session = new thread
    setInput("");
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: "human", content: input.trim() };
    const initialMessages = [
      ...messages,
      userMessage,
      { role: "ai", content: "" },
    ];
    setMessages(initialMessages);
    setInput("");
    setLoading(true);

    let currentAIMessageIndex = initialMessages.length - 1;
    const toolCallToIndex = new Map();

    try {
      const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,         // <-- send the session ID
          messages: [
            { role: "human", content: input.trim() },
          ],
        }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (let line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;

          try {
            const event = JSON.parse(data);

            switch (event.event) {
              case "on_chat_model_start":
                setMessages((prev) => {
                  const updated = [...prev, { role: "ai", content: "" }];
                  currentAIMessageIndex = updated.length - 1;
                  return updated;
                });
                break;

              case "on_chat_model_stream":
                if (currentAIMessageIndex >= 0) {
                  const newContent = event.data?.chunk?.content || "";
                  setMessages((prev) => {
                    const updated = [...prev];
                    if (updated[currentAIMessageIndex]) {
                      updated[currentAIMessageIndex] = {
                        ...updated[currentAIMessageIndex],
                        content:
                          updated[currentAIMessageIndex].content + newContent,
                      };
                    }
                    return updated;
                  });
                }
                break;

              case "on_tool_start": {
                const toolName = event.name || "unknown";
                const toolInput = event.data?.input;
                const toolRunId = event.run_id;
                setMessages((prev) => {
                  const updated = [...prev];
                  const toolMsg = {
                    role: "tool",
                    toolRunId,
                    toolName,
                    input: toolInput,
                    output: null,
                    status: "running",
                  };
                  const insertAt = Math.min(
                    currentAIMessageIndex + 1,
                    updated.length
                  );
                  updated.splice(insertAt, 0, toolMsg);
                  if (insertAt <= currentAIMessageIndex) {
                    currentAIMessageIndex++;
                  }
                  toolCallToIndex.set(toolRunId, insertAt);
                  return updated;
                });
                break;
              }

              case "on_tool_end": {
                const toolRunId = event.run_id;
                const output = event.data?.output;
                if (toolCallToIndex.has(toolRunId)) {
                  const idx = toolCallToIndex.get(toolRunId);
                  setMessages((prev) => {
                    const updated = [...prev];
                    if (updated[idx]) {
                      updated[idx] = {
                        ...updated[idx],
                        output,
                        status: "done",
                      };
                    }
                    return updated;
                  });
                }
                break;
              }

              case "on_tool_error": {
                const toolRunId = event.run_id;
                const errorMsg = event.data?.error || "Tool error";
                if (toolCallToIndex.has(toolRunId)) {
                  const idx = toolCallToIndex.get(toolRunId);
                  setMessages((prev) => {
                    const updated = [...prev];
                    if (updated[idx]) {
                      updated[idx] = {
                        ...updated[idx],
                        output: errorMsg,
                        status: "error",
                      };
                    }
                    return updated;
                  });
                }
                break;
              }

              default:
                break;
            }
          } catch (e) {
            // Ignore malformed JSON
          }
        }
      }
    } catch (err) {
      console.error("Streaming error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto", padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontFamily: "system-ui, sans-serif" }}>Simple AI Chat</h2>
        <button
          onClick={startNewChat}
          style={{
            padding: "6px 12px",
            borderRadius: "6px",
            border: "1px solid #d1d5db",
            backgroundColor: "#fff",
            cursor: "pointer",
          }}
        >
          + New Chat
        </button>
      </div>

      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          padding: "16px",
          height: "450px",
          overflowY: "auto",
          marginBottom: "12px",
          backgroundColor: "#f9f9f9",
        }}
      >
        {messages.map((msg, i) => {
          if (msg.role === "human") {
            return (
              <div
                key={i}
                style={{ textAlign: "right", marginBottom: "10px" }}
              >
                <div
                  style={{
                    display: "inline-block",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    maxWidth: "80%",
                    backgroundColor: "#2563eb",
                    color: "white",
                    textAlign: "left",
                  }}
                >
                  {msg.content}
                </div>
              </div>
            );
          }

          if (msg.role === "tool") {
            return (
              <ToolMessage
                key={i}
                toolName={msg.toolName}
                input={msg.input}
                output={msg.output}
                status={msg.status}
              />
            );
          }

          // AI message – no bubble, plain text on the background
          return (
            <div
              key={i}
              style={{
                textAlign: "left",
                marginBottom: "12px",
                padding: 0,
                backgroundColor: "transparent",
                color: "#111827",
                fontSize: "0.95rem",
                lineHeight: 1.5,
              }}
            >
              <ReactMarkdown>
                {msg.content || (loading && i === messages.length - 1 ? "…" : "")}
              </ReactMarkdown>
            </div>
          );
        })}
        {loading && messages.length === 0 && (
          <div style={{ fontStyle: "italic", color: "#6b7280" }}>Thinking…</div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a part number or say hi..."
          disabled={loading}
          style={{
            flex: 1,
            padding: "12px 16px",
            borderRadius: "8px",
            border: "1px solid #d1d5db",
            fontSize: "0.95rem",
            outline: "none",
          }}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || loading}
          style={{
            padding: "12px 24px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: "#2563eb",
            color: "white",
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}