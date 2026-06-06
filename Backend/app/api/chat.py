from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from app.core.agent_logic.agent_service import get_agent
import json
import logging
from langchain_core.messages import HumanMessage, AIMessage, ToolMessage
from langchain_core.messages import BaseMessage
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["chat"])


def _serialize_value(value):
    """
    Recursively convert Pydantic models, LangChain messages, and other
    non‑JSON objects into plain dicts / lists / primitives.
    """
    if isinstance(value, BaseModel):
        # Pydantic v2
        if hasattr(value, "model_dump"):
            return value.model_dump(mode="json")
        # Older Pydantic / LangChain objects with .dict()
        if hasattr(value, "dict"):
            return value.dict()
    if isinstance(value, dict):
        return {k: _serialize_value(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_serialize_value(item) for item in value]
    if isinstance(value, (str, int, float, bool, type(None))):
        return value
    # Fallback – convert to string (avoids crashes)
    return str(value)


def _serialize_event(event: dict) -> dict:
    """Make a LangGraph v2 event dict fully JSON‑safe."""
    return _serialize_value(event)


@router.post("/")
async def chat_ai(request: Request):
    """
    POST /chat
    Body: { "messages": [{"role": "human"/"ai"/"tool", "content": "..."}] }
    Returns SSE stream of serialized LangGraph v2 events.
    """
    body = await request.json()
    frontend_messages = body.get("messages", [])

    # Map frontend roles to LangChain message types
    lc_messages = []
    for msg in frontend_messages:
        # The frontend sends "role", not "type"
        role = msg.get("role")          # "human", "ai", "tool"
        content = msg.get("content", "")
        if role == "human":
            lc_messages.append(HumanMessage(content=content))
        elif role == "ai":
            lc_messages.append(AIMessage(content=content))
        elif role == "tool":
            lc_messages.append(ToolMessage(
                content=content,
                tool_call_id=msg.get("tool_call_id", "")
            ))
        # ignore unknown roles silently

    async def event_stream():
        try:
            agent = await get_agent()

            # Use version="v2" to get consistent dict‑based events
            async for event in agent.astream_events(
                {"messages": lc_messages},
                version="v2"
            ):
                if await request.is_disconnected():
                    logger.info("Client disconnected – stopping stream")
                    break

                # Convert all internal objects to plain data
                serializable_event = _serialize_event(event)
                # Yield properly formatted SSE line
                yield f"data: {json.dumps(serializable_event)}\n\n"

            # Signal end of stream
            yield "data: [DONE]\n\n"

        except Exception as e:
            logger.error(f"Streaming error: {e}", exc_info=True)
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )