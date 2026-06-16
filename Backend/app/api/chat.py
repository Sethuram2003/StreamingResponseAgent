from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
from app.core.agent_logic.agent_service import get_agent
import json
import logging
from langchain_core.messages import HumanMessage

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["chat"])


def _serialize_output(output_msg):
    """Normalize a tool/sub-agent output for JSON SSE."""
    if output_msg is None:
        return None
    # LangGraph Command objects carry updates (e.g. messages). Unwrap them.
    if type(output_msg).__name__ == "Command":
        update = getattr(output_msg, "update", None)
        return _serialize_output(update)
    if hasattr(output_msg, "content"):
        return output_msg.content
    if hasattr(output_msg, "to_json"):
        try:
            return output_msg.to_json()
        except Exception:
            pass
    if isinstance(output_msg, (dict, list, str, int, float, bool)):
        if isinstance(output_msg, dict):
            return {k: _serialize_output(v) for k, v in output_msg.items()}
        if isinstance(output_msg, list):
            return [_serialize_output(v) for v in output_msg]
        return output_msg
    return str(output_msg)


def _extract_final_ai_text(output_data):
    """Try to pull the final AI message text from a chain output."""
    if not isinstance(output_data, dict):
        return None
    messages = output_data.get("messages")
    if not isinstance(messages, list):
        return None
    for m in reversed(messages):
        if isinstance(m, dict):
            if m.get("role") in {"ai", "assistant", "AIMessage"}:
                content = m.get("content")
                if content:
                    return content
        elif isinstance(m, str) and m.strip():
            return m
        if hasattr(m, "content"):
            content = getattr(m, "content", None)
            if content:
                return content
    return None


def _serialize_input(input_data):
    """Normalize chain/tool inputs that may contain LangChain messages."""
    if input_data is None:
        return None
    if isinstance(input_data, dict):
        out = {}
        for k, v in input_data.items():
            if k == "messages" and isinstance(v, list):
                out[k] = [
                    {"role": getattr(m, "type", "unknown"), "content": getattr(m, "content", str(m))}
                    if hasattr(m, "content") else str(m)
                    for m in v
                ]
            else:
                out[k] = _serialize_output(v)
        return out
    return _serialize_output(input_data)


class _SSEEncoder(json.JSONEncoder):
    def default(self, o):
        if hasattr(o, "content"):
            return o.content
        if hasattr(o, "to_json"):
            try:
                return o.to_json()
            except Exception:
                return str(o)
        return super().default(o)


def _json_dumps(obj):
    """JSON dump with fallback serialization for LangChain objects."""
    return json.dumps(obj, cls=_SSEEncoder)


@router.post("/")
async def chat_ai(request: Request):
    """
    POST /chat
    Body: {
        "session_id": "required-thread-id",
        "agent_type": "single" | "deep",
        "messages": [{"role": "human", "content": "..."}]
    }
    Returns SSE stream of lightweight, typed events.
    Uses session_id as LangGraph thread_id for persistent chat history.
    """
    body = await request.json()

    session_id = body.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id is required")

    agent_type = body.get("agent_type", "single")
    if agent_type not in {"single", "deep"}:
        raise HTTPException(
            status_code=400,
            detail="agent_type must be 'single' or 'deep'"
        )

    frontend_messages = body.get("messages", [])

    lc_messages = []
    for msg in frontend_messages:
        if msg.get("role") == "human":
            lc_messages.append(HumanMessage(content=msg.get("content", "")))
    if lc_messages:
        lc_messages = [lc_messages[-1]]

    config = {"configurable": {"thread_id": session_id}}

    async def event_stream():
        try:
            agent = await get_agent(agent_type)

            async for event in agent.astream_events(
                {"messages": lc_messages},
                config=config,
                version="v2"
            ):
                if await request.is_disconnected():
                    logger.info("Client disconnected – stopping stream")
                    break

                kind = event["event"]
                name = event.get("name", "")
                data = event.get("data", {})
                run_id = event.get("run_id", "")
                parent_ids = event.get("parent_ids", [])

                if kind == "on_chat_model_stream":
                    chunk = data.get("chunk")
                    chunk_content = getattr(chunk, "content", None) or ""
                    done_marker = data.get("chunk", {}).get("done", False)
                    if chunk_content or done_marker:
                        yield f"data: {_json_dumps({'event': 'on_chat_model_stream', 'run_id': run_id, 'parent_ids': parent_ids, 'data': {'chunk': {'content': chunk_content, 'done': done_marker}}})}\n\n"

                elif kind == "on_tool_start":
                    tool_input = data.get("input")
                    yield f"data: {_json_dumps({'event': 'on_tool_start', 'name': name, 'run_id': run_id, 'parent_ids': parent_ids, 'data': {'input': tool_input}})}\n\n"

                elif kind == "on_tool_end":
                    output_content = _serialize_output(data.get("output"))
                    yield f"data: {_json_dumps({'event': 'on_tool_end', 'run_id': run_id, 'parent_ids': parent_ids, 'data': {'output': output_content}})}\n\n"

                elif kind == "on_tool_error":
                    error_msg = data.get("error", "Unknown tool error")
                    yield f"data: {_json_dumps({'event': 'on_tool_error', 'run_id': run_id, 'parent_ids': parent_ids, 'data': {'error': error_msg}})}\n\n"

                elif kind == "on_chain_start":
                    input_data = _serialize_input(data.get("input"))
                    yield f"data: {_json_dumps({'event': 'on_chain_start', 'name': name, 'run_id': run_id, 'parent_ids': parent_ids, 'data': {'input': input_data}})}\n\n"

                elif kind == "on_chain_end":
                    output_data = _serialize_output(data.get("output"))
                    final_text = _extract_final_ai_text(output_data)
                    # Emit a synthetic model-stream event for the final AI text when the model
                    # produced it as part of a chain-end Command instead of token-by-token.
                    if final_text and name == "LangGraph":
                        yield f"data: {_json_dumps({'event': 'on_chat_model_stream', 'run_id': run_id, 'parent_ids': parent_ids, 'data': {'chunk': {'content': final_text}}})}\n\n"
                    # If the final output is empty but we still want the frontend to know the chain finished,
                    # emit a synthetic empty-stream marker so it stops loading.
                    if not final_text and name == "LangGraph":
                        yield f"data: {_json_dumps({'event': 'on_chat_model_stream', 'run_id': run_id, 'parent_ids': parent_ids, 'data': {'chunk': {'content': ''}, 'done': True}})}\n\n"
                    yield f"data: {_json_dumps({'event': 'on_chain_end', 'name': name, 'run_id': run_id, 'parent_ids': parent_ids, 'data': {'output': output_data}})}\n\n"

                elif kind == "on_chain_error":
                    error_msg = data.get("error", "Unknown chain error")
                    yield f"data: {_json_dumps({'event': 'on_chain_error', 'name': name, 'run_id': run_id, 'parent_ids': parent_ids, 'data': {'error': error_msg}})}\n\n"

            yield "data: [DONE]\n\n"

        except Exception as e:
            logger.error(f"Streaming error: {e}", exc_info=True)
            yield f"data: {_json_dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
